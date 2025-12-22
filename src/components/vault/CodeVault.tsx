
import { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useCodeStore, CodeFile } from '@/stores/codeStore';
import Editor, { DiffEditor } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCode, Plus, Save, Box, Code, Clock, AlertCircle, Copy, Trash2, GitCompare, ArrowLeft, Github } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ImportGithubDialog } from './ImportGithubDialog';

const LANGUAGES = [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' },
    { label: 'Go', value: 'go' },
    { label: 'SQL', value: 'sql' },
    { label: 'HTML', value: 'html' },
    { label: 'CSS', value: 'css' },
    { label: 'JSON', value: 'json' },
    { label: 'Bash', value: 'shell' },
    { label: 'Markdown', value: 'markdown' },
];

export function CodeVault() {
    const { selectedProjectId } = useProjectStore();
    const {
        containers, fetchContainers, createContainer,
        selectContainer, selectedContainerId,
        files, fetchFiles, selectFile, selectedFile,
        saveFile, fetchFileHistory, deleteFile
    } = useCodeStore();

    const [isCreating, setIsCreating] = useState(false);
    const [newContainerName, setNewContainerName] = useState("");
    const [newContainerLang, setNewContainerLang] = useState("javascript");
    const [isImporting, setIsImporting] = useState(false);

    // Editor State
    const [editorContent, setEditorContent] = useState("");
    const [currentFilename, setCurrentFilename] = useState("");

    // History & Compare State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [fileHistory, setFileHistory] = useState<CodeFile[]>([]);
    const [isComparing, setIsComparing] = useState(false);
    const [compareBase, setCompareBase] = useState<{ content: string, version: number } | null>(null);

    // Save State
    const [isSaveOpen, setIsSaveOpen] = useState(false);
    const [saveNote, setSaveNote] = useState("");

    useEffect(() => {
        if (selectedProjectId) {
            fetchContainers(selectedProjectId);
        }
    }, [selectedProjectId, fetchContainers]);

    useEffect(() => {
        if (selectedFile) {
            setEditorContent(selectedFile.content);
            setCurrentFilename(selectedFile.filename);
            setIsComparing(false); // Reset comparison on file switch
        } else {
            if (currentFilename === "" && selectedFile === null) {
                setEditorContent("");
            }
        }
    }, [selectedFile]); // eslint-disable-line

    const handleSelectContainer = (id: string) => {
        selectContainer(id);
        setCurrentFilename("");
        setEditorContent("");
        setIsComparing(false);
    };

    const handleCreateContainer = async () => {
        if (!selectedProjectId || !newContainerName) return;
        await createContainer(selectedProjectId, newContainerName, newContainerLang);
        setNewContainerName("");
        setIsCreating(false);
    };

    const handleInitSave = () => {
        if (!selectedContainerId) return;
        if (!currentFilename.trim()) {
            toast.error("Filename required");
            return;
        }
        setIsSaveOpen(true);
    };

    const handleConfirmSave = async () => {
        if (!selectedContainerId) return;
        await saveFile(selectedContainerId, currentFilename, editorContent, saveNote);
        setSaveNote("");
        setIsSaveOpen(false);
    };

    const handleOpenHistory = async () => {
        if (!selectedContainerId || !currentFilename || !selectedFile) return;
        setIsHistoryOpen(true);
        const history = await fetchFileHistory(selectedContainerId, currentFilename);
        setFileHistory(history);
    };

    const handleRestore = (versionContent: string, version: number) => {
        setEditorContent(versionContent);
        setIsHistoryOpen(false);
        setIsComparing(false);
        toast.info(`Loaded content from v${version}. Save to persist as new version.`);
    };

    const handleCompare = (ver: CodeFile) => {
        setCompareBase({ content: ver.content, version: ver.version });
        setIsComparing(true);
        setIsHistoryOpen(false);
    };

    const handleExitComparison = () => {
        setIsComparing(false);
        setCompareBase(null);
    };

    const handleCopyContent = () => {
        if (!editorContent) return;
        navigator.clipboard.writeText(editorContent);
        toast.success("Copied to clipboard");
    };

    const handleDeleteFile = async () => {
        if (!selectedContainerId || !currentFilename) return;
        if (confirm(`Are you sure you want to delete ${currentFilename}? This cannot be undone.`)) {
            await deleteFile(selectedContainerId, currentFilename);
            setEditorContent("");
            setCurrentFilename("");
        }
    };

    const activeContainer = containers.find(c => c.id === selectedContainerId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[75vh] animate-in fade-in">
            {/* Sidebar: Containers & Files */}
            <Card className="col-span-1 border-border/60 flex flex-col h-full bg-card/50">
                <CardHeader className="py-4 px-4 border-b border-border/40">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Box className="w-4 h-4" /> Code Vault
                        </CardTitle>
                        <div className="flex items-center gap-1">
                            <Button
                                size="icon" variant="ghost" className="h-6 w-6"
                                onClick={() => setIsImporting(true)}
                                title="Import from GitHub"
                            >
                                <Github className="w-4 h-4" />
                            </Button>
                            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                                <DialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-6 w-6"><Plus className="w-4 h-4" /></Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>New Container</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Name</label>
                                            <Input value={newContainerName} onChange={e => setNewContainerName(e.target.value)} placeholder="e.g. Backend Scripts" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Language</label>
                                            <Select value={newContainerLang} onValueChange={setNewContainerLang}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {LANGUAGES.map(l => (
                                                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button onClick={handleCreateContainer}>Create Container</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>
                <div className="flex-1 min-h-0 flex flex-col">
                    <ScrollArea className="flex-1">
                        <div className="space-y-1 p-2">
                            {containers.length === 0 && (
                                <div className="text-xs text-muted-foreground text-center p-4 italic">
                                    No containers. Create one to start.
                                </div>
                            )}
                            {containers.map(c => (
                                <div key={c.id}>
                                    <button
                                        onClick={() => handleSelectContainer(c.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                                            selectedContainerId === c.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <Code className="w-3 h-3 shrink-0" />
                                            <span className="truncate">{c.name}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0 bg-background">{c.language}</Badge>
                                    </button>

                                    {selectedContainerId === c.id && (
                                        <div className="ml-4 mt-1 border-l border-border/50 pl-2 space-y-0.5 animate-in slide-in-from-left-2 duration-200">
                                            {files.map(f => (
                                                <button
                                                    key={f.id}
                                                    onClick={() => { selectFile(f); setCurrentFilename(f.filename); }}
                                                    className={cn(
                                                        "w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md text-left truncate group",
                                                        selectedFile?.id === f.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    <FileCode className="w-3 h-3 shrink-0 group-hover:text-primary transition-colors" />
                                                    <span className="truncate flex-1">{f.filename}</span>
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => { selectFile(null); setCurrentFilename(""); setEditorContent(""); setIsComparing(false); }}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-primary mt-1 transition-colors"
                                            >
                                                <Plus className="w-3 h-3" /> New File
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </Card>

            {/* Main: Editor or Diff */}
            <div className="col-span-1 lg:col-span-3 flex flex-col h-full gap-4">
                {selectedContainerId ? (
                    <Card className="flex-1 border-border/60 flex flex-col overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-card">
                            <div className="flex items-center gap-3 flex-1">
                                {isComparing ? (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleExitComparison}>
                                            <ArrowLeft className="w-4 h-4" />
                                        </Button>
                                        <span className="text-sm font-mono font-medium">
                                            Comparing v{compareBase?.version} <span className="text-muted-foreground">vs</span> Current
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <FileCode className="w-4 h-4 text-primary" />
                                        <Input
                                            className="h-8 w-[240px] font-mono text-sm bg-muted/30 border-transparent focus:bg-background focus:border-input px-2 transition-all placeholder:text-muted-foreground/50"
                                            value={currentFilename}
                                            onChange={e => setCurrentFilename(e.target.value)}
                                            placeholder="filename.ext"
                                        />
                                        {selectedFile && currentFilename === selectedFile.filename && (
                                            <Badge variant="secondary" className="font-mono text-[10px]">
                                                v{selectedFile.version}
                                            </Badge>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {!isComparing && (
                                    <>
                                        <Badge variant="outline" className="uppercase font-mono text-[10px] mr-2">
                                            {activeContainer?.language}
                                        </Badge>

                                        {selectedFile && (
                                            <>
                                                <Button size="sm" variant="ghost" onClick={handleCopyContent} className="h-7 w-7 p-0" title="Copy Content">
                                                    <Copy className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={handleOpenHistory} className="h-7 w-7 p-0" title="History">
                                                    <Clock className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={handleDeleteFile} className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete File">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <div className="w-px h-4 bg-border mx-1" />
                                            </>
                                        )}

                                        <Button size="sm" onClick={handleInitSave} className="gap-2 h-8">
                                            <Save className="w-3 h-3" /> Save
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 bg-[#1e1e1e]">
                            {isComparing && compareBase ? (
                                <DiffEditor
                                    height="100%"
                                    original={compareBase.content}
                                    modified={editorContent}
                                    language={activeContainer?.language}
                                    theme="vs-dark"
                                    options={{
                                        readOnly: true,
                                        originalEditable: false,
                                        fontSize: 13,
                                        fontFamily: 'JetBrains Mono, monospace',
                                        renderSideBySide: true,
                                    }}
                                />
                            ) : (
                                <Editor
                                    height="100%"
                                    language={activeContainer?.language}
                                    value={editorContent}
                                    onChange={(value) => setEditorContent(value || "")}
                                    theme="vs-dark"
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        fontFamily: 'JetBrains Mono, monospace',
                                    }}
                                />
                            )}
                        </div>
                    </Card>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-lg bg-muted/10">
                        <Box className="w-12 h-12 mb-4 opacity-50" />
                        <p>Select or create a container to start coding.</p>
                    </div>
                )}
            </div>

            {/* History Dialog */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Version History: {currentFilename}
                        </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1 -mx-4 px-4">
                        <div className="space-y-4 py-2">
                            {fileHistory.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-8">No history found.</p>
                            )}
                            {fileHistory.map((ver) => (
                                <div key={ver.id} className="border rounded-md p-3 bg-muted/10 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={ver.version === selectedFile?.version ? "default" : "secondary"}>
                                                v{ver.version}
                                            </Badge>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(ver.created_at).toLocaleString()}
                                                </span>
                                                {ver.note && <span className="text-xs font-medium text-foreground/80">{ver.note}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button size="sm" variant="outline" className="h-6 text-xs gap-1" onClick={() => handleCompare(ver)}>
                                                <GitCompare className="w-3 h-3" /> Compare
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => handleRestore(ver.content, ver.version)}>
                                                Load
                                            </Button>
                                        </div>
                                    </div>
                                    <pre className="text-[10px] font-mono bg-background p-2 rounded overflow-hidden max-h-16 opacity-60">
                                        {ver.content.slice(0, 150)}{ver.content.length > 150 && "..."}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Save Dialog */}
            <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save New Version</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Version Note (Optional)</label>
                            <Input
                                placeholder="What changed? e.g. Fixed API bug"
                                value={saveNote}
                                onChange={e => setSaveNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSaveOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmSave}>Save Version</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {selectedProjectId && (
                <ImportGithubDialog
                    open={isImporting}
                    onOpenChange={setIsImporting}
                    projectId={selectedProjectId}
                    onImportSuccess={() => selectedProjectId && fetchContainers(selectedProjectId)}
                />
            )}
        </div>
    );
}
