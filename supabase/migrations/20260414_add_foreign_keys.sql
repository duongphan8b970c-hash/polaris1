-- Add missing foreign key constraints required by PostgREST join queries.
-- These FKs must exist for Supabase `.select('*, wallets(...)')` syntax to work.
--
-- Uses DO blocks with IF NOT EXISTS checks so the migration is idempotent.

-- 1. financial_transactions.wallet_id → wallets.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'financial_transactions_wallet_id_fkey'
      AND table_name = 'financial_transactions'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD CONSTRAINT financial_transactions_wallet_id_fkey
      FOREIGN KEY (wallet_id) REFERENCES public.wallets(id);
  END IF;
END $$;

-- 2. financial_transactions.to_wallet_id → wallets.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'financial_transactions_to_wallet_id_fkey'
      AND table_name = 'financial_transactions'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD CONSTRAINT financial_transactions_to_wallet_id_fkey
      FOREIGN KEY (to_wallet_id) REFERENCES public.wallets(id);
  END IF;
END $$;

-- 3. financial_transactions.category_id → categories.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'financial_transactions_category_id_fkey'
      AND table_name = 'financial_transactions'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD CONSTRAINT financial_transactions_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.categories(id);
  END IF;
END $$;

-- 4. financial_transactions.payback_goal_id → payback_goals.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'financial_transactions_payback_goal_id_fkey'
      AND table_name = 'financial_transactions'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD CONSTRAINT financial_transactions_payback_goal_id_fkey
      FOREIGN KEY (payback_goal_id) REFERENCES public.payback_goals(id);
  END IF;
END $$;

-- 5. budgets.category_id → categories.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'budgets_category_id_fkey'
      AND table_name = 'budgets'
  ) THEN
    ALTER TABLE public.budgets
      ADD CONSTRAINT budgets_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.categories(id);
  END IF;
END $$;

-- 6. trades.wallet_id → wallets.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'trades_wallet_id_fkey'
      AND table_name = 'trades'
  ) THEN
    ALTER TABLE public.trades
      ADD CONSTRAINT trades_wallet_id_fkey
      FOREIGN KEY (wallet_id) REFERENCES public.wallets(id);
  END IF;
END $$;

-- 7. payback_goals.priority_id → payback_priorities.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payback_goals_priority_id_fkey'
      AND table_name = 'payback_goals'
  ) THEN
    ALTER TABLE public.payback_goals
      ADD CONSTRAINT payback_goals_priority_id_fkey
      FOREIGN KEY (priority_id) REFERENCES public.payback_priorities(id);
  END IF;
END $$;

-- 8. wallet_monthly_snapshots.wallet_id → wallets.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'wallet_monthly_snapshots_wallet_id_fkey'
      AND table_name = 'wallet_monthly_snapshots'
  ) THEN
    ALTER TABLE public.wallet_monthly_snapshots
      ADD CONSTRAINT wallet_monthly_snapshots_wallet_id_fkey
      FOREIGN KEY (wallet_id) REFERENCES public.wallets(id);
  END IF;
END $$;
