import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Shield, ArrowLeft, CheckCircle2, Loader2, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PlanCard } from '@/components/billing/PlanCard';
import { PlanIndicator } from '@/components/billing/PlanBadge';
import { useSubscriptionCheckout } from '@/components/billing/useSubscriptionCheckout';
import { getPlans, type Plan } from '@/services/subscriptionService';
import { usePlanStore } from '@/stores/planStore';
import { useUserStore } from '@/stores/userStore';

export default function Pricing() {
    const navigate = useNavigate();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentPlan, fetchPlan } = usePlanStore();
    const { profile, loading: userLoading } = useUserStore();

    const userEmail = profile?.email || '';
    const userName = profile?.username; // or metadata if available in store? Store has username/email.

    // Fetch plan on mount
    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    // Fetch plans from backend
    useEffect(() => {
        const fetchPlansData = async () => {
            try {
                const response = await getPlans();
                setPlans(response.plans);
            } catch (error) {
                console.error('Failed to fetch plans:', error);
                toast.error('Failed to load plans. Using default plans.');
                // Fallback to hardcoded plans if backend is unavailable
                setPlans([
                    {
                        key: 'starter',
                        id: 'plan_starter',
                        name: 'Starter Plan',
                        price: 499,
                        currency: 'INR',
                        interval: 'monthly',
                        features: [
                            'Unlimited Projects',
                            'Database Designer Access',
                            'TraceDraw Access',
                            'Basic Analytics',
                            'Email Support'
                        ]
                    },
                    {
                        key: 'pro',
                        id: 'plan_pro',
                        name: 'Pro Plan',
                        price: 1499,
                        currency: 'INR',
                        interval: 'yearly',
                        features: [
                            'Unlimited Projects',
                            'Database Designer Access',
                            'TraceDraw Access',
                            'Advanced Analytics',
                            'Priority Support',
                            'Team Collaboration',
                            'Custom Integrations',
                            '1 Year Validity'
                        ]
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchPlansData();
    }, []);

    const { isLoading, selectedPlan, handlePlanSelect } = useSubscriptionCheckout({
        customerEmail: userEmail || '',
        customerName: userName || undefined,
        userId: profile?.id,
        onSuccess: (subscriptionId) => {
            console.log('Subscription activated:', subscriptionId);
            toast.success('🎉 Plan activated! Redirecting to dashboard...');
            // Navigate to dashboard or show success state
            setTimeout(() => navigate('/'), 1500);
        },
        onError: (error) => {
            console.error('Subscription failed:', error);
        },
    });

    if (loading || userLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading plans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

            <div className="relative max-w-6xl mx-auto px-6 py-16">
                {/* Back button */}
                <Button
                    variant="ghost"
                    className="mb-8 gap-2"
                    onClick={() => navigate('/')}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Button>

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                        <Crown className="w-4 h-4" />
                        <span className="text-sm font-medium">Choose Your Plan</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text text-transparent">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Start free, upgrade when you're ready. No hidden fees, cancel anytime.
                    </p>
                </div>

                {/* Current Plan Indicator */}
                {currentPlan !== 'free' && (
                    <div className="max-w-md mx-auto mb-8">
                        <PlanIndicator />
                    </div>
                )}

                {/* Plans Grid */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan.key}
                            plan={plan}
                            isPopular={plan.key === 'pro' && currentPlan !== 'pro'}
                            isLoading={isLoading && selectedPlan?.key === plan.key}
                            currentPlan={plan.key === currentPlan}
                            onSelect={handlePlanSelect}
                        />
                    ))}
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-8 mb-16">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Shield className="w-5 h-5 text-green-500" />
                        <span className="text-sm">SSL Secured Payments</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <CreditCard className="w-5 h-5 text-blue-500" />
                        <span className="text-sm">Powered by Razorpay</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        <span className="text-sm">Cancel Anytime</span>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>

                    <div className="space-y-6">
                        <div className="bg-card border rounded-lg p-6">
                            <h3 className="font-semibold mb-2">Can I upgrade or downgrade anytime?</h3>
                            <p className="text-muted-foreground text-sm">
                                Yes! You can change your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at the end of your current billing cycle.
                            </p>
                        </div>

                        <div className="bg-card border rounded-lg p-6">
                            <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                            <p className="text-muted-foreground text-sm">
                                We accept all major credit/debit cards, UPI, net banking, and popular wallets through Razorpay. All payments are processed securely.
                            </p>
                        </div>

                        <div className="bg-card border rounded-lg p-6">
                            <h3 className="font-semibold mb-2">Is there a free trial?</h3>
                            <p className="text-muted-foreground text-sm">
                                Yes! You can use Trace.dev with limited features for free. Upgrade to a paid plan to unlock all features and higher limits.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
