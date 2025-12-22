
import { useSchemaStore } from '@/stores/schemaStore';
import { Column } from '@/stores/schemaStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Key } from 'lucide-react';

const DATA_TYPES = ['uuid', 'text', 'integer', 'boolean', 'timestamptz', 'date', 'jsonb', 'bigint', 'decimal'];

export function PropertiesPanel() {
    const { tables, selectedItemId, updateTable, addColumn, updateColumn, deleteColumn } = useSchemaStore();

    const selectedTable = tables.find(t => t.id === selectedItemId);

    if (!selectedTable) {
        return (
            <div className="w-80 border-l border-border/40 bg-card/30 p-6 flex items-center justify-center text-muted-foreground text-sm">
                Select a table to edit properties
            </div>
        );
    }

    return (
        <div className="w-80 h-full border-l border-border/40 bg-card/30 flex flex-col">
            <div className="p-4 border-b border-border/40">
                <h3 className="font-semibold text-sm mb-4">Table Properties</h3>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Table Name</Label>
                        <Input
                            value={selectedTable.name}
                            onChange={(e) => updateTable(selectedTable.id, { name: e.target.value })}
                            className="bg-background/50 font-mono text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="p-2 flex items-center justify-between bg-muted/20">
                    <span className="text-xs font-semibold px-2">Columns</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => addColumn(selectedTable.id)}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                <ScrollArea className="flex-1 p-3">
                    <div className="space-y-4">
                        {selectedTable.columns.map((col, idx) => (
                            <div key={col.id} className="space-y-3 p-3 rounded-lg border border-border/40 bg-background/20">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-destructive" onClick={() => deleteColumn(selectedTable.id, col.id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <Input
                                            value={col.name}
                                            onChange={(e) => updateColumn(selectedTable.id, col.id, { name: e.target.value })}
                                            className="h-7 text-xs font-mono bg-transparent border-0 border-b border-border/50 rounded-none px-0 focus-visible:ring-0"
                                            placeholder="column_name"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Select value={col.type} onValueChange={(val) => updateColumn(selectedTable.id, col.id, { type: val })}>
                                            <SelectTrigger className="h-7 text-xs bg-background/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DATA_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={col.isPk}
                                                onCheckedChange={(c) => updateColumn(selectedTable.id, col.id, { isPk: c })}
                                                className="scale-75"
                                            />
                                            <Label className="text-[10px] flex items-center gap-1 cursor-pointer">
                                                <Key className="w-3 h-3 text-yellow-500" /> PK
                                            </Label>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={col.isNullable}
                                                onCheckedChange={(c) => updateColumn(selectedTable.id, col.id, { isNullable: c })}
                                                className="scale-75"
                                            />
                                            <Label className="text-[10px]">Null</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={col.isUnique}
                                                onCheckedChange={(c) => updateColumn(selectedTable.id, col.id, { isUnique: c })}
                                                className="scale-75"
                                            />
                                            <Label className="text-[10px]">Unique</Label>
                                        </div>
                                    </div>
                                    <div>
                                        <Input
                                            value={col.defaultValue || ''}
                                            onChange={(e) => updateColumn(selectedTable.id, col.id, { defaultValue: e.target.value })}
                                            className="h-6 text-[10px] bg-background/30"
                                            placeholder="default value (e.g. now())"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
