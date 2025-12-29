// Subscription Service - Frontend API integration for Razorpay subscriptions

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Plan {
    key: string;
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
    features: string[];
}

export interface Subscription {
    id: string;
    plan_id: string;
    status: string;
    short_url?: string;
    created_at?: number;
    current_start?: number;
    current_end?: number;
    paid_count?: number;
    total_count?: number;
}

export interface CreateSubscriptionResponse {
    success: boolean;
    subscription: Subscription;
    publicKey: string;
}

export interface VerifyPaymentResponse {
    success: boolean;
    verified: boolean;
    message: string;
    subscription_id?: string;
    payment_id?: string;
    plan?: any;
}

export interface PlansResponse {
    success: boolean;
    plans: Plan[];
    publicKey: string;
}

/**
 * Default plans to use as fallback if backend is unavailable
 */
export const DEFAULT_PLANS: Plan[] = [
    {
        key: 'monthly',
        id: 'plan_monthly',
        name: 'Monthly Plan',
        price: 499,
        currency: 'INR',
        interval: 'month',
        features: [
            'Unlimited project creation',
            'Database Visualization tools',
            'Table-to-code conversion',
            'Download generated code',
            'TraceDraw visual diagramming',
            'Export diagrams in PNG'
        ]
    },
    {
        key: 'yearly',
        id: 'plan_yearly',
        name: 'Yearly Plan',
        price: 5699,
        currency: 'INR',
        interval: 'year',
        features: [
            'Unlimited project creation',
            'Database Visualization tools',
            'Table-to-code conversion',
            'Download generated code',
            'TraceDraw visual diagramming',
            'Export diagrams in PNG'
        ]
    }
];

/**
 * Fetch all available subscription plans
 */
export async function getPlans(): Promise<PlansResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/subscription/plans`);

        if (!response.ok) {
            console.warn('[SubscriptionService] Failed to fetch plans from API, using defaults');
            return {
                success: true,
                plans: DEFAULT_PLANS,
                publicKey: import.meta.env.VITE_RAZORPAY_KEY_ID || ''
            };
        }

        return response.json();
    } catch (error) {
        console.warn('[SubscriptionService] Network error fetching plans, using defaults:', error);
        return {
            success: true,
            plans: DEFAULT_PLANS,
            publicKey: import.meta.env.VITE_RAZORPAY_KEY_ID || ''
        };
    }
}

/**
 * Create a new subscription
 */
export async function createSubscription(
    planId: string,
    planKey: string,
    customerEmail: string
): Promise<CreateSubscriptionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            planId,
            planKey,
            customerEmail,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create subscription');
    }

    return response.json();
}

/**
 * Verify payment after Razorpay checkout
 */
export async function verifyPayment(
    razorpayPaymentId: string,
    razorpaySubscriptionId: string,
    razorpaySignature: string,
    userId?: string,
    planType?: string
): Promise<VerifyPaymentResponse> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            razorpay_payment_id: razorpayPaymentId,
            razorpay_subscription_id: razorpaySubscriptionId,
            razorpay_signature: razorpaySignature,
            userId,
            planType,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment verification failed');
    }

    return response.json();
}

/**
 * Get subscription status (for polling)
 */
export async function getSubscriptionStatus(subscriptionId: string): Promise<{
    success: boolean;
    subscription: Subscription;
}> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/status/${subscriptionId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
    }

    return response.json();
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
    subscriptionId: string,
    cancelAtCycleEnd: boolean = true
): Promise<{ success: boolean; subscription: Subscription }> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/cancel/${subscriptionId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancelAtCycleEnd }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
    }

    return response.json();
}

/**
 * Load Razorpay checkout script dynamically
 */
export function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof window !== 'undefined' && (window as any).Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

/**
 * Open Razorpay checkout
 */
export interface RazorpayCheckoutOptions {
    subscriptionId: string;
    publicKey: string;
    planName: string;
    customerEmail?: string;
    customerName?: string;
    onSuccess: (response: {
        razorpay_payment_id: string;
        razorpay_subscription_id: string;
        razorpay_signature: string;
    }) => void;
    onClose?: () => void;
}

export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
    const loaded = await loadRazorpayScript();

    if (!loaded) {
        throw new Error('Failed to load Razorpay checkout');
    }

    const rzpOptions = {
        key: options.publicKey,
        subscription_id: options.subscriptionId,
        name: 'Trace.dev',
        description: `${options.planName} Subscription`,
        image: '/logo.png',
        prefill: {
            email: options.customerEmail || '',
            name: options.customerName || '',
        },
        theme: {
            color: '#6366f1', // Indigo color matching the app theme
        },
        handler: options.onSuccess,
        modal: {
            ondismiss: options.onClose,
        },
    };

    const rzp = new (window as any).Razorpay(rzpOptions);
    rzp.open();
}
