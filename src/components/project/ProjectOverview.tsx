import { useProjectStore } from '@/stores/projectStore';
import { FolderCode, Flame, Calendar, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProjectOverview() {
  const { projects, selectedProjectId } = useProjectStore();
  const project = projects.find((p) => p.id === selectedProjectId);

  if (!project) return null;

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-muted/30 border border-border rounded-sm flex items-center justify-center">
          <FolderCode className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <h1 className="font-mono text-xl font-semibold text-foreground">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border border-border rounded-sm p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Circle className={cn(
              "w-2 h-2",
              project.status === 'active' ? "fill-primary text-primary" : "fill-muted-foreground"
            )} />
            <span className="text-xs font-mono uppercase tracking-wider">Status</span>
          </div>
          <div className="font-mono text-lg text-foreground capitalize">{project.status}</div>
        </div>

        <div className="border border-border rounded-sm p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Flame className="w-3.5 h-3.5" />
            <span className="text-xs font-mono uppercase tracking-wider">Streak</span>
          </div>
          <div className="font-mono text-lg text-foreground">{project.streak} days</div>
        </div>

        <div className="border border-border rounded-sm p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs font-mono uppercase tracking-wider">Last Activity</span>
          </div>
          <div className="font-mono text-lg text-foreground">{project.lastActivity}</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="border border-border rounded-sm">
        <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Recent Activity
          </span>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <div>
                <span className="font-mono text-sm text-foreground">Updated daily log</span>
                <span className="font-mono text-xs text-muted-foreground ml-2">2h ago</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2" />
              <div>
                <span className="font-mono text-sm text-foreground">Added API key for Vercel</span>
                <span className="font-mono text-xs text-muted-foreground ml-2">1d ago</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2" />
              <div>
                <span className="font-mono text-sm text-foreground">Created project</span>
                <span className="font-mono text-xs text-muted-foreground ml-2">5d ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
