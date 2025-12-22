
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flame, CheckCircle2, LayoutGrid, Calendar } from 'lucide-react';
import { useMemo } from 'react';
import { isSameDay, isSameWeek, parseISO, subDays } from 'date-fns';
import { EditProfileDialog } from '@/components/dashboard/EditProfileDialog';

export function ProfileSection() {
    const { profile } = useUserStore();
    const { projects } = useProjectStore();
    const { tasks, heatmapData } = useTaskStore();

    // Compute Stats
    const stats = useMemo(() => {
        const activeProjects = projects.filter(p => p.status === 'active').length;

        const today = new Date();

        const tasksCompletedToday = tasks.filter(t =>
            t.status === 'completed' && t.completed_at && isSameDay(parseISO(t.completed_at), today)
        ).length;

        const tasksCompletedWeek = tasks.filter(t =>
            t.status === 'completed' && t.completed_at && isSameWeek(parseISO(t.completed_at), today, { weekStartsOn: 1 }) // Mon-Sun
        ).length;

        // Calculate Streak
        let currentStreak = 0;
        const todayStr = today.toISOString().split('T')[0];
        const hasToday = heatmapData.find(d => d.date === todayStr && d.score > 0);

        for (let i = 0; i < 365; i++) {
            const dStr = subDays(today, i).toISOString().split('T')[0];
            const entry = heatmapData.find(h => h.date === dStr);
            if (entry && entry.score > 0) {
                currentStreak++;
            } else if (i === 0 && !hasToday) {
                continue;
            } else {
                break;
            }
        }

        return {
            activeProjects,
            tasksCompletedToday,
            tasksCompletedWeek,
            currentStreak
        };
    }, [projects, tasks, heatmapData]);

    if (!profile) return (
        <Card className="animate-pulse bg-muted/20 border-none">
            <CardContent className="h-32" />
        </Card>
    );

    return (
        <Card className="bg-card border-border h-full shadow-sm">
            <CardContent className="p-6 flex items-start gap-6 h-full">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl shrink-0">
                    <AvatarImage src={profile.avatar_url || ""} className="object-cover" />
                    <AvatarFallback className="text-2xl bg-primary/20 text-primary font-mono">
                        {profile.email ? profile.email[0].toUpperCase() : "U"}
                    </AvatarFallback>
                </Avatar>

                <div className="space-y-2 flex-1">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{profile.username || "Developer"}</h2>
                            <p className="text-muted-foreground line-clamp-2 max-w-md">{profile.bio || "No bio set. Ready to code."}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className="font-mono text-xs py-1">
                                {profile.email}
                            </Badge>
                            <EditProfileDialog />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-mono uppercase">Streak</span>
                            <div className="flex items-center gap-2 font-bold text-lg">
                                <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                                {stats.currentStreak} days
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-mono uppercase">Today</span>
                            <div className="flex items-center gap-2 font-bold text-lg">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                {stats.tasksCompletedToday}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-mono uppercase">Week</span>
                            <div className="flex items-center gap-2 font-bold text-lg">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                {stats.tasksCompletedWeek}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-mono uppercase">Active</span>
                            <div className="flex items-center gap-2 font-bold text-lg">
                                <LayoutGrid className="w-5 h-5 text-purple-500" />
                                {stats.activeProjects}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
