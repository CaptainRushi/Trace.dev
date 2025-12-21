import { Plus } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { cn } from '@/lib/utils';

interface Column {
  id: 'improve' | 'tomorrow' | 'stop';
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'improve', title: 'Improve', color: 'text-primary' },
  { id: 'tomorrow', title: 'Tomorrow', color: 'text-terminal-blue' },
  { id: 'stop', title: 'Stop Doing', color: 'text-destructive' },
];

export function ImprovementsBoard() {
  const { improvements, selectedProjectId } = useProjectStore();
  const projectImprovements = improvements.filter((i) => i.projectId === selectedProjectId);

  return (
    <div className="grid grid-cols-3 gap-4 h-[calc(100vh-200px)]">
      {columns.map((column) => {
        const items = projectImprovements.filter((i) => i.category === column.id);
        
        return (
          <div key={column.id} className="flex flex-col border border-border rounded-sm overflow-hidden">
            {/* Header */}
            <div className="px-3 py-2 bg-muted/30 border-b border-border flex items-center justify-between">
              <span className={cn("text-xs font-mono uppercase tracking-wider", column.color)}>
                {column.title}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {items.length}
              </span>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-sm p-3 text-sm font-mono text-foreground hover:border-primary/30 transition-colors cursor-default"
                >
                  {item.text}
                </div>
              ))}
            </div>

            {/* Add Button */}
            <div className="p-2 border-t border-border">
              <button className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-mono text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/50 rounded-sm transition-colors">
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
