
import { Plus, FolderCode, Circle, LogOut, Crown, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { usePlanStore } from '@/stores/planStore';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { UserDashboardTrigger } from './UserDashboardTrigger';
import { CreateProjectDialog } from '@/components/dialogs/CreateProjectDialog';
import { toast } from 'sonner';

export function Sidebar() {
  const navigate = useNavigate();
  const { projects, selectedProjectId, setSelectedProject } = useProjectStore();
  const { currentPlan, fetchPlan, loading } = usePlanStore();

  const isPaid = currentPlan !== 'free';

  return (
    <aside className="w-56 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo & User Dashboard */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Trace.dev" className="h-5 w-auto max-w-[24px] object-contain" />
          <span className="font-mono text-sm font-semibold text-primary tracking-tight">
            Trace.dev
          </span>
        </div>
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
          onClick={async () => {
            await fetchPlan();
            toast.success('Subscription status synced');
          }}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono border border-sidebar-border text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors rounded-sm"
        >
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          Sync Status
        </button>

        <button
          onClick={() => navigate('/pricing')}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono transition-colors rounded-sm border",
            isPaid
              ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
              : "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30 text-indigo-400 hover:from-indigo-500/20 hover:to-purple-500/20 hover:text-indigo-300"
          )}
        >
          <Crown className="w-3.5 h-3.5" />
          {isPaid ? (['monthly', 'starter'].includes(currentPlan) ? 'Monthly Plan' : 'Yearly Plan') : 'Upgrade Plan'}
        </button>

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
