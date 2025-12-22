
import { useSchemaStore } from '@/stores/schemaStore';
import { cn } from '@/lib/utils';
import { Database, Table as TableIcon, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export function SchemaNavigator() {
    const { tables, selectItem, selectedItemId, setPan } = useSchemaStore();

    const handleSelect = (id: string, x: number, y: number) => {
        selectItem(id, 'table');
        // Simple center logic: 
        // We want (x,y) to be at screen center (assuming screen 1000x800 roughly or getting container dims).
        // For accurate centering we need container size. 
        // We'll just set pan to -x + offset.
        setPan(-x + 300, -y + 300);
    };

    return (
        <div className="h-full flex flex-col border-r border-border/40 bg-card/30 w-64">
            <div className="p-4 border-b border-border/40">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <Database className="w-4 h-4 text-indigo-500" /> Schema Explorer
                </h3>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search tables..." className="pl-8 h-9 bg-background/50" />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {tables.map(table => (
                        <Button
                            key={table.id}
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "w-full justify-start text-sm font-normal",
                                selectedItemId === table.id && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => handleSelect(table.id, table.position.x, table.position.y)}
                        >
                            <TableIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                            {table.name}
                        </Button>
                    ))}
                    {tables.length === 0 && (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                            No tables yet. Add one from the canvas.
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
