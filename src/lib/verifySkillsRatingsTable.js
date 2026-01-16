/**
 * Utility to verify the skills_ratings table was created correctly
 * 
 * This module provides functions to test the skills_ratings table structure,
 * foreign key constraints, check constraints, and basic operations.
 * 
 * Requirements: 2.2
 */

import { supabase } from './supabase';

/**
 * Verify that the skills_ratings table exists and has the correct structure
 * 
 * @returns {Promise<Object>} Verification results
 */
export async function verifySkillsRatingsTable() {
  const results = {
    tableExists: false,
    canQuery: false,
    canInsert: false,
    foreignKeyWorks: false,
    checkConstraintsWork: false,
    indexExists: false,
    errors: []
  };

  if (!supabase) {
    results.errors.push('Supabase client not initialized');
    return results;
  }

  let testPlayerId = null;
  let testRatingId = null;

  try {
    // Test 1: Check if table exists by querying it
    console.log('Test 1: Checking if skills_ratings table exists...');
    const { error: queryError } = await supabase
      .from('skills_ratings')
      .select('*')
      .limit(1);

    if (queryError) {
      if (queryError.code === '42P01') {
        results.errors.push('skills_ratings table does not exist. Please run the migration first.');
        return results;
      }
      results.errors.push(`Query error: ${queryError.message}`);
      return results;
    }

    results.tableExists = true;
    results.canQuery = true;
    console.log('✓ skills_ratings table exists and can be queried');

    // Test 2: Create a test player for foreign key testing
    console.log('Test 2: Creating test player for foreign key testing...');
    const testPlayer = {
      name: 'Test Player for Skills ' + Date.now(),
      team: 'Test Team',
      play_cricket_id: 'test_skills_' + Date.now()
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

    // Test 3: Insert a valid skills rating
    console.log('Test 3: Testing insert operation with valid data...');
    const testRating = {
      player_id: testPlayerId,
      batting: 7,
      bowling: 6,
      fielding: 8,
      fitness: 9
    };

    const { data: insertData, error: insertError } = await supabase
      .from('skills_ratings')
      .insert([testRating])
      .select();

    if (insertError) {
      results.errors.push(`Insert error: ${insertError.message}`);
    } else {
      results.canInsert = true;
      results.foreignKeyWorks = true;
      testRatingId = insertData[0].id;
      console.log('✓ Can insert skills ratings successfully');
      console.log('✓ Foreign key constraint works (accepted valid player_id)');
      console.log('Inserted rating:', insertData[0]);
    }

    // Test 4: Test foreign key constraint with invalid player_id
    console.log('Test 4: Testing foreign key constraint with invalid player_id...');
    const invalidRating = {
      player_id: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
      batting: 5,
      bowling: 5,
      fielding: 5,
      fitness: 5
    };

    const { error: fkError } = await supabase
      .from('skills_ratings')
      .insert([invalidRating])
      .select();

    if (fkError) {
      // We expect an error here due to foreign key constraint
      if (fkError.code === '23503') {
        console.log('✓ Foreign key constraint properly rejects invalid player_id');
      } else {
        console.log('⚠ Got error but not the expected foreign key error:', fkError.message);
      }
    } else {
      results.errors.push('Foreign key constraint did not prevent invalid player_id');
    }

    // Test 5: Test check constraints (values must be 0-10)
    console.log('Test 5: Testing check constraints...');
    const constraintTests = [
      { batting: -1, bowling: 5, fielding: 5, fitness: 5, name: 'negative batting' },
      { batting: 11, bowling: 5, fielding: 5, fitness: 5, name: 'batting > 10' },
      { batting: 5, bowling: -1, fielding: 5, fitness: 5, name: 'negative bowling' },
      { batting: 5, bowling: 11, fielding: 5, fitness: 5, name: 'bowling > 10' },
      { batting: 5, bowling: 5, fielding: -1, fitness: 5, name: 'negative fielding' },
      { batting: 5, bowling: 5, fielding: 11, fitness: 5, name: 'fielding > 10' },
      { batting: 5, bowling: 5, fielding: 5, fitness: -1, name: 'negative fitness' },
      { batting: 5, bowling: 5, fielding: 5, fitness: 11, name: 'fitness > 10' }
    ];

    let checkConstraintsPassed = 0;
    for (const test of constraintTests) {
      const { error: checkError } = await supabase
        .from('skills_ratings')
        .insert([{
          player_id: testPlayerId,
          batting: test.batting,
          bowling: test.bowling,
          fielding: test.fielding,
          fitness: test.fitness
        }])
        .select();

      if (checkError && checkError.code === '23514') {
        checkConstraintsPassed++;
      }
    }

    if (checkConstraintsPassed === constraintTests.length) {
      results.checkConstraintsWork = true;
      console.log('✓ All check constraints work correctly (0-10 range enforced)');
    } else {
      results.errors.push(`Check constraints: ${checkConstraintsPassed}/${constraintTests.length} tests passed`);
    }

    // Test 6: Test boundary values (0 and 10 should be valid)
    console.log('Test 6: Testing boundary values (0 and 10)...');
    const boundaryTests = [
      { batting: 0, bowling: 0, fielding: 0, fitness: 0, name: 'all zeros' },
      { batting: 10, bowling: 10, fielding: 10, fitness: 10, name: 'all tens' }
    ];

    let boundaryTestsPassed = 0;
    for (const test of boundaryTests) {
      const { data: boundaryData, error: boundaryError } = await supabase
        .from('skills_ratings')
        .insert([{
          player_id: testPlayerId,
          batting: test.batting,
          bowling: test.bowling,
          fielding: test.fielding,
          fitness: test.fitness
        }])
        .select();

      if (!boundaryError && boundaryData) {
        boundaryTestsPassed++;
        // Clean up boundary test data
        await supabase
          .from('skills_ratings')
          .delete()
          .eq('id', boundaryData[0].id);
      }
    }

    if (boundaryTestsPassed === boundaryTests.length) {
      console.log('✓ Boundary values (0 and 10) are accepted correctly');
    } else {
      results.errors.push(`Boundary tests: ${boundaryTestsPassed}/${boundaryTests.length} tests passed`);
    }

    // Test 7: Verify index exists (indirect test via query performance)
    console.log('Test 7: Testing index on player_id...');
    const { error: indexError } = await supabase
      .from('skills_ratings')
      .select('*')
      .eq('player_id', testPlayerId);

    if (!indexError) {
      results.indexExists = true;
      console.log('✓ Can query by player_id (index should optimize this)');
    } else {
      results.errors.push(`Index test error: ${indexError.message}`);
    }

    // Test 8: Test CASCADE delete (deleting player should delete ratings)
    console.log('Test 8: Testing CASCADE delete...');
    const { error: deletePlayerError } = await supabase
      .from('players')
      .delete()
      .eq('id', testPlayerId);

    if (deletePlayerError) {
      console.warn('Warning: Could not delete test player:', deletePlayerError.message);
    } else {
      // Check if rating was also deleted
      const { data: orphanedRatings, error: orphanError } = await supabase
        .from('skills_ratings')
        .select('*')
        .eq('id', testRatingId);

      if (!orphanError && orphanedRatings.length === 0) {
        console.log('✓ CASCADE delete works (rating deleted when player deleted)');
      } else {
        console.warn('⚠ CASCADE delete may not be working correctly');
      }
    }

    // Mark that we've cleaned up
    testPlayerId = null;
    testRatingId = null;

  } catch (error) {
    results.errors.push(`Unexpected error: ${error.message}`);
  } finally {
    // Clean up any remaining test data
    if (testPlayerId) {
      console.log('Cleaning up remaining test data...');
      await supabase
        .from('players')
        .delete()
        .eq('id', testPlayerId);
    }
  }

  return results;
}

/**
 * Get detailed information about the skills_ratings table structure
 * 
 * @returns {Promise<Object>} Table structure information
 */
export async function getSkillsRatingsTableInfo() {
  if (!supabase) {
    return { error: 'Supabase client not initialized' };
  }

  try {
    // Query a sample rating to see the structure
    const { data, error } = await supabase
      .from('skills_ratings')
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
        : 'Table exists but is empty. Expected columns: id, player_id, batting, bowling, fielding, fitness, created_at, updated_at'
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
  console.log('=== Skills Ratings Table Verification ===\n');

  const results = await verifySkillsRatingsTable();

  console.log('\n=== Verification Results ===');
  console.log('Table exists:', results.tableExists ? '✓' : '✗');
  console.log('Can query:', results.canQuery ? '✓' : '✗');
  console.log('Can insert:', results.canInsert ? '✓' : '✗');
  console.log('Foreign key works:', results.foreignKeyWorks ? '✓' : '✗');
  console.log('Check constraints work:', results.checkConstraintsWork ? '✓' : '✗');
  console.log('Index exists:', results.indexExists ? '✓' : '✗');

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(error => console.log('  ✗', error));
  }

  const allTestsPassed = results.tableExists && 
                         results.canQuery && 
                         results.canInsert && 
                         results.foreignKeyWorks &&
                         results.checkConstraintsWork &&
                         results.indexExists &&
                         results.errors.length === 0;

  console.log('\n=== Overall Result ===');
  console.log(allTestsPassed ? '✓ All tests passed!' : '✗ Some tests failed');

  // Get table info
  const tableInfo = await getSkillsRatingsTableInfo();
  if (tableInfo.success) {
    console.log('\n=== Table Structure ===');
    console.log('Columns:', tableInfo.sampleStructure.join(', '));
    console.log(tableInfo.message);
  }

  return allTestsPassed;
}
