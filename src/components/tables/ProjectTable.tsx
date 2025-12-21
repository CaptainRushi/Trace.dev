import { useProjectStore } from '@/stores/projectStore';
import { cn } from '@/lib/utils';
import { Circle, Flame } from 'lucide-react';

export function ProjectTable() {
  const { projects, setSelectedProject } = useProjectStore();

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_120px_100px_80px] bg-muted/30 border-b border-border">
        <div className="px-4 py-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Name
        </div>
        <div className="px-4 py-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Last Active
        </div>
        <div className="px-4 py-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Streak
        </div>
        <div className="px-4 py-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Status
        </div>
      </div>

      {/* Rows */}
      {projects.map((project, index) => (
        <button
          key={project.id}
          onClick={() => setSelectedProject(project.id)}
          className={cn(
            "w-full grid grid-cols-[1fr_120px_100px_80px] items-center text-left transition-colors",
            "hover:bg-muted/20",
            index !== projects.length - 1 && "border-b border-border"
          )}
        >
          <div className="px-4 py-3">
            <span className="font-mono text-sm text-foreground">{project.name}</span>
            {project.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {project.description}
              </p>
            )}
          </div>
          <div className="px-4 py-3 font-mono text-xs text-muted-foreground">
            {project.lastActivity}
          </div>
          <div className="px-4 py-3 flex items-center gap-1.5">
            <Flame className={cn(
              "w-3 h-3",
              project.streak > 0 ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "font-mono text-xs",
              project.streak > 0 ? "text-foreground" : "text-muted-foreground"
            )}>
              {project.streak}d
            </span>
          </div>
          <div className="px-4 py-3">
            <span className={cn(
              "inline-flex items-center gap-1.5 text-xs font-mono",
              project.status === 'active' ? "text-primary" : "text-muted-foreground"
            )}>
              <Circle className={cn(
                "w-1.5 h-1.5",
                project.status === 'active' ? "fill-primary" : "fill-muted-foreground"
              )} />
              {project.status}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
