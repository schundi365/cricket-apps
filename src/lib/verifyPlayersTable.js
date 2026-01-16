/**
 * Utility to verify the players table was created correctly
 * 
 * This module provides functions to test the players table structure
 * and basic operations after running the migration.
 * 
 * Requirements: 2.1
 */

import { supabase } from './supabase';

/**
 * Verify that the players table exists and has the correct structure
 * 
 * @returns {Promise<Object>} Verification results
 */
export async function verifyPlayersTable() {
  const results = {
    tableExists: false,
    canQuery: false,
    canInsert: false,
    uniqueConstraintWorks: false,
    errors: []
  };

  if (!supabase) {
    results.errors.push('Supabase client not initialized');
    return results;
  }

  try {
    // Test 1: Check if table exists by querying it
    console.log('Test 1: Checking if players table exists...');
    const { data: queryData, error: queryError } = await supabase
      .from('players')
      .select('*')
      .limit(1);

    if (queryError) {
      if (queryError.code === '42P01') {
        results.errors.push('Players table does not exist. Please run the migration first.');
        return results;
      }
      results.errors.push(`Query error: ${queryError.message}`);
      return results;
    }

    results.tableExists = true;
    results.canQuery = true;
    console.log('✓ Players table exists and can be queried');

    // Test 2: Try to insert a test player
    console.log('Test 2: Testing insert operation...');
    const testPlayer = {
      name: 'Test Player ' + Date.now(),
      team: 'Test Team',
      play_cricket_id: 'test_' + Date.now()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('players')
      .insert([testPlayer])
      .select();

    if (insertError) {
      results.errors.push(`Insert error: ${insertError.message}`);
      return results;
    }

    results.canInsert = true;
    console.log('✓ Can insert players successfully');
    console.log('Inserted player:', insertData[0]);

    const insertedPlayerId = insertData[0].id;
    const insertedPlayCricketId = insertData[0].play_cricket_id;

    // Test 3: Verify unique constraint on play_cricket_id
    console.log('Test 3: Testing unique constraint on play_cricket_id...');
    const duplicatePlayer = {
      name: 'Another Test Player',
      team: 'Another Team',
      play_cricket_id: insertedPlayCricketId // Same play_cricket_id
    };

    const { error: duplicateError } = await supabase
      .from('players')
      .insert([duplicatePlayer])
      .select();

    if (duplicateError) {
      // We expect an error here due to unique constraint
      if (duplicateError.code === '23505') {
        results.uniqueConstraintWorks = true;
        console.log('✓ Unique constraint on play_cricket_id works correctly');
      } else {
        results.errors.push(`Unexpected error testing unique constraint: ${duplicateError.message}`);
      }
    } else {
      results.errors.push('Unique constraint did not prevent duplicate play_cricket_id');
    }

    // Clean up: Delete the test player
    console.log('Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('players')
      .delete()
      .eq('id', insertedPlayerId);

    if (deleteError) {
      console.warn('Warning: Could not delete test player:', deleteError.message);
    } else {
      console.log('✓ Test data cleaned up successfully');
    }

  } catch (error) {
    results.errors.push(`Unexpected error: ${error.message}`);
  }

  return results;
}

/**
 * Get detailed information about the players table structure
 * Note: This requires direct database access and may not work with RLS enabled
 * 
 * @returns {Promise<Object>} Table structure information
 */
export async function getPlayersTableInfo() {
  if (!supabase) {
    return { error: 'Supabase client not initialized' };
  }

  try {
    // Query a sample player to see the structure
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .limit(1);

    if (error) {
      return { error: error.message };
    }

    return {
      success: true,
      sampleStructure: data.length > 0 ? Object.keys(data[0]) : [],
      message: data.length > 0 
        ? 'Table has data. Sample structure shown.' 
        : 'Table exists but is empty. Expected columns: id, play_cricket_id, name, team, created_at, updated_at'
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Run all verification tests and log results
 * 
 * @returns {Promise<boolean>} True if all tests pass
 */
export async function runAllVerificationTests() {
  console.log('=== Players Table Verification ===\n');

  const results = await verifyPlayersTable();

  console.log('\n=== Verification Results ===');
  console.log('Table exists:', results.tableExists ? '✓' : '✗');
  console.log('Can query:', results.canQuery ? '✓' : '✗');
  console.log('Can insert:', results.canInsert ? '✓' : '✗');
  console.log('Unique constraint works:', results.uniqueConstraintWorks ? '✓' : '✗');

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(error => console.log('  ✗', error));
  }

  const allTestsPassed = results.tableExists && 
                         results.canQuery && 
                         results.canInsert && 
                         results.uniqueConstraintWorks &&
                         results.errors.length === 0;

  console.log('\n=== Overall Result ===');
  console.log(allTestsPassed ? '✓ All tests passed!' : '✗ Some tests failed');

  // Get table info
  const tableInfo = await getPlayersTableInfo();
  if (tableInfo.success) {
    console.log('\n=== Table Structure ===');
    console.log('Columns:', tableInfo.sampleStructure.join(', '));
    console.log(tableInfo.message);
  }

  return allTestsPassed;
}

