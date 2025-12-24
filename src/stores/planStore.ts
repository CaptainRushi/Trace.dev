import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export type PlanType = 'free' | 'monthly' | 'yearly' | 'starter' | 'pro';

export interface UserPlan {
    id: string;
    user_id: string;
    plan_type: PlanType;
    activated_at: string | null;
    expires_at: string | null;
    razorpay_subscription_id: string | null;
    razorpay_payment_id: string | null;
}

export interface PlanFeatures {
    maxProjects: number | null; // null = unlimited
    databaseAccess: boolean;
    traceDrawAccess: boolean;
    prioritySupport: boolean;
}

// Feature access by plan type
export const PLAN_FEATURES: Record<string, PlanFeatures> = {
    free: {
        maxProjects: 5,
        databaseAccess: false,
        traceDrawAccess: false,
        prioritySupport: false,
    },
    monthly: {
        maxProjects: null, // unlimited
        databaseAccess: true,
        traceDrawAccess: true,
        prioritySupport: true,
    },
    yearly: {
        maxProjects: null, // unlimited
        databaseAccess: true,
        traceDrawAccess: true,
        prioritySupport: true,
    },
    // Legacy mapping
    starter: {
        maxProjects: null,
        databaseAccess: true,
        traceDrawAccess: true,
        prioritySupport: true,
    },
    pro: {
        maxProjects: null,
        databaseAccess: true,
        traceDrawAccess: true,
        prioritySupport: true,
    },
};

// Plan display info
export const PLAN_INFO: Record<string, { name: string; duration: string; badge: string }> = {
    free: { name: 'Free Plan', duration: 'Forever', badge: '🆓' },
    monthly: { name: 'Monthly Plan', duration: '1 Month', badge: '💳' },
    yearly: { name: 'Yearly Plan', duration: '1 Year', badge: '👑' },
    // Legacy labels
    starter: { name: 'Monthly Plan', duration: '1 Month', badge: '💳' },
    pro: { name: 'Yearly Plan', duration: '1 Year', badge: '👑' },
};

interface PlanStore {
    // State
    userPlan: UserPlan | null;
    loading: boolean;
    error: string | null;

    // Computed
    currentPlan: PlanType;
    isActive: boolean;
    daysRemaining: number | null;
    features: PlanFeatures;

    // Actions
    fetchPlan: () => Promise<void>;
    activatePlan: (planType: PlanType, subscriptionId?: string, paymentId?: string) => Promise<void>;
    setPlan: (plan: UserPlan) => void;
    checkFeatureAccess: (feature: keyof PlanFeatures) => boolean;
    canCreateProject: (currentProjectCount: number) => boolean;

    // Helpers
    syncState: () => void;
    getPlanExpiry: () => Date | null;
    getFormattedExpiry: () => string;
}

