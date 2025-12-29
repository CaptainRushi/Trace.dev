-- Migration: Update plan_type enum and map existing plans
-- Objective: Add 'monthly' and 'yearly', map legacy 'starter' and 'pro'.

-- STEP 1: ADD NEW VALUES
-- IMPORTANT: In Postgres, new enum values must be committed before they can be used in the same table.
-- RUN THIS FIRST, then commit/refresh, then run Step 2.
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'monthly';
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'yearly';

-- STEP 2: UPDATE DATA (Run this after Step 1 has been executed and committed)
UPDATE user_plans SET plan_type = 'monthly' WHERE plan_type = 'starter';
UPDATE user_plans SET plan_type = 'yearly' WHERE plan_type = 'pro';

-- 3. (Optional) Remove legacy values if desired, 
-- but Postgres doesn't easily support removing enum values without dropping and recreating.
-- For now, we keep them but they won't be used by the app.

-- 4. Update the activate_plan function to handle new types
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
        WHEN 'monthly' THEN INTERVAL '1 month'
        WHEN 'yearly' THEN INTERVAL '1 year'
        -- Legacy support during transition
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
        CASE 
            WHEN p_plan_type = 'starter' THEN 'monthly'::plan_type
            WHEN p_plan_type = 'pro' THEN 'yearly'::plan_type
            ELSE p_plan_type 
        END,
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
