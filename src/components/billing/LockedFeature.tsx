import { useNavigate } from 'react-router-dom';
import { Lock, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePlanStore, PLAN_INFO, type PlanType } from '@/stores/planStore';
import { cn } from '@/lib/utils';

interface LockedFeatureProps {
    feature: 'database' | 'tracedraw';
    children: React.ReactNode;
    className?: string;
}

const FEATURE_CONFIG = {
    database: {
        name: 'Database Designer',
        description: 'Visual schema designer with SQL generation',
        requiredPlan: 'monthly' as PlanType,
    },
    tracedraw: {
        name: 'TraceDraw',
        description: 'Collaborative whiteboard for planning',
        requiredPlan: 'monthly' as PlanType,
    },
};

export function LockedFeature({ feature, children, className }: LockedFeatureProps) {
    const navigate = useNavigate();
    const { features, currentPlan } = usePlanStore();

    const config = FEATURE_CONFIG[feature];
    const planInfo = PLAN_INFO[config.requiredPlan];

    // Check if feature is accessible
    const isAccessible = feature === 'database'
        ? features.databaseAccess
        : features.traceDrawAccess;

    // If accessible, render children normally
    if (isAccessible) {
        return <>{children}</>;
    }

    // Render locked state
    return (
        <div className={cn('relative w-full h-full', className)}>
            {/* Blurred/Dimmed background */}
            <div className="absolute inset-0 backdrop-blur-sm bg-background/80 z-10 flex items-center justify-center">
                <div className="text-center p-8 max-w-md">
                    {/* Lock Icon */}
                    <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6 border border-indigo-500/30">
                        <Lock className="w-10 h-10 text-indigo-400" />
                    </div>

                    {/* Feature Name */}
                    <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {config.name}
                    </h2>

                    {/* Description */}
                    <p className="text-muted-foreground mb-6">
                        {config.description}
                    </p>

                    {/* Upgrade CTA */}
                    <div className="bg-card/50 border rounded-lg p-4 mb-6">
                        <p className="text-sm text-muted-foreground mb-3">
                            This feature requires a paid plan
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm">
                            <span className="text-indigo-400">{planInfo.badge}</span>
                            <span className="font-medium">{planInfo.name}</span>
                            <span className="text-muted-foreground">or higher</span>
                        </div>
                    </div>

                    {/* Upgrade Button */}
                    <Button
                        onClick={() => navigate('/pricing')}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 gap-2"
                        size="lg"
                    >
                        <Crown className="w-4 h-4" />
                        Upgrade to Unlock
                    </Button>

                    {/* Current Plan Info */}
                    <p className="text-xs text-muted-foreground mt-4">
                        Current plan: <span className="font-medium">{PLAN_INFO[currentPlan].name}</span>
                    </p>
                </div>
            </div>

            {/* Dimmed original content (for visual context) */}
            <div className="opacity-20 pointer-events-none">
                {children}
            </div>
        </div>
    );
}

interface LockedTabProps {
    feature: 'database' | 'tracedraw';
    label: string;
    isActive: boolean;
    onClick: () => void;
}

export function LockedTab({ feature, label, isActive, onClick }: LockedTabProps) {
    const navigate = useNavigate();
    const { features } = usePlanStore();

    const isAccessible = feature === 'database'
        ? features.databaseAccess
        : features.traceDrawAccess;

    if (isAccessible) {
        // Regular tab behavior
        return (
            <button
                onClick={onClick}
                className={cn(
                    'px-3 py-1.5 text-sm font-mono transition-colors',
                    isActive
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                )}
            >
                {label}
            </button>
        );
    }

    // Locked tab with tooltip
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={() => navigate('/pricing')}
                    className="px-3 py-1.5 text-sm font-mono text-muted-foreground/60 cursor-not-allowed flex items-center gap-1.5"
                >
                    <Lock className="w-3 h-3" />
                    {label}
                </button>
            </TooltipTrigger>
            <TooltipContent
                side="bottom"
                className="bg-card border shadow-lg"
            >
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Upgrade to unlock {label}</span>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
