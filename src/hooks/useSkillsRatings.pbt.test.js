/**
 * Property-Based Tests for Skills Rating Persistence
 * 
 * Feature: supabase-player-sync
 * Property 7: Data Persistence Round Trip
 * 
 * **Validates: Requirements 5.2**
 * 
 * For any valid skills rating update, after persisting to the database and 
 * re-fetching, the retrieved data should match the original update.
 */

import fc from 'fast-check';
import { supabase } from '../lib/supabase';

describe('Property 7: Data Persistence Round Trip - Skills Ratings', () => {
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

  // Helper function to clean up test data
  async function cleanupTestPlayer(playerId) {
    // Delete skills ratings first (foreign key constraint)
    await supabase
      .from('skills_ratings')
      .delete()
      .eq('player_id', playerId);
    
    // Delete player
    await supabase
      .from('players')
      .delete()
      .eq('id', playerId);
  }

  // Helper function to update skills rating
  async function updateSkillsRating(playerId, ratings) {
    // Check if rating exists
    const { data: existingRating } = await supabase
      .from('skills_ratings')
      .select('id')
      .eq('player_id', playerId)
      .single();

    if (existingRating) {
      // Update existing
      const { data, error } = await supabase
        .from('skills_ratings')
        .update({
          ...ratings,
          updated_at: new Date().toISOString()
        })
        .eq('player_id', playerId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('skills_ratings')
        .insert({
          player_id: playerId,
          batting: 0,
          bowling: 0,
          fielding: 0,
          fitness: 0,
          ...ratings
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }

  // Helper function to fetch skills rating
  async function getSkillsRating(playerId) {
    const { data, error } = await supabase
      .from('skills_ratings')
      .select('*')
      .eq('player_id', playerId)
      .single();
    
    if (error) throw error;
    return data;
  }

  test('Property 7: Skills rating persistence round trip', async () => {
    // Skip if Supabase is not configured
    if (!supabase) {
      console.log('Skipping property test: Supabase not configured');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          batting: fc.integer({ min: 0, max: 10 }),
          bowling: fc.integer({ min: 0, max: 10 }),
          fielding: fc.integer({ min: 0, max: 10 }),
          fitness: fc.integer({ min: 0, max: 10 })
        }),
        async (rating) => {
          let player = null;
          
          try {
            // Create a test player
            player = await createTestPlayer(`Test Player ${Date.now()}`);
            
            // Persist rating to database
            await updateSkillsRating(player.id, rating);
            
            // Fetch rating from database
            const retrieved = await getSkillsRating(player.id);
            
            // Verify round trip - all rating values should match
            expect(retrieved.batting).toBe(rating.batting);
            expect(retrieved.bowling).toBe(rating.bowling);
            expect(retrieved.fielding).toBe(rating.fielding);
            expect(retrieved.fitness).toBe(rating.fitness);
            expect(retrieved.player_id).toBe(player.id);
          } finally {
            // Clean up test data
            if (player) {
              await cleanupTestPlayer(player.id);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for property test
});
