// Import all data from backups/data_backup.json into a NEW Supabase project
//
// Usage:
// NEW_SUPABASE_URL=https://newproject.supabase.co \
// NEW_SERVICE_ROLE_KEY=eyJ... \
// node scripts/import-db.mjs
//
// Make sure backups/data_backup.json exists (run scripts/backup-db.mjs first)
// Make sure schema is already created in the new project before running this

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BACKUP_FILE = path.resolve(__dirname, '../backups/data_backup.json')

// ── Env validation ────────────────────────────────────────────────────────────

const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL
const NEW_SERVICE_ROLE_KEY = process.env.NEW_SERVICE_ROLE_KEY

if (!NEW_SUPABASE_URL || !NEW_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  if (!NEW_SUPABASE_URL) console.error('   NEW_SUPABASE_URL is not set')
  if (!NEW_SERVICE_ROLE_KEY) console.error('   NEW_SERVICE_ROLE_KEY is not set')
  console.error('')
  console.error('Usage:')
  console.error('  NEW_SUPABASE_URL=https://newproject.supabase.co \\')
  console.error('  NEW_SERVICE_ROLE_KEY=eyJ... \\')
  console.error('  node scripts/import-db.mjs')
  process.exit(1)
}

// ── Backup file validation ────────────────────────────────────────────────────

if (!fs.existsSync(BACKUP_FILE)) {
  console.error(`❌ Backup file not found: ${BACKUP_FILE}`)
  console.error('   Run scripts/backup-db.mjs first to create the backup.')
  process.exit(1)
}

// ── Supabase client ───────────────────────────────────────────────────────────

const supabase = createClient(NEW_SUPABASE_URL, NEW_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Import order (respects FK dependencies) ───────────────────────────────────

const TABLE_ORDER = [
  'profiles',               // no dependencies
  'payback_priorities',     // no dependencies
  'exchange_rates',         // no dependencies
  'categories',             // no dependencies
  'wallets',                // no dependencies
  'payback_goals',          // depends on payback_priorities
  'goals',                  // no FK to other user tables
  'kanji_card_groups',      // no dependencies
  'kanji_cards',            // depends on kanji_card_groups
  'study_materials',        // no dependencies
  'tasks',                  // depends on goals
  'subtasks',               // depends on tasks
  'budgets',                // depends on categories
  'trades',                 // depends on wallets
  'financial_transactions', // depends on wallets, categories, payback_goals
  'wallet_monthly_snapshots', // depends on wallets
  'checkin_calendar',       // depends on goals, tasks, subtasks
  'assignment_history',     // depends on goals, tasks
  'task_completions',       // depends on tasks
  'subtask_completions',    // depends on subtasks
]

// Tables that use a composite key instead of 'id' for conflict resolution
const CONFLICT_KEYS = {
  exchange_rates: 'from_currency,to_currency',
}

const CHUNK_SIZE = 100

// ── Data helpers ──────────────────────────────────────────────────────────────

function processRow(row) {
  const processed = {}
  for (const [key, value] of Object.entries(row)) {
    // Keep null as null
    if (value === null || value === undefined) {
      processed[key] = null
      continue
    }
    // Ensure array fields stay as arrays (not stringified)
    if (key === 'assigned_to' || key === 'tags' || key === 'images') {
      processed[key] = Array.isArray(value) ? value : value
      continue
    }
    // Keep progress as-is (integer or float)
    processed[key] = value
  }
  return processed
}

function chunkArray(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting import to NEW Supabase project...')
  console.log(`   URL: ${NEW_SUPABASE_URL}`)
  console.log(`   Backup: ${BACKUP_FILE}`)
  console.log('')

  const raw = fs.readFileSync(BACKUP_FILE, 'utf-8')
  const backup = JSON.parse(raw)

  const { tables } = backup

  let successCount = 0
  let failCount = 0
  let totalRows = 0

  for (const tableName of TABLE_ORDER) {
    const tableData = tables[tableName]

    if (!tableData) {
      console.log(`⏭️  Skipping ${tableName} (not found in backup)`)
      continue
    }

    const { data: rows } = tableData
    process.stdout.write(`📥 Importing ${tableName}... `)

    if (!rows || rows.length === 0) {
      console.log(`✅ 0 rows`)
      successCount++
      continue
    }

    const onConflict = CONFLICT_KEYS[tableName] ?? 'id'
    const processedRows = rows.map(processRow)
    const chunks = chunkArray(processedRows, CHUNK_SIZE)

    let tableError = null
    let importedRows = 0

    for (const chunk of chunks) {
      const { error } = await supabase
        .from(tableName)
        .upsert(chunk, { onConflict })

      if (error) {
        tableError = error
        break
      }
      importedRows += chunk.length
    }

    if (tableError) {
      console.log(`❌ Error: ${tableError.message}`)
      failCount++
    } else {
      console.log(`✅ ${importedRows} rows`)
      successCount++
      totalRows += importedRows
    }
  }

  console.log('')
  console.log('✅ IMPORT COMPLETE!')
  console.log('━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Success: ${successCount} tables`)
  console.log(`❌ Failed: ${failCount} tables`)
  console.log(`Total rows imported: ~${totalRows}`)
  console.log('━━━━━━━━━━━━━━━━━━━━')
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
