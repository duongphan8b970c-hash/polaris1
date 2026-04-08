-- Add plan_note column to trades table for trade planning notes
ALTER TABLE trades ADD COLUMN IF NOT EXISTS plan_note TEXT;

-- Add notes column if it doesn't exist (it was in the form but not being persisted)
ALTER TABLE trades ADD COLUMN IF NOT EXISTS notes TEXT;
