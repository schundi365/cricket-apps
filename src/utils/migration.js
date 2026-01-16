/**
 * Migration Utility
 * 
 * This module provides functionality to migrate hardcoded player data
 * to Supabase database.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { supabase } from '../lib/supabase';

/**
 * @typedef {Object} MigrationResult
 * @property {number} playersInserted - Number of players successfully inserted
 * @property {number} ratingsInserted - Number of ratings successfully inserted
 * @property {number} statisticsInserted - Number of statistics successfully inserted
 * @property {string[]} errors - Array of error messages encountered during migration
 */

/**
 * Migrate hardcoded player data to Supabase
 * 
 * This function accepts hardcoded player data, ratings, and statistics
 * and migrates them to the Supabase database. It handles duplicates
 * gracefully using upsert operations.
 * 
 * @param {Array<Object>} players - Array of player objects with name, team, etc.
 * @param {Array<Object>} ratings - Array of skills rating objects
 * @param {Array<Object>} statistics - Array of nets statistics objects
 * @returns {Promise<MigrationResult>} Migration result with counts and errors
 */
export async function migrateHardcodedData(players = [], ratings = [], statistics = []) {
  const result = {
    playersInserted: 0,
    ratingsInserted: 0,
    statisticsInserted: 0,
    errors: []
  };

  if (!supabase) {
    result.errors.push('Supabase client not initialized');
    return result;
  }

  try {
    // Step 1: Migrate players using upsert to handle duplicates
    if (players.length > 0) {
      const { data: insertedPlayers, error: playersError } = await supabase
        .from('players')
        .upsert(
          players.map(player => ({
            name: player.name,
            team: player.team || null,
            play_cricket_id: player.play_cricket_id || null
          })),
          { 
            onConflict: 'name',
            ignoreDuplicates: false 
          }
        )
        .select();

      if (playersError) {
        result.errors.push(`Players migration error: ${playersError.message}`);
      } else {
        result.playersInserted = insertedPlayers?.length || 0;
      }
    }

    // Step 2: Migrate skills ratings
    // First, we need to get player IDs to link ratings
    if (ratings.length > 0) {
      const { data: allPlayers, error: fetchError } = await supabase
        .from('players')
        .select('id, name');

      if (fetchError) {
        result.errors.push(`Failed to fetch players for ratings: ${fetchError.message}`);
      } else {
        // Create a map of player names to IDs
        const playerNameToId = new Map(
          allPlayers.map(p => [p.name, p.id])
        );

        // Prepare ratings with player_id
        const ratingsToInsert = ratings
          .map(rating => {
            const playerId = playerNameToId.get(rating.playerName);
            if (!playerId) {
              result.errors.push(`Player not found for rating: ${rating.playerName}`);
              return null;
            }
            return {
              player_id: playerId,
              batting: rating.batting || 0,
              bowling: rating.bowling || 0,
              fielding: rating.fielding || 0,
              fitness: rating.fitness || 0
            };
          })
          .filter(r => r !== null);

        if (ratingsToInsert.length > 0) {
          const { data: insertedRatings, error: ratingsError } = await supabase
            .from('skills_ratings')
            .insert(ratingsToInsert)
            .select();

          if (ratingsError) {
            result.errors.push(`Ratings migration error: ${ratingsError.message}`);
          } else {
            result.ratingsInserted = insertedRatings?.length || 0;
          }
        }
      }
    }

    // Step 3: Migrate nets statistics
    // Need to link to both session_id and player_id
    if (statistics.length > 0) {
      const { data: allPlayers, error: fetchPlayersError } = await supabase
        .from('players')
        .select('id, name');

      if (fetchPlayersError) {
        result.errors.push(`Failed to fetch players for statistics: ${fetchPlayersError.message}`);
      } else {
        const playerNameToId = new Map(
          allPlayers.map(p => [p.name, p.id])
        );

        // Prepare statistics with player_id and session_id
        const statisticsToInsert = statistics
          .map(stat => {
            const playerId = playerNameToId.get(stat.playerName);
            if (!playerId) {
              result.errors.push(`Player not found for statistic: ${stat.playerName}`);
              return null;
            }
            return {
              session_id: stat.session_id,
              player_id: playerId,
              attended: stat.attended || false,
              dismissals: stat.dismissals || 0,
              wickets: stat.wickets || 0,
              extras: stat.extras || 0
            };
          })
          .filter(s => s !== null);

        if (statisticsToInsert.length > 0) {
          const { data: insertedStatistics, error: statisticsError } = await supabase
            .from('nets_statistics')
            .insert(statisticsToInsert)
            .select();

          if (statisticsError) {
            result.errors.push(`Statistics migration error: ${statisticsError.message}`);
          } else {
            result.statisticsInserted = insertedStatistics?.length || 0;
          }
        }
      }
    }

  } catch (error) {
    result.errors.push(`Unexpected migration error: ${error.message}`);
  }

  return result;
}
