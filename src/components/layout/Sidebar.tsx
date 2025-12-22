import { Plus, FolderCode, Circle, LogOut } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { UserDashboardTrigger } from './UserDashboardTrigger';
import { CreateProjectDialog } from '@/components/dialogs/CreateProjectDialog';

export function Sidebar() {
  const { projects, selectedProjectId, setSelectedProject } = useProjectStore();

  return (
    <aside className="w-56 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo & User Dashboard */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-sidebar-border">
        <span className="font-mono text-sm font-semibold text-primary tracking-tight">
          Trace.dev
        </span>
        <UserDashboardTrigger />
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 py-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
            Projects
          </span>
        </div>

        <nav className="space-y-0.5 px-2">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project.id)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-mono rounded-sm transition-colors text-left",
                selectedProjectId === project.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <FolderCode className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{project.name}</span>
              <Circle
                className={cn(
                  "w-1.5 h-1.5 ml-auto shrink-0",
                  project.status === 'active' ? "fill-primary text-primary" : "fill-muted-foreground text-muted-foreground"
                )}
              />
            </button>
          ))}
        </nav>
      </div>

      {/* New Project Button */}
      <div className="p-2 border-t border-sidebar-border gap-2 flex flex-col">
        <CreateProjectDialog
          trigger={
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono border border-dashed border-sidebar-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors rounded-sm">
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>
          }
        />

        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors rounded-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
