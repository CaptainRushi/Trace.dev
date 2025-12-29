-- Migration: Create user_plans table for subscription management
-- Run this in Supabase SQL Editor

-- Create plan type enum
CREATE TYPE plan_type AS ENUM ('free', 'starter', 'pro');

-- Create user_plans table
CREATE TABLE IF NOT EXISTS user_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type plan_type NOT NULL DEFAULT 'free',
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    razorpay_subscription_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one plan per user
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX idx_user_plans_expires_at ON user_plans(expires_at);

-- Enable RLS
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own plan
CREATE POLICY "Users can view own plan"
    ON user_plans FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own plan (for initial creation)
CREATE POLICY "Users can create own plan"
    ON user_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own plan
CREATE POLICY "Users can update own plan"
    ON user_plans FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to automatically create a free plan for new users
CREATE OR REPLACE FUNCTION create_default_plan()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_plans (user_id, plan_type)
    VALUES (NEW.id, 'free')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default plan when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_plan ON auth.users;
CREATE TRIGGER on_auth_user_created_plan
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_plan();

-- Function to get user's active plan with expiry check
CREATE OR REPLACE FUNCTION get_active_plan(p_user_id UUID)
RETURNS TABLE (
    plan_type plan_type,
    is_active BOOLEAN,
    days_remaining INTEGER,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.plan_type,
        CASE 
            WHEN up.plan_type = 'free' THEN TRUE
            WHEN up.expires_at IS NULL THEN FALSE
            WHEN up.expires_at > NOW() THEN TRUE
            ELSE FALSE
        END as is_active,
        CASE 
            WHEN up.plan_type = 'free' THEN NULL::INTEGER
            WHEN up.expires_at IS NULL THEN 0
            ELSE GREATEST(0, EXTRACT(DAY FROM (up.expires_at - NOW()))::INTEGER)
        END as days_remaining,
        up.expires_at
    FROM user_plans up
    WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate a plan after payment
CREATE OR REPLACE FUNCTION activate_plan(
    p_user_id UUID,
    p_plan_type plan_type,
    p_razorpay_subscription_id TEXT DEFAULT NULL,
    p_razorpay_payment_id TEXT DEFAULT NULL
)
RETURNS user_plans AS $$
DECLARE
    v_duration INTERVAL;
    v_result user_plans;
BEGIN
    -- Set duration based on plan type
    v_duration := CASE p_plan_type
        WHEN 'starter' THEN INTERVAL '1 month'
        WHEN 'pro' THEN INTERVAL '1 year'
        ELSE INTERVAL '0'
    END;
    
    -- Upsert the plan
    INSERT INTO user_plans (
        user_id, 
        plan_type, 
        activated_at, 
        expires_at,
        razorpay_subscription_id,
        razorpay_payment_id,
        updated_at
    )
    VALUES (
        p_user_id,
        p_plan_type,
        NOW(),
        CASE WHEN p_plan_type = 'free' THEN NULL ELSE NOW() + v_duration END,
        p_razorpay_subscription_id,
        p_razorpay_payment_id,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        plan_type = EXCLUDED.plan_type,
        activated_at = EXCLUDED.activated_at,
        expires_at = EXCLUDED.expires_at,
        razorpay_subscription_id = EXCLUDED.razorpay_subscription_id,
        razorpay_payment_id = EXCLUDED.razorpay_payment_id,
        updated_at = NOW()
    RETURNING * INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing users with free plan
INSERT INTO user_plans (user_id, plan_type)
SELECT id, 'free'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_plans)
ON CONFLICT (user_id) DO NOTHING;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_active_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_plan(UUID, plan_type, TEXT, TEXT) TO authenticated;
