
import { useState, useMemo } from 'react';
import { useTaskStore, Task } from '@/stores/taskStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, parseISO, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export function WorkCalendar() {
    const { tasks } = useTaskStore();
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarGrid = useMemo(() => {
        const days = [];
        let day = startDate;
        while (day <= endDate) {
            days.push(day);
            day = addDays(day, 1);
        }
        return days;
    }, [viewDate]);

    // Group tasks by date
    const tasksByDate = useMemo(() => {
        const map = new Map<string, { planned: Task[], completed: Task[] }>();

        tasks.forEach(t => {
            // Planned (Pending)
            if (t.status === 'pending' && t.scheduled_date) {
                const d = t.scheduled_date; // YYYY-MM-DD
                const entry = map.get(d) || { planned: [], completed: [] };
                entry.planned.push(t);
                map.set(d, entry);
            }

            // Completed (Based on completed_at)
            if (t.status === 'completed' && t.completed_at) {
                const dLocal = format(parseISO(t.completed_at), 'yyyy-MM-dd');
                const entry = map.get(dLocal) || { planned: [], completed: [] };
                entry.completed.push(t);
                map.set(dLocal, entry);
            }
        });
        return map;
    }, [tasks]);

    const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
    const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));

    return (
        <Card className="h-full border-border/60 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
                <div>
                    <CardTitle className="text-lg font-bold">Plan</CardTitle>
                    <CardDescription>Workload Overview</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-mono text-sm w-24 text-center">
                        {format(viewDate, 'MMMM yyyy')}
                    </span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-[10px] uppercase font-bold text-muted-foreground">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-muted/20 border border-muted/20 rounded overflow-hidden">
                    {calendarGrid.map((day, idx) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const data = tasksByDate.get(dateKey) || { planned: [], completed: [] };
                        const { planned, completed } = data;

                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isTodayDate = isSameDay(day, new Date());
                        const isOverloaded = planned.length > 3;
                        const displayPlanned = planned;

                        return (
                            <Dialog key={dateKey}>
                                <DialogTrigger asChild>
                                    <button
                                        className={cn(
                                            "h-24 p-1 flex flex-col items-start justify-start text-left transition-colors hover:bg-muted/50 focus:outline-none bg-card relative",
                                            !isCurrentMonth && "bg-muted/10 text-muted-foreground opacity-50",
                                            isTodayDate && "bg-primary/5 ring-1 ring-primary inset-0 z-10"
                                        )}
                                        onClick={() => setSelectedDay(day)}
                                    >
                                        <div className="w-full flex justify-between items-start">
                                            <span className={cn("text-xs font-mono p-1", isTodayDate && "text-primary font-bold")}>
                                                {format(day, 'd')}
                                            </span>
                                            {isOverloaded && (
                                                <AlertTriangle className="w-3 h-3 text-amber-500 m-1" />
                                            )}
                                        </div>

                                        <div className="w-full space-y-0.5 mt-1 overflow-hidden">
                                            {planned.slice(0, 3).map(t => (
                                                <div key={t.id} className="text-[10px] truncate bg-primary/10 text-primary-foreground/80 dark:text-primary px-1 rounded mx-0.5">
                                                    {t.title}
                                                </div>
                                            ))}
                                            {planned.length > 3 && (
                                                <div className="text-[9px] text-muted-foreground pl-1">
                                                    +{planned.length - 3} more
                                                </div>
                                            )}

                                            {completed.length > 0 && (
                                                <div className="absolute bottom-1 right-1 flex items-center text-[10px] text-purple-400 font-mono font-bold bg-purple-500/10 px-1 rounded">
                                                    ✓ {completed.length}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <span>{format(day, 'MMMM d')}</span>
                                            {isTodayDate && <Badge variant="secondary" className="text-xs">Today</Badge>}
                                        </DialogTitle>
                                        <DialogDescription>
                                            Activity Summary
                                        </DialogDescription>
                                    </DialogHeader>

                                    <ScrollArea className="max-h-[60vh] pr-4">
                                        <div className="space-y-6">
                                            {/* Planned / Pending Section - Hidden for Today as per user request */}
                                            {!isTodayDate && (
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                        <Circle className="w-3 h-3" /> Planned / Pending
                                                    </h4>
                                                    {displayPlanned.length === 0 ? (
                                                        <div className="text-sm text-muted-foreground italic px-2">No pending tasks for this day.</div>
                                                    ) : (
                                                        displayPlanned.map(t => (
                                                            <div key={t.id} className="flex items-start gap-3 p-3 bg-card border rounded-md shadow-sm group">
                                                                <div className="mt-0.5 w-2 h-2 rounded-full bg-primary/50 shrink-0" />
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium leading-none">{t.title}</p>
                                                                    {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}

                                            {/* Completed Section */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B3FA0] flex items-center gap-2">
                                                    <CheckCircle2 className="w-3 h-3" /> Completed Today
                                                </h4>
                                                {completed.length === 0 ? (
                                                    <div className="text-sm text-muted-foreground italic px-2">No tasks completed on this day.</div>
                                                ) : (
                                                    completed.map(t => (
                                                        <div key={t.id} className="flex items-start gap-3 p-3 bg-[#6B3FA0]/5 border border-[#6B3FA0]/20 rounded-md">
                                                            <CheckCircle2 className="w-4 h-4 text-[#6B3FA0] mt-0.5 shrink-0" />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium leading-none text-foreground/80 line-through decoration-[#6B3FA0]/50">{t.title}</p>
                                                                <div className="flex justify-between items-center mt-1">
                                                                    {t.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{t.description}</p>}
                                                                    <span className="text-[10px] font-mono text-[#6B3FA0]/70">
                                                                        {t.completed_at ? format(parseISO(t.completed_at), 'HH:mm') : ''}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </ScrollArea>
                                </DialogContent>
                            </Dialog>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
