
import {
    MousePointer2, Pencil, Square, Circle, Minus, MoveRight, Eraser,
    Undo, Redo, ZoomIn, ZoomOut, Save, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTraceDrawStore } from '@/stores/traceDrawStore';
import { TraceDrawCanvas } from './TraceDrawCanvas';

export function TraceDraw() {
    const {
        activeTool, setTool,
        undo, redo,
        scale, setScale,
        elements, loadCanvas
    } = useTraceDrawStore();
    const { selectedProjectId } = useProjectStore();

    useEffect(() => {
        if (!selectedProjectId) return;

        const fetchState = async () => {
            const { data, error } = await supabase
                .from('tracedraw_states')
                .select('elements')
                .eq('project_id', selectedProjectId)
                .single();

            if (data?.elements) {
                loadCanvas(data.elements as any);
            } else {
                loadCanvas([]);
            }
        };

        fetchState();
    }, [selectedProjectId, loadCanvas]);

    const handleExport = async () => {
        const node = document.getElementById('tracedraw-canvas');
        if (!node) {
            toast.error("Canvas not found");
            return;
        }

        try {
            const dataUrl = await toPng(node, {
                backgroundColor: '#121212',
            });
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `tracedraw-${new Date().toISOString().split('T')[0]}.png`;
            a.click();
            toast.success("Canvas exported to PNG");
        } catch (error) {
            console.error('Export failed', error);
            toast.error("Failed to export PNG");
        }
    };

    const handleSave = async () => {
        if (!selectedProjectId) {
            toast.error("No project selected");
            return;
        }

        const { error } = await supabase
            .from('tracedraw_states')
            .upsert({
                project_id: selectedProjectId,
                elements: elements as any,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error("Error saving canvas:", error);
            toast.error("Failed to save canvas");
        } else {
            toast.success("Canvas saved successfully");
        }
    };

    return (
        <div className="relative w-full h-full bg-[#121212] flex flex-col overflow-hidden">
            {/* Canvas Area */}
            <div className="flex-1 relative">
                <TraceDrawCanvas />

                {/* Floating Toolbar */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#1e1e1e]/90 backdrop-blur border border-white/10 p-1.5 rounded-xl shadow-2xl flex items-center gap-1 z-50">
                    <Toggle pressed={activeTool === 'select'} onPressedChange={() => setTool('select')} size="sm" className="h-9 w-9 p-0 data-[state=on]:bg-indigo-500 data-[state=on]:text-white transition-all">
                        <MousePointer2 className="w-4 h-4" />
                    </Toggle>
                    <Separator orientation="vertical" className="h-6 mx-1 bg-white/10" />

                    <Toggle pressed={activeTool === 'pencil'} onPressedChange={() => setTool('pencil')} size="sm" className="h-9 w-9 p-0 data-[state=on]:bg-indigo-500 data-[state=on]:text-white transition-all">
                        <Pencil className="w-4 h-4" />
                    </Toggle>
                    <Toggle pressed={activeTool === 'rectangle'} onPressedChange={() => setTool('rectangle')} size="sm" className="h-9 w-9 p-0 data-[state=on]:bg-indigo-500 data-[state=on]:text-white transition-all">
                        <Square className="w-4 h-4" />
                    </Toggle>
                    <Toggle pressed={activeTool === 'ellipse'} onPressedChange={() => setTool('ellipse')} size="sm" className="h-9 w-9 p-0 data-[state=on]:bg-indigo-500 data-[state=on]:text-white transition-all">
                        <Circle className="w-4 h-4" />
                    </Toggle>
                    <Toggle pressed={activeTool === 'line'} onPressedChange={() => setTool('line')} size="sm" className="h-9 w-9 p-0 data-[state=on]:bg-indigo-500 data-[state=on]:text-white transition-all">
                        <Minus className="w-4 h-4" />
                    </Toggle>
                    <Toggle pressed={activeTool === 'arrow'} onPressedChange={() => setTool('arrow')} size="sm" className="h-9 w-9 p-0 data-[state=on]:bg-indigo-500 data-[state=on]:text-white transition-all">
                        <MoveRight className="w-4 h-4" />
                    </Toggle>

                    <Separator orientation="vertical" className="h-6 mx-1 bg-white/10" />

                    <Toggle pressed={activeTool === 'eraser'} onPressedChange={() => setTool('eraser')} size="sm" className="h-9 w-9 p-0 data-[state=on]:bg-red-500/20 data-[state=on]:text-red-400 hover:text-red-400 transition-all">
                        <Eraser className="w-4 h-4" />
                    </Toggle>

                    <Separator orientation="vertical" className="h-6 mx-1 bg-white/10" />

                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5" onClick={undo}>
                        <Undo className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5" onClick={redo}>
                        <Redo className="w-4 h-4" />
                    </Button>

                    <Separator orientation="vertical" className="h-6 mx-1 bg-white/10" />

                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5" onClick={handleExport} title="Export to PNG">
                        <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5" onClick={handleSave} title="Save Canvas">
                        <Save className="w-4 h-4" />
                    </Button>
                </div>

                {/* Zoom Controls */}
                <div className="absolute bottom-4 left-4 flex gap-1 bg-[#1e1e1e]/90 backdrop-blur border border-white/10 p-1 rounded-lg">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5" onClick={() => setScale(Math.max(0.1, scale - 0.1))}>
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center justify-center w-12 text-xs font-mono text-muted-foreground select-none">
                        {Math.round(scale * 100)}%
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5" onClick={() => setScale(scale + 0.1)}>
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
