
import { useEffect, useMemo, useState } from 'react';
import { useTaskStore, HeatmapPoint } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { differenceInDays, subDays, format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Plus, Square, CheckSquare, Globe, Filter, FileText } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';

// Color scale logic (Locked Purple/Magenta Protocol)
const getColorClass = (score: number) => {
    // Shared border style
    const base = "border border-white/5";

    if (score === 0) return `bg-[var(--heat-0)] ${base}`; // Neutral dark
    if (score <= 2) return `bg-[var(--heat-1)] ${base}`; // Light day
    if (score <= 5) return `bg-[var(--heat-2)] ${base}`; // Productive
    if (score <= 8) return `bg-[var(--heat-3)] ${base}`; // Strong output
    return `bg-[var(--heat-4)] ${base} shadow-[0_0_10px_var(--heat-4)]`; // Peak day
};

export function TaskHeatmap() {
    const { selectedProjectId } = useProjectStore();
    const { heatmapData, fetchHeatmapStats, tasks, fetchTasks, createTask, toggleTaskStatus } = useTaskStore();
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showAllProjects, setShowAllProjects] = useState(false);
    const [selectedDayLogs, setSelectedDayLogs] = useState<any[]>([]);

    useEffect(() => {
        const pid = showAllProjects ? undefined : (selectedProjectId || undefined);
        fetchHeatmapStats(pid);
        fetchTasks(selectedProjectId || undefined);
    }, [selectedProjectId, showAllProjects, fetchHeatmapStats, fetchTasks]);

    // Fetch logs when date selected
    useEffect(() => {
        if (!selectedDate) {
            setSelectedDayLogs([]);
            return;
        }
        const fetchLogs = async () => {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            let query = supabase
                .from('daily_logs')
                .select('*')
                .eq('status', 'submitted')
                .eq('log_date', dateStr);

            if (!showAllProjects && selectedProjectId) {
                query = query.eq('project_id', selectedProjectId);
            }

            const { data } = await query;
            setSelectedDayLogs(data || []);
        };
        fetchLogs();
    }, [selectedDate, selectedProjectId, showAllProjects]);

    const calendarData = useMemo(() => {
        const today = new Date();
        const startDate = startOfWeek(subDays(today, 364));
        const statsMap = new Map<string, HeatmapPoint>();
        heatmapData.forEach(d => statsMap.set(d.date, d));

        const days = [];
        for (let i = 0; i < 371; i++) {
            const d = addDays(startDate, i);
            if (d > today) break;

            const dateStr = format(d, 'yyyy-MM-dd');
            const stat = statsMap.get(dateStr);
            days.push({
                date: d,
                dateStr,
                score: stat?.score || 0,
                taskCount: stat?.taskCount || 0,
                logCount: stat?.logCount || 0
            });
        }
        return days;
    }, [heatmapData]);

    const tasksForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return tasks.filter(t => {
            if (t.status === 'completed' && t.completed_at?.startsWith(dateStr)) return true;
            return false;
        });
    }, [selectedDate, tasks]);

    const pendingTasks = tasks.filter(t => t.status === 'pending');

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !selectedProjectId) return;
        await createTask(selectedProjectId, newTaskTitle);
        setNewTaskTitle("");
    };

    return (
        <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <CardTitle className="text-lg font-semibold tracking-tight">Daily Activity Heatmap</CardTitle>
                        <CardDescription>
                            {showAllProjects ? "All projects (Tasks + Logs)" : "Project activity"}
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="show-all"
                                checked={showAllProjects}
                                onCheckedChange={setShowAllProjects}
                                className="data-[state=checked]:bg-[var(--heat-3)]"
                            />
                            <Label htmlFor="show-all" className="text-xs text-muted-foreground uppercase font-mono tracking-wider cursor-pointer">
                                Global Stats
                            </Label>
                        </div>
                    </div>
                </div>

                {/* Quick Add Task */}
                <form onSubmit={handleCreateTask} className="flex gap-2">
                    <Input
                        placeholder="Add new task..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="h-8 w-[200px] bg-background border-muted"
                    />
                    <Button size="sm" type="submit" variant="secondary" className="h-8 hover:bg-[var(--heat-1)] hover:text-white transition-colors">
                        <Plus className="w-4 h-4" />
                    </Button>
                </form>
            </CardHeader>

            <CardContent className="px-0">
                {/* Heatmap Grid */}
                <div className="flex flex-wrap gap-1 w-full overflow-x-auto pb-4 custom-scrollbar">
                    <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
                        {calendarData.map((day) => (
                            <TooltipProvider key={day.dateStr}>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setSelectedDate(day.date)}
                                            className={cn(
                                                "w-3 h-3 rounded-[3px] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ring-offset-background",
                                                getColorClass(day.score),
                                                selectedDate && isSameDay(selectedDate, day.date) ? "ring-2 ring-[var(--heat-3)] ring-offset-2" : ""
                                            )}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-[#1E1E1E] border-[var(--heat-1)] text-white">
                                        <div className="text-xs font-medium font-mono mb-1 border-b border-white/10 pb-1">
                                            {format(day.date, 'MMM d, yyyy')}
                                        </div>
                                        <div className="text-xs space-y-0.5">
                                            <div className="flex justify-between gap-4">
                                                <span>Tasks:</span>
                                                <span className="font-mono text-[var(--heat-3)]">{day.taskCount}</span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span>Log:</span>
                                                <span className={cn("font-mono", day.logCount > 0 ? "text-[var(--heat-3)]" : "text-muted-foreground")}>
                                                    {day.logCount > 0 ? "Submitted" : "None"}
                                                </span>
                                            </div>
                                            <div className="pt-1 mt-1 border-t border-white/10 flex justify-between gap-4 font-bold">
                                                <span>Score:</span>
                                                <span>{day.score}</span>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                </div>

                <div className="mt-6">
                    {/* Pending Tasks Area */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Square className="w-3 h-3" />
                            Pending Tasks
                        </h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {pendingTasks.length === 0 ? (
                                <div className="text-sm text-muted-foreground italic p-4 border border-dashed border-white/10 rounded-md text-center bg-[#1E1E1E]">
                                    No pending tasks.
                                </div>
                            ) : (
                                pendingTasks.map(task => (
                                    <div key={task.id} className="flex items-start gap-3 p-3 bg-card border border-white/5 rounded-md group hover:border-[var(--heat-2)]/50 transition-colors">
                                        <button
                                            onClick={() => toggleTaskStatus(task.id, 'pending')}
                                            className="mt-0.5 text-muted-foreground hover:text-[var(--heat-3)] transition-colors"
                                        >
                                            <Square className="w-4 h-4" />
                                        </button>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium leading-none">{task.title}</p>
                                            {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
