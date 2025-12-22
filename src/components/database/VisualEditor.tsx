
import { useRef, useState, useEffect } from 'react';
import { useSchemaStore } from '@/stores/schemaStore';
import { cn } from '@/lib/utils';
import { GripVertical, Key, Plus, Trash2, X, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function VisualEditor() {
    const {
        tables, relations,
        updateTablePosition, selectItem, selectedItemId,
        scale, pan, setPan, setScale,
        addTable, deleteTable,
        activeTool, startConnect, completeConnect, connectSource,
        activeMode
    } = useSchemaStore();

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
    const [tableStart, setTableStart] = useState<{ x: number, y: number } | null>(null);

    const canvasRef = useRef<HTMLDivElement>(null);

    // Canvas Panning
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<{ x: number, y: number } | null>(null);

    // Mouse tracking for connecting line
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent, id: string, type: 'table' | 'canvas') => {
        if (activeTool === 'connect') return; // Click handled on columns

        if (type === 'table') {
            e.stopPropagation();
            setDraggingId(id);
            setDragStart({ x: e.clientX, y: e.clientY });
            const table = tables.find(t => t.id === id);
            if (table) setTableStart({ x: table.position.x, y: table.position.y });
            selectItem(id, 'table');
        } else if (activeTool === 'pan' || e.button === 0 || e.button === 1) {
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
            selectItem(null, null);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        // Update mouse pos for drawing temp line
        if (connectSource) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                setMousePos({
                    x: (e.clientX - rect.left - pan.x) / scale,
                    y: (e.clientY - rect.top - pan.y) / scale
                });
            }
        }

        if (draggingId && dragStart && tableStart) {
            const dx = (e.clientX - dragStart.x) / scale;
            const dy = (e.clientY - dragStart.y) / scale;
            updateTablePosition(draggingId, tableStart.x + dx, tableStart.y + dy);
        }

        if (isPanning && panStart) {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            setPan(pan.x + dx, pan.y + dy);
            setPanStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handlePointerUp = () => {
        setDraggingId(null);
        setIsPanning(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const newScale = Math.min(Math.max(0.1, scale - e.deltaY * zoomSensitivity), 5);
            setScale(newScale);
        } else {
            setPan(pan.x - e.deltaX, pan.y - e.deltaY);
        }
    };

    const handleColumnClick = (e: React.MouseEvent, tableId: string, columnId: string) => {
        e.stopPropagation();
        if (activeTool === 'connect') {
            if (!connectSource) {
                startConnect(tableId, columnId);
            } else {
                completeConnect(tableId, columnId);
            }
        } else {
            // Select column specifically?
            selectItem(tableId, 'table'); // For now just select table
        }
    };

    // Calculate Relation Lines
    const getRelationPath = (rel: typeof relations[0]) => {
        const fromTable = tables.find(t => t.id === rel.fromTableId);
        const toTable = tables.find(t => t.id === rel.toTableId);
        if (!fromTable || !toTable) return '';

        // Estimate column offsets (approximate height logic)
        const headerHeight = 40;
        const rowHeight = 28;

        const fromIdx = fromTable.columns.findIndex(c => c.id === rel.fromColumnId);
        const toIdx = toTable.columns.findIndex(c => c.id === rel.toColumnId);

        const x1 = fromTable.position.x + 256; // Right side
        const y1 = fromTable.position.y + headerHeight + (fromIdx * rowHeight) + (rowHeight / 2);

        const x2 = toTable.position.x; // Left side
        const y2 = toTable.position.y + headerHeight + (toIdx * rowHeight) + (rowHeight / 2);

        // Bezier
        const cx1 = x1 + 50;
        const cx2 = x2 - 50;

        return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
    };

    // Temp Line
    const getTempLine = () => {
        if (!connectSource) return null;
        const fromTable = tables.find(t => t.id === connectSource.tableId);
        if (!fromTable) return null;

        const idx = fromTable.columns.findIndex(c => c.id === connectSource.columnId);
        const headerHeight = 40;
        const rowHeight = 28;

        const x1 = fromTable.position.x + 256;
        const y1 = fromTable.position.y + headerHeight + (idx * rowHeight) + (rowHeight / 2);

        const x2 = mousePos.x;
        const y2 = mousePos.y;

        return <path d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke="#6366f1" strokeWidth="2" strokeDasharray="5,5" fill="none" />;
    };

    const gridSize = 20 * scale;
    const bgPosition = `${pan.x}px ${pan.y}px`;

    return (
        <div
            ref={canvasRef}
            className={cn(
                "w-full h-full bg-[#121212] overflow-hidden relative select-none",
                activeTool === 'pan' && "cursor-grab active:cursor-grabbing",
                activeTool === 'connect' && "cursor-crosshair"
            )}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
            onPointerDown={(e) => handlePointerDown(e, 'canvas', 'canvas')}
            style={{
                backgroundImage: `radial-gradient(#333 1px, transparent 1px)`,
                backgroundSize: `${gridSize}px ${gridSize}px`,
                backgroundPosition: bgPosition
            }}
        >
            <div
                className="absolute inset-0 transform-gpu origin-top-left"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`
                }}
            >
                {/* Relations Layer */}
                <svg className="absolute inset-0 overflow-visible w-full h-full pointer-events-none">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                        </marker>
                    </defs>
                    {relations.map(rel => (
                        <g key={rel.id} className="pointer-events-auto cursor-pointer group" onClick={(e) => { e.stopPropagation(); selectItem(rel.id, 'relation'); }}>
                            <path
                                d={getRelationPath(rel)}
                                stroke={selectedItemId === rel.id ? "#6366f1" : "#64748b"}
                                strokeWidth="2"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                                className="group-hover:stroke-indigo-400 transition-colors"
                            />
                        </g>
                    ))}
                    {getTempLine()}
                </svg>

                {/* Tables */}
                {tables.map(table => (
                    <div
                        key={table.id}
                        className={cn(
                            "absolute w-64 bg-card border rounded-lg shadow-xl flex flex-col transition-shadow",
                            selectedItemId === table.id ? "ring-2 ring-primary border-primary z-10" : "border-border/60 hover:border-border/80"
                        )}
                        style={{
                            left: table.position.x,
                            top: table.position.y
                        }}
                        onPointerDown={(e) => handlePointerDown(e, table.id, 'table')}
                    >
                        {/* Header */}
                        <div className={cn(
                            "flex items-center justify-between p-2 border-b border-border/50 rounded-t-lg",
                            activeTool === 'connect' ? "bg-muted/10" : "bg-muted/30 cursor-grab active:cursor-grabbing"
                        )}>
                            <div className="flex items-center gap-2 font-mono font-medium text-sm truncate">
                                <GripVertical className="w-4 h-4 text-muted-foreground" />
                                <span className="truncate">{table.name}</span>
                            </div>
                            {/* Inline delete only if selected to reduce clutter? Or hover? */}
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                                onPointerDown={(e) => { e.stopPropagation(); deleteTable(table.id); }}
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>

                        {/* Columns */}
                        <div className="p-2 space-y-1 bg-card rounded-b-lg">
                            {table.columns.map(col => {
                                const isSource = connectSource?.tableId === table.id && connectSource?.columnId === col.id;
                                return (
                                    <div
                                        key={col.id}
                                        className={cn(
                                            "flex items-center justify-between text-xs p-1.5 rounded transition-colors group/col relative",
                                            activeTool === 'connect' ? "hover:bg-indigo-500/20 cursor-pointer" : "hover:bg-muted/50",
                                            isSource && "bg-indigo-500/30 ring-1 ring-indigo-500"
                                        )}
                                        onClick={(e) => handleColumnClick(e, table.id, col.id)}
                                    >
                                        <div className="flex items-center gap-2 flex-1 overflow-hidden pointer-events-none">
                                            {col.isPk && <Key className="w-3 h-3 text-yellow-500 shrink-0" />}
                                            <span className={cn("truncate font-medium", col.isPk && "text-yellow-500")}>{col.name}</span>
                                            <span className="text-[10px] text-muted-foreground">{col.type}</span>
                                        </div>

                                        {/* Connection Handle indicator */}
                                        {activeTool === 'connect' && (
                                            <div className="absolute right-2 opacity-0 group-hover/col:opacity-100 transition-opacity">
                                                <Link className="w-3 h-3 text-indigo-400" />
                                            </div>
                                        )}

                                        {/* FK Indicator */}
                                        {relations.some(r => r.fromTableId === table.id && r.fromColumnId === col.id) && (
                                            <div className="absolute right-1 top-1.5">
                                                <Badge variant="outline" className="text-[8px] h-3 px-1 border-indigo-500/50 text-indigo-400 bg-indigo-500/10">FK</Badge>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State / Hint */}
            {tables.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-muted-foreground/50 space-y-2">
                        <p className="text-lg font-medium">Empty Canvas</p>
                        <p className="text-sm">Click "Add Table" to start designing.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
