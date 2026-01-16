/**
 * useSkillsRatings Hook
 * 
 * Custom React hook for fetching and managing skills ratings from Supabase.
 * Implements optimistic updates for better UX.
 * 
 * Requirements: 5.2, 7.1, 7.2, 7.5
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { retrySupabaseQuery } from '../utils/retry';
import { queueOperation, isOnline } from '../utils/offlineQueue';
import { shouldUpdate } from '../utils/conflictResolution';

/**
 * @typedef {import('../types').SkillsRating} SkillsRating
 */

/**
 * Hook to fetch and manage skills ratings for all players
 * 
 * @returns {Object} Hook state and methods
 * @returns {Map<string, SkillsRating>} ratings - Map of player_id to skills rating object
 * @returns {boolean} loading - Loading state
 * @returns {Error|null} error - Error object if fetch failed
 * @returns {Function} updateRating - Function to update a player's rating
 */
export function useSkillsRatings() {
  const [ratings, setRatings] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRatings = useCallback(async () => {
    // Check if Supabase client is initialized
    if (!supabase) {
      setError(new Error('Supabase client not initialized'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await retrySupabaseQuery(async () => {
        return await supabase
          .from('skills_ratings')
          .select('*');
      });

      if (fetchError) {
        throw fetchError;
      }

      // Convert array to Map for efficient lookups by player_id
      const ratingsMap = new Map();
      (data || []).forEach(rating => {
        ratingsMap.set(rating.player_id, rating);
      });

      setRatings(ratingsMap);
    } catch (err) {
      console.error('Error fetching skills ratings:', err);
      const userFriendlyError = new Error(
        'Unable to load skills ratings. Please check your connection and try again.'
      );
      userFriendlyError.originalError = err;
      setError(userFriendlyError);
      setRatings(new Map());
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update a player's skills rating with optimistic updates and offline queue
   * 
   * @param {string} playerId - The player's UUID
   * @param {Object} newRatings - Partial ratings object with fields to update
   * @returns {Promise<void>}
   */
  const updateRating = useCallback(async (playerId, newRatings) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Get current rating for optimistic update and rollback
    const currentRating = ratings.get(playerId);
    
    // Optimistic update - update UI immediately
    const optimisticRating = {
      ...currentRating,
      ...newRatings,
      player_id: playerId,
      updated_at: new Date().toISOString()
    };

    setRatings(prev => {
      const newMap = new Map(prev);
      newMap.set(playerId, optimisticRating);
      return newMap;
    });

    // If offline, queue the operation
    if (!isOnline()) {
      queueOperation({
        type: 'update_rating',
        data: { playerId, newRatings },
        timestamp: Date.now()
      });
      return; // Keep optimistic update in UI
    }

    try {
      // Check if rating exists for this player
      const { data: existingRating } = await retrySupabaseQuery(async () => {
        return await supabase
          .from('skills_ratings')
          .select('id')
          .eq('player_id', playerId)
          .single();
      });

      let result;
      if (existingRating) {
        // Update existing rating
        result = await retrySupabaseQuery(async () => {
          return await supabase
            .from('skills_ratings')
            .update({
              ...newRatings,
              updated_at: new Date().toISOString()
            })
            .eq('player_id', playerId)
            .select()
            .single();
        });
      } else {
        // Insert new rating
        result = await retrySupabaseQuery(async () => {
          return await supabase
            .from('skills_ratings')
            .insert({
              player_id: playerId,
              batting: 0,
              bowling: 0,
              fielding: 0,
              fitness: 0,
              ...newRatings
            })
            .select()
            .single();
        });
      }

      if (result.error) {
        throw result.error;
      }

      // Apply last-write-wins: only update if remote is newer
      const currentRating = ratings.get(playerId);
      if (shouldUpdate(currentRating, result.data)) {
        setRatings(prev => {
          const newMap = new Map(prev);
          newMap.set(playerId, result.data);
          return newMap;
        });
      }
    } catch (err) {
      console.error('Error updating skills rating:', err);
      
      // Revert optimistic update on error (preserves user input in UI)
      if (currentRating) {
        setRatings(prev => {
          const newMap = new Map(prev);
          newMap.set(playerId, currentRating);
          return newMap;
        });
      } else {
        setRatings(prev => {
          const newMap = new Map(prev);
          newMap.delete(playerId);
          return newMap;
        });
      }
      
      // Throw user-friendly error
      const userFriendlyError = new Error(
        'Unable to save skills rating. Please check your connection and try again.'
      );
      userFriendlyError.originalError = err;
      throw userFriendlyError;
    }
  }, [ratings]);

  // Fetch ratings on mount
  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  return {
    ratings,
    loading,
    error,
    updateRating
  };
}
