
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, CalendarDays, Pin } from 'lucide-react';
import { useMemo } from 'react';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export function ActiveProjectsPanel() {
    const { projects, setSelectedProject, togglePin } = useProjectStore();
    const { tasks } = useTaskStore();

    const activeProjectStats = useMemo(() => {
        return projects
            .filter(p => p.status === 'active') // Only showing active projects
            .map(p => {
                const pTasks = tasks.filter(t => t.project_id === p.id);
                const total = pTasks.length;
                const completed = pTasks.filter(t => t.status === 'completed').length;
                const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

                const pendingTasks = pTasks.filter(t => t.status === 'pending');
                const nextDue = pendingTasks
                    .filter(t => t.scheduled_date)
                    .sort((a, b) => a.scheduled_date!.localeCompare(b.scheduled_date!))[0];

                return {
                    ...p,
                    progress,
                    pendingCount: pendingTasks.length,
                    nextDueDate: nextDue?.scheduled_date,
                    nextTaskTitle: nextDue?.title
                };
            })
            .sort((a, b) => {
                // Pinned first
                if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;

                // Sort by Next Due Date (Ascending), then Name
                if (a.nextDueDate && !b.nextDueDate) return -1;
                if (!a.nextDueDate && b.nextDueDate) return 1;
                if (a.nextDueDate && b.nextDueDate) return a.nextDueDate.localeCompare(b.nextDueDate);
                return 0; // Fallback
            });
    }, [projects, tasks]);

    if (activeProjectStats.length === 0) {
        return (
            <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                No active projects. Start something new!
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeProjectStats.map((project) => (
                <Card key={project.id} className={cn("flex flex-col border-border/60 transition-all hover:border-primary/50 group relative", project.is_pinned && "border-primary/30 bg-primary/5")}>
                    {/* Pinned Indicator */}
                    <button
                        onClick={(e) => { e.stopPropagation(); togglePin(project.id); }}
                        className={cn("absolute top-3 right-3 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100", project.is_pinned && "opacity-100 text-primary")}
                    >
                        <Pin className="w-4 h-4" fill={project.is_pinned ? "currentColor" : "none"} />
                    </button>

                    <CardHeader className="pb-3">
                        <CardTitle className="flex justify-between items-start text-base font-bold font-mono tracking-tight">
                            <span className="truncate pr-6">{project.name}</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-2 h-10 text-xs text-muted-foreground">
                            {project.tech_stack?.join(', ') || 'No stack'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 pb-2">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-medium">
                                    <span>Progress</span>
                                    <span>{project.progress}%</span>
                                </div>
                                <Progress value={project.progress} className="h-1.5" />
                            </div>

                            {project.nextDueDate ? (
                                <div className={cn("p-2 rounded bg-muted/50 text-xs border flex items-center gap-2",
                                    (isToday(parseISO(project.nextDueDate)) || isPast(parseISO(project.nextDueDate))) && "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                                )}>
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="truncate flex-1 font-mono">
                                        {format(parseISO(project.nextDueDate), 'MMM d')}: {project.nextTaskTitle}
                                    </span>
                                </div>
                            ) : (
                                <div className="p-2 rounded bg-muted/30 text-xs border border-dashed text-muted-foreground flex items-center gap-2">
                                    <CalendarDays className="w-3.5 h-3.5 opacity-50" />
                                    <span>No upcoming tasks</span>
                                </div>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="pt-2">
                        <Button
                            variant="ghost"
                            className="w-full justify-between text-xs font-mono h-8 hover:bg-primary/10 hover:text-primary"
                            onClick={() => setSelectedProject(project.id)}
                        >
                            Open Terminal <ArrowRight className="w-3 h-3 ml-2" />
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
