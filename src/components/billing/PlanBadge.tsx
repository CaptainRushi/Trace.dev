import { Crown, Clock, Sparkles, Zap } from 'lucide-react';
import { usePlanStore, PLAN_INFO, type PlanType } from '@/stores/planStore';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PlanBadgeProps {
    showExpiry?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const planColors: Record<string, string> = {
    free: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    monthly: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    yearly: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
    // Legacy
    starter: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    pro: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
};

const planIcons: Record<string, typeof Crown> = {
    free: Zap,
    monthly: Sparkles,
    yearly: Crown,
    // Legacy
    starter: Sparkles,
    pro: Crown,
};

export function PlanBadge({ showExpiry = false, size = 'md', className }: PlanBadgeProps) {
    const { currentPlan, daysRemaining, getFormattedExpiry } = usePlanStore();
    const planInfo = PLAN_INFO[currentPlan];
    const Icon = planIcons[currentPlan];

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5',
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4',
    };

    // Warning state for expiring soon
    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
    const isExpired = daysRemaining === 0;

    const badge = (
        <Badge
            variant="outline"
            className={cn(
                'font-medium gap-1.5 border',
                planColors[currentPlan],
                sizeClasses[size],
                isExpiringSoon && 'animate-pulse',
                className
            )}
        >
            <Icon className={iconSizes[size]} />
            <span>{planInfo.name}</span>
            {showExpiry && daysRemaining !== null && (
                <>
                    <span className="opacity-50">•</span>
                    <Clock className={cn(iconSizes[size], 'opacity-70')} />
                    <span className={cn(
                        isExpiringSoon && 'text-amber-400',
                        isExpired && 'text-red-400'
                    )}>
                        {daysRemaining}d
                    </span>
                </>
            )}
        </Badge>
    );

    if (!showExpiry) return badge;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {badge}
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
                {getFormattedExpiry()}
            </TooltipContent>
        </Tooltip>
    );
}

interface PlanIndicatorProps {
    className?: string;
}

export function PlanIndicator({ className }: PlanIndicatorProps) {
    const { currentPlan, daysRemaining, getFormattedExpiry, features } = usePlanStore();
    const planInfo = PLAN_INFO[currentPlan];
    const Icon = planIcons[currentPlan];

    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;

    return (
        <div className={cn('p-3 rounded-lg border bg-card/50', className)}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        currentPlan === 'yearly' || currentPlan === 'pro'
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                            : currentPlan === 'monthly' || currentPlan === 'starter'
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                                : 'bg-gray-600'
                    )}>
                        <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">{planInfo.name}</p>
                        <p className="text-xs text-muted-foreground">{getFormattedExpiry()}</p>
                    </div>
                </div>

                {isExpiringSoon && (
                    <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-xs">
                        Expiring Soon
                    </Badge>
                )}
            </div>

            {/* Feature summary */}
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className={cn(
                        'w-2 h-2 rounded-full',
                        features.databaseAccess ? 'bg-green-500' : 'bg-red-500'
                    )} />
                    <span className="text-muted-foreground">Database</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className={cn(
                        'w-2 h-2 rounded-full',
                        features.traceDrawAccess ? 'bg-green-500' : 'bg-red-500'
                    )} />
                    <span className="text-muted-foreground">TraceDraw</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">
                        {features.maxProjects === null ? '∞' : features.maxProjects} Projects
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className={cn(
                        'w-2 h-2 rounded-full',
                        features.prioritySupport ? 'bg-green-500' : 'bg-gray-500'
                    )} />
                    <span className="text-muted-foreground">Priority Support</span>
                </div>
            </div>
        </div>
    );
}
