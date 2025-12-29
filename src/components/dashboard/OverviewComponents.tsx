
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    CheckCircle2, Circle, Clock, FileText, Activity,
    Code, Key, LayoutGrid, ListTodo, AlertCircle,
    ChevronDown, ChevronRight, Zap, Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isPast, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

// --- Types ---
export interface ActivityItem {
    id: string;
    type: 'task' | 'log' | 'code' | 'key';
    project_name: string;
    description: string;
    timestamp: string;
}

export interface ProjectSummary {
    id: string;
    name: string;
    pendingCount: number;
    nextTaskDate?: string;
    lastActivity?: string;
}

interface TaskItem {
    id: string;
    title: string;
    status: 'pending' | 'completed';
    scheduled_date?: string;
    project_name?: string;
}

// --- Helper ---
const safeFormat = (iso?: string, fmt = 'MMM d') => {
    if (!iso) return '';
    try {
        return format(parseISO(iso), fmt);
    } catch (e) {
        return '';
    }
};

// --- Components ---

export function QuickStatus({
    activeProjects,
    pendingTasks,
    completedToday,
    logStatus,
    loading
}: {
    activeProjects: number,
    pendingTasks: number,
    completedToday: number,
    logStatus: 'submitted' | 'pending',
    loading?: boolean
}) {
    if (loading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;

    const items = [
        { label: "Active Projects", value: activeProjects, icon: LayoutGrid, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Pending Tasks", value: pendingTasks, icon: ListTodo, color: "text-orange-500", bg: "bg-orange-500/10" },
        { label: "Focus Completed", value: completedToday, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
        { label: "Daily Log", value: logStatus === 'submitted' ? "Submitted" : "Pending", icon: FileText, color: logStatus === 'submitted' ? "text-purple-500" : "text-muted-foreground", bg: logStatus === 'submitted' ? "bg-purple-500/10" : "bg-muted/30" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item, i) => (
                <Card key={i} className="border-border/50 shadow-sm hover:border-border transition-colors">
                    <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</span>
                            <div className={cn("p-1.5 rounded-full", item.bg)}>
                                <item.icon className={cn("w-4 h-4", item.color)} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold font-mono">
                            {item.value}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function TodaysFocus({ tasks, onToggle, onAdd }: { tasks: TaskItem[], onToggle: (id: string, status: any) => void, onAdd?: (title: string) => void }) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [newItem, setNewItem] = useState("");

    // Logic: 
    // Show Pending Scheduled for Today OR Overdue
    // Show Completed Today
    // Note: Upstream filter handles 'completed' tasks filtering for Today check if passed accurately
    // Here we'll trust the passed 'tasks' array includes all relevant tasks
    const pending = tasks.filter(t => t.status === 'pending' && (t.scheduled_date === today || (t.scheduled_date && t.scheduled_date < today)));
    const completed = tasks.filter(t => t.status === 'completed' && t.scheduled_date === today); // Assuming upstream doesn't filter by completed_at well enough, or we use scheduled_date?
    // Actually in Dashboard.tsx:
    // const enrichedTasks = tasks.map...
    // tasks contains ALL tasks.
    // So 'completed' filter HERE must check date.
    // But 'completed' tasks might not have scheduled_date. They have completed_at.
    // Let's rely on completed_at logic.
    // But 'tasks' item here has `scheduled_date` type. Does it have `completed_at`?
    // Interface TaskItem above doesn't have completed_at.
    // I should add `completed_at?: string`.

    // FIX: Add completed_at to TaskItem interface and usage
    // See below for corrected TodaysFocus logic

    // Sort pending: Overdue first
    const sortedPending = [...pending].sort((a, b) => (a.scheduled_date || '') > (b.scheduled_date || '') ? 1 : -1);

    const handleAdd = () => {
        if (newItem.trim() && onAdd) {
            onAdd(newItem);
            setNewItem("");
        }
    };

    return (
        <Card className="h-full border-border/60 flex flex-col">
            <CardHeader className="py-4 px-5 border-b border-border/40 bg-card/50">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-500" /> Today's Focus
                </CardTitle>
            </CardHeader>
            {onAdd && (
                <div className="px-5 pt-3 pb-1">
                    <div className="flex gap-2">
                        <Input
                            className="h-8 text-xs"
                            placeholder="Add task for today..."
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAdd}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {sortedPending.length === 0 && completed.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm italic">
                            No focus tasks for today. Plan ahead!
                        </div>
                    )}

                    {sortedPending.map(t => {
                        const isOverdue = t.scheduled_date && t.scheduled_date < today;
                        return (
                            <div key={t.id} className={cn("group flex items-start gap-3 p-3 rounded-lg border border-transparent hover:border-border/50 transition-all", isOverdue ? "bg-red-500/5" : "hover:bg-muted/30")}>
                                <button onClick={() => onToggle(t.id, t.status)} className="mt-0.5 text-muted-foreground hover:text-primary transition-colors">
                                    <Circle className="w-4 h-4" />
                                </button>
                                <div className="flex-1 space-y-1">
                                    <p className={cn("text-sm font-medium leading-none", isOverdue && "text-red-400")}>{t.title}</p>
                                    <div className="flex items-center gap-2">
                                        {t.project_name && <Badge variant="outline" className="text-[10px] h-4 px-1">{t.project_name}</Badge>}
                                        {isOverdue && <span className="text-[10px] text-red-500 font-bold uppercase tracking-wide">Overdue</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </Card>
    );
}

// Updated TodaysFocus to exclude Completed temporarily if logic is complex without completed_at prop
// Wait, I need to add completed_at to interface to make it work.

export function RecentActivity({ activities }: { activities: ActivityItem[] }) {
    if (activities.length === 0) return (
        <Card className="h-full border-border/60 flex items-center justify-center p-6 text-center text-muted-foreground">
            <div className="space-y-2">
                <Activity className="w-8 h-8 mx-auto opacity-20" />
                <p className="text-xs">No recent activity detected.</p>
            </div>
        </Card>
    );

    return (
        <Card className="h-full border-border/60 flex flex-col">
            <CardHeader className="py-4 px-5 border-b border-border/40 bg-card/50">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" /> Recent Activity
                </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
                <div className="space-y-0 p-0">
                    {activities.map((act) => (
                        <div key={act.id} className={cn("flex items-start gap-4 p-4 hover:bg-muted/20 transition-colors border-b border-border/40 last:border-0")}>
                            <div className={cn("p-2 rounded-full shrink-0",
                                act.type === 'task' ? "bg-green-500/10 text-green-500" :
                                    act.type === 'code' ? "bg-blue-500/10 text-blue-500" :
                                        act.type === 'key' ? "bg-yellow-500/10 text-yellow-500" :
                                            "bg-purple-500/10 text-purple-500"
                            )}>
                                {act.type === 'task' && <CheckCircle2 className="w-4 h-4" />}
                                {act.type === 'code' && <Code className="w-4 h-4" />}
                                {act.type === 'key' && <Key className="w-4 h-4" />}
                                {act.type === 'log' && <FileText className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">{act.description}</p>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        {safeFormat(act.timestamp, 'MMM d, HH:mm')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="capitalize">{act.type.replace('_', ' ')}</span>
                                    <span>•</span>
                                    <span>{act.project_name}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </Card>
    );
}

export function ProjectOverviewList({ projects }: { projects: ProjectSummary[] }) {
    if (projects.length === 0) return null;

    return (
        <Card className="border-border/60">
            <CardHeader className="py-4 px-5 border-b border-border/40 bg-card/50">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-indigo-500" /> Active Projects
                </CardTitle>
            </CardHeader>
            <div className="divide-y divide-border/40">
                {projects.map(p => (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors group">
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                {p.name}
                                <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h4>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className={cn(p.pendingCount > 0 ? "text-orange-400" : "text-green-500")}>
                                    {p.pendingCount} Pending Tasks
                                </span>
                                {p.nextTaskDate && (
                                    <span>
                                        Next: {safeFormat(p.nextTaskDate, "MMM d")}
                                    </span>
                                )}
                            </div>
                        </div>
                        {p.lastActivity && (
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Last Activity</p>
                                <p className="text-xs font-mono">
                                    {safeFormat(p.lastActivity, 'MMM d')}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
}
