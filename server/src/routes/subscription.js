import express from 'express';
import { razorpayService } from '../services/RazorpayService.js';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Simple logger to help debug
const log = (msg) => {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    try {
        fs.appendFileSync('debug.log', line);
    } catch (e) {
        console.error('Log failed', e);
    }
};

log('--- Subscription Routes Loaded ---');

// Initialize Supabase Admin
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL; // Using VITE_ var if shared env file
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;

if (supabaseUrl && supabaseKey) {
    try {
        supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        console.log('✅ Supabase Admin initialized for subscription activation');
    } catch (err) {
        console.error('❌ Failed to init Supabase Admin:', err.message);
    }
} else {
    console.warn('⚠️ MISSING SUPABASE KEYS: Database will not be updated after payment!');
}

/**
 * GET /api/subscription/plans
 * Get all available subscription plans
 */
router.get('/plans', (req, res) => {
    try {
        const plans = razorpayService.getPlans();
        res.json({
            success: true,
            plans,
            publicKey: razorpayService.getPublicKey()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/subscription/create
 * Create a new Razorpay subscription
 * 
 * Body: {
 *   planId: "plan_XXXXXXXX",
 *   planKey: "starter" | "pro",
 *   customerEmail: "user@example.com"
 * }
 */
router.post('/create', async (req, res) => {
    try {
        const { planId, planKey, customerEmail } = req.body;
        log(`Creating subscription for: ${customerEmail}, Key: ${planKey}, ID: ${planId}`);

        // Validate input
        if (!customerEmail) {
            return res.status(400).json({
                success: false,
                error: 'Customer email is required'
            });
        }

        // Get plan ID from key if not provided directly
        let resolvedPlanId = planId;
        if (!resolvedPlanId && planKey) {
            const plan = razorpayService.getPlan(planKey);
            if (!plan) {
                log(`❌ Invalid plan key provided: ${planKey}`);
                return res.status(400).json({
                    success: false,
                    error: `Invalid plan key: ${planKey}`
                });
            }
            resolvedPlanId = plan.id;
        }

        if (!resolvedPlanId || resolvedPlanId.includes('placeholder')) {
            log(`❌ Plan ID is missing or a placeholder: ${resolvedPlanId}`);
            return res.status(400).json({
                success: false,
                error: 'Valid Plan ID is required. Check your RAZORPAY_PLAN environment variables.'
            });
        }

        const result = await razorpayService.createSubscription(
            resolvedPlanId,
            customerEmail,
            { notes: { plan_key: planKey } }
        );

        res.json({
            success: true,
            subscription: result.subscription,
            publicKey: razorpayService.getPublicKey()
        });
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/subscription/verify
 * Verify payment signature after checkout
 * 
 * Body: {
 *   razorpay_payment_id: "pay_XXXXXXXX",
 *   razorpay_subscription_id: "sub_XXXXXXXX",
 *   razorpay_signature: "signature_hash"
 * }
 */
router.post('/verify', async (req, res) => {
    try {
        const {
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature,
            userId,
            planType
        } = req.body;

        // Validate input
        if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: 'Missing required payment verification fields'
            });
        }

        const result = razorpayService.verifyPaymentSignature(
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature
        );

        if (result.verified) {
            log(`✅ Payment verified for Sub ID: ${razorpay_subscription_id}. User: ${userId}, Plan: ${planType}`);

            let activationStatus = 'skipped_no_user';

            // ATTEMPT DATABASE UPDATE
            if (supabaseAdmin && userId && planType) {
                try {
                    console.log(`Checking activation for User: ${userId}, Plan: ${planType}`);

                    const now = new Date();
                    let expiresAt = null;

                    // Map legacy plan types to new ones if necessary
                    let effectivePlanType = planType;
                    if (planType === 'starter') effectivePlanType = 'monthly';
                    if (planType === 'pro') effectivePlanType = 'yearly';

                    // Calculate expiry
                    if (effectivePlanType === 'monthly') {
                        const expiry = new Date(now);
                        expiry.setMonth(expiry.getMonth() + 1);
                        expiresAt = expiry.toISOString();
                    } else if (effectivePlanType === 'yearly') {
                        const expiry = new Date(now);
                        expiry.setFullYear(expiry.getFullYear() + 1);
                        expiresAt = expiry.toISOString();
                    }

                    // Perform UPSERT
                    const { data: updatedPlan, error } = await supabaseAdmin
                        .from('user_plans')
                        .upsert({
                            user_id: userId,
                            plan_type: effectivePlanType,
                            activated_at: now.toISOString(),
                            expires_at: expiresAt,
                            razorpay_subscription_id: razorpay_subscription_id,
                            razorpay_payment_id: razorpay_payment_id,
                        }, { onConflict: 'user_id' })
                        .select()
                        .single();

                    if (error) {
                        log(`❌ Database update failed for ${userId}: ${JSON.stringify(error)}`);
                        activationStatus = 'failed_db_error';
                    } else {
                        log(`✅ User plan updated in database for ${userId}. New plan: ${planType}`);
                        activationStatus = 'success';
                    }

                    res.json({
                        success: true,
                        verified: true,
                        message: 'Payment verified successfully',
                        activationStatus,
                        subscription_id: razorpay_subscription_id,
                        payment_id: razorpay_payment_id,
                        plan: updatedPlan
                    });
                    return; // Ensure we don't hit the bottom response
                } catch (dbError) {
                    console.error('❌ Database update exception:', dbError);
                    activationStatus = 'failed_exception';
                }
            } else {
                if (!supabaseAdmin) console.warn('⚠️ Supabase Admin not ready');
                if (!userId) console.warn('⚠️ User ID missing in verify request');
            }

            res.json({
                success: true,
                verified: true,
                message: 'Payment verified successfully',
                activationStatus, // debug info
                subscription_id: razorpay_subscription_id,
                payment_id: razorpay_payment_id
            });
        } else {
            res.status(400).json({
                success: false,
                verified: false,
                error: 'Payment verification failed (signature mismatch)'
            });
        }
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/subscription/status/:subscriptionId
 * Get current subscription status (for polling)
 */
router.get('/status/:subscriptionId', async (req, res) => {
    try {
        const { subscriptionId } = req.params;

        if (!subscriptionId) {
            return res.status(400).json({
                success: false,
                error: 'Subscription ID is required'
            });
        }

        const result = await razorpayService.getSubscription(subscriptionId);
        res.json(result);
    } catch (error) {
        console.error('Get subscription status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/subscription/cancel/:subscriptionId
 * Cancel a subscription
 * 
 * Body: {
 *   cancelAtCycleEnd: true | false
 * }
 */
router.post('/cancel/:subscriptionId', async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const { cancelAtCycleEnd = true } = req.body;

        if (!subscriptionId) {
            return res.status(400).json({
                success: false,
                error: 'Subscription ID is required'
            });
        }

        const result = await razorpayService.cancelSubscription(subscriptionId, cancelAtCycleEnd);
        res.json(result);
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/subscription/user/:userId
 * Get user's plan details (bypassing RLS)
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        if (!supabaseAdmin) {
            return res.status(500).json({
                success: false,
                error: 'Server database connection not available'
            });
        }

        const { data, error } = await supabaseAdmin
            .from('user_plans')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            log(`❌ Error fetching plan for ${userId}: ${error.message}`);
            throw error;
        }

        log(`🔍 Fetched plan for ${userId}: ${data ? data.plan_type : 'null'}`);

        res.json({
            success: true,
            plan: data
        });
    } catch (error) {
        console.error('Get user plan error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
