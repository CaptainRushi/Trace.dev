
import { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';
import { QuickStatus, RecentActivity, ActivityItem } from '@/components/dashboard/OverviewComponents';
import { supabase } from '@/integrations/supabase/client';
import { TaskHeatmap } from "@/components/charts/TaskHeatmap";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Github, Layers, Globe } from 'lucide-react';
import { format } from 'date-fns';

export function ProjectOverview() {
  const { selectedProjectId, projects } = useProjectStore();
  const {
    tasks, fetchTasks, heatmapData, fetchHeatmapStats, toggleTaskStatus, createTask, scheduleTask
  } = useTaskStore();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedProjectId) return;

    const load = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTasks(selectedProjectId),
          fetchHeatmapStats(selectedProjectId),
          fetchProjectActivity()
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();

    const channel = supabase.channel(`project-${selectedProjectId}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchTasks(selectedProjectId, true);
        fetchHeatmapStats(selectedProjectId);
        fetchProjectActivity();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };

  }, [selectedProjectId]);

  const fetchProjectActivity = async () => {
    if (!selectedProjectId) return;

    try {
      const [
        { data: recentTasks },
        { data: recentCode },
        { data: recentKeys },
        { data: recentLogs }
      ] = await Promise.all([
        supabase.from('tasks')
          .select('id, title, completed_at, project_id, projects(name)')
          .eq('project_id', selectedProjectId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(5),
        supabase.from('code_files')
          .select('id, filename, version, created_at, code_containers!inner(project_id, projects(name))')
          .eq('code_containers.project_id', selectedProjectId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('api_key_packets') // Corrected table name
          .select('id, platform_name, created_at, project_id, projects(name)')
          .eq('project_id', selectedProjectId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('daily_logs')
          .select('id, log_date, created_at, project_id, projects(name)')
          .eq('project_id', selectedProjectId)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const merged: ActivityItem[] = [];

      recentTasks?.forEach((t: any) => {
        if (t.completed_at) {
          merged.push({
            id: t.id, type: 'task',
            description: `Completed "${t.title}"`,
            project_name: t.projects?.name || 'Unknown',
            timestamp: t.completed_at
          });
        }
      });

      recentCode?.forEach((c: any) => {
        const pName = c.code_containers?.projects?.name || 'Unknown';
        if (c.created_at) {
          merged.push({
            id: c.id, type: 'code',
            description: `Saved ${c.filename} (v${c.version})`,
            project_name: pName,
            timestamp: c.created_at
          });
        }
      });

      recentKeys?.forEach((k: any) => merged.push({
        id: k.id, type: 'key',
        description: `Added Key: ${k.platform_name}`, // Corrected field name
        project_name: k.projects?.name || 'Unknown',
        timestamp: k.created_at
      }));

      recentLogs?.forEach((l: any) => merged.push({
        id: l.id, type: 'log',
        description: `Daily Log for ${l.log_date}`,
        project_name: l.projects?.name || 'Unknown',
        timestamp: l.created_at || l.log_date
      }));

      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(merged.slice(0, 10));
    } catch (err) {
      console.error('Error fetching project activity:', err);
    }
  };

  const project = projects.find(p => p.id === selectedProjectId);
  if (!project) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingCount = tasks.filter(t => t.project_id === selectedProjectId && t.status === 'pending').length;
  const completedToday = tasks.filter(t =>
    t.project_id === selectedProjectId &&
    t.status === 'completed' &&
    t.completed_at?.startsWith(todayStr)
  ).length;
  const hasLog = heatmapData.some(h => h.date === todayStr && h.logCount > 0);

  return (
    <div className="space-y-8 animate-in fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{project.name} Overview</h2>
          <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM do')}</p>
        </div>
      </div>

      <QuickStatus
        activeProjects={1}
        pendingTasks={pendingCount}
        completedToday={completedToday}
        logStatus={hasLog ? 'submitted' : 'pending'}
        loading={loading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Info */}
        <div className="lg:col-span-2 space-y-8">
          <ProjectInfoCard project={project} />
          <div className="pt-4 border-t border-border/40">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Project Snapshot</h3>
            <TaskHeatmap />
          </div>
        </div>

        {/* Right: Feed & Heatmap */}
        <div className="space-y-8">
          <RecentActivity activities={activities} />
        </div>
      </div>
    </div>
  );
}

function ProjectInfoCard({ project }: { project: any }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="py-4 px-5 border-b border-border/40 bg-card/50">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-500" /> Project Details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Globe className="w-3 h-3" /> Repository
          </h4>
          <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md border border-border/50">
            <Github className="w-4 h-4 text-foreground" />
            <span className="text-sm font-mono truncate select-all">{project.repo_url || 'No repository linked'}</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Layers className="w-3 h-3" /> Tech Stack
          </h4>
          <div className="flex flex-wrap gap-2">
            {project.tech_stack && project.tech_stack.length > 0 ? (
              project.tech_stack.map((t: string) => (
                <Badge key={t} variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">
                  {t}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground italic">Not specified</span>
            )}
          </div>
        </div>

        <div className="md:col-span-2 flex items-center gap-6 pt-2 border-t border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Badge variant={project.status === 'active' ? 'default' : 'outline'} className="capitalize h-5 text-[10px]">
              {project.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Created:</span>
            <span className="text-xs font-mono">{format(new Date(project.created_at), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
