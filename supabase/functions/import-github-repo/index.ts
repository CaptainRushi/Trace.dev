
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { repoUrl, branch, token, projectId } = await req.json();

        if (!repoUrl || !projectId) {
            throw new Error("Missing repoUrl or projectId");
        }

        // Parse Repo URL
        // Format: https://github.com/owner/repo or https://github.com/owner/repo.git
        const urlParts = repoUrl.replace('.git', '').split('/');
        const repo = urlParts.pop();
        const owner = urlParts.pop();

        if (!repo || !owner) {
            throw new Error("Invalid repository URL");
        }

        // Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // GitHub Headers
        const ghHeaders: any = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CodeVault-Importer'
        };
        if (token) {
            ghHeaders['Authorization'] = `token ${token}`;
        }

        // 1. Get HEAD commit of branch (or default)
        let targetBranch = branch;
        if (!targetBranch) {
            // Fetch repo info to get default branch
            const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders });
            if (!repoRes.ok) throw new Error("Failed to fetch repository info: " + repoRes.statusText);
            const repoData = await repoRes.json();
            targetBranch = repoData.default_branch;
        }

        const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${targetBranch}`, { headers: ghHeaders });
        if (!branchRes.ok) throw new Error("Failed to fetch branch info: " + branchRes.statusText);
        const branchData = await branchRes.json();
        const currentCallback = branchData.commit.sha;

        // 2. Get Tree (Recursive)
        const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${currentCallback}?recursive=1`, { headers: ghHeaders });
        if (!treeRes.ok) throw new Error("Failed to fetch file tree");
        const treeData = await treeRes.json();

        if (treeData.truncated) {
            // Warning: Repo too large
            console.warn("Tree truncated. Some files may be missing.");
        }

        // 3. Create Container
        const { data: container, error: containerError } = await supabaseClient
            .from('code_containers')
            .insert({
                project_id: projectId,
                name: repo,
                language: 'mixed', // TODO: Detect main language
                source_type: 'github',
                repo_url: repoUrl,
                repo_owner: owner,
                repo_name: repo,
                branch: targetBranch,
                commit_hash: currentCallback,
                last_synced_at: new Date().toISOString()
            })
            .select()
            .single();

        if (containerError) throw containerError;

        // 4. Fetch Files and Insert
        // Filter blobs (files), limit to Avoid timeout for massive repos in this implementation
        const blobs = treeData.tree.filter((node: any) => node.type === 'blob');

        // Check limit
        const MAX_FILES = 100; // Safety limit for synchronous edge function
        const filesToFetch = blobs.slice(0, MAX_FILES);

        // Helper to fetch content
        const fetchContent = async (path: string, url: string) => {
            // Use Raw content URL or Blob API
            // For text, raw url is convenient: https://raw.githubusercontent.com/owner/repo/commit/path
            // BETTER: Use Blob API to handle encoding securely?
            // Using raw.githubusercontent handles simple text fetch
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${currentCallback}/${path}`;

            // Private repos need token for raw fetch? 
            // Official API: GET /repos/{owner}/{repo}/contents/{path} with Accept: application/vnd.github.v3.raw
            const contentRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                headers: { ...ghHeaders, 'Accept': 'application/vnd.github.v3.raw' }
            });

            if (!contentRes.ok) return null; // Skip invalid
            return await contentRes.text();
        };

        // Parallel processing with concurrency limit
        const validFiles = [];
        const BATCH_SIZE = 5;

        for (let i = 0; i < filesToFetch.length; i += BATCH_SIZE) {
            const chunk = filesToFetch.slice(i, i + BATCH_SIZE);
            const results = await Promise.all(chunk.map(async (file: any) => {
                try {
                    const content = await fetchContent(file.path, file.url);
                    if (content !== null) {
                        return {
                            container_id: container.id,
                            filename: file.path,
                            content: content,
                            version: 1
                        };
                    }
                } catch (e) {
                    console.error(`Failed to fetch ${file.path}`, e);
                }
                return null;
            }));
            validFiles.push(...results.filter(r => r !== null));
        }

        // Bulk Insert Code Files
        if (validFiles.length > 0) {
            const { error: filesError } = await supabaseClient
                .from('code_files')
                .insert(validFiles);
            if (filesError) throw filesError;
        }

        return new Response(
            JSON.stringify({
                success: true,
                containerId: container.id,
                message: `Imported ${validFiles.length} files from ${owner}/${repo}`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
