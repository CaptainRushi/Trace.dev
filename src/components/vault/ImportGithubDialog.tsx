
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Github, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImportGithubDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    onImportSuccess: () => void;
}

export function ImportGithubDialog({ open, onOpenChange, projectId, onImportSuccess }: ImportGithubDialogProps) {
    const [url, setUrl] = useState('');
    const [branch, setBranch] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);

    const handleImport = async () => {
        if (!url) {
            toast.error("Repository URL is required");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('import-github-repo', {
                body: {
                    repoUrl: url,
                    branch: branch || undefined,
                    token: token || undefined,
                    projectId: projectId
                }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            toast.success(data.message || "Repository imported successfully");
            onOpenChange(false);
            onImportSuccess(); // Refresh list

            // Reset
            setUrl('');
            setBranch('');
            setToken('');

        } catch (err: any) {
            console.error('Import Error:', err);
            toast.error(err.message || "Failed to import repository");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Github className="w-5 h-5" />
                        Import from GitHub
                    </DialogTitle>
                    <DialogDescription>
                        Clone a public or private GitHub repository into your Code Vault.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="url">Repository URL</Label>
                        <Input
                            id="url"
                            placeholder="https://github.com/owner/repo"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="branch">Branch (Optional)</Label>
                        <Input
                            id="branch"
                            placeholder="main"
                            value={branch}
                            onChange={e => setBranch(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="token" className="flex items-center gap-1">
                            GitHub Token (Optional)
                            <Lock className="w-3 h-3 text-muted-foreground" />
                        </Label>
                        <Input
                            id="token"
                            type="password"
                            placeholder="ghp_..."
                            value={token}
                            onChange={e => setToken(e.target.value)}
                        />
                        <p className="text-[0.8rem] text-muted-foreground">Required for private repositories.</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                    <Button onClick={handleImport} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Import
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
