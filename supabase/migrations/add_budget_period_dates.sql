-- Add period_start_day and period_start_month columns to budgets table
-- These allow users to customize when their budget period starts
-- to align with salary cycles.

-- period_start_day: Day of month when the period starts (1-28).
--   For monthly budgets, the cycle runs from this day to the day before next period.
--   Default 1 means period starts on the 1st of each month.
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS period_start_day INTEGER DEFAULT 1;

-- period_start_month: Month when the yearly period starts (1-12).
--   Only used for yearly budgets.
--   Default 1 means period starts in January.
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS period_start_month INTEGER DEFAULT 1;

-- Add constraints to ensure valid values
ALTER TABLE budgets ADD CONSTRAINT budgets_period_start_day_check
  CHECK (period_start_day >= 1 AND period_start_day <= 28);

ALTER TABLE budgets ADD CONSTRAINT budgets_period_start_month_check
  CHECK (period_start_month >= 1 AND period_start_month <= 12);
