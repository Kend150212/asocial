-- Migration: add trial_ends_at column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Set trial for all existing users who registered within the last 14 days
-- (give existing free users who haven't had a trial a 14-day trial from now)
UPDATE users
SET trial_ends_at = NOW() + INTERVAL '14 days'
WHERE trial_ends_at IS NULL
  AND created_at > NOW() - INTERVAL '14 days'
  AND id NOT IN (
    SELECT DISTINCT user_id FROM subscriptions WHERE status IN ('active', 'trialing')
    AND plan_id != (SELECT id FROM plans WHERE price_monthly = 0 ORDER BY price_monthly ASC LIMIT 1)
  );
