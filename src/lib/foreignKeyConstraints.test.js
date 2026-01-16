/**
 * Property-Based Tests for Foreign Key Constraints
 * 
 * Feature: supabase-player-sync
 * Property 1: Foreign Key Referential Integrity
 * 
 * **Validates: Requirements 2.5**
 * 
 * For any attempt to insert or update a record with a foreign key reference,
 * the operation should succeed if the referenced record exists, and fail with
 * a constraint violation if the referenced record does not exist.
 */

import fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';

// For testing foreign key constraints, we need to bypass RLS
// Use service role key if available, otherwise skip tests
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a service role client that bypasses RLS for testing
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Helper to generate valid UUIDs for testing
const uuidArbitrary = fc.uuid();

// Helper to generate valid skill ratings (0-10)
const ratingArbitrary = fc.integer({ min: 0, max: 10 });

// Helper to generate valid player data with unique names
const playerArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => s.trim().length > 0)
    .map(s => `test_${Date.now()}_${Math.random().toString(36).substring(7)}_${s}`), // Ensure unique names
  team: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), { nil: null })
});

// Helper to generate valid skills rating data (without player_id)
const skillsRatingDataArbitrary = fc.record({
  batting: ratingArbitrary,
  bowling: ratingArbitrary,
  fielding: ratingArbitrary,
  fitness: ratingArbitrary
});

// Helper to generate valid nets session data
const netsSessionArbitrary = fc.record({
  session_date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
    .map(d => d.toISOString().split('T')[0]), // Format as YYYY-MM-DD
  session_name: fc.option(fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0), { nil: null })
});

// Helper to generate valid nets statistics data (without foreign keys)
const netsStatisticsDataArbitrary = fc.record({
  attended: fc.boolean(),
  dismissals: fc.integer({ min: 0, max: 100 }),
  wickets: fc.integer({ min: 0, max: 100 }),
  extras: fc.integer({ min: 0, max: 100 })
});

