
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CodeContainer {
    id: string;
    project_id: string;
    language: string;
    name: string;
    created_at: string;
}

export interface CodeFile {
    id: string;
    container_id: string;
    filename: string;
    content: string;
    version: number;
    note?: string;
    created_at: string;
}

interface CodeStore {
    containers: CodeContainer[];
    selectedContainerId: string | null;
    files: CodeFile[];
    selectedFile: CodeFile | null;

    fetchContainers: (projectId: string) => Promise<void>;
    createContainer: (projectId: string, name: string, language: string) => Promise<void>;
    selectContainer: (containerId: string) => void;

    fetchFiles: (containerId: string) => Promise<void>;
    selectFile: (file: CodeFile | null) => void;

    saveFile: (containerId: string, filename: string, content: string, note?: string) => Promise<void>;
    fetchFileHistory: (containerId: string, filename: string) => Promise<CodeFile[]>;
    deleteFile: (containerId: string, filename: string) => Promise<void>;
}

export const useCodeStore = create<CodeStore>((set, get) => ({
    containers: [],
    selectedContainerId: null,
    files: [],
    selectedFile: null,

    fetchContainers: async (projectId) => {
        const { data, error } = await supabase
            .from('code_containers')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Fetch Containers Error:", error);
            return;
        }
        set({ containers: data || [] });
    },

    createContainer: async (projectId, name, language) => {
        const { error } = await supabase.from('code_containers').insert({
            project_id: projectId,
            name,
            language
        });
        if (error) {
            toast.error("Failed to create container");
            throw error;
        }
        await get().fetchContainers(projectId);
        toast.success("Container created");
    },

    selectContainer: (id) => {
        set({ selectedContainerId: id, selectedFile: null });
        get().fetchFiles(id);
    },

    fetchFiles: async (containerId) => {
        // Get all files for the container
        const { data, error } = await supabase
            .from('code_files')
            .select('*')
            .eq('container_id', containerId)
            .order('version', { ascending: false });

        if (error) {
            console.error("Fetch Files Error:", error);
            return;
        }

        // Filter to keep only the latest version of each filename
        const latestFilesMap = new Map<string, CodeFile>();
        data?.forEach(f => {
            if (!latestFilesMap.has(f.filename)) {
                latestFilesMap.set(f.filename, f);
            }
        });

        set({ files: Array.from(latestFilesMap.values()) });
    },

    selectFile: (file) => set({ selectedFile: file }),

    saveFile: async (containerId, filename, content, note) => {
        const { data: versions } = await supabase
            .from('code_files')
            .select('version')
            .eq('container_id', containerId)
            .eq('filename', filename)
            .order('version', { ascending: false })
            .limit(1);

        const nextVersion = (versions && versions.length > 0) ? versions[0].version + 1 : 1;

        const { error } = await supabase.from('code_files').insert({
            container_id: containerId,
            filename,
            content,
            version: nextVersion,
            note
        });

        if (error) {
            toast.error("Failed to save file");
            throw error;
        }

        toast.success(`Saved ${filename} (v${nextVersion})`);

        // Refresh file list
        await get().fetchFiles(containerId);

        // Update selected file to this new version
        const { files } = get();
        const newFile = files.find(f => f.filename === filename && f.version === nextVersion);
        if (newFile) {
            set({ selectedFile: newFile });
        }
    },

    fetchFileHistory: async (containerId, filename) => {
        const { data } = await supabase
            .from('code_files')
            .select('*')
            .eq('container_id', containerId)
            .eq('filename', filename)
            .order('version', { ascending: false });
        return data || [];
    },

    deleteFile: async (containerId, filename) => {
        const { error } = await supabase
            .from('code_files')
            .delete()
            .eq('container_id', containerId)
            .eq('filename', filename);

        if (error) {
            toast.error("Failed to delete file");
            throw error;
        }
        toast.success("File deleted");
        await get().fetchFiles(containerId);
        set({ selectedFile: null });
    }
}));
