-- Add recurrence column to payback_goals (used by 'plan' goal_type).
-- 'none'    = one-time plan (default, also used by all payback goals)
-- 'weekly'  = when marked done, auto-create a copy due +7 days
-- 'monthly' = when marked done, auto-create a copy due +1 month
ALTER TABLE payback_goals
ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'none';

-- Category chosen for a plan. When a plan payment is confirmed, the auto-created
-- expense transaction uses this category (instead of a generic 'Plan' category).
-- Nullable: payback goals leave it null and keep using the 'Payback' category.
ALTER TABLE payback_goals
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);
