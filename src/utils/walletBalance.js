import { supabase } from '../lib/supabase'

/**
 * Recalculate current_amount for all wallets based on actual transaction data.
 * 
 * Formula: current_amount = initial_amount + SUM(amount) from all transactions
 * where wallet_id = this wallet.
 * 
 * Transaction amounts are already correctly signed:
 * - Income: positive
 * - Expense: negative
 * - Transfer out: negative (includes fee)
 * - Transfer in: positive
 */
export async function recalculateAllWalletBalances() {
  // 1. Fetch all wallets
  const { data: wallets, error: walletsError } = await supabase
    .from('wallets')
    .select('id, initial_amount, current_amount')
    .is('deleted_at', null)

  if (walletsError) throw walletsError
  if (!wallets || wallets.length === 0) return []

  // 2. Fetch ALL transactions grouped by wallet_id
  const { data: transactions, error: txnError } = await supabase
    .from('financial_transactions')
    .select('wallet_id, amount')

  if (txnError) throw txnError

  // 3. Sum amounts per wallet
  const sumByWallet = {}
  for (const txn of (transactions || [])) {
    if (!txn.wallet_id) continue
    sumByWallet[txn.wallet_id] = (sumByWallet[txn.wallet_id] || 0) + (parseFloat(txn.amount) || 0)
  }

  // 4. Update each wallet whose balance is wrong
  const updates = []
  for (const wallet of wallets) {
    const initialAmount = parseFloat(wallet.initial_amount) || 0
    const txnSum = sumByWallet[wallet.id] || 0
    const correctBalance = initialAmount + txnSum

    // Only update if the balance is actually different (avoid unnecessary writes)
    if (Math.abs((parseFloat(wallet.current_amount) || 0) - correctBalance) > 0.001) {
      updates.push(
        supabase
          .from('wallets')
          .update({ current_amount: correctBalance })
          .eq('id', wallet.id)
      )
    }
  }

  if (updates.length > 0) {
    await Promise.all(updates)
  }

  return updates.length
}
