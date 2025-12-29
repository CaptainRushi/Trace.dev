
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useProjectStore } from "@/stores/projectStore";
import { usePlanStore } from "@/stores/planStore";
import { Loader2, Plus, Lock, Crown } from "lucide-react";
import { toast } from "sonner";
import { cn } from '@/lib/utils';

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    repoUrl: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
    techStack: z.string().optional(), // Comma separated
});

export function CreateProjectDialog({ trigger }: { trigger?: React.ReactNode }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const { createProject, loading, projects, fetchProjects } = useProjectStore();
    const { canCreateProject, features, fetchPlan, currentPlan } = usePlanStore();

    // Fetch plan and projects when dialog opens
    useEffect(() => {
        if (open) {
            fetchPlan();
            fetchProjects();
        }
    }, [open, fetchPlan, fetchProjects]);

    const projectCount = projects.length;
    const canCreate = canCreateProject(projectCount);
    const maxProjects = features.maxProjects;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            repoUrl: "",
            techStack: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        // Double-check project limit
        if (!canCreate) {
            toast.error("Project limit reached", {
                description: "Upgrade your plan to create more projects.",
            });
            return;
        }

        try {
            const stack = values.techStack ? values.techStack.split(',').map(s => s.trim()) : [];
            await createProject(values.name, values.repoUrl || "", stack);
            toast.success("Project created successfully");
            setOpen(false);
            form.reset();
        } catch (error: any) {
            toast.error(error.message || "Failed to create project");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" /> New Project
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
                    <DialogDescription>
                        Start tracking a new development project.
                    </DialogDescription>
                </DialogHeader>

                {/* Project Limit Warning for Free Plan */}
                {currentPlan === 'free' && (
                    <div className={cn(
                        "p-3 rounded-lg border text-sm",
                        canCreate
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                            : "bg-red-500/10 border-red-500/30 text-red-400"
                    )}>
                        <div className="flex items-center justify-between">
                            <span>
                                {canCreate
                                    ? `${projectCount} of ${maxProjects} projects used`
                                    : `Project limit reached (${maxProjects}/${maxProjects})`
                                }
                            </span>
                            {!canCreate && <Lock className="w-4 h-4" />}
                        </div>
                    </div>
                )}

                {canCreate ? (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Project Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="trace-dev" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="repoUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Repository URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://github.com/user/repo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="techStack"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tech Stack (comma separated)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="React, Node, Supabase" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                ) : (
                    /* Upgrade CTA when limit reached */
                    <div className="text-center py-6">
                        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 border border-indigo-500/30">
                            <Lock className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Project Limit Reached</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Free plan allows up to {maxProjects} projects. Upgrade to create unlimited projects.
                        </p>
                        <Button
                            onClick={() => {
                                setOpen(false);
                                navigate('/pricing');
                            }}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 gap-2"
                        >
                            <Crown className="w-4 h-4" />
                            Upgrade Plan
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
