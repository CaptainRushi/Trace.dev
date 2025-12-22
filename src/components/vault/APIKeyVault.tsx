
import { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useApiKeyStore, ApiKey } from '@/stores/apiKeyStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Key, Eye, EyeOff, Copy, Trash2, Shield, Plus, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PLATFORMS = [
    'OpenAI', 'Supabase', 'Razorpay', 'Stripe', 'AWS', 'Google Cloud', 'GitHub', 'Custom'
];

export function APIKeyVault() {
    const { selectedProjectId } = useProjectStore();
    const { keys, fetchKeys, createKey } = useApiKeyStore();
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [platform, setPlatform] = useState("OpenAI");
    const [name, setName] = useState("");
    const [value, setValue] = useState("");

    useEffect(() => {
        if (selectedProjectId) {
            fetchKeys(selectedProjectId);
        }
    }, [selectedProjectId, fetchKeys]);

    const handleCreate = async () => {
        if (!selectedProjectId) return;
        if (!name || !value) {
            toast.error("Name and Value are required");
            return;
        }
        await createKey(selectedProjectId, platform, name, value);
        setIsCreating(false);
        setName("");
        setValue("");
    };

    return (
        <div className="space-y-6 h-full flex flex-col animate-in fade-in">
            <Card className="flex-1 border-border/60 bg-card/50 flex flex-col">
                <CardHeader className="py-4 px-6 border-b border-border/40 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-400" />
                        <CardTitle className="text-base font-semibold">API Credentials</CardTitle>
                    </div>

                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Plus className="w-4 h-4" /> Add Credential
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Secure Storage</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Platform</label>
                                    <Select value={platform} onValueChange={setPlatform}>
                                        <SelectTrigger> <SelectValue /> </SelectTrigger>
                                        <SelectContent>
                                            {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Key Name</label>
                                    <Input placeholder="e.g. Production Key" value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Secret Key</label>
                                    <Input type="password" placeholder="sk-..." value={value} onChange={e => setValue(e.target.value)} />
                                    <p className="text-[10px] text-muted-foreground">
                                        Scan encrypted at rest. Never shared.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                                <Button onClick={handleCreate}>Encrypt & Save</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>

                <CardContent className="p-0 flex-1 overflow-auto">
                    {keys.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2 p-8">
                            <Lock className="w-12 h-12" />
                            <p>No credentials stored in this vault.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Platform</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="hidden lg:table-cell">Added</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {keys.map(key => (
                                    <KeyRow key={key.id} data={key} />
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function KeyRow({ data }: { data: ApiKey }) {
    const { revealKey, deleteKey } = useApiKeyStore();
    const [revealed, setRevealed] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleReveal = async () => {
        if (revealed) {
            setRevealed(null);
            return;
        }
        setLoading(true);
        const val = await revealKey(data.id);
        setLoading(false);
        if (val) {
            setRevealed(val);
            setTimeout(() => setRevealed(null), 30000);
        }
    };

    const handleCopy = async () => {
        let text = revealed;
        if (!text) {
            const toastId = toast.loading("Decrypting...");
            const val = await revealKey(data.id);
            toast.dismiss(toastId);

            if (!val) return;
            text = val;
        }

        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const handleDelete = async () => {
        if (confirm(`Revoke '${data.name}'? This cannot be undone.`)) {
            await deleteKey(data.id);
        }
    };

    return (
        <TableRow>
            <TableCell>
                <div className="flex flex-col">
                    <Badge variant="outline" className="w-fit font-normal mb-1">{data.platform}</Badge>
                    <span className="text-[10px] text-muted-foreground md:hidden">{data.name}</span>
                </div>
            </TableCell>
            <TableCell className="font-medium text-sm hidden md:table-cell">{data.name}</TableCell>
            <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                {new Date(data.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                    <div className={cn(
                        "font-mono text-xs px-2 py-1 rounded min-w-[200px] text-center transition-colors border border-transparent",
                        revealed ? "bg-muted text-foreground select-all border-border" : "bg-muted/30 text-muted-foreground"
                    )}>
                        {loading ? "Decrypting..." : revealed ? revealed : "••••••••••••••••••••••••"}
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleReveal} title={revealed ? "Hide Value" : "Reveal Value"}>
                        {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCopy} title="Copy to Clipboard (Auto-Decrypt)">
                        <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete} title="Revoke Credential">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