const updateComputedState = (plan: UserPlan | null): {
    currentPlan: PlanType,
    features: PlanFeatures,
    isActive: boolean,
    daysRemaining: number | null
} => {
    if (!plan) {
        return {
            currentPlan: 'free',
            features: PLAN_FEATURES.free,
            isActive: true,
            daysRemaining: null
        };
    }

    let planType = (plan.plan_type || 'free') as PlanType;

    // Map legacy types to new ones for display
    if (planType === 'starter') planType = 'monthly';
    if (planType === 'pro') planType = 'yearly';

    // Check expiry
    if (planType !== 'free' && plan.expires_at) {
        const expiryDate = new Date(plan.expires_at);
        if (expiryDate < new Date()) {
            console.warn(`[PlanStore] Plan ${planType} expired. Reverting to free.`);
            planType = 'free';
        }
    }

    const currentFeatures = PLAN_FEATURES[planType] || PLAN_FEATURES.free;

    // Days remaining
    let days = null;
    if (planType !== 'free' && plan.expires_at) {
        const diffTime = new Date(plan.expires_at).getTime() - new Date().getTime();
        days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return {
        currentPlan: planType,
        features: currentFeatures,
        isActive: planType !== 'free' || plan.plan_type === 'free',
        daysRemaining: days
    };
};

export const usePlanStore = create<PlanStore>((set, get) => ({
    // Initial state
    userPlan: null,
    loading: false,
    error: null,
    currentPlan: 'free',
    isActive: true,
    daysRemaining: null,
    features: PLAN_FEATURES.free,

    // Actions
    syncState: () => {
        const { userPlan } = get();
        const computed = updateComputedState(userPlan);
        set({ ...computed });
    },

    // Actions
    fetchPlan: async (force = false) => {
        // If we already have the plan and don't need a force refresh, skip the network call
        if (!force && get().userPlan) {
            console.log('[PlanStore] Plan already in store, skipping fetch.');
            return;
        }

        set({ loading: true, error: null });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ userPlan: null, loading: false });
                return;
            }

            // Try fetching from backend API (bypasses RLS)
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            let planData: UserPlan | null = null;

            console.log(`[PlanStore] Checking plan for user ${user.id} via backend...`);
            try {
                const response = await fetch(`${API_URL}/api/subscription/user/${user.id}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.plan) {
                        planData = result.plan;
                        console.log(`[PlanStore] Plan found via API:`, planData.plan_type);
                    } else {
                        console.log(`[PlanStore] No plan found via API, successful response but no plan record.`);
                    }
                } else {
                    console.warn(`[PlanStore] API fetch failed with status ${response.status}`);
                }
            } catch (apiError) {
                console.warn('[PlanStore] Backend API unreachable, falling back to Supabase:', apiError);
            }

            // Fallback to Supabase direct if API failed or returned nothing
            if (!planData) {
                console.log(`[PlanStore] Querying Supabase direct for user ${user.id}...`);
                const { data, error } = await supabase
                    .from('user_plans')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) {
                    console.error('[PlanStore] Supabase query error:', error);
                }

                if (data) {
                    planData = data as UserPlan;
                    console.log(`[PlanStore] Plan found via Supabase:`, planData.plan_type);
                }
            }

            if (planData) {
                console.log(`[PlanStore] Final plan selection:`, planData.plan_type);
                const computed = updateComputedState(planData);
                set({ userPlan: planData, ...computed, loading: false });
            } else {
                console.log(`[PlanStore] No plan found, initializing default FREE.`);
                // If still no plan exists, create a free one
                const { data: newPlan, error: createError } = await supabase
                    .from('user_plans')
                    .insert({ user_id: user.id, plan_type: 'free' })
                    .select()
                    .single();

                if (createError) {
                    console.error('[PlanStore] Error creating default plan:', createError);
                }

                const computed = updateComputedState(newPlan as UserPlan);
                set({ userPlan: newPlan as UserPlan, ...computed, loading: false });
            }
        } catch (err) {
            console.error('Plan fetch error:', err);
            set({ error: (err as Error).message, loading: false });
        }
    },

    activatePlan: async (planType: PlanType, subscriptionId?: string, paymentId?: string) => {
        set({ loading: true, error: null });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Calculate expiry based on plan type
            const now = new Date();
            let expiresAt: string | null = null;

            if (planType === 'monthly' || planType === 'starter') {
                const expiry = new Date(now);
                expiry.setMonth(expiry.getMonth() + 1);
                expiresAt = expiry.toISOString();
            } else if (planType === 'yearly' || planType === 'pro') {
                const expiry = new Date(now);
                expiry.setFullYear(expiry.getFullYear() + 1);
                expiresAt = expiry.toISOString();
            }

            const { data, error } = await supabase
                .from('user_plans')
                .upsert({
                    user_id: user.id,
                    plan_type: planType,
                    activated_at: now.toISOString(),
                    expires_at: expiresAt,
                    razorpay_subscription_id: subscriptionId || null,
                    razorpay_payment_id: paymentId || null,
                }, { onConflict: 'user_id' })
                .select()
                .single();

            if (error) throw error;

            const computed = updateComputedState(data as UserPlan);
            set({ userPlan: data as UserPlan, ...computed, loading: false });
        } catch (err) {
            console.error('Plan activation error:', err);
            set({ error: (err as Error).message, loading: false });
            throw err;
        }
    },

    setPlan: (plan: UserPlan) => {
        const computed = updateComputedState(plan);
        set({ userPlan: plan, ...computed, loading: false });
    },

    checkFeatureAccess: (feature: keyof PlanFeatures): boolean => {
        const { features } = get();
        const value = features[feature];

        // For boolean features, return the value directly
        if (typeof value === 'boolean') return value;

        // For maxProjects, null means unlimited
        return value === null || value > 0;
    },

    canCreateProject: (currentProjectCount: number): boolean => {
        const { features } = get();

        // null means unlimited
        if (features.maxProjects === null) return true;

        return currentProjectCount < features.maxProjects;
    },

    getPlanExpiry: (): Date | null => {
        const { userPlan } = get();
        if (!userPlan?.expires_at) return null;
        return new Date(userPlan.expires_at);
    },

    getFormattedExpiry: (): string => {
        const { userPlan, daysRemaining, currentPlan } = get();

        if (currentPlan === 'free') return 'Free Forever';
        if (!userPlan?.expires_at) return 'No expiry';

        const expiryDate = new Date(userPlan.expires_at);
        const formatted = expiryDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        if (daysRemaining !== null && daysRemaining <= 7) {
            return `Expires ${formatted} (${daysRemaining} days left)`;
        }

        return `Expires ${formatted}`;
    }
}));
