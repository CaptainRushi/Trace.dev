
import { useEffect, useState } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { ActiveProjectsPanel } from "@/components/dashboard/ActiveProjectsPanel";
import { CreateProjectDialog } from '@/components/dialogs/CreateProjectDialog';
import { ProfileSection } from '@/components/dashboard/ProfileSection';
import { TaskCalendar } from '@/components/dashboard/TaskCalendar';
import { TopProjects } from '@/components/dashboard/TopProjects';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const { fetchTasks } = useTaskStore();
  const { fetchProjects, projects } = useProjectStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchProjects(),
          fetchTasks()
        ]);
      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const channel = supabase.channel('dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);



  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in space-y-10">
      {/* 1. User Profile Section */}
      <div className="w-full">
        <ProfileSection />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Active Projects */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Active Projects</h2>
              <p className="text-sm text-muted-foreground">Recent work.</p>
            </div>
            <CreateProjectDialog />
          </div>
          <ActiveProjectsPanel />
        </div>

        {/* Right Column: Top Projects */}
        <div className="xl:col-span-4 space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4 h-[67px] mt-0">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Top Projects</h2>
              <p className="text-sm text-muted-foreground">Productivity leaders.</p>
            </div>
          </div>
          <TopProjects />
        </div>
      </div>

      {/* 3. Task Calendar */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Task Calendar</h2>
          <p className="text-sm text-muted-foreground">Planned schedule.</p>
        </div>
        <TaskCalendar />
      </div>
    </div>
  );
}
