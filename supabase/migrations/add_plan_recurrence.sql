-- Add recurrence column to payback_goals (used by 'plan' goal_type).
-- 'none'    = one-time plan (default, also used by all payback goals)
-- 'weekly'  = when marked done, auto-create a copy due +7 days
-- 'monthly' = when marked done, auto-create a copy due +1 month
ALTER TABLE payback_goals
ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'none';

-- Note: the default 'Plan' expense category is created on demand by the app
-- (usePaybackGoals.getOrCreateExpenseCategory) the first time a plan payment
-- is confirmed, so no seed row is required here.
