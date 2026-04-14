-- Add period_start_day and period_start_month columns to budgets table
-- period_start_day: day of month salary is paid (1-28), default 1
-- period_start_month: starting month for yearly budgets (1-12), default 1

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS period_start_day INTEGER NOT NULL DEFAULT 1 CHECK (period_start_day >= 1 AND period_start_day <= 28),
  ADD COLUMN IF NOT EXISTS period_start_month INTEGER NOT NULL DEFAULT 1 CHECK (period_start_month >= 1 AND period_start_month <= 12);

COMMENT ON COLUMN public.budgets.period_start_day IS 'Day of month when salary/budget period starts (1-28). Default 1 = standard calendar month.';
COMMENT ON COLUMN public.budgets.period_start_month IS 'Starting month for yearly budgets (1-12). Only relevant when period=yearly.';
