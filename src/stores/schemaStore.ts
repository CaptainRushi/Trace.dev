
import { create } from 'zustand';

// Types
export interface Column {
    id: string;
    name: string;
    type: string;
    isPk: boolean;
    isUnique: boolean;
    isNullable: boolean;
    defaultValue: string;
}

export interface Table {
    id: string;
    name: string;
    columns: Column[];
    position: { x: number; y: number };
}

export interface Relation {
    id: string;
    fromTableId: string;
    fromColumnId: string;
    toTableId: string;
    toColumnId: string;
}

interface SchemaHistory {
    past: { tables: Table[], relations: Relation[] }[];
    future: { tables: Table[], relations: Relation[] }[];
}

interface SchemaStore {
    tables: Table[];
    relations: Relation[];
    sql: string;
    activeMode: 'code' | 'visual';
    activeTool: 'select' | 'connect' | 'pan';

    // Connect Tool State
    connectSource: { tableId: string, columnId: string } | null;

    selectedItemId: string | null;
    selectedItemType: 'table' | 'column' | 'relation' | null;
    scale: number;
    pan: { x: number; y: number };

    // History
    history: SchemaHistory;

    // Actions
    setMode: (mode: 'code' | 'visual') => void;
    setTool: (tool: 'select' | 'connect' | 'pan') => void;
    selectItem: (id: string | null, type: 'table' | 'column' | 'relation' | null) => void;

    // Visual Editing
    addTable: (x: number, y: number) => void;
    updateTable: (id: string, updates: Partial<Table>) => void;
    updateTablePosition: (id: string, x: number, y: number) => void;
    deleteTable: (id: string) => void;

    addColumn: (tableId: string) => void;
    updateColumn: (tableId: string, columnId: string, updates: Partial<Column>) => void;
    deleteColumn: (tableId: string, columnId: string) => void;

    // Relations
    startConnect: (tableId: string, columnId: string) => void;
    completeConnect: (tableId: string, columnId: string) => void;
    deleteRelation: (id: string) => void;

    // Canvas
    setPan: (x: number, y: number) => void;
    setScale: (s: number) => void;

    // Sync
    syncVisualToSql: () => void;
    syncSqlToVisual: (sql: string) => void;

    // History
    undo: () => void;
    redo: () => void;
    saveSnapshot: () => void;
}

