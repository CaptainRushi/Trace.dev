import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * RazorpayService - Handles all Razorpay subscription operations
 * 
 * IMPORTANT: Plans must be created in Razorpay Dashboard:
 * Dashboard → Subscriptions → Plans
 * 
 * Plans Configuration:
 * - Starter Plan: ₹499/month (plan_XXXXXXXX)
 * - Pro Plan: ₹1499/month (plan_YYYYYYYY)
 */
class RazorpayService {
    constructor() {
        // Lazy initialization - don't create Razorpay instance in constructor
        this._razorpay = null;
        this._isConfigured = null;
    }

    /**
     * Lazy getter for Razorpay instance
     */
    get razorpay() {
        if (this._razorpay === null && this.isConfigured) {
            this._razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET
            });
        }
        return this._razorpay;
    }

    /**
     * Check if Razorpay is configured
     */
    get isConfigured() {
        if (this._isConfigured === null) {
            this._isConfigured = !!(
                process.env.RAZORPAY_KEY_ID &&
                process.env.RAZORPAY_KEY_SECRET &&
                process.env.RAZORPAY_PLAN_STARTER &&
                process.env.RAZORPAY_PLAN_PRO
            );
            if (!this._isConfigured) {
                console.warn('⚠️ Razorpay credentials or Plan IDs not configured.');
                console.warn('   Please set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_PLAN_STARTER, and RAZORPAY_PLAN_PRO');
            }
        }
        return this._isConfigured;
    }

    /**
     * Get plan configuration (reads env vars on each call)
     */
    get plans() {
        return {
            starter: {
                id: process.env.RAZORPAY_PLAN_STARTER || 'plan_starter_placeholder',
                name: 'Starter Plan',
                price: 1,
                currency: 'INR',
                interval: 'monthly',
                features: [
                    '5 Projects',
                    '100 API Keys',
                    '10GB Code Storage',
                    'Basic Analytics',
                    'Email Support'
                ]
            },
            pro: {
                id: process.env.RAZORPAY_PLAN_PRO || 'plan_pro_placeholder',
                name: 'Pro Plan',
                price: 2,
                currency: 'INR',
                interval: 'monthly',
                features: [
                    'Unlimited Projects',
                    'Unlimited API Keys',
                    '100GB Code Storage',
                    'Advanced Analytics',
                    'Priority Support',
                    'Team Collaboration',
                    'Custom Integrations',
                    'SSO Authentication'
                ]
            }
        };
    }

    /**
     * Check if Razorpay is properly configured
     */
    checkConfiguration() {
        if (!this.isConfigured) {
            throw new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
        }
    }

    /**
     * Get all available subscription plans
     */
    getPlans() {
        return Object.entries(this.plans).map(([key, plan]) => ({
            key,
            ...plan
        }));
    }

    /**
     * Get a specific plan by key
     */
    getPlan(planKey) {
        return this.plans[planKey] || null;
    }

    /**
     * Create a Razorpay subscription
     * @param {string} planId - Razorpay Plan ID
     * @param {string} customerEmail - Customer email for notifications
     * @param {object} options - Additional options
     */
    async createSubscription(planId, customerEmail, options = {}) {
        this.checkConfiguration();

        console.log(`[Razorpay] Creating subscription for ${customerEmail} with Plan ${planId}`);
        console.log(`[Razorpay] Using Key ID: ${this.razorpay.key_id ? this.razorpay.key_id.slice(0, 10) + '...' : 'MISSING'}`);

        try {
            const subscription = await this.razorpay.subscriptions.create({
                plan_id: planId,
                total_count: options.totalCount || 12, // 12 billing cycles
                quantity: 1,
                customer_notify: 1,
                notes: {
                    customer_email: customerEmail,
                    created_at: new Date().toISOString(),
                    ...options.notes
                }
            });

            console.log('[Razorpay] Subscription created successfully:', subscription.id);

            return {
                success: true,
                subscription: {
                    id: subscription.id,
                    plan_id: subscription.plan_id,
                    status: subscription.status,
                    short_url: subscription.short_url,
                    created_at: subscription.created_at
                }
            };
        } catch (error) {
            console.error('Razorpay subscription creation error:', JSON.stringify(error, null, 2));
            throw new Error(error.error?.description || error.message || 'Failed to create subscription');
        }
    }

    /**
     * Verify payment signature (without webhook)
     * This validates that the payment response came from Razorpay
     * @param {string} razorpayPaymentId - Payment ID from checkout
     * @param {string} razorpaySubscriptionId - Subscription ID
     * @param {string} razorpaySignature - Signature from checkout
     */
    verifyPaymentSignature(razorpayPaymentId, razorpaySubscriptionId, razorpaySignature) {
        try {
            const body = razorpayPaymentId + '|' + razorpaySubscriptionId;

            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body)
                .digest('hex');

            const isValid = expectedSignature === razorpaySignature;

            return {
                success: isValid,
                verified: isValid,
                message: isValid ? 'Payment verified successfully' : 'Invalid signature'
            };
        } catch (error) {
            console.error('Signature verification error:', error);
            return {
                success: false,
                verified: false,
                message: 'Verification failed'
            };
        }
    }

    /**
     * Fetch subscription details from Razorpay
     * Useful for checking current status without webhooks
     * @param {string} subscriptionId - Razorpay Subscription ID
     */
    async getSubscription(subscriptionId) {
        this.checkConfiguration();

        try {
            const subscription = await this.razorpay.subscriptions.fetch(subscriptionId);
            return {
                success: true,
                subscription: {
                    id: subscription.id,
                    plan_id: subscription.plan_id,
                    status: subscription.status,
                    current_start: subscription.current_start,
                    current_end: subscription.current_end,
                    ended_at: subscription.ended_at,
                    charge_at: subscription.charge_at,
                    paid_count: subscription.paid_count,
                    total_count: subscription.total_count
                }
            };
        } catch (error) {
            console.error('Fetch subscription error:', error);
            throw new Error(error.error?.description || 'Failed to fetch subscription');
        }
    }

    /**
     * Cancel a subscription
     * @param {string} subscriptionId - Razorpay Subscription ID
     * @param {boolean} cancelAtCycleEnd - If true, cancels at end of current billing cycle
     */
    async cancelSubscription(subscriptionId, cancelAtCycleEnd = true) {
        this.checkConfiguration();

        try {
            const subscription = await this.razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
            return {
                success: true,
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    ended_at: subscription.ended_at
                }
            };
        } catch (error) {
            console.error('Cancel subscription error:', error);
            throw new Error(error.error?.description || 'Failed to cancel subscription');
        }
    }

    /**
     * Get Razorpay Key ID (safe to expose to frontend)
     */
    getPublicKey() {
        return process.env.RAZORPAY_KEY_ID;
    }
}

// Singleton export
export const razorpayService = new RazorpayService();
export default RazorpayService;
