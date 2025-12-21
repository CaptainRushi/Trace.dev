import { Flame, Activity } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

export function TopBar() {
  const { projects, selectedProjectId } = useProjectStore();
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <header className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        {currentProject ? (
          <>
            <span className="font-mono text-sm font-medium text-foreground">
              {currentProject.name}
            </span>
            <span className="text-muted-foreground text-xs font-mono">
              /{currentProject.status}
            </span>
          </>
        ) : (
          <span className="font-mono text-sm text-muted-foreground">
            Select a project
          </span>
        )}
      </div>

      {currentProject && (
        <div className="flex items-center gap-4">
          {/* Streak */}
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono text-foreground">
              {currentProject.streak}d streak
            </span>
          </div>

          {/* Today's Activity */}
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">
              Last: {currentProject.lastActivity}
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
