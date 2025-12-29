
import { useState } from 'react';
import { SchemaNavigator } from './SchemaNavigator';
import { VisualEditor } from './VisualEditor';
import { SqlEditor } from './SqlEditor';
import { PropertiesPanel } from './PropertiesPanel';
import { useSchemaStore } from '@/stores/schemaStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    LayoutDashboard, FileCode, Save, Download,
    Plus, Undo, Redo, ZoomIn, ZoomOut, Move, Link as LinkIcon,
    MousePointer2, Grid3X3
} from 'lucide-react';
import { toast } from 'sonner';
import { Toggle } from "@/components/ui/toggle";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy } from "lucide-react";

export function DatabaseTab() {
    const {
        activeMode, setMode, sql,
        addTable, undo, redo,
        scale, setScale,
        activeTool, setTool,
        selectedItemId
    } = useSchemaStore();

    const handleSave = () => {
        console.log("Saving Schema:", sql);
        toast.success("Schema saved (simulation)");
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(sql);
        toast.success("SQL copied to clipboard");
    };

    const handleDownloadSql = () => {
        const blob = new Blob([sql], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'schema.sql';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Downloaded schema.sql");
    };

    return (
        <div className="flex h-full w-full bg-background overflow-hidden">
            {/* Left: Navigator (Contextual Side Panel) */}
            <div className="flex-none hidden md:block h-full border-r border-border/40">
                <SchemaNavigator />
            </div>

            {/* Center: Workspace */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                {/* Integrated Top Toolbar */}
                <div className="h-14 border-b border-border/40 flex items-center justify-between px-4 bg-muted/10 shrink-0">

                    {/* Left: Edit Tools */}
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => addTable(100, 100)} className="h-8 gap-2 border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-400">
                            <Plus className="w-4 h-4 text-indigo-500" /> <span className="hidden sm:inline">Add Table</span>
                        </Button>
                        <Separator orientation="vertical" className="h-6 mx-1" />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo}>
                            <Undo className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo}>
                            <Redo className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Center: Tools & View */}
                    {activeMode === 'visual' && (
                        <div className="flex items-center gap-1 bg-background/50 p-1 rounded-md border border-border/40 shadow-sm">
                            <Toggle pressed={activeTool === 'select'} onPressedChange={() => setTool('select')} size="sm" className="h-7 w-7 p-0 data-[state=on]:bg-indigo-500 data-[state=on]:text-white">
                                <MousePointer2 className="w-4 h-4" />
                            </Toggle>
                            <Toggle pressed={activeTool === 'pan'} onPressedChange={() => setTool('pan')} size="sm" className="h-7 w-7 p-0 data-[state=on]:bg-indigo-500 data-[state=on]:text-white">
                                <Move className="w-4 h-4" />
                            </Toggle>
                            <Toggle pressed={activeTool === 'connect'} onPressedChange={() => setTool('connect')} size="sm" className="h-7 w-7 p-0 data-[state=on]:bg-indigo-500 data-[state=on]:text-white">
                                <LinkIcon className="w-4 h-4" />
                            </Toggle>
                            <Separator orientation="vertical" className="h-4 mx-1" />
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(scale + 0.1)}>
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(Math.max(0.1, scale - 0.1))}>
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* Right: Mode & System */}
                    <div className="flex items-center gap-2">
                        <div className="flex bg-muted/50 p-0.5 rounded-lg border border-border/20">
                            <Button
                                variant={activeMode === 'visual' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 text-xs gap-2 px-3"
                                onClick={() => setMode('visual')}
                            >
                                <LayoutDashboard className="w-3 h-3" /> Visual
                            </Button>
                            <Button
                                variant={activeMode === 'code' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 text-xs gap-2 px-3"
                                onClick={() => setMode('code')}
                            >
                                <FileCode className="w-3 h-3" /> Code
                            </Button>
                        </div>
                        <Separator orientation="vertical" className="h-6 mx-1" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 gap-2">
                                    <Download className="w-3 h-3" /> Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleCopyToClipboard}>
                                    <Copy className="w-4 h-4 mr-2" /> Copy SQL
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDownloadSql}>
                                    <FileCode className="w-4 h-4 mr-2" /> Download .sql
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button size="sm" className="h-8 gap-2 bg-indigo-600 hover:bg-indigo-500" onClick={handleSave}>
                            <Save className="w-3 h-3" /> Save
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 relative overflow-hidden">
                    {activeMode === 'visual' ? (
                        <VisualEditor />
                    ) : (
                        <SqlEditor />
                    )}
                </div>
            </div>

            {/* Right: Properties Panel (Contextual) */}
            <div className="flex-none hidden lg:block border-l border-border/40 h-full bg-card/30 w-80">
                <PropertiesPanel />
            </div>
        </div>
    );
}
