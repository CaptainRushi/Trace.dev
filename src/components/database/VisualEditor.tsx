
import { useRef, useState, useEffect, useMemo } from 'react';
import { useSchemaStore } from '@/stores/schemaStore';
import { cn } from '@/lib/utils';
import { GripVertical, Key, Plus, Trash2, X, Link, ArrowRight, Ban, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
    const [hoveredColumn, setHoveredColumn] = useState<{ tableId: string, colId: string } | null>(null);

    // --- Helpers for Precise Anchors ---

    const COLUMN_HEIGHT = 28;
    const HEADER_HEIGHT = 41; // p-2 is 8px top/bot + 24px content + 1px border = approx 41
    const TABLE_WIDTH = 256;

    const getAnchorPoint = (tableId: string, colId: string, side: 'left' | 'right') => {
        const table = tables.find(t => t.id === tableId);
        if (!table) return { x: 0, y: 0 };

        const colIndex = table.columns.findIndex(c => c.id === colId);
        if (colIndex === -1) return { x: 0, y: 0 };

        const x = side === 'left' ? table.position.x : table.position.x + TABLE_WIDTH;
        const y = table.position.y + HEADER_HEIGHT + (colIndex * COLUMN_HEIGHT) + (COLUMN_HEIGHT / 2);

        return { x, y };
    };

    // --- Interaction Handlers ---

    const handlePointerDown = (e: React.PointerEvent, id: string, type: 'table' | 'canvas') => {
        if (activeTool === 'connect') return; // Click handled on columns/anchors for connect tool

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
                toast.info("Select target column to connect");
            } else {
                // Determine compatibility, prevent self-connection if needed (though self-ref is valid sql)
                if (connectSource.tableId === tableId && connectSource.columnId === columnId) {
                    toast.error("Cannot connect column to itself");
                    return;
                }
                completeConnect(tableId, columnId);
                setHoveredColumn(null);
            }
        } else {
            // Select column specifically?
            selectItem(tableId, 'table');
        }
    };

    // Calculate Relation Lines
    const getRelationPath = (rel: typeof relations[0]) => {
        const p1 = getAnchorPoint(rel.fromTableId, rel.fromColumnId, 'right');
        const p2 = getAnchorPoint(rel.toTableId, rel.toColumnId, 'left');

        if (p1.x === 0 || p2.x === 0) return ''; // Invalid anchor

        // Bezier
        const cx1 = p1.x + 50;
        const cx2 = p2.x - 50;

        return `M ${p1.x} ${p1.y} C ${cx1} ${p1.y}, ${cx2} ${p2.y}, ${p2.x} ${p2.y}`;
    };

    // Temp Line
    const getTempLine = () => {
        if (!connectSource) return null;

        const p1 = getAnchorPoint(connectSource.tableId, connectSource.columnId, 'right');

        // Snapping logic if hovering a valid target
        let p2 = { x: mousePos.x, y: mousePos.y };
        let isValidTarget = false;

        if (hoveredColumn) {
            const snapPoint = getAnchorPoint(hoveredColumn.tableId, hoveredColumn.colId, 'left');
            if (snapPoint.x !== 0) {
                p2 = snapPoint;
                isValidTarget = true;
            }
        }

        const strokeColor = isValidTarget ? "#22c55e" : "#6366f1"; // Green if valid snap, else blue

        return (
            <path
                d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                stroke={strokeColor}
                strokeWidth="2"
                strokeDasharray="5,5"
                fill="none"
                markerEnd={isValidTarget ? "url(#arrowhead-green)" : ""}
            />
        );
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
                <svg className="absolute inset-0 overflow-visible w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                        </marker>
                        <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
                        </marker>
                    </defs>
                    {relations.map(rel => (
                        <g key={rel.id} className="pointer-events-auto cursor-pointer group" onClick={(e) => { e.stopPropagation(); selectItem(rel.id, 'relation'); }}>
                            <path // Hover target (invisible but thick)
                                d={getRelationPath(rel)}
                                stroke="transparent"
                                strokeWidth="15"
                                fill="none"
                            />
                            <path // Visible line
                                d={getRelationPath(rel)}
                                stroke={selectedItemId === rel.id ? "#6366f1" : "#64748b"}
                                strokeWidth={selectedItemId === rel.id ? "3" : "2"}
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
                            "flex items-center justify-between p-2 border-b border-border/50 rounded-t-lg h-[41px]",
                            activeTool === 'connect' ? "bg-muted/10" : "bg-muted/30 cursor-grab active:cursor-grabbing"
                        )}>
                            <div className="flex items-center gap-2 font-mono font-medium text-sm truncate">
                                <GripVertical className="w-4 h-4 text-muted-foreground" />
                                <span className="truncate">{table.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                                onPointerDown={(e) => { e.stopPropagation(); deleteTable(table.id); }}
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>

                        {/* Columns */}
                        <div className="p-0 bg-card rounded-b-lg">
                            {table.columns.map((col, index) => {
                                const isSource = connectSource?.tableId === table.id && connectSource?.columnId === col.id;
                                const isHovered = hoveredColumn?.tableId === table.id && hoveredColumn?.colId === col.id;

                                // Only show hover effect for valid targets during connection
                                const isValidTarget = activeTool === 'connect' && connectSource && !isSource;
                                const showHover = activeTool === 'connect' && (!connectSource || isValidTarget);

                                return (
                                    <div
                                        key={col.id}
                                        className={cn(
                                            "flex items-center justify-between text-xs px-2 h-[28px] border-b border-transparent transition-colors group/col relative",
                                            index === table.columns.length - 1 ? "rounded-b-lg" : "",
                                            showHover && "hover:bg-muted/50 cursor-crosshair",
                                            isSource && "bg-indigo-500/20",
                                            isHovered && isValidTarget && "bg-green-500/20"
                                        )}
                                        onClick={(e) => handleColumnClick(e, table.id, col.id)}
                                        onMouseEnter={() => activeTool === 'connect' && setHoveredColumn({ tableId: table.id, colId: col.id })}
                                        onMouseLeave={() => setHoveredColumn(null)}
                                    >
                                        <div className="flex items-center gap-2 flex-1 overflow-hidden pointer-events-none">
                                            {col.isPk && <Key className="w-3 h-3 text-yellow-500 shrink-0" />}
                                            <span className={cn("truncate font-medium", col.isPk && "text-yellow-500")}>{col.name}</span>
                                            <span className="text-[10px] text-muted-foreground ml-auto">{col.type}</span>
                                        </div>

                                        {/* Anchors Visuals */}
                                        {activeTool === 'connect' && (
                                            <>
                                                {/* Left Anchor (Target) */}
                                                <div className={cn(
                                                    "absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full",
                                                    (isHovered && isValidTarget) ? "bg-green-500 ring-2 ring-green-500/50" : "bg-transparent"
                                                )} />

                                                {/* Right Anchor (Source) */}
                                                <div className={cn(
                                                    "absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all",
                                                    isSource ? "bg-indigo-500 ring-2 ring-indigo-500/50 scale-125" :
                                                        !connectSource ? "bg-muted-foreground/30 opacity-0 group-hover/col:opacity-100 group-hover/col:scale-110" : "bg-transparent"
                                                )} />
                                            </>
                                        )}

                                        {/* FK Indicator */}
                                        {relations.some(r => r.fromTableId === table.id && r.fromColumnId === col.id) && (
                                            <ArrowRight className="w-3 h-3 text-indigo-400 absolute right-1 opacity-50" />
                                        )}
                                    </div>
                                );
                            })}

                            {/* Add Column Placeholder (Visual Only for now) */}
                            <div className="h-[28px] flex items-center justify-center text-muted-foreground/30 hover:bg-muted/20 cursor-not-allowed">
                                <Plus className="w-3 h-3" />
                            </div>
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

            {/* Tooltip for Connect Mode */}
            {activeTool === 'connect' && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm border border-white/10 pointer-events-none shadow-lg animate-in fade-in slide-in-from-bottom-2">
                    {connectSource ? `Select target column in another table` : `Select a source column to start connection`}
                </div>
            )}
        </div>
    );
}
