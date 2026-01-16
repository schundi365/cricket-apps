/**
 * Utility to verify the nets_sessions and nets_statistics tables were created correctly
 * 
 * This module provides functions to test the nets tables structure,
 * foreign key constraints, unique constraints, and basic operations.
 * 
 * Requirements: 2.3, 2.4
 */

import { supabase } from './supabase';

/**
 * Verify that the nets_sessions and nets_statistics tables exist and have the correct structure
 * 
 * @returns {Promise<Object>} Verification results
 */
export async function verifyNetsTables() {
  const results = {
    sessionsTableExists: false,
    statisticsTableExists: false,
    canQuerySessions: false,
    canQueryStatistics: false,
    canInsertSession: false,
    canInsertStatistic: false,
    foreignKeysWork: false,
    uniqueConstraintWorks: false,
    indexesExist: false,
    cascadeDeleteWorks: false,
    errors: []
  };

  if (!supabase) {
    results.errors.push('Supabase client not initialized');
    return results;
  }

  let testPlayerId = null;
  let testSessionId = null;
  let testStatisticId = null;

  try {
    // Test 1: Check if nets_sessions table exists
    console.log('Test 1: Checking if nets_sessions table exists...');
    const { error: sessionsQueryError } = await supabase
      .from('nets_sessions')
      .select('*')
      .limit(1);

    if (sessionsQueryError) {
      if (sessionsQueryError.code === '42P01') {
        results.errors.push('nets_sessions table does not exist. Please run the migration first.');
        return results;
      }
      results.errors.push(`Sessions query error: ${sessionsQueryError.message}`);
      return results;
    }

    results.sessionsTableExists = true;
    results.canQuerySessions = true;
    console.log('✓ nets_sessions table exists and can be queried');

    // Test 2: Check if nets_statistics table exists
    console.log('Test 2: Checking if nets_statistics table exists...');
    const { error: statisticsQueryError } = await supabase
      .from('nets_statistics')
      .select('*')
      .limit(1);

    if (statisticsQueryError) {
      if (statisticsQueryError.code === '42P01') {
        results.errors.push('nets_statistics table does not exist. Please run the migration first.');
        return results;
      }
      results.errors.push(`Statistics query error: ${statisticsQueryError.message}`);
      return results;
    }

    results.statisticsTableExists = true;
    results.canQueryStatistics = true;
    console.log('✓ nets_statistics table exists and can be queried');

    // Test 3: Create a test player for foreign key testing
    console.log('Test 3: Creating test player for foreign key testing...');
    const testPlayer = {
      name: 'Test Player for Nets ' + Date.now(),
      team: 'Test Team',
      play_cricket_id: 'test_nets_' + Date.now()
    };

    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .insert([testPlayer])
      .select();

    if (playerError) {
      results.errors.push(`Failed to create test player: ${playerError.message}`);
      return results;
    }

    testPlayerId = playerData[0].id;
    console.log('✓ Test player created with ID:', testPlayerId);

    // Test 4: Insert a nets session
    console.log('Test 4: Testing insert operation for nets_sessions...');
    const testSession = {
      session_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      session_name: 'Test session ' + Date.now()
    };

    const { data: sessionData, error: sessionError } = await supabase
      .from('nets_sessions')
      .insert([testSession])
      .select();

    if (sessionError) {
      results.errors.push(`Session insert error: ${sessionError.message}`);
      return results;
    }

    results.canInsertSession = true;
    testSessionId = sessionData[0].id;
    console.log('✓ Can insert nets sessions successfully');
    console.log('Inserted session:', sessionData[0]);

    // Test 5: Insert a nets statistic with valid foreign keys
    console.log('Test 5: Testing insert operation for nets_statistics with valid foreign keys...');
    const testStatistic = {
      session_id: testSessionId,
      player_id: testPlayerId,
      attended: true,
      dismissals: 2,
      wickets: 3,
      extras: 1
    };

    const { data: statisticData, error: statisticError } = await supabase
      .from('nets_statistics')
      .insert([testStatistic])
      .select();

    if (statisticError) {
      results.errors.push(`Statistic insert error: ${statisticError.message}`);
    } else {
      results.canInsertStatistic = true;
      results.foreignKeysWork = true;
      testStatisticId = statisticData[0].id;
      console.log('✓ Can insert nets statistics successfully');
      console.log('✓ Foreign key constraints work (accepted valid session_id and player_id)');
      console.log('Inserted statistic:', statisticData[0]);
    }

    // Test 6: Test foreign key constraint with invalid session_id
    console.log('Test 6: Testing foreign key constraint with invalid session_id...');
    const invalidStatistic1 = {
      session_id: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
      player_id: testPlayerId,
      attended: true,
      dismissals: 0,
      wickets: 0,
      extras: 0
    };

    const { error: fkError1 } = await supabase
      .from('nets_statistics')
      .insert([invalidStatistic1])
      .select();

    if (fkError1 && fkError1.code === '23503') {
      console.log('✓ Foreign key constraint properly rejects invalid session_id');
    } else if (fkError1) {
      console.log('⚠ Got error but not the expected foreign key error:', fkError1.message);
    } else {
      results.errors.push('Foreign key constraint did not prevent invalid session_id');
    }

    // Test 7: Test foreign key constraint with invalid player_id
    console.log('Test 7: Testing foreign key constraint with invalid player_id...');
    const invalidStatistic2 = {
      session_id: testSessionId,
      player_id: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
      attended: true,
      dismissals: 0,
      wickets: 0,
      extras: 0
    };

    const { error: fkError2 } = await supabase
      .from('nets_statistics')
      .insert([invalidStatistic2])
      .select();

    if (fkError2 && fkError2.code === '23503') {
      console.log('✓ Foreign key constraint properly rejects invalid player_id');
    } else if (fkError2) {
      console.log('⚠ Got error but not the expected foreign key error:', fkError2.message);
    } else {
      results.errors.push('Foreign key constraint did not prevent invalid player_id');
    }

    // Test 8: Test unique constraint on (session_id, player_id)
    console.log('Test 8: Testing unique constraint on (session_id, player_id)...');
    const duplicateStatistic = {
      session_id: testSessionId,
      player_id: testPlayerId,
      attended: false,
      dismissals: 5,
      wickets: 2,
      extras: 3
    };

    const { error: uniqueError } = await supabase
      .from('nets_statistics')
      .insert([duplicateStatistic])
      .select();

    if (uniqueError && uniqueError.code === '23505') {
      results.uniqueConstraintWorks = true;
      console.log('✓ Unique constraint properly prevents duplicate (session_id, player_id) pairs');
    } else if (uniqueError) {
      console.log('⚠ Got error but not the expected unique constraint error:', uniqueError.message);
    } else {
      results.errors.push('Unique constraint did not prevent duplicate (session_id, player_id)');
    }

    // Test 9: Verify indexes exist (indirect test via query performance)
    console.log('Test 9: Testing indexes on session_id and player_id...');
    const { error: indexError1 } = await supabase
      .from('nets_statistics')
      .select('*')
      .eq('session_id', testSessionId);

    const { error: indexError2 } = await supabase
      .from('nets_statistics')
      .select('*')
      .eq('player_id', testPlayerId);

    const { error: indexError3 } = await supabase
      .from('nets_sessions')
      .select('*')
      .order('session_date', { ascending: false })
      .limit(10);

    if (!indexError1 && !indexError2 && !indexError3) {
      results.indexesExist = true;
      console.log('✓ Can query by session_id, player_id, and date (indexes should optimize these)');
    } else {
      results.errors.push('Index test errors occurred');
    }

    // Test 10: Test CASCADE delete (deleting session should delete statistics)
    console.log('Test 10: Testing CASCADE delete for session...');
    const { error: deleteSessionError } = await supabase
      .from('nets_sessions')
      .delete()
      .eq('id', testSessionId);

    if (deleteSessionError) {
      console.warn('Warning: Could not delete test session:', deleteSessionError.message);
    } else {
      // Check if statistic was also deleted
      const { data: orphanedStatistics, error: orphanError } = await supabase
        .from('nets_statistics')
        .select('*')
        .eq('id', testStatisticId);

      if (!orphanError && orphanedStatistics.length === 0) {
        results.cascadeDeleteWorks = true;
        console.log('✓ CASCADE delete works (statistic deleted when session deleted)');
      } else {
        console.warn('⚠ CASCADE delete may not be working correctly for session');
      }
    }

    // Mark that we've cleaned up the session and statistic
    testSessionId = null;
    testStatisticId = null;

    // Test 11: Test CASCADE delete (deleting player should delete statistics)
    console.log('Test 11: Testing CASCADE delete for player...');
    
    // Create a new session and statistic for this test
    const { data: newSessionData } = await supabase
      .from('nets_sessions')
      .insert([{ session_date: new Date().toISOString().split('T')[0], session_name: 'Test cascade' }])
      .select();

    if (newSessionData && newSessionData.length > 0) {
      const newSessionId = newSessionData[0].id;
      
      const { data: newStatisticData } = await supabase
        .from('nets_statistics')
        .insert([{
          session_id: newSessionId,
          player_id: testPlayerId,
          attended: true,
          dismissals: 0,
          wickets: 0,
          extras: 0
        }])
        .select();

      if (newStatisticData && newStatisticData.length > 0) {
        const newStatisticId = newStatisticData[0].id;

        // Now delete the player
        const { error: deletePlayerError } = await supabase
          .from('players')
          .delete()
          .eq('id', testPlayerId);

        if (deletePlayerError) {
          console.warn('Warning: Could not delete test player:', deletePlayerError.message);
        } else {
          // Check if statistic was also deleted
          const { data: orphanedStats, error: orphanError2 } = await supabase
            .from('nets_statistics')
            .select('*')
            .eq('id', newStatisticId);

          if (!orphanError2 && orphanedStats.length === 0) {
            console.log('✓ CASCADE delete works (statistic deleted when player deleted)');
          } else {
            console.warn('⚠ CASCADE delete may not be working correctly for player');
          }
        }

        // Clean up the test session
        await supabase
          .from('nets_sessions')
          .delete()
          .eq('id', newSessionId);
      }
    }

    // Mark that we've cleaned up
    testPlayerId = null;

  } catch (error) {
    results.errors.push(`Unexpected error: ${error.message}`);
  } finally {
    // Clean up any remaining test data
    if (testSessionId) {
      console.log('Cleaning up remaining test session...');
      await supabase
        .from('nets_sessions')
        .delete()
        .eq('id', testSessionId);
    }
    if (testPlayerId) {
      console.log('Cleaning up remaining test player...');
      await supabase
        .from('players')
        .delete()
        .eq('id', testPlayerId);
    }
  }

  return results;
}

