/**
 * Offline Queue Utility
 * 
 * Manages queuing of write operations when offline and syncing when connectivity is restored.
 * 
 * Requirements: 6.3, 7.4
 */

const QUEUE_STORAGE_KEY = 'offline_queue';

/**
 * Get the current offline queue from localStorage
 * @returns {Array} Array of queued operations
 */
function getQueue() {
  try {
    const queueJson = localStorage.getItem(QUEUE_STORAGE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (err) {
    console.error('Error reading offline queue:', err);
    return [];
  }
}

/**
 * Save the queue to localStorage
 * @param {Array} queue - Array of operations to save
 */
function saveQueue(queue) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Error saving offline queue:', err);
  }
}

/**
 * Add an operation to the offline queue
 * @param {Object} operation - The operation to queue
 * @param {string} operation.type - Type of operation (e.g., 'update_rating', 'create_session')
 * @param {Object} operation.data - Data for the operation
 * @param {Function} operation.execute - Function to execute when online
 * @param {number} operation.timestamp - Timestamp when operation was queued
 */
export function queueOperation(operation) {
  const queue = getQueue();
  const queuedOp = {
    ...operation,
    timestamp: operation.timestamp || Date.now(),
    id: `${operation.type}_${Date.now()}_${Math.random()}`
  };
  queue.push(queuedOp);
  saveQueue(queue);
  return queuedOp.id;
}

/**
 * Get all queued operations
 * @returns {Array} Array of queued operations
 */
export function getQueuedOperations() {
  return getQueue();
}

/**
 * Clear all queued operations
 */
export function clearQueue() {
  saveQueue([]);
}

/**
 * Remove a specific operation from the queue
 * @param {string} operationId - ID of the operation to remove
 */
export function removeOperation(operationId) {
  const queue = getQueue();
  const filtered = queue.filter(op => op.id !== operationId);
  saveQueue(filtered);
}

/**
 * Check if the browser is currently online
 * @returns {boolean} True if online, false if offline
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Normalize operation data to include new schema fields with defaults
 * Ensures backward compatibility with operations queued before schema migration
 * 
 * @param {Object} operation - The operation to normalize
 * @returns {Object} Normalized operation with all required fields
 */
export function normalizeOperationData(operation) {
  if (operation.type !== 'update_statistic') {
    return operation;
  }

  const { data } = operation;
  if (!data || !data.stats) {
    return operation;
  }

  // Add new schema fields with defaults if they don't exist
  const normalizedStats = {
    ...data.stats,
    // Behavioral fields - default to FALSE if not present
    works_on_technique: data.stats.works_on_technique ?? false,
    punctual_to_training: data.stats.punctual_to_training ?? false,
    // Points columns - default to 0 if not present
    batting_points: data.stats.batting_points ?? 0,
    bowling_points: data.stats.bowling_points ?? 0,
    fielding_points: data.stats.fielding_points ?? 0,
    technique_points: data.stats.technique_points ?? 0,
    punctuality_points: data.stats.punctuality_points ?? 0
  };

  // Calculate technique_points and punctuality_points from boolean fields
  normalizedStats.technique_points = normalizedStats.works_on_technique ? 1 : 0;
  normalizedStats.punctuality_points = normalizedStats.punctual_to_training ? 1 : 0;

  return {
    ...operation,
    data: {
      ...data,
      stats: normalizedStats
    }
  };
}

/**
 * Sync all queued operations when connectivity is restored
 * @param {Object} executors - Map of operation types to executor functions
 * @returns {Promise<Object>} Result with success and failure counts
 */
export async function syncQueue(executors) {
  if (!isOnline()) {
    return { synced: 0, failed: 0, errors: ['Device is offline'] };
  }

  const queue = getQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0, errors: [] };
  }

  const results = {
    synced: 0,
    failed: 0,
    errors: []
  };

  // Sort by timestamp to maintain order
  const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);

  for (const operation of sortedQueue) {
    try {
      const executor = executors[operation.type];
      if (!executor) {
        throw new Error(`No executor found for operation type: ${operation.type}`);
      }

      // Normalize operation data to handle old and new schema formats
      const normalizedOperation = normalizeOperationData(operation);

      await executor(normalizedOperation.data);
      removeOperation(operation.id);
      results.synced++;
    } catch (err) {
      console.error(`Error syncing operation ${operation.id}:`, err);
      results.failed++;
      results.errors.push({
        operationId: operation.id,
        type: operation.type,
        error: err.message
      });
    }
  }

  return results;
}

/**
 * Set up event listeners for online/offline events
 * @param {Function} onOnline - Callback when device comes online
 * @param {Function} onOffline - Callback when device goes offline
 * @returns {Function} Cleanup function to remove listeners
 */
export function setupConnectivityListeners(onOnline, onOffline) {
  const handleOnline = () => {
    console.log('Device is online');
    if (onOnline) onOnline();
  };

  const handleOffline = () => {
    console.log('Device is offline');
    if (onOffline) onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