export const useSchemaStore = create<SchemaStore>((set, get) => ({
    tables: [],
    relations: [],
    sql: '',
    activeMode: 'visual',
    activeTool: 'select',
    connectSource: null,
    selectedItemId: null,
    selectedItemType: null,
    scale: 1,
    pan: { x: 0, y: 0 },
    history: { past: [], future: [] },

    setMode: (mode) => {
        const state = get();
        if (mode === 'code') {
            get().syncVisualToSql();
        } else {
            get().syncSqlToVisual(state.sql);
        }
        set({ activeMode: mode });
    },

    setTool: (tool) => set({ activeTool: tool, connectSource: null }),

    selectItem: (id, type) => set({ selectedItemId: id, selectedItemType: type }),

    saveSnapshot: () => {
        const { tables, relations, history } = get();
        set({
            history: {
                past: [...history.past, { tables: JSON.parse(JSON.stringify(tables)), relations: JSON.parse(JSON.stringify(relations)) }],
                future: []
            }
        });
    },

    undo: () => {
        const { history, tables, relations } = get();
        if (history.past.length === 0) return;
        const previous = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);

        set({
            tables: previous.tables,
            relations: previous.relations,
            history: {
                past: newPast,
                future: [{ tables, relations }, ...history.future]
            }
        });
        get().syncVisualToSql();
    },

    redo: () => {
        const { history, tables, relations } = get();
        if (history.future.length === 0) return;
        const next = history.future[0];
        const newFuture = history.future.slice(1);

        set({
            tables: next.tables,
            relations: next.relations,
            history: {
                past: [...history.past, { tables, relations }],
                future: newFuture
            }
        });
        get().syncVisualToSql();
    },

    addTable: (x, y) => {
        get().saveSnapshot();
        const newState = get();
        // Generate unique name
        let name = 'new_table';
        let counter = 1;
        while (newState.tables.some(t => t.name === name)) {
            name = `new_table_${counter}`;
            counter++;
        }

        const newTable: Table = {
            id: crypto.randomUUID(),
            name: name,
            position: { x, y },
            columns: [
                { id: crypto.randomUUID(), name: 'id', type: 'uuid', isPk: true, isUnique: true, isNullable: false, defaultValue: 'gen_random_uuid()' },
                { id: crypto.randomUUID(), name: 'created_at', type: 'timestamptz', isPk: false, isUnique: false, isNullable: false, defaultValue: 'now()' }
            ]
        };
        set(state => ({ tables: [...state.tables, newTable], selectedItemId: newTable.id, selectedItemType: 'table' }));
        get().syncVisualToSql();
    },

    updateTable: (id, updates) => {
        get().saveSnapshot();
        set(state => ({
            tables: state.tables.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
        get().syncVisualToSql();
    },

    updateTablePosition: (id, x, y) => {
        // No snapshot for drag
        set(state => ({
            tables: state.tables.map(t => t.id === id ? { ...t, position: { x, y } } : t)
        }));
    },

    deleteTable: (id) => {
        get().saveSnapshot();
        set(state => ({
            tables: state.tables.filter(t => t.id !== id),
            relations: state.relations.filter(r => r.fromTableId !== id && r.toTableId !== id),
            selectedItemId: null
        }));
        get().syncVisualToSql();
    },

    addColumn: (tableId) => {
        get().saveSnapshot();
        set(state => ({
            tables: state.tables.map(t => {
                if (t.id !== tableId) return t;

                let name = 'new_column';
                let counter = 1;
                while (t.columns.some(c => c.name === name)) {
                    name = `new_column_${counter}`;
                    counter++;
                }

                return {
                    ...t,
                    columns: [...t.columns, {
                        id: crypto.randomUUID(),
                        name: name,
                        type: 'text',
                        isPk: false,
                        isNullable: true,
                        isUnique: false,
                        defaultValue: ''
                    }]
                };
            })
        }));
        get().syncVisualToSql();
    },

    updateColumn: (tableId, columnId, updates) => {
        get().saveSnapshot();
        set(state => ({
            tables: state.tables.map(t => {
                if (t.id !== tableId) return t;

                return {
                    ...t,
                    columns: t.columns.map(c => c.id === columnId ? { ...c, ...updates } : c)
                };
            })
        }));
        get().syncVisualToSql();
    },

    deleteColumn: (tableId, columnId) => {
        get().saveSnapshot();
        set(state => ({
            tables: state.tables.map(t => {
                if (t.id !== tableId) return t;
                return {
                    ...t,
                    columns: t.columns.filter(c => c.id !== columnId)
                };
            }),
            // Cascading delete for relations
            relations: state.relations.filter(r => r.fromColumnId !== columnId && r.toColumnId !== columnId)
        }));
        get().syncVisualToSql();
    },

    startConnect: (tableId, columnId) => {
        set({ connectSource: { tableId, columnId } });
    },

    completeConnect: (tableId, columnId) => {
        const { connectSource, relations, tables } = get();
        if (!connectSource) return;

        // Validation 1: Prevent Self-Constraint on same column
        if (connectSource.tableId === tableId && connectSource.columnId === columnId) return;

        // Validation 2: Check for duplicate relationship
        const exists = relations.find(r =>
            r.fromTableId === connectSource.tableId && r.fromColumnId === connectSource.columnId &&
            r.toTableId === tableId && r.toColumnId === columnId
        );
        if (exists) {
            set({ connectSource: null, activeTool: 'select' });
            return;
        }

        // Validation 3: Type Compatibility
        const sourceTable = tables.find(t => t.id === connectSource.tableId);
        const targetTable = tables.find(t => t.id === tableId);
        const sourceCol = sourceTable?.columns.find(c => c.id === connectSource.columnId);
        const targetCol = targetTable?.columns.find(c => c.id === columnId);

        if (!sourceCol || !targetCol) return;

        const normalizeType = (t: string) => t.toLowerCase().replace('character varying', 'text').replace('varchar', 'text');

        if (normalizeType(sourceCol.type) !== normalizeType(targetCol.type)) {
            console.warn(`Type mismatch: ${sourceCol.type} vs ${targetCol.type}`);
            set({ connectSource: null, activeTool: 'select' });
            return;
        }

        get().saveSnapshot();
        const newRel: Relation = {
            id: crypto.randomUUID(),
            fromTableId: connectSource.tableId,
            fromColumnId: connectSource.columnId,
            toTableId: tableId,
            toColumnId: columnId
        };

        set(state => ({
            relations: [...state.relations, newRel],
            connectSource: null,
            activeTool: 'select'
        }));
        get().syncVisualToSql();
    },

    deleteRelation: (id) => {
        get().saveSnapshot();
        set(state => ({
            relations: state.relations.filter(r => r.id !== id),
            selectedItemId: null
        }));
        get().syncVisualToSql();
    },

    setPan: (x, y) => set({ pan: { x, y } }),
    setScale: (s) => set({ scale: s }),

    syncVisualToSql: () => {
        const { tables, relations } = get();
        let sql = '';

        tables.forEach(table => {
            sql += `CREATE TABLE ${table.name} (\n`;

            const colDefs = table.columns.map(col => {
                const parts = [`  ${col.name} ${col.type}`];

                if (col.isPk) {
                    parts.push('PRIMARY KEY');
                } else {
                    if (!col.isNullable) parts.push('NOT NULL');
                    if (col.isUnique) parts.push('UNIQUE');
                }

                if (col.defaultValue && col.defaultValue.trim() !== '') {
                    parts.push(`DEFAULT ${col.defaultValue}`);
                }

                return parts.join(' ');
            });

            sql += colDefs.join(',\n');
            sql += '\n);\n\n';
        });

        relations.forEach(rel => {
            const fromTable = tables.find(t => t.id === rel.fromTableId);
            const toTable = tables.find(t => t.id === rel.toTableId);
            const fromCol = fromTable?.columns.find(c => c.id === rel.fromColumnId);
            const toCol = toTable?.columns.find(c => c.id === rel.toColumnId);

            if (fromTable && toTable && fromCol && toCol) {
                const constraintName = `fk_${fromTable.name}_${fromCol.name}__${toTable.name}_${toCol.name}`;
                sql += `ALTER TABLE ${fromTable.name}\n`;
                sql += `  ADD CONSTRAINT ${constraintName}\n`;
                sql += `  FOREIGN KEY (${fromCol.name})\n`;
                sql += `  REFERENCES ${toTable.name} (${toCol.name});\n\n`;
            }
        });

        set({ sql });
    },

    syncSqlToVisual: (sqlInput) => {
        set({ sql: sqlInput });
    }
}));
