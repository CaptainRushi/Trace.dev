
import { useProjectStore } from '@/stores/projectStore';
import { cn } from '@/lib/utils';
import { LayoutDashboard } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function UserDashboardTrigger() {
    const { setSelectedProject, selectedProjectId } = useProjectStore();
    const isActive = selectedProjectId === null;

    return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => setSelectedProject(null)}
                        className={cn(
                            "group relative flex items-center justify-center w-8 h-8 rounded-md transition-all duration-300 focus:outline-none",
                            // Border & Background
                            "border",
                            isActive
                                ? "border-primary bg-primary/10"
                                : "border-primary/30 bg-transparent hover:border-primary hover:bg-primary/5"
                        )}
                        aria-label="Open User Dashboard"
                    >
                        <LayoutDashboard
                            className={cn(
                                "w-4 h-4 transition-colors duration-300",
                                isActive
                                    ? "text-primary"
                                    : "text-primary/60 group-hover:text-primary"
                            )}
                            strokeWidth={isActive ? 2.5 : 2}
                        />

                        {/* Subtle Glow/Ring for Active State */}
                        {isActive && (
                            <span className="absolute inset-0 rounded-md shadow-[0_0_8px_hsl(var(--primary))] opacity-20" />
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#121212] border-primary text-primary font-mono text-xs">
                    User Dashboard
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
