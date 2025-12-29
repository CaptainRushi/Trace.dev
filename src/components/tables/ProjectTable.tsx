
import { useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, FolderOpen, Trash2, GitBranch, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { CreateProjectDialog } from '@/components/dialogs/CreateProjectDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ProjectTable() {
  const { projects, fetchProjects, deleteProject, setSelectedProject, loading } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteProject(id);
  };

  if (loading && projects.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateProjectDialog />
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
          <p>No projects found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="p-4 hover:border-primary transition-colors group relative">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  {project.created_at && (
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Calendar className="mr-1 h-3 w-3" />
                      {format(new Date(project.created_at), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
                <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                  {project.status}
                </Badge>
              </div>

              <div className="mb-4">
                {project.repo_url && (
                  <a href={project.repo_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center">
                    <GitBranch className="mr-1 h-3 w-3" />
                    Repository
                  </a>
                )}
                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.tech_stack.map((stack, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">
                        {stack}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mr-2"
                  onClick={() => setSelectedProject(project.id)}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Open
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        project and remove your data from servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(project.id)} className="bg-destructive text-destructive-foreground">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
