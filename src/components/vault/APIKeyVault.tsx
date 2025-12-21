
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Eye, Copy, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

export function APIKeyVault() {
    const { apiKeys, createApiKey, deleteApiKey, selectedProjectId } = useProjectStore();
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Create Form
    const [platform, setPlatform] = useState("");
    const [env, setEnv] = useState<'dev' | 'prod'>('dev');
    const [payload, setPayload] = useState("");

    // Reveal State
    const [revealingId, setRevealingId] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!selectedProjectId) return;
        if (!payload) {
            toast.error("Payload is required");
            return;
        }
        setLoading(true);
        try {
            await createApiKey(selectedProjectId, platform, env, payload);
            toast.success("Packet encrypted and stored");
            setDialogOpen(false);
            setPlatform("");
            setPayload("");
        } catch (error: any) {
            toast.error(error.message || "Failed to create packet");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        try {
            await deleteApiKey(id);
            toast.success("Packet deleted");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleReveal = async (id: string) => {
        setRevealingId(id);
        try {
            const { data, error } = await supabase.functions.invoke('decrypt-packet', {
                body: { packet_id: id }
            });
            if (error) throw error;

            if (data?.original_value) {
                await navigator.clipboard.writeText(data.original_value);
                toast.success("Decrypted and copied to clipboard!");
            } else {
                throw new Error("No data returned");
            }
        } catch (error: any) {
            toast.error("Decryption failed: " + error.message);
        } finally {
            setRevealingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-green-500" />
                        Secure Key Vault
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Keys are encrypted with AES-GCM before storage. "Secret Zero" architecture.
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Add Secret
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add API Key Packet</DialogTitle>
                            <DialogDescription>
                                The payload will be encrypted immediately. We never store plaintext.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Platform Name</Label>
                                <Input
                                    placeholder="e.g. Stripe, AWS, OpenAI"
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Environment</Label>
                                <Select value={env} onValueChange={(v: any) => setEnv(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dev">Development</SelectItem>
                                        <SelectItem value="prod">Production</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Secret Payload</Label>
                                <Textarea
                                    placeholder="sk_live_..."
                                    className="font-mono text-xs"
                                    value={payload}
                                    onChange={(e) => setPayload(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Encrypt & Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Platform</TableHead>
                            <TableHead>Environment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {apiKeys.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No encrypted packets found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            apiKeys.map((key) => (
                                <TableRow key={key.id}>
                                    <TableCell className="font-medium">{key.platform_name}</TableCell>
                                    <TableCell>
                                        <Badge variant={key.environment === 'prod' ? 'destructive' : 'secondary'}>
                                            {key.environment}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-xs text-green-500">
                                            <Lock className="h-3 w-3" /> Encrypted
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleReveal(key.id)}
                                                disabled={revealingId === key.id}
                                            >
                                                {revealingId === key.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                                <span className="sr-only">Copy</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(key.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
