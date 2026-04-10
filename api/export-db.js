import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'crypto'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const TABLES = [
  'transactions',
  'categories',
  'trades',
  'tasks',
  'goals',
  'payback_goals',
  'kanji_cards',
  'kanji_card_groups',
  'exchange_rates',
  'wallets',
  'budgets',
]

export default async function handler(req, res) {
  try {
    const token = req.query.token || ''
    const expectedToken = process.env.EXPORT_SECRET || 'polaris_export_2026'

    // Use constant-time comparison to prevent timing attacks
    const tokensMatch =
      token.length === expectedToken.length &&
      timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))

    if (!tokensMatch) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Fetch all tables in parallel; wrap each so rejections carry the table name
    const results = await Promise.allSettled(
      TABLES.map((table) =>
        supabase
          .from(table)
          .select('*')
          .then((res) => ({ table, ...res }))
          .catch((err) => Promise.reject({ table, message: err?.message ?? String(err) }))
      )
    )

    const result = {}
    const errors = {}

    for (const settled of results) {
      if (settled.status === 'rejected') {
        const { table, message } = settled.reason
        errors[table] = message
        continue
      }
      // Fulfilled value has .table, .data, .error from Supabase
      const { table, data, error } = settled.value
      if (error) {
        errors[table] = error.message
      } else {
        result[table] = data
      }
    }

    return res.status(200).json({
      exported_at: new Date().toISOString(),
      tables: result,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('❌ Error exporting database:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
