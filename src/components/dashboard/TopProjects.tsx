
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TopProjects() {
    const { tasks } = useTaskStore();
    const { projects } = useProjectStore();

    // Logic
    const stats = projects.map(p => {
        const pTasks = tasks.filter(t => t.project_id === p.id);
        const completed = pTasks.filter(t => t.status === 'completed').length;

        return {
            ...p,
            completedCount: completed,
        }
    })
        .filter(p => p.completedCount > 0)
        .sort((a, b) => b.completedCount - a.completedCount)
        .slice(0, 5);

    const maxCompleted = Math.max(...stats.map(s => s.completedCount), 1);

    return (
        <Card className="border-border/60 h-full shadow-sm">
            <CardHeader className="py-4 border-b border-border/40 bg-card/50">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" /> Top Projects
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-5">
                {stats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm italic">
                        No projects with completed tasks yet.
                    </div>
                ) : (
                    stats.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-4 group">
                            <div className={cn("flex items-center justify-center w-8 h-8 rounded-md font-bold text-sm transition-transform group-hover:scale-110",
                                i === 0 ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                                    i === 1 ? "bg-slate-400/10 text-slate-400 border border-slate-400/20" :
                                        i === 2 ? "bg-amber-700/10 text-amber-700 border border-amber-700/20" : "bg-muted text-muted-foreground border border-border"
                            )}>
                                {i + 1}
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <div className="flex justify-between items-end">
                                    <span className="font-semibold text-sm truncate">{p.name}</span>
                                    <span className="text-xs font-mono text-muted-foreground">{p.completedCount} Tasks</span>
                                </div>
                                {/* Bar */}
                                <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-1000 ease-out",
                                            i === 0 ? "bg-yellow-500" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-amber-700" : "bg-primary/50"
                                        )}
                                        style={{ width: `${(p.completedCount / maxCompleted) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
