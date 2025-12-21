
import { useProjectStore } from '@/stores/projectStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Activity, Shield, Database, Zap } from 'lucide-react';

export function ProjectOverview() {
  const { projects, selectedProjectId, stats, dailyLogs } = useProjectStore();
  const project = projects.find(p => p.id === selectedProjectId);

  if (!project) return <div>Project not found</div>;

  // Derived stats
  const totalLogs = dailyLogs.length;
  const lastActivity = stats.length > 0 ? stats[stats.length - 1].activity_date : 'No activity';
  const totalScore = stats.reduce((acc, curr) => acc + curr.activity_score, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activity Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScore}</div>
            <p className="text-xs text-muted-foreground">Lifetime contribution points</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
            <p className="text-xs text-muted-foreground">Recorded work days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{project.status}</div>
            <p className="text-xs text-muted-foreground">Current lifecycle stage</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Active</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sm">
              {lastActivity !== 'No activity' ? format(new Date(lastActivity), 'MMM d, yyyy') : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Latest contribution</p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Repository</dt>
              <dd className="text-sm mt-1">{project.repo_url || 'Not linked'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Tech Stack</dt>
              <dd className="text-sm mt-1">
                {project.tech_stack && project.tech_stack.length > 0
                  ? project.tech_stack.join(', ')
                  : 'Not specified'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
