import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
    createSubscription,
    verifyPayment,
    openRazorpayCheckout,
    type Plan,
} from '@/services/subscriptionService';
import { usePlanStore, type PlanType } from '@/stores/planStore';

interface UseSubscriptionCheckoutProps {
    customerEmail: string;
    customerName?: string;
    userId?: string;
    onSuccess?: (subscriptionId: string, paymentId: string) => void;
    onError?: (error: Error) => void;
}

export function useSubscriptionCheckout({
    customerEmail,
    customerName,
    userId,
    onSuccess,
    onError,
}: UseSubscriptionCheckoutProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const { fetchPlan, setPlan } = usePlanStore();

    const handlePlanSelect = useCallback(async (plan: Plan) => {
        if (!customerEmail) {
            toast.error('Please sign in to subscribe');
            return;
        }

        setIsLoading(true);
        setSelectedPlan(plan);

        try {
            // Step 1: Create subscription on backend
            const { subscription, publicKey } = await createSubscription(
                plan.id,
                plan.key,
                customerEmail
            );

            // Step 2: Open Razorpay checkout
            await openRazorpayCheckout({
                subscriptionId: subscription.id,
                publicKey,
                planName: plan.name,
                customerEmail,
                customerName,
                onSuccess: async (response) => {
                    try {
                        // Step 3: Verify payment on backend
                        const verification = await verifyPayment(
                            response.razorpay_payment_id,
                            response.razorpay_subscription_id,
                            response.razorpay_signature,
                            userId,
                            plan.key
                        );

                        if (verification.verified) {
                            // Step 4: Update plan in store (from backend response or fetch)
                            if (verification.plan) {
                                console.log('Updating plan store with returned plan:', verification.plan);
                                setPlan(verification.plan);

                                toast.success('🎉 Subscription activated successfully!', {
                                    description: `Welcome to ${plan.name}! Your features are now unlocked.`,
                                });
                                onSuccess?.(response.razorpay_subscription_id, response.razorpay_payment_id);
                            } else {
                                // Fallback: Refresh plan from database
                                try {
                                    await fetchPlan();

                                    toast.success('🎉 Subscription activated successfully!', {
                                        description: `Welcome to ${plan.name}! Your features are now unlocked.`,
                                    });
                                    onSuccess?.(response.razorpay_subscription_id, response.razorpay_payment_id);
                                } catch (refreshError) {
                                    console.error('Plan refresh error:', refreshError);
                                    // Even if refresh fails, payment is verified.
                                    toast.success('Payment verified. Please refresh the page if plan is not updated.');
                                }
                            }
                        } else {
                            throw new Error('Payment verification signature check failed');
                        }
                    } catch (verifyError) {
                        console.error('Verification error:', verifyError);
                        // don't overwrite specific activation error toast
                        if (!((verifyError as Error).message.includes('Payment verified but plan'))) {
                            toast.error('Payment verification failed. Please contact support.');
                        }
                        onError?.(verifyError as Error);
                    } finally {
                        setIsLoading(false);
                        setSelectedPlan(null);
                    }
                },
                onClose: () => {
                    setIsLoading(false);
                    setSelectedPlan(null);
                    toast.info('Payment cancelled');
                },
            });
        } catch (error) {
            console.error('Subscription error:', error);
            toast.error('Failed to start subscription', {
                description: (error as Error).message,
            });
            onError?.(error as Error);
            setIsLoading(false);
            setSelectedPlan(null);
        }
    }, [customerEmail, customerName, userId, onSuccess, onError, fetchPlan, setPlan]);

    return {
        isLoading,
        selectedPlan,
        handlePlanSelect,
    };
}
