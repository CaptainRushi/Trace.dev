
import { useRef, useState, useEffect } from 'react';
import { useTraceDrawStore, Element, ToolType, Point } from '@/stores/traceDrawStore';
import { cn } from '@/lib/utils';
import { getStroke } from 'perfect-freehand';

// Helper to get svg path from stroke
function getSvgPathFromStroke(stroke: any) {
    if (!stroke.length) return "";
    const d = stroke.reduce(
        (acc: any, [x0, y0]: any, i: number, arr: any) => {
            const [x1, y1] = arr[(i + 1) % arr.length];
            acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
            return acc;
        },
        ["M", ...stroke[0], "Q"]
    );
    d.push("Z");
    return d.join(" ");
}

export function TraceDrawCanvas() {
    const {
        elements, activeTool,
        pan, setPan, setScale, scale,
        addElement, updateElement, deleteElement,
        selectElements, selectedElementIds, moveElements,
        saveSnapshot, undo, redo, setTool
    } = useTraceDrawStore();

    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<Point | null>(null);
    const [drawing, setDrawing] = useState(false);
    const [currentElementId, setCurrentElementId] = useState<string | null>(null);

    // Selection & Move
    const [isDraggingElements, setIsDraggingElements] = useState(false);
    const [dragStart, setDragStart] = useState<Point | null>(null);
    const [selectionBox, setSelectionBox] = useState<{ start: Point, end: Point } | null>(null);

    // Text editing
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [textInputPos, setTextInputPos] = useState<Point | null>(null);
    const [textInputValue, setTextInputValue] = useState("");

    const canvasRef = useRef<HTMLDivElement>(null);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                // Select All
                // Don't select deleted elements if soft delete exists
                selectElements(elements.map(el => el.id));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [elements, selectElements]);

    // Mouse Events
    const handlePointerDown = (e: React.PointerEvent) => {
        const { clientX, clientY } = e;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = (clientX - rect.left - pan.x) / scale;
        const y = (clientY - rect.top - pan.y) / scale;

        if (activeTool === 'select') {
            const clickedEl = [...elements].reverse().find(el => hitTest(el, x, y));

            if (clickedEl) {
                // Clicked on an element
                setIsDraggingElements(true);
                setDragStart({ x, y });

                // Selection Logic
                if (e.shiftKey) {
                    // Toggle
                    if (selectedElementIds.includes(clickedEl.id)) {
                        selectElements(selectedElementIds.filter(id => id !== clickedEl.id));
                    } else {
                        selectElements([...selectedElementIds, clickedEl.id]);
                    }
                } else {
                    // If not already selected, select only this. 
                    // If already selected, keep selection (to allow moving group)
                    if (!selectedElementIds.includes(clickedEl.id)) {
                        selectElements([clickedEl.id]);
                    }
                }

                // Prepare for move: Snapshot!
                saveSnapshot();
            } else {
                // Background Click
                if (!e.shiftKey) {
                    selectElements([]); // Clear selection
                }
                // Start Selection Box or Pan?
                // Prompt says "Pan & zoom support". Usually select tool drags box on background.
                // Middle click for pan.
                if (e.button === 1 || e.button === 2) { // Middle or Right
                    setIsPanning(true);
                    setPanStart({ x: clientX, y: clientY });
                } else {
                    setSelectionBox({ start: { x, y }, end: { x, y } });
                }
            }
        } else if (activeTool === 'eraser') {
            saveSnapshot();
            const clickedEl = [...elements].reverse().find(el => hitTest(el, x, y));
            if (clickedEl) {
                deleteElement(clickedEl.id);
            }
        } else {
            // Drawing
            setIsPanning(false);
            setDrawing(true);
            saveSnapshot();

            const id = crypto.randomUUID();
            setCurrentElementId(id);

            let newEl: Element = {
                id,
                type: activeTool,
                strokeColor: '#e2e8f0',
                backgroundColor: 'transparent',
                strokeWidth: 2,
            };

            if (activeTool === 'pencil') {
                newEl.points = [{ x, y }];
            } else if (['rectangle', 'ellipse', 'line', 'arrow'].includes(activeTool)) {
                newEl.x = x;
                newEl.y = y;
                newEl.width = 0;
                newEl.height = 0;
            }

            addElement(newEl);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left - pan.x) / scale;
        const y = (e.clientY - rect.top - pan.y) / scale;

        if (isPanning && panStart) {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            setPan({ x: pan.x + dx, y: pan.y + dy });
            setPanStart({ x: e.clientX, y: e.clientY });
            return;
        }

        if (isDraggingElements && dragStart) {
            const dx = x - dragStart.x;
            const dy = y - dragStart.y;
            moveElements(dx, dy);
            setDragStart({ x, y }); // Update drag start to current for next delta
            return;
        }

        if (selectionBox) {
            setSelectionBox(prev => prev ? { ...prev, end: { x, y } } : null);
            return;
        }

        if (drawing && currentElementId) {
            const el = elements.find(e => e.id === currentElementId);
            if (!el) return;

            if (activeTool === 'pencil') {
                updateElement(currentElementId, { points: [...(el.points || []), { x, y }] });
            } else if (['rectangle', 'ellipse'].includes(activeTool)) {
                const width = x - (el.x || 0);
                const height = y - (el.y || 0);
                updateElement(currentElementId, { width, height });
            } else if (activeTool === 'line' || activeTool === 'arrow') {
                const width = x - (el.x || 0);
                const height = y - (el.y || 0);
                updateElement(currentElementId, { width, height });
            }
        }

        if (activeTool === 'eraser' && e.buttons === 1) {
            const hitEl = elements.find(el => hitTest(el, x, y));
            if (hitEl) {
                deleteElement(hitEl.id);
            }
        }
    };

    const handlePointerUp = () => {
        // Auto-switch to Cursor (Select)
        if (drawing && activeTool !== 'select' && activeTool !== 'eraser') {
            setTool('select');
        }

        if (selectionBox) {
            // Calculate intersection
            const boxFn = (p1: Point, p2: Point) => {
                const bx = Math.min(p1.x, p2.x);
                const by = Math.min(p1.y, p2.y);
                const bw = Math.abs(p1.x - p2.x);
                const bh = Math.abs(p1.y - p2.y);
                return { x: bx, y: by, w: bw, h: bh };
            };
            const box = boxFn(selectionBox.start, selectionBox.end);

            const ids = elements.filter(el => {
                // Check if element is roughly inside box
                // Simple point check for now or center point
                const center = getElementCenter(el);
                return center.x >= box.x && center.x <= box.x + box.w &&
                    center.y >= box.y && center.y <= box.y + box.h;
            }).map(el => el.id);

            selectElements(ids);
            setSelectionBox(null);
        }

        setIsPanning(false);
        setDrawing(false);
        setCurrentElementId(null);
        setIsDraggingElements(false);
        setDragStart(null);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left - pan.x) / scale;
        const y = (e.clientY - rect.top - pan.y) / scale;

        const hitEl = elements.find(el => el.type === 'text' && hitTest(el, x, y));
        if (hitEl) {
            setEditingTextId(hitEl.id);
            setTextInputValue(hitEl.text || "");
            setTextInputPos({ x: hitEl.x || 0, y: hitEl.y || 0 });
        } else {
            const id = crypto.randomUUID();
            const newText: Element = {
                id,
                type: 'text',
                x: x,
                y: y,
                text: '',
                strokeColor: '#e2e8f0'
            };
            addElement(newText);
            setEditingTextId(id);
            setTextInputValue("");
            setTextInputPos({ x, y });
        }
    };

    const handleTextSubmit = () => {
        if (editingTextId) {
            if (!textInputValue.trim()) {
                deleteElement(editingTextId);
            } else {
                saveSnapshot();
                updateElement(editingTextId, { text: textInputValue });
            }
            setEditingTextId(null);
            setTextInputPos(null);
        }
    };

    const hitTest = (el: Element, x: number, y: number) => {
        if (el.type === 'text') {
            return x >= (el.x || 0) && x <= (el.x || 0) + (el.text?.length || 1) * 10 &&
                y >= (el.y || 0) && y <= (el.y || 0) + 24;
        }
        if (el.points) {
            // Pencil/Line hit test - Bounding Box
            const xs = el.points.map(p => p.x);
            const ys = el.points.map(p => p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            // Add padding
            return x >= minX - 5 && x <= maxX + 5 && y >= minY - 5 && y <= maxY + 5;
        }

        const ex = el.x || 0;
        const ey = el.y || 0;
        const ew = el.width || 0;
        const eh = el.height || 0;
        const rx = ew > 0 ? ex : ex + ew;
        const ry = eh > 0 ? ey : ey + eh;
        const rw = Math.abs(ew);
        const rh = Math.abs(eh);

        return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
    };

    const getElementCenter = (el: Element) => {
        if (el.points) {
            const xs = el.points.map(p => p.x);
            const ys = el.points.map(p => p.y);
            return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
        }
        const ex = el.x || 0;
        const ey = el.y || 0;
        const ew = el.width || 0;
        const eh = el.height || 0;
        return { x: ex + ew / 2, y: ey + eh / 2 };
    }

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const ds = -e.deltaY * 0.001;
            setScale(Math.min(max(0.1, scale + ds), 5));
        } else {
            setPan({ x: pan.x - e.deltaX, y: pan.y - e.deltaY });
        }
    };

    const gridSize = 20 * scale;
    const bgPosition = `${pan.x}px ${pan.y}px`;

    return (
        <div
            ref={canvasRef}
            id="tracedraw-canvas"
            className={cn(
                "w-full h-full bg-[#121212] overflow-hidden relative select-none touch-none",
                activeTool === 'pencil' && "cursor-crosshair",
                activeTool === 'eraser' && "cursor-not-allowed",
                activeTool === 'select' && "cursor-default"
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onDoubleClick={handleDoubleClick}
            onWheel={handleWheel}
            style={{
                backgroundImage: `radial-gradient(#333 1px, transparent 1px)`,
                backgroundSize: `${gridSize}px ${gridSize}px`,
                backgroundPosition: bgPosition
            }}
        >
            <div
                className="absolute inset-0 origin-top-left pointer-events-none"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
            >
                {elements.map(el => {
                    const isSelected = selectedElementIds.includes(el.id);

                    // Render Content
                    let content = null;
                    if (el.type === 'pencil' && el.points) {
                        const stroke = getStroke(el.points, { size: el.strokeWidth || 4, thinning: 0.5, smoothing: 0.5, streamline: 0.5 });
                        const pathData = getSvgPathFromStroke(stroke);
                        content = (
                            <svg key={el.id} className="absolute overflow-visible">
                                <path d={pathData} fill={el.strokeColor} />
                            </svg>
                        );
                    } else if (el.type === 'text') {
                        if (el.id !== editingTextId) {
                            content = (
                                <div
                                    key={el.id}
                                    className="absolute font-hand text-white whitespace-pre select-none"
                                    style={{ left: el.x, top: el.y, fontSize: '16px' }}
                                >
                                    {el.text}
                                </div>
                            );
                        }
                    } else if (el.type === 'rectangle') {
                        content = (
                            <div
                                key={el.id}
                                className="absolute border-2"
                                style={{
                                    left: Math.min(el.x!, el.x! + el.width!),
                                    top: Math.min(el.y!, el.y! + el.height!),
                                    width: Math.abs(el.width!),
                                    height: Math.abs(el.height!),
                                    borderColor: el.strokeColor,
                                    backgroundColor: el.backgroundColor
                                }}
                            />
                        );
                    } else if (el.type === 'ellipse') {
                        content = (
                            <div
                                key={el.id}
                                className="absolute border-2 rounded-full"
                                style={{
                                    left: Math.min(el.x!, el.x! + el.width!),
                                    top: Math.min(el.y!, el.y! + el.height!),
                                    width: Math.abs(el.width!),
                                    height: Math.abs(el.height!),
                                    borderColor: el.strokeColor,
                                    backgroundColor: el.backgroundColor
                                }}
                            />
                        );
                    } else if (el.type === 'line' || el.type === 'arrow') {
                        content = (
                            <svg key={el.id} className="absolute overflow-visible">
                                <line
                                    x1={el.x} y1={el.y}
                                    x2={(el.x || 0) + (el.width || 0)}
                                    y2={(el.y || 0) + (el.height || 0)}
                                    stroke={el.strokeColor}
                                    strokeWidth={2}
                                    markerEnd={el.type === 'arrow' ? "url(#arrowhead)" : undefined}
                                />
                            </svg>
                        );
                    }

                    if (!content) return null;

                    // Wrap in selection outline if selected
                    if (isSelected) {
                        // We need a wrapper to show selection. 
                        // But for simplicity in this SVG/Div mix, we can render a highlight box ON TOP.
                        // Or render the element with a ring class.
                        // For pencil (SVG path), ring might not work well on valid SVG.
                        // Let's just use opacity or a separate overlay.
                        // Simple: Just render it. Selection box handled below?
                        // Requirements: "Selected elements are visually highlighted"

                        // Option A: Render a highlight rect behind/over it?
                        // This loop renders elements themselves.

                        // Let's modify opacity or drop shadow?
                        // Or wrap in a group with filter?
                        return (
                            <g key={`wrap-${el.id}`} style={{ opacity: isDraggingElements ? 0.7 : 1, filter: 'drop-shadow(0 0 2px #6366f1)' }}>
                                {content}
                            </g>
                        );
                        // Wait, 'g' only works in SVG. My canvas is a div with mixed children.
                        // Pencil is path inside div? No, I was returning <path> directly in map but map is inside <div>.
                        // Ah, the previous code had {elements.map...} inside <div ... relative>.
                        // Pencil and Line were returning <path> or <svg> which is fine.
                        // But <path> cannot be direct child of <div>.
                        // PREVIOUS BUG: <path> was direct child of <div>. Browser probably ignored or handled weirdly.
                        // Pencil should be detailed as <svg><path ... /></svg>.
                    }
                    return content;
                })}

                {/* Highlight Selection Overlay */}
                {/* Highlight Selection Overlay - Disabled per user request */}
                {elements.map(el => {
                    if (!selectedElementIds.includes(el.id)) return null;
                    // const bounds = getBoundingBox(el);
                    // return (
                    //     <div
                    //         key={`sel-${el.id}`}
                    //         className="absolute border border-indigo-500 pointer-events-none"
                    //         style={{
                    //             left: bounds.x - 2,
                    //             top: bounds.y - 2,
                    //             width: bounds.w + 4,
                    //             height: bounds.h + 4,
                    //         }}
                    //     />
                    // );
                    return null;
                })}

                {/* Selection Box */}
                {selectionBox && (
                    <div
                        className="absolute border border-indigo-500 bg-indigo-500/20 pointer-events-none"
                        style={{
                            left: Math.min(selectionBox.start.x, selectionBox.end.x),
                            top: Math.min(selectionBox.start.y, selectionBox.end.y),
                            width: Math.abs(selectionBox.start.x - selectionBox.end.x),
                            height: Math.abs(selectionBox.start.y - selectionBox.end.y),
                        }}
                    />
                )}

                <svg className="absolute w-0 h-0"><defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#e2e8f0" /></marker></defs></svg>
            </div>

            {editingTextId && textInputPos && (
                <textarea
                    className="absolute bg-transparent text-white border-none outline-none p-0 m-0 resize-none overflow-hidden font-hand z-50"
                    style={{
                        left: textInputPos.x * scale + pan.x,
                        top: textInputPos.y * scale + pan.y,
                        fontSize: `${16 * scale}px`,
                        minWidth: '50px',
                        minHeight: '1.2em'
                    }}
                    value={textInputValue}
                    onChange={e => setTextInputValue(e.target.value)}
                    onBlur={handleTextSubmit}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); } }}
                    autoFocus
                />
            )}
        </div>
    );
}

// Fixed getBoundingBox helper
function getBoundingBox(el: Element) {
    if (el.points) {
        const xs = el.points.map(p => p.x);
        const ys = el.points.map(p => p.y);
        return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    }
    const ex = el.x || 0;
    const ey = el.y || 0;
    const ew = el.width || 0;
    const eh = el.height || 0;
    return {
        x: Math.min(ex, ex + ew),
        y: Math.min(ey, ey + eh),
        w: Math.abs(ew),
        h: Math.abs(eh)
    };
}

function max(a: number, b: number) { return a > b ? a : b; }
