/**
 * useRealtimeSubscription Hook
 * 
 * Custom React hook for setting up Supabase real-time subscriptions.
 * Handles subscription lifecycle (subscribe/unsubscribe).
 * 
 * Requirements: 6.1
 */

import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to set up real-time subscriptions for a Supabase table
 * 
 * @param {string} table - The table name to subscribe to
 * @param {Function} callback - Callback function to handle data changes
 * @param {Object} options - Optional configuration
 * @param {string} options.event - Specific event to listen for ('INSERT', 'UPDATE', 'DELETE', '*')
 * @param {Object} options.filter - Optional filter for the subscription
 */
export function useRealtimeSubscription(table, callback, options = {}) {
  const channelRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Check if Supabase client is initialized
    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    // Skip if no table specified
    if (!table) {
      return;
    }

    const event = options.event || '*';
    const filter = options.filter || {};

    // Create a unique channel name
    const channelName = `${table}_${Date.now()}`;

    // Set up the subscription
    let subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          ...filter
        },
        (payload) => {
          // Call the callback with the payload
          if (callbackRef.current) {
            callbackRef.current(payload);
          }
        }
      );

    // Subscribe to the channel
    subscription.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to ${table} changes`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Error subscribing to ${table} changes`);
      } else if (status === 'TIMED_OUT') {
        console.error(`Subscription to ${table} timed out`);
      }
    });

    // Store the channel reference
    channelRef.current = subscription;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log(`Unsubscribing from ${table} changes`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, options.event, JSON.stringify(options.filter)]);

  // Return nothing - this hook is for side effects only
  return null;
}
