// Usage:
// VITE_SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/backup-db.mjs

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TABLES = [
  'financial_transactions',
  'wallets',
  'wallet_monthly_snapshots',
  'categories',
  'trades',
  'tasks',
  'subtasks',
  'goals',
  'payback_goals',
  'payback_priorities',
  'kanji_cards',
  'kanji_card_groups',
  'study_materials',
  'assignment_history',
  'checkin_calendar',
  'task_completions',
  'subtask_completions',
  'exchange_rates',
  'budgets',
  'profiles',
]

// Tables with public read access
const PUBLIC_READ_TABLES = new Set(['exchange_rates', 'payback_priorities', 'categories'])

// ── Type inference ────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TIMESTAMPTZ_RE = /^\d{4}-\d{2}-\d{2}T[\d:.]+(\+\d{2}:\d{2}|Z)$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function inferType(value) {
  if (value === null || value === undefined) return null // unknown — defer
  if (typeof value === 'boolean') return 'BOOLEAN'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'INTEGER' : 'NUMERIC'
  }
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'string') return 'TEXT[]'
    return 'JSONB'
  }
  if (typeof value === 'object') return 'JSONB'
  if (typeof value === 'string') {
    if (UUID_RE.test(value)) return 'UUID'
    if (TIMESTAMPTZ_RE.test(value)) return 'TIMESTAMPTZ'
    if (DATE_RE.test(value)) return 'DATE'
    return 'TEXT'
  }
  return 'TEXT'
}

/**
 * Given an array of row objects, infer the SQL type for each column.
 * Returns a Map<colName, sqlType>.
 */
function inferColumnTypes(rows) {
  const typeMap = new Map()

  for (const row of rows) {
    for (const [col, val] of Object.entries(row)) {
      if (!typeMap.has(col)) typeMap.set(col, null)
      const existing = typeMap.get(col)
      const inferred = inferType(val)
      if (inferred !== null && existing === null) {
        typeMap.set(col, inferred)
      }
    }
  }

  // Fill any remaining unknowns with TEXT
  for (const [col, type] of typeMap.entries()) {
    if (type === null) typeMap.set(col, 'TEXT')
  }

  return typeMap
}

/**
 * Determine which columns are never null across all rows.
 */
function findNotNullColumns(rows, columns) {
  if (rows.length === 0) return new Set()
  const notNull = new Set(columns)
  for (const row of rows) {
    for (const col of columns) {
      if (row[col] === null || row[col] === undefined) {
        notNull.delete(col)
      }
    }
  }
  return notNull
}

// ── Schema generation ─────────────────────────────────────────────────────────

function generateCreateTable(tableName, rows, columns) {
  if (columns.length === 0) {
    return `-- Table ${tableName}: no columns detected (empty table)\n`
  }

  const typeMap = inferColumnTypes(rows)
  const notNullSet = findNotNullColumns(rows, columns)

  const colDefs = columns.map((col) => {
    let type = typeMap.get(col) || 'TEXT'
    const parts = [`  "${col}" ${type}`]

    if (col === 'id') {
      parts.push('PRIMARY KEY')
    }

    if (col === 'created_at' || col === 'updated_at') {
      parts.push('DEFAULT NOW()')
    }

    // NOT NULL (skip nullable columns like deleted_at)
    if (col !== 'deleted_at' && notNullSet.has(col) && col !== 'id') {
      parts.push('NOT NULL')
    }

    let line = parts.join(' ')

    // Comment on potential foreign keys
    if (col !== 'id' && col.endsWith('_id')) {
      line += ` -- FK: references another table`
    }

    return line
  })

  return `CREATE TABLE IF NOT EXISTS public."${tableName}" (\n${colDefs.join(',\n')}\n);\n`
}

function generateRlsStatements(tableName, columns) {
  const lines = []
  lines.push(`ALTER TABLE public."${tableName}" ENABLE ROW LEVEL SECURITY;`)

  const hasUserId = columns.includes('user_id')
  const hasCreatedBy = columns.includes('created_by')
  const isPublicRead = PUBLIC_READ_TABLES.has(tableName)

  if (isPublicRead) {
    lines.push(
      `CREATE POLICY "${tableName}_public_read" ON public."${tableName}"`,
      `  FOR SELECT USING (true);`,
    )
  }

  if (hasUserId) {
    lines.push(
      `CREATE POLICY "${tableName}_owner_all" ON public."${tableName}"`,
      `  FOR ALL USING (auth.uid() = user_id);`,
    )
  } else if (hasCreatedBy) {
    lines.push(
      `CREATE POLICY "${tableName}_owner_all" ON public."${tableName}"`,
      `  FOR ALL USING (auth.uid() = created_by);`,
    )
  }

  return lines.join('\n') + '\n'
}

const PROFILES_TRIGGER_SQL = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync('backups', { recursive: true })

  const exportedAt = new Date().toISOString()
  const result = {
    exported_at: exportedAt,
    project_url: SUPABASE_URL,
    tables: {},
    errors: {},
  }

  const schemaBlocks = [
    `-- Schema inferred from data export`,
    `-- Generated at: ${exportedAt}`,
    `-- Project: ${SUPABASE_URL}`,
    ``,
  ]

  for (const table of TABLES) {
    process.stdout.write(`📦 Exporting ${table}... `)

    const { data, error } = await supabase.from(table).select('*')

    if (error) {
      console.log(`❌ ${error.message}`)
      result.errors[table] = error.message
      continue
    }

    const columns = data.length > 0 ? Object.keys(data[0]) : []
    result.tables[table] = {
      count: data.length,
      columns,
      data,
    }

    console.log(`✅ ${data.length} rows`)

    // Generate schema for this table
    schemaBlocks.push(`-- ── ${table} ──`)
    schemaBlocks.push(generateCreateTable(table, data, columns))
    schemaBlocks.push(generateRlsStatements(table, columns))
    schemaBlocks.push('')
  }

  // Add profiles trigger
  schemaBlocks.push('-- ── profiles trigger ──')
  schemaBlocks.push(PROFILES_TRIGGER_SQL)

  console.log('\n💾 Writing backups/data_backup.json...')
  fs.writeFileSync('backups/data_backup.json', JSON.stringify(result, null, 2), 'utf8')

  console.log('📝 Writing backups/schema_inferred.sql...')
  fs.writeFileSync('backups/schema_inferred.sql', schemaBlocks.join('\n'), 'utf8')

  console.log('✅ DONE! Files saved to backups/')
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
