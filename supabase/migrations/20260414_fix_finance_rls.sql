-- ============================================================
-- Fix RLS policies for all finance tables
-- ============================================================
-- Problem: RLS is enabled on finance tables but no policies exist,
-- causing all SELECT queries to return 0 rows even though data exists.
--
-- Solution: Create permissive policies for authenticated users.
-- The app's finance hooks do NOT filter by user_id, so policies
-- allow any authenticated user full CRUD access.
--
-- SECURITY NOTE: These are permissive (USING true) policies that allow
-- any authenticated user to access all finance data. This matches the
-- current app code which doesn't isolate finance data by user_id.
-- For multi-user deployments, these should be tightened to user-scoped
-- policies (e.g. auth.uid() = user_id) after:
--   1. Adding user_id columns to tables that lack them
--   2. Backfilling user_id on existing rows
--   3. Updating all finance hooks to include user_id in queries/inserts
-- ============================================================

BEGIN;

-- ============================================================
-- 1. financial_transactions
-- ============================================================
ALTER TABLE IF EXISTS financial_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financial_transactions_select" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete" ON financial_transactions;

CREATE POLICY "financial_transactions_select"
  ON financial_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "financial_transactions_insert"
  ON financial_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "financial_transactions_update"
  ON financial_transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "financial_transactions_delete"
  ON financial_transactions FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 2. wallets
-- ============================================================
ALTER TABLE IF EXISTS wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_select" ON wallets;
DROP POLICY IF EXISTS "wallets_insert" ON wallets;
DROP POLICY IF EXISTS "wallets_update" ON wallets;
DROP POLICY IF EXISTS "wallets_delete" ON wallets;

CREATE POLICY "wallets_select"
  ON wallets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "wallets_insert"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "wallets_update"
  ON wallets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "wallets_delete"
  ON wallets FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 3. categories
-- ============================================================
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
DROP POLICY IF EXISTS "categories_delete" ON categories;

CREATE POLICY "categories_select"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "categories_insert"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "categories_update"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "categories_delete"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 4. payback_goals
-- ============================================================
ALTER TABLE IF EXISTS payback_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payback_goals_select" ON payback_goals;
DROP POLICY IF EXISTS "payback_goals_insert" ON payback_goals;
DROP POLICY IF EXISTS "payback_goals_update" ON payback_goals;
DROP POLICY IF EXISTS "payback_goals_delete" ON payback_goals;

CREATE POLICY "payback_goals_select"
  ON payback_goals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "payback_goals_insert"
  ON payback_goals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "payback_goals_update"
  ON payback_goals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "payback_goals_delete"
  ON payback_goals FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 5. payback_priorities
-- ============================================================
ALTER TABLE IF EXISTS payback_priorities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payback_priorities_select" ON payback_priorities;
DROP POLICY IF EXISTS "payback_priorities_insert" ON payback_priorities;
DROP POLICY IF EXISTS "payback_priorities_update" ON payback_priorities;
DROP POLICY IF EXISTS "payback_priorities_delete" ON payback_priorities;

CREATE POLICY "payback_priorities_select"
  ON payback_priorities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "payback_priorities_insert"
  ON payback_priorities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "payback_priorities_update"
  ON payback_priorities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "payback_priorities_delete"
  ON payback_priorities FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 6. wallet_monthly_snapshots
-- ============================================================
ALTER TABLE IF EXISTS wallet_monthly_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallet_monthly_snapshots_select" ON wallet_monthly_snapshots;
DROP POLICY IF EXISTS "wallet_monthly_snapshots_insert" ON wallet_monthly_snapshots;
DROP POLICY IF EXISTS "wallet_monthly_snapshots_update" ON wallet_monthly_snapshots;
DROP POLICY IF EXISTS "wallet_monthly_snapshots_delete" ON wallet_monthly_snapshots;

CREATE POLICY "wallet_monthly_snapshots_select"
  ON wallet_monthly_snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "wallet_monthly_snapshots_insert"
  ON wallet_monthly_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "wallet_monthly_snapshots_update"
  ON wallet_monthly_snapshots FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "wallet_monthly_snapshots_delete"
  ON wallet_monthly_snapshots FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 7. budgets
-- ============================================================
ALTER TABLE IF EXISTS budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budgets_select" ON budgets;
DROP POLICY IF EXISTS "budgets_insert" ON budgets;
DROP POLICY IF EXISTS "budgets_update" ON budgets;
DROP POLICY IF EXISTS "budgets_delete" ON budgets;

CREATE POLICY "budgets_select"
  ON budgets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "budgets_insert"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "budgets_update"
  ON budgets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "budgets_delete"
  ON budgets FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 8. trades
-- ============================================================
ALTER TABLE IF EXISTS trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trades_select" ON trades;
DROP POLICY IF EXISTS "trades_insert" ON trades;
DROP POLICY IF EXISTS "trades_update" ON trades;
DROP POLICY IF EXISTS "trades_delete" ON trades;

CREATE POLICY "trades_select"
  ON trades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "trades_insert"
  ON trades FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "trades_update"
  ON trades FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "trades_delete"
  ON trades FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 9. exchange_rates
-- ============================================================
ALTER TABLE IF EXISTS exchange_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exchange_rates_select" ON exchange_rates;
DROP POLICY IF EXISTS "exchange_rates_insert" ON exchange_rates;
DROP POLICY IF EXISTS "exchange_rates_update" ON exchange_rates;
DROP POLICY IF EXISTS "exchange_rates_delete" ON exchange_rates;

CREATE POLICY "exchange_rates_select"
  ON exchange_rates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "exchange_rates_insert"
  ON exchange_rates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "exchange_rates_update"
  ON exchange_rates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "exchange_rates_delete"
  ON exchange_rates FOR DELETE
  TO authenticated
  USING (true);

COMMIT;
