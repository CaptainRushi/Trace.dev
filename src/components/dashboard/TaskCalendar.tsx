
import { useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export function TaskCalendar() {
    const { tasks, toggleTaskStatus, createTask, scheduleTask } = useTaskStore();
    const { projects } = useProjectStore();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [addProjectId, setAddProjectId] = useState<string>("");

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || !addProjectId || !selectedDate) return;
        try {
            const task = await createTask(addProjectId, newTaskTitle);
            if (task) {
                await scheduleTask(task.id, format(selectedDate, 'yyyy-MM-dd'));
                setNewTaskTitle("");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    });

    const getTasksForDay = (date: Date) => {
        const dStr = format(date, 'yyyy-MM-dd');
        return tasks.filter(t => t.scheduled_date && t.scheduled_date.startsWith(dStr));
    };

    const selectedTasks = selectedDate ? getTasksForDay(selectedDate).map(t => ({
        ...t,
        projectName: projects.find(p => p.id === t.project_id)?.name || 'Unknown Project'
    })) : [];

    const renderTaskList = (filterStatus: 'all' | 'pending' | 'completed') => {
        const filtered = selectedTasks.filter(t => filterStatus === 'all' ? true : t.status === filterStatus);

        if (filtered.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground text-sm italic">
                    {filterStatus === 'all' ? "No tasks scheduled for this date." :
                        filterStatus === 'pending' ? "No pending tasks." : "No completed tasks yet."}
                </div>
            );
        }

        // Group by Project
        const grouped: Record<string, typeof filtered> = {};
        filtered.forEach(t => {
            if (!grouped[t.projectName]) grouped[t.projectName] = [];
            grouped[t.projectName].push(t);
        });

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {Object.entries(grouped).map(([project, pTasks]) => (
                    <div key={project} className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <span className="w-1 h-3 bg-primary rounded-full" />
                            {project}
                        </h4>
                        <div className="space-y-2 pl-2 border-l border-border/40 ml-0.5">
                            {pTasks.map(t => (
                                <div key={t.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/10 border border-transparent hover:border-border/50 transition-colors group">
                                    <button
                                        onClick={() => toggleTaskStatus(t.id, t.status)}
                                        className={cn("mt-0.5 shrink-0 transition-colors", t.status === 'completed' ? "text-green-500" : "text-muted-foreground hover:text-primary")}
                                    >
                                        {t.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                    </button>
                                    <div className="flex-1 space-y-1">
                                        <p className={cn("text-sm font-medium leading-tight", t.status === 'completed' && "line-through text-muted-foreground")}>
                                            {t.title}
                                        </p>
                                        {t.description && <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <Card className="border-border/60 h-full shadow-sm flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-border/40 bg-card/50 px-6">
                    <CardTitle className="text-lg font-medium">Task Calendar ({tasks.length})</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-7 w-7">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-mono font-semibold w-32 text-center select-none">
                            {format(currentMonth, 'MMMM yyyy')}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-7 w-7">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 bg-background/50">
                    <div className="grid grid-cols-7 border-b border-border/40 bg-muted/20">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                            <div key={d} className="p-3 text-center text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 auto-rows-fr">
                        {days.map((day, i) => {
                            const dayTasks = getTasksForDay(day);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isTodayDate = isSameDay(day, new Date());

                            return (
                                <div key={day.toISOString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={cn(
                                        "min-h-[100px] md:min-h-[120px] border-b border-r border-border/40 p-1 md:p-2 transition-all hover:bg-primary/5 cursor-pointer relative group flex flex-col gap-1",
                                        !isCurrentMonth && "bg-muted/5 opacity-40 grayscale pointer-events-none",
                                    )}
                                >
                                    <div className={cn("text-[10px] md:text-xs font-mono mb-1 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-sm transition-colors",
                                        isTodayDate ? "bg-primary text-primary-foreground font-bold shadow-sm" : "text-muted-foreground group-hover:text-foreground"
                                    )}>
                                        {format(day, 'd')}
                                    </div>

                                    <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                        {dayTasks.slice(0, 4).map(t => (
                                            <div key={t.id} className={cn("text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded border truncate flex items-center gap-1.5 shadow-sm transition-transform group-hover:scale-[1.02]",
                                                t.status === 'completed'
                                                    ? "bg-muted/50 text-muted-foreground line-through decoration-muted-foreground/50 border-transparent opacity-70"
                                                    : "bg-[#1A1A1A] border-l-[2px] border-l-indigo-500 border-y-transparent border-r-transparent text-indigo-100"
                                            )}>
                                                <div className={cn("w-1 h-1 rounded-full shrink-0", t.status === 'completed' ? "bg-muted-foreground" : "bg-indigo-500")} />
                                                <span className="truncate">{t.title}</span>
                                            </div>
                                        ))}
                                        {dayTasks.length > 4 && (
                                            <div className="text-[9px] text-muted-foreground pl-1">
                                                +{dayTasks.length - 4} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <Sheet open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
                <SheetContent className="sm:max-w-md w-[400px]">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-xl font-mono">
                            {selectedDate && format(selectedDate, 'MMMM do, yyyy')}
                        </SheetTitle>
                        <SheetDescription>
                            Scheduled tasks and deadlines.
                        </SheetDescription>
                    </SheetHeader>

                    {selectedDate && (
                        <div className="h-full flex flex-col">
                            <div className="mb-6 space-y-3 p-4 border rounded-lg bg-muted/20 shrink-0">
                                <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                    <Plus className="w-4 h-4" /> Add Task for {format(selectedDate, 'MMM d')}
                                </h4>
                                <div className="space-y-2">
                                    <Select value={addProjectId} onValueChange={setAddProjectId}>
                                        <SelectTrigger className="h-8 text-xs bg-background w-full">
                                            <SelectValue placeholder="Select Project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Task title..."
                                            className="h-8 text-xs bg-background"
                                            value={newTaskTitle}
                                            onChange={e => setNewTaskTitle(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                                        />
                                        <Button size="sm" className="h-8 px-3" onClick={handleAddTask} disabled={!addProjectId || !newTaskTitle.trim()}>
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Tabs defaultValue="all" className="flex-1 flex flex-col min-h-0">
                                <TabsList className="grid w-full grid-cols-3 mb-4 shrink-0">
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="pending">Pending</TabsTrigger>
                                    <TabsTrigger value="completed">Done</TabsTrigger>
                                </TabsList>

                                <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                                    <TabsContent value="all" className="mt-0">
                                        {renderTaskList('all')}
                                    </TabsContent>
                                    <TabsContent value="pending" className="mt-0">
                                        {renderTaskList('pending')}
                                    </TabsContent>
                                    <TabsContent value="completed" className="mt-0">
                                        {renderTaskList('completed')}
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}

