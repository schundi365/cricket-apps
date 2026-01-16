/**
 * usePlayers Hook
 * 
 * Custom React hook for fetching and managing player data from Supabase.
 * 
 * Requirements: 5.1, 7.1, 7.2, 7.5
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { retrySupabaseQuery } from '../utils/retry';

/**
 * @typedef {import('../types').Player} Player
 */

/**
 * Hook to fetch all players from Supabase
 * 
 * @returns {Object} Hook state and methods
 * @returns {Player[]} players - Array of player objects
 * @returns {boolean} loading - Loading state
 * @returns {Error|null} error - Error object if fetch failed
 * @returns {Function} refetch - Function to manually refetch players
 */
export function usePlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlayers = useCallback(async () => {
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
          .from('players')
          .select('*')
          .order('name', { ascending: true });
      });

      if (fetchError) {
        throw fetchError;
      }

      setPlayers(data || []);
    } catch (err) {
      console.error('Error fetching players:', err);
      const userFriendlyError = new Error(
        'Unable to load players. Please check your connection and try again.'
      );
      userFriendlyError.originalError = err;
      setError(userFriendlyError);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch players on mount
  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  return {
    players,
    loading,
    error,
    refetch: fetchPlayers
  };
}
