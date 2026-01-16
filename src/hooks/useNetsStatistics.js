/**
 * useNetsStatistics Hook
 * 
 * Custom React hook for fetching and managing nets statistics from Supabase.
 * 
 * Requirements: 5.3, 7.1, 7.2, 7.5
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { retrySupabaseQuery } from '../utils/retry';
import { queueOperation, isOnline } from '../utils/offlineQueue';
import { shouldUpdate } from '../utils/conflictResolution';

/**
 * @typedef {import('../types').NetsStatistic} NetsStatistic
 */

/**
 * Hook to fetch and manage nets statistics for a specific session
 * 
 * @param {string} sessionId - The session ID to fetch statistics for
 * @returns {Object} Hook state and methods
 * @returns {NetsStatistic[]} statistics - Array of nets statistic objects
 * @returns {boolean} loading - Loading state
 * @returns {Error|null} error - Error object if fetch failed
 * @returns {Function} updateStatistic - Function to update a player's statistic
 * @returns {Function} refetch - Function to manually refetch statistics
 */
export function useNetsStatistics(sessionId) {
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistics = useCallback(async () => {
    // Check if Supabase client is initialized
    if (!supabase) {
      setError(new Error('Supabase client not initialized'));
      setLoading(false);
      return;
    }

    // Skip if no session ID provided
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await retrySupabaseQuery(async () => {
        return await supabase
          .from('nets_statistics')
          .select('*')
          .eq('session_id', sessionId);
      });

      if (fetchError) {
        throw fetchError;
      }

      setStatistics(data || []);
    } catch (err) {
      console.error('Error fetching nets statistics:', err);
      const userFriendlyError = new Error(
        'Unable to load nets statistics. Please check your connection and try again.'
      );
      userFriendlyError.originalError = err;
      setError(userFriendlyError);
      setStatistics([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  /**
   * Update a player's nets statistic with optimistic updates and offline queue
   * 
   * @param {string} playerId - The player's UUID
   * @param {Partial<NetsStatistic>} stats - Partial statistics object with fields to update
   * @returns {Promise<void>}
   */
  const updateStatistic = useCallback(async (playerId, stats) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    // Calculate technique_points and punctuality_points from boolean fields
    // Requirements: 5.8, 5.9, 5.10, 5.11
    const enhancedStats = { ...stats };
    if ('works_on_technique' in stats) {
      enhancedStats.technique_points = stats.works_on_technique ? 1 : 0;
    }
    if ('punctual_to_training' in stats) {
      enhancedStats.punctuality_points = stats.punctual_to_training ? 1 : 0;
    }

    // Get current statistic for optimistic update and rollback
    const currentStat = statistics.find(s => s.player_id === playerId);
    
    // Optimistic update - update UI immediately
    // Requirement 6.2: Include all new columns with appropriate defaults
    const optimisticStat = currentStat ? {
      // Preserve all existing fields including new columns
      ...currentStat,
      ...enhancedStats,
      updated_at: new Date().toISOString()
    } : {
      // Create new record with all required fields and defaults
      session_id: sessionId,
      player_id: playerId,
      nets_attended: false,
      dismissals: 0,
      wickets: 0,
      extras: 0,
      // Behavioral fields with defaults
      works_on_technique: false,
      punctual_to_training: false,
      // Points columns with defaults
      batting_points: 0,
      bowling_points: 0,
      fielding_points: 0,
      technique_points: 0,
      punctuality_points: 0,
      // session_date will be null initially (populated by trigger)
      session_date: null,
      // Apply the updates
      ...enhancedStats,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setStatistics(prev => {
      const index = prev.findIndex(s => s.player_id === playerId);
      if (index >= 0) {
        const newStats = [...prev];
        newStats[index] = optimisticStat;
        return newStats;
      } else {
        return [...prev, optimisticStat];
      }
    });

    // If offline, queue the operation with enhanced stats
    if (!isOnline()) {
      queueOperation({
        type: 'update_statistic',
        data: { sessionId, playerId, stats: enhancedStats },
        timestamp: Date.now()
      });
      return; // Keep optimistic update in UI
    }

    try {
      // Check if statistic exists for this player and session
      const { data: existingStat } = await retrySupabaseQuery(async () => {
        return await supabase
          .from('nets_statistics')
          .select('id')
          .eq('session_id', sessionId)
          .eq('player_id', playerId)
          .single();
      });

      let result;
      if (existingStat) {
        // Update existing statistic
        result = await retrySupabaseQuery(async () => {
          return await supabase
            .from('nets_statistics')
            .update({
              ...enhancedStats,
              updated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .eq('player_id', playerId)
            .select()
            .single();
        });
      } else {
        // Insert new statistic with all new columns and default values
        // Requirements: 5.1, 5.2, 5.3, 5.5
        result = await retrySupabaseQuery(async () => {
          return await supabase
            .from('nets_statistics')
            .insert({
              session_id: sessionId,
              player_id: playerId,
              // Use nets_attended instead of attended (Requirement 5.5)
              nets_attended: false,
              dismissals: 0,
              wickets: 0,
              extras: 0,
              // Behavioral fields (Requirement 5.3)
              works_on_technique: false,
              punctual_to_training: false,
              // Points columns (Requirement 5.2)
              batting_points: 0,
              bowling_points: 0,
              fielding_points: 0,
              technique_points: 0,
              punctuality_points: 0,
              // session_date will be populated by database trigger (Requirement 5.1)
              ...enhancedStats
            })
            .select()
            .single();
        });
      }

      if (result.error) {
        throw result.error;
      }

      // Apply last-write-wins: only update if remote is newer
      const currentStat = statistics.find(s => s.player_id === playerId);
      if (shouldUpdate(currentStat, result.data)) {
        setStatistics(prev => {
          const index = prev.findIndex(s => s.player_id === playerId);
          if (index >= 0) {
            const newStats = [...prev];
            newStats[index] = result.data;
            return newStats;
          } else {
            return [...prev, result.data];
          }
        });
      }
    } catch (err) {
      console.error('Error updating nets statistic:', err);
      
      // Revert optimistic update on error
      // Requirement 6.2: Rollback logic handles new columns correctly
      if (currentStat) {
        // Restore the original statistic with all its fields
        setStatistics(prev => {
          const index = prev.findIndex(s => s.player_id === playerId);
          if (index >= 0) {
            const newStats = [...prev];
            // Restore complete original record including all new columns
            newStats[index] = { ...currentStat };
            return newStats;
          }
          return prev;
        });
      } else {
        // Remove the optimistically added record
        setStatistics(prev => prev.filter(s => s.player_id !== playerId));
      }
      
      // Throw user-friendly error
      const userFriendlyError = new Error(
        'Unable to save nets statistic. Please check your connection and try again.'
      );
      userFriendlyError.originalError = err;
      throw userFriendlyError;
    }
  }, [sessionId, statistics]);

  // Fetch statistics when session ID changes
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    updateStatistic,
    refetch: fetchStatistics
  };
}
