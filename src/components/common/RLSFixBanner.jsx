import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Auto-detects RLS policy issues on financial_transactions table.
 * Shows a banner with the SQL fix when RLS is blocking data.
 * 
 * The issue: RLS is enabled but no SELECT policy exists for authenticated users,
 * causing queries to return 0 rows (status 200, no error).
 */
export default function RLSFixBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSQL, setShowSQL] = useState(false)
  const [copied, setCopied] = useState(false)
  const [diagnosisDetails, setDiagnosisDetails] = useState('')

  useEffect(() => {
    checkRLSIssue()
  }, [])

  const checkRLSIssue = async () => {
    try {
      // 1. Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return // Not logged in, not an RLS issue

      // 2. Check if financial_transactions returns 0 rows
      const { data: txnData, error: txnError } = await supabase
        .from('financial_transactions')
        .select('id', { count: 'exact', head: true })

      // If there's an error, it's not an RLS issue (it's a different problem)
      if (txnError) return

      // 3. Check if wallets returns data (wallets work = auth is fine)
      const { data: walletData } = await supabase
        .from('wallets')
        .select('id', { count: 'exact', head: true })

      const txnCount = txnData?.length ?? 0
      const walletCount = walletData?.length ?? 0

      // RLS issue pattern: authenticated user, wallets work but transactions return 0
      if (txnCount === 0 && walletCount > 0) {
        setShowBanner(true)
        setDiagnosisDetails(
          `Authenticated as ${session.user.email}. ` +
          `Wallets: ${walletCount} rows ✅ | Transactions: 0 rows ❌`
        )
        console.warn(
          '🚨 [RLSFixBanner] RLS policy issue detected on financial_transactions!\n' +
          'Run the SQL fix in Supabase SQL Editor. See banner for details.'
        )
      }
    } catch {
      // Silently ignore - this is a diagnostic, not critical
    }
  }

  const fixSQL = `-- =============================================
-- Fix RLS policies for financial_transactions
-- Run this in Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → Paste → Run)
-- =============================================

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "financial_transactions_select" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete" ON financial_transactions;

-- Create permissive policies for authenticated users
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
  USING (true);`

  const handleCopy = () => {
    navigator.clipboard.writeText(fixSQL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!showBanner) return null

  return (
    <div className="mb-4 rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">⚠️</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-amber-800 text-lg">
            Không thể tải giao dịch — Cần cấu hình RLS
          </h3>
          <p className="text-amber-700 text-sm mt-1">
            Bảng <code className="bg-amber-100 px-1 rounded">financial_transactions</code> bật Row Level Security nhưng chưa có policy cho phép đọc dữ liệu. 
            Bạn cần chạy SQL bên dưới trong <strong>Supabase SQL Editor</strong> để sửa.
          </p>
          <p className="text-amber-600 text-xs mt-1">
            {diagnosisDetails}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setShowSQL(!showSQL)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              {showSQL ? '🔼 Ẩn SQL' : '🔧 Xem SQL Fix'}
            </button>
            
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              🔗 Mở Supabase Dashboard
            </a>

            <button
              onClick={() => setShowBanner(false)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              ✕ Đóng
            </button>
          </div>

          {showSQL && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-amber-700 font-medium">
                  📋 Copy SQL này → Paste vào Supabase SQL Editor → Click Run
                </span>
                <button
                  onClick={handleCopy}
                  className="text-xs px-2 py-1 bg-amber-200 text-amber-800 rounded hover:bg-amber-300 transition-colors"
                >
                  {copied ? '✅ Đã copy!' : '📋 Copy SQL'}
                </button>
              </div>
              <pre className="bg-gray-900 text-green-400 p-3 rounded-md text-xs overflow-x-auto max-h-64 overflow-y-auto">
                {fixSQL}
              </pre>
              <p className="text-xs text-amber-600 mt-2">
                💡 <strong>Hướng dẫn:</strong> Vào Supabase Dashboard → SQL Editor → New Query → Paste SQL trên → Run. 
                Sau đó reload trang này.
              </p>
              <p className="text-xs text-amber-600 mt-1">
                📂 Hoặc chạy file migration đầy đủ: <code className="bg-amber-100 px-1 rounded">supabase/migrations/20260414_fix_finance_rls.sql</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
