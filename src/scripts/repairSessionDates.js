/**
 * Data Repair Utility for Session Date Inconsistencies
 * 
 * This script detects and repairs inconsistencies between session_date in nets_statistics
 * and the actual date in nets_sessions table.
 * 
 * Usage:
 *   node src/scripts/repairSessionDates.js [--dry-run] [--verbose]
 * 
 * Options:
 *   --dry-run   Show what would be repaired without making changes
 *   --verbose   Show detailed information about each record
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.error('Required: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Detect session_date inconsistencies
 * 
 * Finds all nets_statistics records where session_date doesn't match
 * the corresponding nets_sessions.date value
 * 
 * @returns {Promise<Array>} Array of inconsistent records
 */
async function detectInconsistencies() {
  console.log('🔍 Detecting session_date inconsistencies...\n');

  const { data, error } = await supabase
    .from('nets_statistics')
    .select(`
      id,
      session_id,
      player_id,
      session_date,
      nets_sessions!inner(id, date)
    `);

  if (error) {
    throw new Error(`Failed to query database: ${error.message}`);
  }

  // Filter records where session_date doesn't match nets_sessions.date
  const inconsistencies = data.filter(record => {
    const sessionDate = record.session_date;
    const actualDate = record.nets_sessions.date;
    return sessionDate !== actualDate;
  });

  return inconsistencies.map(record => ({
    id: record.id,
    session_id: record.session_id,
    player_id: record.player_id,
    current_session_date: record.session_date,
    actual_session_date: record.nets_sessions.date
  }));
}

/**
 * Validate that all records have proper session_date values
 * 
 * Finds records with NULL or missing session_date that should be populated
 * 
 * @returns {Promise<Array>} Array of records with missing session_date
 */
async function findMissingSessionDates() {
  console.log('🔍 Finding records with missing session_date...\n');

  const { data, error } = await supabase
    .from('nets_statistics')
    .select(`
      id,
      session_id,
      player_id,
      session_date,
      nets_sessions!inner(id, date)
    `)
    .is('session_date', null);

  if (error) {
    throw new Error(`Failed to query database: ${error.message}`);
  }

  return data.map(record => ({
    id: record.id,
    session_id: record.session_id,
    player_id: record.player_id,
    current_session_date: null,
    actual_session_date: record.nets_sessions.date
  }));
}

/**
 * Repair session_date inconsistencies
 * 
 * Updates all nets_statistics records to sync session_date with nets_sessions.date
 * 
 * @param {Array} inconsistencies - Array of inconsistent records to repair
 * @param {boolean} dryRun - If true, don't make actual changes
 * @returns {Promise<Object>} Repair results
 */
async function repairInconsistencies(inconsistencies, dryRun = false) {
  if (inconsistencies.length === 0) {
    console.log('✅ No inconsistencies to repair\n');
    return { repaired: 0, failed: 0 };
  }

  console.log(`🔧 ${dryRun ? 'Would repair' : 'Repairing'} ${inconsistencies.length} record(s)...\n`);

  if (dryRun) {
    return { repaired: inconsistencies.length, failed: 0 };
  }

  let repaired = 0;
  let failed = 0;

  for (const record of inconsistencies) {
    const { error } = await supabase
      .from('nets_statistics')
      .update({
        session_date: record.actual_session_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', record.id);

    if (error) {
      console.error(`❌ Failed to repair record ${record.id}: ${error.message}`);
      failed++;
    } else {
      repaired++;
    }
  }

  return { repaired, failed };
}

/**
 * Display inconsistencies in a readable format
 * 
 * @param {Array} inconsistencies - Array of inconsistent records
 * @param {boolean} verbose - Show detailed information
 */
function displayInconsistencies(inconsistencies, verbose = false) {
  if (inconsistencies.length === 0) {
    console.log('✅ No inconsistencies found!\n');
    return;
  }

  console.log(`⚠️  Found ${inconsistencies.length} inconsistent record(s):\n`);

  if (verbose) {
    inconsistencies.forEach((record, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  ID: ${record.id}`);
      console.log(`  Session ID: ${record.session_id}`);
      console.log(`  Player ID: ${record.player_id}`);
      console.log(`  Current session_date: ${record.current_session_date || 'NULL'}`);
      console.log(`  Actual session date: ${record.actual_session_date}`);
      console.log('');
    });
  } else {
    console.log('Record ID | Session ID | Current Date | Actual Date');
    console.log('----------|------------|--------------|------------');
    inconsistencies.forEach(record => {
      const currentDate = record.current_session_date || 'NULL';
      console.log(`${record.id.substring(0, 8)}... | ${record.session_id.substring(0, 8)}... | ${currentDate} | ${record.actual_session_date}`);
    });
    console.log('');
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  console.log('═══════════════════════════════════════════════════════');
  console.log('  Session Date Repair Utility');
  console.log('═══════════════════════════════════════════════════════\n');

  if (dryRun) {
    console.log('🔍 Running in DRY RUN mode (no changes will be made)\n');
  }

  try {
    // Step 1: Detect mismatched dates
    const mismatches = await detectInconsistencies();
    
    // Step 2: Find missing dates
    const missing = await findMissingSessionDates();
    
    // Combine all issues
    const allInconsistencies = [...mismatches, ...missing];
    
    // Step 3: Display findings
    if (mismatches.length > 0) {
      console.log('📊 Mismatched Dates:');
      displayInconsistencies(mismatches, verbose);
    }
    
    if (missing.length > 0) {
      console.log('📊 Missing Dates:');
      displayInconsistencies(missing, verbose);
    }
    
    if (allInconsistencies.length === 0) {
      console.log('✅ Database is consistent! No repairs needed.\n');
      process.exit(0);
    }
    
    // Step 4: Repair inconsistencies
    const results = await repairInconsistencies(allInconsistencies, dryRun);
    
    // Step 5: Display results
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Repair Summary');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`Total inconsistencies found: ${allInconsistencies.length}`);
    console.log(`Successfully repaired: ${results.repaired}`);
    console.log(`Failed to repair: ${results.failed}\n`);
    
    if (dryRun) {
      console.log('💡 Run without --dry-run to apply these changes\n');
    } else if (results.failed === 0) {
      console.log('✅ All inconsistencies have been repaired!\n');
    } else {
      console.log('⚠️  Some repairs failed. Check the errors above.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();
