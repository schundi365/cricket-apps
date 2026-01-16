/**
 * useOfflineQueue Hook
 * 
 * Custom React hook for managing offline queue and connectivity state.
 * 
 * Requirements: 6.3, 7.4
 */

import { useState, useEffect, useCallback } from 'react';
import {
  isOnline,
  setupConnectivityListeners,
  syncQueue,
  getQueuedOperations
} from '../utils/offlineQueue';

/**
 * Hook to manage offline queue and connectivity state
 * 
 * @param {Object} executors - Map of operation types to executor functions
 * @returns {Object} Hook state and methods
 * @returns {boolean} online - Whether device is currently online
 * @returns {number} queueLength - Number of operations in queue
 * @returns {Function} sync - Function to manually trigger sync
 * @returns {boolean} syncing - Whether sync is in progress
 * @returns {Object|null} syncResult - Result of last sync operation
 */
export function useOfflineQueue(executors = {}) {
  const [online, setOnline] = useState(isOnline());
  const [queueLength, setQueueLength] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  // Update queue length
  const updateQueueLength = useCallback(() => {
    const queue = getQueuedOperations();
    setQueueLength(queue.length);
  }, []);

  // Sync queued operations
  const sync = useCallback(async () => {
    if (!online || syncing) {
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncQueue(executors);
      setSyncResult(result);
      updateQueueLength();
      return result;
    } catch (err) {
      console.error('Error syncing queue:', err);
      setSyncResult({
        synced: 0,
        failed: 0,
        errors: [err.message]
      });
    } finally {
      setSyncing(false);
    }
  }, [online, syncing, executors, updateQueueLength]);

  // Set up connectivity listeners
  useEffect(() => {
    const cleanup = setupConnectivityListeners(
      () => {
        setOnline(true);
        // Auto-sync when coming online
        setTimeout(() => {
          sync();
        }, 1000); // Wait 1 second to ensure connection is stable
      },
      () => {
        setOnline(false);
      }
    );

    // Update initial queue length
    updateQueueLength();

    return cleanup;
  }, [sync, updateQueueLength]);

  return {
    online,
    queueLength,
    sync,
    syncing,
    syncResult
  };
}
