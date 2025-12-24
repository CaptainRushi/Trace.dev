import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSubscriptionStatus, type Subscription } from '@/services/subscriptionService';

interface SubscriptionStatusProps {
    subscriptionId: string;
    onRefresh?: () => void;
}

const statusConfig: Record<string, {
    icon: typeof CheckCircle2;
    color: string;
    bgColor: string;
    label: string;
    description: string;
}> = {
    active: {
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        label: 'Active',
        description: 'Your subscription is active and running.',
    },
    authenticated: {
        icon: Clock,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        label: 'Authenticated',
        description: 'Payment authenticated. Awaiting first charge.',
    },
    pending: {
        icon: Clock,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        label: 'Pending',
        description: 'Your subscription is being processed.',
    },
    halted: {
        icon: AlertCircle,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        label: 'Halted',
        description: 'Payment failed. Please update payment method.',
    },
    cancelled: {
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        label: 'Cancelled',
        description: 'Your subscription has been cancelled.',
    },
    completed: {
        icon: CheckCircle2,
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/10',
        label: 'Completed',
        description: 'Your subscription period has ended.',
    },
    expired: {
        icon: XCircle,
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/10',
        label: 'Expired',
        description: 'Your subscription has expired.',
    },
};

export function SubscriptionStatus({ subscriptionId, onRefresh }: SubscriptionStatusProps) {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getSubscriptionStatus(subscriptionId);
            setSubscription(response.subscription);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();

        // Optional: Poll every 30 seconds for status updates (since no webhooks)
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, [subscriptionId]);

    if (loading && !subscription) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-red-500/30">
                <CardContent className="flex items-center gap-4 py-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <div>
                        <p className="font-medium">Failed to load subscription</p>
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchStatus} className="ml-auto">
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!subscription) return null;

    const status = subscription.status || 'pending';
    const config = statusConfig[status] || statusConfig.pending;
    const StatusIcon = config.icon;

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">Subscription Status</CardTitle>
                        <CardDescription className="text-xs font-mono mt-1">
                            ID: {subscription.id}
                        </CardDescription>
                    </div>
                    <Badge className={cn(config.bgColor, config.color, 'border-0')}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{config.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Current Period</p>
                        <p className="font-medium">
                            {formatDate(subscription.current_start)} - {formatDate(subscription.current_end)}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Payments Made</p>
                        <p className="font-medium">
                            {subscription.paid_count || 0} / {subscription.total_count || 12}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            fetchStatus();
                            onRefresh?.();
                        }}
                        disabled={loading}
                    >
                        {loading ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Refresh Status
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
