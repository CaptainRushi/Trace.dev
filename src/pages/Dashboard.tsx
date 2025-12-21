import { ProjectTable } from '@/components/tables/ProjectTable';

export function Dashboard() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-lg font-semibold text-foreground">Projects</h1>
        <span className="text-xs font-mono text-muted-foreground">
          {new Date().toISOString().split('T')[0]}
        </span>
      </div>
      <ProjectTable />
    </div>
  );
}