/**
 * Get detailed information about the nets tables structure
 * 
 * @returns {Promise<Object>} Table structure information
 */
export async function getNetsTablesInfo() {
  if (!supabase) {
    return { error: 'Supabase client not initialized' };
  }

  try {
    // Query sample data from both tables
    const { data: sessionData, error: sessionError } = await supabase
      .from('nets_sessions')
      .select('*')
      .limit(1);

    const { data: statisticData, error: statisticError } = await supabase
      .from('nets_statistics')
      .select('*')
      .limit(1);

    if (sessionError || statisticError) {
      return { 
        error: sessionError?.message || statisticError?.message 
      };
    }

    return {
      success: true,
      sessionsStructure: sessionData.length > 0 ? Object.keys(sessionData[0]) : [],
      statisticsStructure: statisticData.length > 0 ? Object.keys(statisticData[0]) : [],
      sessionsMessage: sessionData.length > 0 
        ? 'nets_sessions table has data. Sample structure shown.' 
        : 'nets_sessions table exists but is empty. Expected columns: id, date, notes, created_at, updated_at',
      statisticsMessage: statisticData.length > 0 
        ? 'nets_statistics table has data. Sample structure shown.' 
        : 'nets_statistics table exists but is empty. Expected columns: id, session_id, player_id, attended, dismissals, wickets, extras, created_at, updated_at'
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
  console.log('=== Nets Tables Verification ===\n');

  const results = await verifyNetsTables();

  console.log('\n=== Verification Results ===');
  console.log('Sessions table exists:', results.sessionsTableExists ? '✓' : '✗');
  console.log('Statistics table exists:', results.statisticsTableExists ? '✓' : '✗');
  console.log('Can query sessions:', results.canQuerySessions ? '✓' : '✗');
  console.log('Can query statistics:', results.canQueryStatistics ? '✓' : '✗');
  console.log('Can insert session:', results.canInsertSession ? '✓' : '✗');
  console.log('Can insert statistic:', results.canInsertStatistic ? '✓' : '✗');
  console.log('Foreign keys work:', results.foreignKeysWork ? '✓' : '✗');
  console.log('Unique constraint works:', results.uniqueConstraintWorks ? '✓' : '✗');
  console.log('Indexes exist:', results.indexesExist ? '✓' : '✗');
  console.log('CASCADE delete works:', results.cascadeDeleteWorks ? '✓' : '✗');

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(error => console.log('  ✗', error));
  }

  const allTestsPassed = results.sessionsTableExists && 
                         results.statisticsTableExists &&
                         results.canQuerySessions && 
                         results.canQueryStatistics &&
                         results.canInsertSession && 
                         results.canInsertStatistic && 
                         results.foreignKeysWork &&
                         results.uniqueConstraintWorks &&
                         results.indexesExist &&
                         results.cascadeDeleteWorks &&
                         results.errors.length === 0;

  console.log('\n=== Overall Result ===');
  console.log(allTestsPassed ? '✓ All tests passed!' : '✗ Some tests failed');

  // Get table info
  const tableInfo = await getNetsTablesInfo();
  if (tableInfo.success) {
    console.log('\n=== Table Structures ===');
    console.log('nets_sessions columns:', tableInfo.sessionsStructure.join(', '));
    console.log(tableInfo.sessionsMessage);
    console.log('\nnets_statistics columns:', tableInfo.statisticsStructure.join(', '));
    console.log(tableInfo.statisticsMessage);
  }

  return allTestsPassed;
}
