
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Briefcase, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";

export function PendingTasksPanel() {
    const { tasks } = useTaskStore();
    const { projects } = useProjectStore();

    // Filter and Sort
    const pendingTasks = tasks
        .filter(t => t.status === 'pending')
        .sort((a, b) => {
            // Scheduled date sort (Earliest first)
            if (a.scheduled_date && !b.scheduled_date) return -1;
            if (!a.scheduled_date && b.scheduled_date) return 1;
            if (a.scheduled_date && b.scheduled_date) return a.scheduled_date.localeCompare(b.scheduled_date);
            // Secondary sort by created_at desc
            return b.created_at.localeCompare(a.created_at);
        });

    const getProjectName = (pid: string) => projects.find(p => p.id === pid)?.name || 'Unknown Project';
    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <Card className="border-border/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-muted-foreground" />
                        Pending Tasks
                    </CardTitle>
                    <CardDescription>Action items by urgency</CardDescription>
                </div>
                <Badge variant="outline" className="font-mono">
                    {pendingTasks.length} Total
                </Badge>
            </CardHeader>
            <CardContent>
                {pendingTasks.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                        No pending tasks. You’re clear for now.
                    </div>
                ) : (
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-3">
                            {pendingTasks.map(t => {
                                const isOverdue = t.scheduled_date && t.scheduled_date < todayStr;
                                const isToday = t.scheduled_date === todayStr;

                                return (
                                    <div key={t.id} className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-muted/30 transition-colors group">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5 container">
                                                <span className={cn("font-medium text-sm truncate", isOverdue ? "text-[#A64DFF]" : "text-foreground")}>
                                                    {t.title}
                                                </span>
                                                {isOverdue && <Badge className="bg-[#A64DFF] hover:bg-[#A64DFF] h-5 text-[10px] shrink-0">Overdue</Badge>}
                                                {isToday && <Badge variant="secondary" className="h-5 text-[10px] shrink-0">Today</Badge>}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1.5 min-w-0">
                                                    <Briefcase className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">{getProjectName(t.project_id)}</span>
                                                </span>
                                                {t.scheduled_date && (
                                                    <span className={cn("flex items-center gap-1 font-mono shrink-0", isOverdue ? "text-[#A64DFF]" : "")}>
                                                        <Clock className="w-3 h-3" /> {t.scheduled_date}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
