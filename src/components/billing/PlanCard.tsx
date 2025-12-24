import { Check, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Plan } from '@/services/subscriptionService';

interface PlanCardProps {
    plan: Plan;
    isPopular?: boolean;
    isLoading?: boolean;
    currentPlan?: boolean;
    onSelect: (plan: Plan) => void;
}

export function PlanCard({ plan, isPopular, isLoading, currentPlan, onSelect }: PlanCardProps) {
    const isYearly = plan.key === 'yearly' || plan.key === 'pro';

    return (
        <Card
            className={cn(
                'relative flex flex-col transition-all duration-300 hover:shadow-xl',
                isPopular && 'border-primary shadow-lg shadow-primary/20 scale-[1.02]',
                currentPlan && 'border-green-500/50 bg-green-500/5'
            )}
        >
            {/* Popular Badge */}
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1 shadow-lg border-none whitespace-nowrap">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Best Value
                    </Badge>
                </div>
            )}

            {/* Current Plan Badge */}
            {currentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-500 text-white px-4 py-1 border-none whitespace-nowrap">
                        <Check className="w-3 h-3 mr-1" />
                        Current Plan
                    </Badge>
                </div>
            )}

            <CardHeader className="text-center pb-2 pt-8">
                <div className={cn(
                    'mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                    isYearly
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                        : 'bg-gradient-to-br from-gray-500 to-gray-700'
                )}>
                    {isYearly ? (
                        <Sparkles className="w-6 h-6 text-white" />
                    ) : (
                        <Zap className="w-6 h-6 text-white" />
                    )}
                </div>

                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">
                    {isYearly ? 'Maximum savings' : 'Flexible monthly billing'}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 text-center">
                {/* Price */}
                <div className="mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            ₹{plan.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-muted-foreground">/{plan.interval}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {isYearly ? 'Billed annually' : 'Billed monthly'} • Cancel anytime
                    </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 text-left">
                    {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                            <div className={cn(
                                'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                                isYearly ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                            )}>
                                <Check className="w-3 h-3" />
                            </div>
                            <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>

            <CardFooter className="pt-4">
                <Button
                    className={cn(
                        'w-full h-12 text-base font-semibold transition-all',
                        isYearly && 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                    )}
                    variant={isYearly ? 'default' : 'outline'}
                    onClick={() => onSelect(plan)}
                    disabled={isLoading || currentPlan}
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </div>
                    ) : currentPlan ? (
                        'Current Plan'
                    ) : (
                        `Get ${plan.name}`
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
