
import { create } from 'zustand';

// Types
export type ToolType = 'select' | 'pencil' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'eraser';

export interface Point {
    x: number;
    y: number;
}

export interface Element {
    id: string;
    type: ToolType | 'text';
    points?: Point[]; // For pencil, line, arrow
    x?: number;       // For shapes/text
    y?: number;
    width?: number;
    height?: number;
    text?: string;    // For text
    strokeColor?: string;
    backgroundColor?: string;
    strokeWidth?: number;
    isDeleted?: boolean; // Soft delete for undo/redo
}

interface DrawHistory {
    past: Element[][];
    future: Element[][];
}

interface TraceDrawStore {
    elements: Element[];
    activeTool: ToolType;
    pan: Point;
    scale: number;
    selectedElementIds: string[];

    // History
    history: DrawHistory;

    // Actions
    setTool: (tool: ToolType) => void;
    setPan: (pan: Point) => void;
    setScale: (scale: number) => void;

    addElement: (element: Element) => void;
    updateElement: (id: string, updates: Partial<Element>) => void;
    deleteElement: (id: string) => void;

    // Canvas Interactions
    selectElements: (ids: string[]) => void;
    moveElements: (dx: number, dy: number) => void;

    // History Actions
    undo: () => void;
    redo: () => void;
    saveSnapshot: () => void;

    // Load/Save
    loadCanvas: (elements: Element[]) => void;
    clearCanvas: () => void;
}

export const useTraceDrawStore = create<TraceDrawStore>((set, get) => ({
    elements: [],
    activeTool: 'select',
    pan: { x: 0, y: 0 },
    scale: 1,
    selectedElementIds: [],
    history: { past: [], future: [] },

    setTool: (tool) => set({ activeTool: tool }),
    setPan: (pan) => set({ pan }),
    setScale: (scale) => set({ scale }),

    selectElements: (ids) => set({ selectedElementIds: ids }),

    addElement: (element) => {
        set(state => ({ elements: [...state.elements, element] }));
    },

    updateElement: (id, updates) => {
        set(state => ({
            elements: state.elements.map(el => el.id === id ? { ...el, ...updates } : el)
        }));
    },

    deleteElement: (id) => {
        set(state => ({
            elements: state.elements.filter(el => el.id !== id)
        }));
    },

    moveElements: (dx, dy) => {
        const { selectedElementIds, elements } = get();
        if (selectedElementIds.length === 0) return;

        set({
            elements: elements.map(el => {
                if (selectedElementIds.includes(el.id)) {
                    if (el.points) {
                        return {
                            ...el,
                            points: el.points.map(p => ({ x: p.x + dx, y: p.y + dy })),
                            x: (el.x || 0) + dx, // Maintain x/y bounds if tracked
                            y: (el.y || 0) + dy
                        };
                    } else {
                        return {
                            ...el,
                            x: (el.x || 0) + dx,
                            y: (el.y || 0) + dy
                        };
                    }
                }
                return el;
            })
        });
    },

    saveSnapshot: () => {
        const { elements, history } = get();
        const currentSnapshot = JSON.parse(JSON.stringify(elements));
        const newPast = [...history.past, currentSnapshot].slice(-50);
        set({
            history: {
                past: newPast,
                future: []
            }
        });
    },

    undo: () => {
        const { history, elements } = get();
        if (history.past.length === 0) return;

        const previous = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);

        set({
            elements: previous,
            history: {
                past: newPast,
                future: [elements, ...history.future]
            }
        });
    },

    redo: () => {
        const { history, elements } = get();
        if (history.future.length === 0) return;

        const next = history.future[0];
        const newFuture = history.future.slice(1);

        set({
            elements: next,
            history: {
                past: [...history.past, elements],
                future: newFuture
            }
        });
    },

    loadCanvas: (elements) => {
        set({ elements, history: { past: [], future: [] }, pan: { x: 0, y: 0 }, scale: 1 });
    },

    clearCanvas: () => {
        set({ elements: [], history: { past: [], future: [] } });
    }
}));