describe('Property 1: Foreign Key Referential Integrity', () => {
  // Skip all tests if Supabase is not configured with service role key
  const skipTests = !supabase;

  beforeAll(() => {
    if (skipTests) {
      console.log('Skipping foreign key property tests - Supabase service role key not configured');
      console.log('To run these tests, add REACT_APP_SUPABASE_SERVICE_ROLE_KEY to your .env file');
      console.log('Get the service role key from: https://supabase.com/dashboard/project/_/settings/api');
    }
  });

  describe('skills_ratings foreign key to players', () => {
    (skipTests ? it.skip : it)('should succeed when inserting with valid player_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          playerArbitrary,
          skillsRatingDataArbitrary,
          async (playerData, ratingData) => {
            // Setup: Insert a player to get a valid player_id
            const { data: player, error: playerError } = await supabase
              .from('players')
              .insert(playerData)
              .select()
              .single();

            if (playerError) {
              throw new Error(`Failed to insert player: ${playerError.message}`);
            }

            try {
              // Test: Insert skills rating with valid player_id
              const { data: rating, error: ratingError } = await supabase
                .from('skills_ratings')
                .insert({
                  player_id: player.id,
                  ...ratingData
                })
                .select()
                .single();

              // Assert: Operation should succeed
              expect(ratingError).toBeNull();
              expect(rating).toBeDefined();
              expect(rating.player_id).toBe(player.id);
              expect(rating.batting).toBe(ratingData.batting);
              expect(rating.bowling).toBe(ratingData.bowling);
              expect(rating.fielding).toBe(ratingData.fielding);
              expect(rating.fitness).toBe(ratingData.fitness);

              // Cleanup: Delete the rating
              await supabase.from('skills_ratings').delete().eq('id', rating.id);
            } finally {
              // Cleanup: Delete the player (cascade will delete rating if still exists)
              await supabase.from('players').delete().eq('id', player.id);
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified // Minimum 100 iterations per property test
      );
    }, 120000); // 60 second timeout for property test

    (skipTests ? it.skip : it)('should fail when inserting with non-existent player_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary,
          skillsRatingDataArbitrary,
          async (nonExistentPlayerId, ratingData) => {
            // Ensure the player_id doesn't exist
            const { data: existingPlayer } = await supabase
              .from('players')
              .select('id')
              .eq('id', nonExistentPlayerId)
              .single();

            // Skip this test case if the UUID happens to exist
            if (existingPlayer) {
              return;
            }

            // Test: Attempt to insert skills rating with non-existent player_id
            const { data: rating, error: ratingError } = await supabase
              .from('skills_ratings')
              .insert({
                player_id: nonExistentPlayerId,
                ...ratingData
              })
              .select()
              .single();

            // Assert: Operation should fail with foreign key constraint violation
            expect(ratingError).toBeDefined();
            expect(ratingError.code).toBe('23503'); // PostgreSQL foreign key violation code
            expect(rating).toBeNull();
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    }, 120000);

    (skipTests ? it.skip : it)('should fail when updating to non-existent player_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          playerArbitrary,
          skillsRatingDataArbitrary,
          uuidArbitrary,
          async (playerData, ratingData, nonExistentPlayerId) => {
            // Setup: Insert a player and rating
            const { data: player, error: playerError } = await supabase
              .from('players')
              .insert(playerData)
              .select()
              .single();

            if (playerError) {
              throw new Error(`Failed to insert player: ${playerError.message}`);
            }

            const { data: rating, error: ratingError } = await supabase
              .from('skills_ratings')
              .insert({
                player_id: player.id,
                ...ratingData
              })
              .select()
              .single();

            if (ratingError) {
              await supabase.from('players').delete().eq('id', player.id);
              throw new Error(`Failed to insert rating: ${ratingError.message}`);
            }

            try {
              // Ensure the target player_id doesn't exist
              const { data: existingPlayer } = await supabase
                .from('players')
                .select('id')
                .eq('id', nonExistentPlayerId)
                .single();

              // Skip if the UUID happens to exist or is the same as current player
              if (existingPlayer || nonExistentPlayerId === player.id) {
                return;
              }

              // Test: Attempt to update rating to non-existent player_id
              const { error: updateError } = await supabase
                .from('skills_ratings')
                .update({ player_id: nonExistentPlayerId })
                .eq('id', rating.id);

              // Assert: Operation should fail with foreign key constraint violation
              expect(updateError).toBeDefined();
              expect(updateError.code).toBe('23503');
            } finally {
              // Cleanup
              await supabase.from('players').delete().eq('id', player.id);
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    }, 120000);
  });

  describe('nets_statistics foreign key to players', () => {
    (skipTests ? it.skip : it)('should succeed when inserting with valid player_id and session_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          playerArbitrary,
          netsSessionArbitrary,
          netsStatisticsDataArbitrary,
          async (playerData, sessionData, statsData) => {
            // Setup: Insert player and session
            const { data: player, error: playerError } = await supabase
              .from('players')
              .insert(playerData)
              .select()
              .single();

            if (playerError) {
              throw new Error(`Failed to insert player: ${playerError.message}`);
            }

            const { data: session, error: sessionError } = await supabase
              .from('nets_sessions')
              .insert(sessionData)
              .select()
              .single();

            if (sessionError) {
              await supabase.from('players').delete().eq('id', player.id);
              throw new Error(`Failed to insert session: ${sessionError.message}`);
            }

            try {
              // Test: Insert nets statistics with valid foreign keys
              const { data: stats, error: statsError } = await supabase
                .from('nets_statistics')
                .insert({
                  player_id: player.id,
                  session_id: session.id,
                  ...statsData
                })
                .select()
                .single();

              // Assert: Operation should succeed
              expect(statsError).toBeNull();
              expect(stats).toBeDefined();
              expect(stats.player_id).toBe(player.id);
              expect(stats.session_id).toBe(session.id);
              expect(stats.attended).toBe(statsData.attended);
              expect(stats.dismissals).toBe(statsData.dismissals);
              expect(stats.wickets).toBe(statsData.wickets);
              expect(stats.extras).toBe(statsData.extras);

              // Cleanup: Delete the stats
              await supabase.from('nets_statistics').delete().eq('id', stats.id);
            } finally {
              // Cleanup
              await supabase.from('nets_sessions').delete().eq('id', session.id);
              await supabase.from('players').delete().eq('id', player.id);
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    }, 120000);

    (skipTests ? it.skip : it)('should fail when inserting with non-existent player_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary,
          netsSessionArbitrary,
          netsStatisticsDataArbitrary,
          async (nonExistentPlayerId, sessionData, statsData) => {
            // Setup: Insert session
            const { data: session, error: sessionError } = await supabase
              .from('nets_sessions')
              .insert(sessionData)
              .select()
              .single();

            if (sessionError) {
              throw new Error(`Failed to insert session: ${sessionError.message}`);
            }

            try {
              // Ensure the player_id doesn't exist
              const { data: existingPlayer } = await supabase
                .from('players')
                .select('id')
                .eq('id', nonExistentPlayerId)
                .single();

              // Skip if the UUID happens to exist
              if (existingPlayer) {
                return;
              }

              // Test: Attempt to insert with non-existent player_id
              const { data: stats, error: statsError } = await supabase
                .from('nets_statistics')
                .insert({
                  player_id: nonExistentPlayerId,
                  session_id: session.id,
                  ...statsData
                })
                .select()
                .single();

              // Assert: Operation should fail with foreign key constraint violation
              expect(statsError).toBeDefined();
              expect(statsError.code).toBe('23503');
              expect(stats).toBeNull();
            } finally {
              // Cleanup
              await supabase.from('nets_sessions').delete().eq('id', session.id);
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    }, 120000);

    (skipTests ? it.skip : it)('should fail when inserting with non-existent session_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          playerArbitrary,
          uuidArbitrary,
          netsStatisticsDataArbitrary,
          async (playerData, nonExistentSessionId, statsData) => {
            // Setup: Insert player
            const { data: player, error: playerError } = await supabase
              .from('players')
              .insert(playerData)
              .select()
              .single();

            if (playerError) {
              throw new Error(`Failed to insert player: ${playerError.message}`);
            }

            try {
              // Ensure the session_id doesn't exist
              const { data: existingSession } = await supabase
                .from('nets_sessions')
                .select('id')
                .eq('id', nonExistentSessionId)
                .single();

              // Skip if the UUID happens to exist
              if (existingSession) {
                return;
              }

              // Test: Attempt to insert with non-existent session_id
              const { data: stats, error: statsError } = await supabase
                .from('nets_statistics')
                .insert({
                  player_id: player.id,
                  session_id: nonExistentSessionId,
                  ...statsData
                })
                .select()
                .single();

              // Assert: Operation should fail with foreign key constraint violation
              expect(statsError).toBeDefined();
              expect(statsError.code).toBe('23503');
              expect(stats).toBeNull();
            } finally {
              // Cleanup
              await supabase.from('players').delete().eq('id', player.id);
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    }, 120000);
  });

  describe('nets_statistics foreign key to nets_sessions', () => {
    (skipTests ? it.skip : it)('should fail when updating to non-existent session_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          playerArbitrary,
          netsSessionArbitrary,
          netsStatisticsDataArbitrary,
          uuidArbitrary,
          async (playerData, sessionData, statsData, nonExistentSessionId) => {
            // Setup: Insert player, session, and stats
            const { data: player, error: playerError } = await supabase
              .from('players')
              .insert(playerData)
              .select()
              .single();

            if (playerError) {
              throw new Error(`Failed to insert player: ${playerError.message}`);
            }

            const { data: session, error: sessionError } = await supabase
              .from('nets_sessions')
              .insert(sessionData)
              .select()
              .single();

            if (sessionError) {
              await supabase.from('players').delete().eq('id', player.id);
              throw new Error(`Failed to insert session: ${sessionError.message}`);
            }

            const { data: stats, error: statsError } = await supabase
              .from('nets_statistics')
              .insert({
                player_id: player.id,
                session_id: session.id,
                ...statsData
              })
              .select()
              .single();

            if (statsError) {
              await supabase.from('nets_sessions').delete().eq('id', session.id);
              await supabase.from('players').delete().eq('id', player.id);
              throw new Error(`Failed to insert stats: ${statsError.message}`);
            }

            try {
              // Ensure the target session_id doesn't exist
              const { data: existingSession } = await supabase
                .from('nets_sessions')
                .select('id')
                .eq('id', nonExistentSessionId)
                .single();

              // Skip if the UUID happens to exist or is the same as current session
              if (existingSession || nonExistentSessionId === session.id) {
                return;
              }

              // Test: Attempt to update to non-existent session_id
              const { error: updateError } = await supabase
                .from('nets_statistics')
                .update({ session_id: nonExistentSessionId })
                .eq('id', stats.id);

              // Assert: Operation should fail with foreign key constraint violation
              expect(updateError).toBeDefined();
              expect(updateError.code).toBe('23503');
            } finally {
              // Cleanup
              await supabase.from('nets_sessions').delete().eq('id', session.id);
              await supabase.from('players').delete().eq('id', player.id);
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    }, 120000);
  });

  describe('CASCADE DELETE behavior', () => {
    (skipTests ? it.skip : it)('should cascade delete skills_ratings when player is deleted', async () => {
      await fc.assert(
        fc.asyncProperty(
          playerArbitrary,
          skillsRatingDataArbitrary,
          async (playerData, ratingData) => {
            // Setup: Insert player and rating
            const { data: player, error: playerError } = await supabase
              .from('players')
              .insert(playerData)
              .select()
              .single();

            if (playerError) {
              throw new Error(`Failed to insert player: ${playerError.message}`);
            }

            const { data: rating, error: ratingError } = await supabase
              .from('skills_ratings')
              .insert({
                player_id: player.id,
                ...ratingData
              })
              .select()
              .single();

            if (ratingError) {
              await supabase.from('players').delete().eq('id', player.id);
              throw new Error(`Failed to insert rating: ${ratingError.message}`);
            }

            // Test: Delete the player
            const { error: deleteError } = await supabase
              .from('players')
              .delete()
              .eq('id', player.id);

            expect(deleteError).toBeNull();

            // Assert: Rating should be cascade deleted
            const { data: deletedRating, error: fetchError } = await supabase
              .from('skills_ratings')
              .select()
              .eq('id', rating.id)
              .single();

            expect(fetchError).toBeDefined();
            expect(fetchError.code).toBe('PGRST116'); // PostgREST "not found" code
            expect(deletedRating).toBeNull();
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    }, 120000);

    (skipTests ? it.skip : it)('should cascade delete nets_statistics when session is deleted', async () => {
      await fc.assert(
        fc.asyncProperty(
          playerArbitrary,
          netsSessionArbitrary,
          netsStatisticsDataArbitrary,
          async (playerData, sessionData, statsData) => {
            // Setup: Insert player, session, and stats
            const { data: player, error: playerError } = await supabase
              .from('players')
              .insert(playerData)
              .select()
              .single();

            if (playerError) {
              throw new Error(`Failed to insert player: ${playerError.message}`);
            }

            const { data: session, error: sessionError } = await supabase
              .from('nets_sessions')
              .insert(sessionData)
              .select()
              .single();

            if (sessionError) {
              await supabase.from('players').delete().eq('id', player.id);
              throw new Error(`Failed to insert session: ${sessionError.message}`);
            }

            const { data: stats, error: statsError } = await supabase
              .from('nets_statistics')
              .insert({
                player_id: player.id,
                session_id: session.id,
                ...statsData
              })
              .select()
              .single();

            if (statsError) {
              await supabase.from('nets_sessions').delete().eq('id', session.id);
              await supabase.from('players').delete().eq('id', player.id);
              throw new Error(`Failed to insert stats: ${statsError.message}`);
            }

            try {
              // Test: Delete the session
              const { error: deleteError } = await supabase
                .from('nets_sessions')
                .delete()
                .eq('id', session.id);

              expect(deleteError).toBeNull();

              // Assert: Stats should be cascade deleted
              const { data: deletedStats, error: fetchError } = await supabase
                .from('nets_statistics')
                .select()
                .eq('id', stats.id)
                .single();

              expect(fetchError).toBeDefined();
              expect(fetchError.code).toBe('PGRST116');
              expect(deletedStats).toBeNull();
            } finally {
              // Cleanup player
              await supabase.from('players').delete().eq('id', player.id);
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    }, 120000);
  });
});




