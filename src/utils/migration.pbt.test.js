/**
 * Property-Based Tests for Migration Utility
 * 
 * Feature: supabase-player-sync
 * 
 * Property 5: Migration Data Preservation
 * Property 6: Duplicate Player Handling
 * 
 * Validates: Requirements 4.2, 4.3, 4.4, 4.5
 */

import fc from 'fast-check';
import { migrateHardcodedData } from './migration';
import { supabase } from '../lib/supabase';

// Helper to clean up test data
async function cleanupTestData() {
  if (!supabase) return;
  
  try {
    // Delete in reverse order of foreign key dependencies
    await supabase.from('nets_statistics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('skills_ratings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

beforeEach(async () => {
  await cleanupTestData();
});

afterEach(async () => {
  await cleanupTestData();
});

describe('Property 5: Migration Data Preservation', () => {
  test('Property 5.1: All migrated players can be retrieved from database', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0),
            team: fc.option(fc.constantFrom('1st XI', '2nd XI', '3rd XI', 'Sunday XI'), { nil: null })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (players) => {
          // Ensure unique player names
          const uniquePlayers = Array.from(
            new Map(players.map(p => [p.name, p])).values()
          );

          // Migrate players
          const result = await migrateHardcodedData(uniquePlayers, [], []);

          // Verify no errors
          expect(result.errors.length).toBe(0);
          expect(result.playersInserted).toBe(uniquePlayers.length);

          // Retrieve players from database
          const { data: retrievedPlayers, error } = await supabase
            .from('players')
            .select('name, team')
            .in('name', uniquePlayers.map(p => p.name));

          expect(error).toBeNull();
          expect(retrievedPlayers.length).toBe(uniquePlayers.length);

          // Verify each player's data is preserved
          uniquePlayers.forEach(originalPlayer => {
            const retrieved = retrievedPlayers.find(p => p.name === originalPlayer.name);
            expect(retrieved).toBeDefined();
            expect(retrieved.team).toBe(originalPlayer.team);
          });
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  test('Property 5.2: All migrated ratings can be retrieved from database', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0),
            team: fc.option(fc.constantFrom('1st XI', '2nd XI'), { nil: null })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (players) => {
          // Ensure unique player names
          const uniquePlayers = Array.from(
            new Map(players.map(p => [p.name, p])).values()
          );

          // Create ratings for each player
          const ratings = uniquePlayers.map(player => ({
            playerName: player.name,
            batting: Math.floor(Math.random() * 11),
            bowling: Math.floor(Math.random() * 11),
            fielding: Math.floor(Math.random() * 11),
            fitness: Math.floor(Math.random() * 11)
          }));

          // Migrate players and ratings
          const result = await migrateHardcodedData(uniquePlayers, ratings, []);

          // Verify no errors
          expect(result.errors.length).toBe(0);
          expect(result.ratingsInserted).toBe(ratings.length);

          // Retrieve ratings from database
          const { data: retrievedRatings, error } = await supabase
            .from('skills_ratings')
            .select('*, players!inner(name)')
            .in('players.name', uniquePlayers.map(p => p.name));

          expect(error).toBeNull();
          expect(retrievedRatings.length).toBe(ratings.length);

          // Verify each rating's data is preserved
          ratings.forEach(originalRating => {
            const retrieved = retrievedRatings.find(
              r => r.players.name === originalRating.playerName
            );
            expect(retrieved).toBeDefined();
            expect(retrieved.batting).toBe(originalRating.batting);
            expect(retrieved.bowling).toBe(originalRating.bowling);
            expect(retrieved.fielding).toBe(originalRating.fielding);
            expect(retrieved.fitness).toBe(originalRating.fitness);
          });
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  test('Property 5.3: All migrated statistics can be retrieved from database', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0),
            team: fc.option(fc.constantFrom('1st XI', '2nd XI'), { nil: null })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (players) => {
          // Ensure unique player names
          const uniquePlayers = Array.from(
            new Map(players.map(p => [p.name, p])).values()
          );

          // Create a test session first
          const { data: session, error: sessionError } = await supabase
            .from('nets_sessions')
            .insert({ date: new Date().toISOString().split('T')[0] })
            .select()
            .single();

          expect(sessionError).toBeNull();
          expect(session).toBeDefined();

          // Create statistics for each player
          const statistics = uniquePlayers.map(player => ({
            playerName: player.name,
            session_id: session.id,
            attended: Math.random() > 0.5,
            dismissals: Math.floor(Math.random() * 10),
            wickets: Math.floor(Math.random() * 10),
            extras: Math.floor(Math.random() * 10)
          }));

          // Migrate players and statistics
          const result = await migrateHardcodedData(uniquePlayers, [], statistics);

          // Verify no errors
          expect(result.errors.length).toBe(0);
          expect(result.statisticsInserted).toBe(statistics.length);

          // Retrieve statistics from database
          const { data: retrievedStats, error } = await supabase
            .from('nets_statistics')
            .select('*, players!inner(name)')
            .eq('session_id', session.id)
            .in('players.name', uniquePlayers.map(p => p.name));

          expect(error).toBeNull();
          expect(retrievedStats.length).toBe(statistics.length);

          // Verify each statistic's data is preserved
          statistics.forEach(originalStat => {
            const retrieved = retrievedStats.find(
              s => s.players.name === originalStat.playerName
            );
            expect(retrieved).toBeDefined();
            expect(retrieved.attended).toBe(originalStat.attended);
            expect(retrieved.dismissals).toBe(originalStat.dismissals);
            expect(retrieved.wickets).toBe(originalStat.wickets);
            expect(retrieved.extras).toBe(originalStat.extras);
          });
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);
});

describe('Property 6: Duplicate Player Handling', () => {
  test('Property 6.1: Duplicate players are handled without errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0),
          team: fc.constantFrom('1st XI', '2nd XI', '3rd XI')
        }),
        async (player) => {
          // First migration
          const result1 = await migrateHardcodedData([player], [], []);
          expect(result1.errors.length).toBe(0);
          expect(result1.playersInserted).toBe(1);

          // Second migration with same player (duplicate)
          const result2 = await migrateHardcodedData([player], [], []);
          
          // Should not cause errors (upsert handles duplicates)
          expect(result2.errors.length).toBe(0);

          // Verify only one player exists in database
          const { data: players, error } = await supabase
            .from('players')
            .select('*')
            .eq('name', player.name);

          expect(error).toBeNull();
          expect(players.length).toBe(1);
          expect(players[0].name).toBe(player.name);
          expect(players[0].team).toBe(player.team);
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  test('Property 6.2: Duplicate players with different teams update existing record', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0),
          team1: fc.constantFrom('1st XI', '2nd XI'),
          team2: fc.constantFrom('3rd XI', 'Sunday XI')
        }),
        async ({ name, team1, team2 }) => {
          // First migration with team1
          const result1 = await migrateHardcodedData([{ name, team: team1 }], [], []);
          expect(result1.errors.length).toBe(0);

          // Second migration with same player but different team
          const result2 = await migrateHardcodedData([{ name, team: team2 }], [], []);
          expect(result2.errors.length).toBe(0);

          // Verify only one player exists with updated team
          const { data: players, error } = await supabase
            .from('players')
            .select('*')
            .eq('name', name);

          expect(error).toBeNull();
          expect(players.length).toBe(1);
          expect(players[0].name).toBe(name);
          expect(players[0].team).toBe(team2); // Should have the updated team
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  test('Property 6.3: Multiple duplicate players in same migration are handled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0),
          team: fc.constantFrom('1st XI', '2nd XI')
        }),
        fc.integer({ min: 2, max: 5 }),
        async (player, duplicateCount) => {
          // Create array with duplicate players
          const duplicatePlayers = Array(duplicateCount).fill(player);

          // Migrate duplicates
          const result = await migrateHardcodedData(duplicatePlayers, [], []);

          // Should handle duplicates without critical errors
          // (may have some errors logged but should not crash)
          expect(result.playersInserted).toBeGreaterThanOrEqual(1);

          // Verify only one player exists in database
          const { data: players, error } = await supabase
            .from('players')
            .select('*')
            .eq('name', player.name);

          expect(error).toBeNull();
          expect(players.length).toBe(1);
          expect(players[0].name).toBe(player.name);
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  test('Property 6.4: Existing players are not duplicated on re-migration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0),
            team: fc.constantFrom('1st XI', '2nd XI', '3rd XI')
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (players) => {
          // Ensure unique player names
          const uniquePlayers = Array.from(
            new Map(players.map(p => [p.name, p])).values()
          );

          // First migration
          const result1 = await migrateHardcodedData(uniquePlayers, [], []);
          expect(result1.errors.length).toBe(0);
          expect(result1.playersInserted).toBe(uniquePlayers.length);

          // Get count after first migration
          const { count: count1, error: error1 } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .in('name', uniquePlayers.map(p => p.name));

          expect(error1).toBeNull();

          // Second migration with same players
          const result2 = await migrateHardcodedData(uniquePlayers, [], []);
          expect(result2.errors.length).toBe(0);

          // Get count after second migration
          const { count: count2, error: error2 } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .in('name', uniquePlayers.map(p => p.name));

          expect(error2).toBeNull();

          // Verify count hasn't increased (no duplicates created)
          expect(count2).toBe(count1);
          expect(count2).toBe(uniquePlayers.length);
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);
});
