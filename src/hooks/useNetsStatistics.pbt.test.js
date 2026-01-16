/**
 * Property-Based Tests for Nets Statistics Persistence
 * 
 * Feature: supabase-player-sync
 * Property 7: Data Persistence Round Trip
 * 
 * **Validates: Requirements 5.3**
 * 
 * For any valid nets statistic update, after persisting to the database and 
 * re-fetching, the retrieved data should match the original update.
 */

import fc from 'fast-check';
import { supabase } from '../lib/supabase';

describe('Property 7: Data Persistence Round Trip - Nets Statistics', () => {
  // Helper function to create a test player
  async function createTestPlayer(name) {
    const { data, error } = await supabase
      .from('players')
      .insert({ name, team: 'Test Team' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Helper function to create a test session
  async function createTestSession(date) {
    const { data, error } = await supabase
      .from('nets_sessions')
      .insert({ session_date: date, session_name: 'Test session' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Helper function to clean up test data
  async function cleanupTestData(playerId, sessionId) {
    // Delete nets statistics first (foreign key constraint)
    await supabase
      .from('nets_statistics')
      .delete()
      .eq('session_id', sessionId);
    
    // Delete session
    await supabase
      .from('nets_sessions')
      .delete()
      .eq('id', sessionId);
    
    // Delete player
    await supabase
      .from('players')
      .delete()
      .eq('id', playerId);
  }

  // Helper function to update nets statistic
  async function updateNetsStatistic(sessionId, playerId, stats) {
    // Check if statistic exists
    const { data: existingStat } = await supabase
      .from('nets_statistics')
      .select('id')
      .eq('session_id', sessionId)
      .eq('player_id', playerId)
      .single();

    if (existingStat) {
      // Update existing
      const { data, error } = await supabase
        .from('nets_statistics')
        .update({
          ...stats,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('player_id', playerId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('nets_statistics')
        .insert({
          session_id: sessionId,
          player_id: playerId,
          attended: false,
          dismissals: 0,
          wickets: 0,
          extras: 0,
          ...stats
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }

  // Helper function to fetch nets statistic
  async function getNetsStatistic(sessionId, playerId) {
    const { data, error } = await supabase
      .from('nets_statistics')
      .select('*')
      .eq('session_id', sessionId)
      .eq('player_id', playerId)
      .single();
    
    if (error) throw error;
    return data;
  }

  test('Property 7: Nets statistics persistence round trip', async () => {
    // Skip if Supabase is not configured
    if (!supabase) {
      console.log('Skipping property test: Supabase not configured');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          attended: fc.boolean(),
          dismissals: fc.integer({ min: 0, max: 20 }),
          wickets: fc.integer({ min: 0, max: 20 }),
          extras: fc.integer({ min: 0, max: 20 })
        }),
        async (statistic) => {
          let player = null;
          let session = null;
          
          try {
            // Create test data
            player = await createTestPlayer(`Test Player ${Date.now()}`);
            session = await createTestSession('2024-01-15');
            
            // Persist statistic to database
            await updateNetsStatistic(session.id, player.id, statistic);
            
            // Fetch statistic from database
            const retrieved = await getNetsStatistic(session.id, player.id);
            
            // Verify round trip - all statistic values should match
            expect(retrieved.attended).toBe(statistic.attended);
            expect(retrieved.dismissals).toBe(statistic.dismissals);
            expect(retrieved.wickets).toBe(statistic.wickets);
            expect(retrieved.extras).toBe(statistic.extras);
            expect(retrieved.session_id).toBe(session.id);
            expect(retrieved.player_id).toBe(player.id);
          } finally {
            // Clean up test data
            if (player && session) {
              await cleanupTestData(player.id, session.id);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for property test
});
