/**
 * useNetsSessions Hook
 * 
 * Custom React hook for fetching and managing nets sessions from Supabase.
 * 
 * Requirements: 5.3, 7.1, 7.2, 7.5
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { retrySupabaseQuery } from '../utils/retry';
import { queueOperation, isOnline } from '../utils/offlineQueue';

/**
 * @typedef {import('../types').NetsSession} NetsSession
 */

/**
 * Hook to fetch and manage nets sessions
 * 
 * @returns {Object} Hook state and methods
 * @returns {NetsSession[]} sessions - Array of nets session objects
 * @returns {boolean} loading - Loading state
 * @returns {Error|null} error - Error object if fetch failed
 * @returns {Function} createSession - Function to create a new session
 * @returns {Function} refetch - Function to manually refetch sessions
 */
export function useNetsSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async () => {
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
          .from('nets_sessions')
          .select('*')
          .order('date', { ascending: false });
      });

      if (fetchError) {
        throw fetchError;
      }

      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching nets sessions:', err);
      const userFriendlyError = new Error(
        'Unable to load nets sessions. Please check your connection and try again.'
      );
      userFriendlyError.originalError = err;
      setError(userFriendlyError);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new nets session with offline queue support
   * 
   * @param {Object} sessionData - The session data
   * @param {Date|string} sessionData.date - The session date
   * @param {number} sessionData.amount_due - Amount due for the session
   * @param {string} sessionData.notes - Optional notes for the session
   * @returns {Promise<string>} The ID of the created session
   */
  const createSession = useCallback(async (sessionData) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { date, amount_due = 0, notes = '' } = sessionData;

    // If offline, queue the operation and return a temporary ID
    if (!isOnline()) {
      const tempId = `temp_${Date.now()}`;
      queueOperation({
        type: 'create_session',
        data: { date, amount_due, notes },
        timestamp: Date.now()
      });
      
      // Add optimistic session to UI
      const optimisticSession = {
        id: tempId,
        date: typeof date === 'string' ? date : date.toISOString().split('T')[0],
        amount_due: amount_due || 0,
        notes: notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setSessions(prev => [optimisticSession, ...prev]);
      return tempId;
    }

    try {
      const { data, error: insertError } = await retrySupabaseQuery(async () => {
        return await supabase
          .from('nets_sessions')
          .insert({
            date: typeof date === 'string' ? date : date.toISOString().split('T')[0],
            amount_due: amount_due || 0,
            notes: notes || ''
          })
          .select()
          .single();
      });

      if (insertError) {
        throw insertError;
      }

      // Refresh sessions list
      await fetchSessions();

      return data.id;
    } catch (err) {
      console.error('Error creating nets session:', err);
      const userFriendlyError = new Error(
        'Unable to create nets session. Please check your connection and try again.'
      );
      userFriendlyError.originalError = err;
      throw userFriendlyError;
    }
  }, [fetchSessions]);

  /**
   * Update an existing nets session
   * 
   * @param {string} sessionId - The ID of the session to update
   * @param {Object} updates - The fields to update
   * @returns {Promise<void>}
   */
  const updateSession = useCallback(async (sessionId, updates) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // If offline, queue the operation
    if (!isOnline()) {
      queueOperation({
        type: 'update_session',
        data: { sessionId, updates },
        timestamp: Date.now()
      });
      
      // Optimistic update
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, ...updates, updated_at: new Date().toISOString() }
          : session
      ));
      return;
    }

    try {
      const { error: updateError } = await retrySupabaseQuery(async () => {
        return await supabase
          .from('nets_sessions')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      });

      if (updateError) {
        throw updateError;
      }

      // Refresh sessions list
      await fetchSessions();
    } catch (err) {
      console.error('Error updating nets session:', err);
      const userFriendlyError = new Error(
        'Unable to update nets session. Please check your connection and try again.'
      );
      userFriendlyError.originalError = err;
      throw userFriendlyError;
    }
  }, [fetchSessions]);

  /**
   * Delete a nets session
   * 
   * @param {string} sessionId - The ID of the session to delete
   * @returns {Promise<void>}
   */
  const deleteSession = useCallback(async (sessionId) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // If offline, queue the operation
    if (!isOnline()) {
      queueOperation({
        type: 'delete_session',
        data: { sessionId },
        timestamp: Date.now()
      });
      
      // Optimistic delete
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      return;
    }

    try {
      const { error: deleteError } = await retrySupabaseQuery(async () => {
        return await supabase
          .from('nets_sessions')
          .delete()
          .eq('id', sessionId);
      });

      if (deleteError) {
        throw deleteError;
      }

      // Refresh sessions list
      await fetchSessions();
    } catch (err) {
      console.error('Error deleting nets session:', err);
      const userFriendlyError = new Error(
        'Unable to delete nets session. Please check your connection and try again.'
      );
      userFriendlyError.originalError = err;
      throw userFriendlyError;
    }
  }, [fetchSessions]);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    refetch: fetchSessions
  };
}
