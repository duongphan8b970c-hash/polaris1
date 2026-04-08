-- Add goal_type column to payback_goals table
-- 'payback' = existing payback tracking goals
-- 'plan' = monthly spending/service plan tracking goals
ALTER TABLE payback_goals
ADD COLUMN IF NOT EXISTS goal_type TEXT NOT NULL DEFAULT 'payback';

-- Update existing goals to be 'payback' type
UPDATE payback_goals SET goal_type = 'payback' WHERE goal_type IS NULL;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_payback_goals_goal_type ON payback_goals(goal_type);
