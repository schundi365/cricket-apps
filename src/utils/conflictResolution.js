/**
 * Conflict Resolution Utility
 * 
 * Implements last-write-wins conflict resolution strategy using timestamps.
 * 
 * Requirements: 6.2
 */

/**
 * Check if a record appears to be a nets_statistics record
 * @param {Object} record - The record to check
 * @returns {boolean} True if it looks like a nets_statistics record
 */
function isNetsStatisticRecord(record) {
  if (!record) return false;
  // Check if it has typical nets_statistics fields
  return (
    'session_id' in record ||
    'player_id' in record ||
    'nets_attended' in record ||
    'dismissals' in record ||
    'wickets' in record ||
    'extras' in record
  );
}

/**
 * Normalize a record to include new schema fields with defaults
 * Ensures backward compatibility when comparing records with mixed schemas
 * Only normalizes nets_statistics records
 * 
 * @param {Object} record - The record to normalize
 * @returns {Object} Normalized record with all required fields
 */
export function normalizeRecord(record) {
  if (!record) return record;
  
  // Only normalize if this looks like a nets_statistics record
  if (!isNetsStatisticRecord(record)) {
    return record;
  }

  // Add new schema fields with defaults if they don't exist
  return {
    ...record,
    // Behavioral fields - default to FALSE if not present
    works_on_technique: record.works_on_technique ?? false,
    punctual_to_training: record.punctual_to_training ?? false,
    // Points columns - default to 0 if not present
    batting_points: record.batting_points ?? 0,
    bowling_points: record.bowling_points ?? 0,
    fielding_points: record.fielding_points ?? 0,
    technique_points: record.technique_points ?? 0,
    punctuality_points: record.punctuality_points ?? 0,
    // Session date - keep as is (may be null for old records)
    session_date: record.session_date ?? null
  };
}

/**
 * Resolve conflict between two data records using last-write-wins strategy
 * Handles records with and without new schema columns
 * 
 * @param {Object} local - Local version of the data
 * @param {Object} remote - Remote version of the data
 * @param {string} timestampField - Field name containing the timestamp (default: 'updated_at')
 * @returns {Object} The winning record (most recent)
 */
export function resolveConflict(local, remote, timestampField = 'updated_at') {
  if (!local) return normalizeRecord(remote);
  if (!remote) return normalizeRecord(local);

  const localTime = new Date(local[timestampField]).getTime();
  const remoteTime = new Date(remote[timestampField]).getTime();

  // Last write wins - return the record with the later timestamp
  // Normalize the winner to ensure all fields are present
  const winner = remoteTime >= localTime ? remote : local;
  return normalizeRecord(winner);
}

/**
 * Merge multiple records with the same key, keeping the most recent
 * Handles records with and without new schema columns
 * 
 * @param {Array} records - Array of records to merge
 * @param {string} keyField - Field name to use as unique key
 * @param {string} timestampField - Field name containing the timestamp
 * @returns {Array} Deduplicated array with most recent records
 */
export function mergeRecords(records, keyField, timestampField = 'updated_at') {
  const recordMap = new Map();

  records.forEach(record => {
    const key = record[keyField];
    const existing = recordMap.get(key);

    if (!existing) {
      recordMap.set(key, normalizeRecord(record));
    } else {
      // Keep the most recent record (already normalized by resolveConflict)
      const winner = resolveConflict(existing, record, timestampField);
      recordMap.set(key, winner);
    }
  });

  return Array.from(recordMap.values());
}

/**
 * Check if a local record should be updated based on remote timestamp
 * Handles records with and without new schema columns
 * 
 * @param {Object} local - Local version of the data
 * @param {Object} remote - Remote version of the data
 * @param {string} timestampField - Field name containing the timestamp
 * @returns {boolean} True if remote is newer and should replace local
 */
export function shouldUpdate(local, remote, timestampField = 'updated_at') {
  if (!local) return true;
  if (!remote) return false;

  // Normalize both records to ensure fair comparison
  const normalizedLocal = normalizeRecord(local);
  const normalizedRemote = normalizeRecord(remote);

  const localTime = new Date(normalizedLocal[timestampField]).getTime();
  const remoteTime = new Date(normalizedRemote[timestampField]).getTime();

  return remoteTime > localTime;
}

/**
 * Apply last-write-wins strategy to update operations
 * Ensures that only updates with newer timestamps are applied
 * Handles records with and without new schema columns
 * 
 * @param {Object} currentData - Current data in the database
 * @param {Object} updateData - New data to potentially apply
 * @param {string} timestampField - Field name containing the timestamp
 * @returns {Object} Result with shouldApply flag and winning data
 */
export function applyLastWriteWins(currentData, updateData, timestampField = 'updated_at') {
  if (!currentData) {
    return {
      shouldApply: true,
      data: normalizeRecord(updateData)
    };
  }

  if (!updateData) {
    return {
      shouldApply: false,
      data: normalizeRecord(currentData)
    };
  }

  // Normalize both records for fair comparison
  const normalizedCurrent = normalizeRecord(currentData);
  const normalizedUpdate = normalizeRecord(updateData);

  const currentTime = new Date(normalizedCurrent[timestampField]).getTime();
  const updateTime = new Date(normalizedUpdate[timestampField]).getTime();

  if (updateTime >= currentTime) {
    return {
      shouldApply: true,
      data: normalizedUpdate
    };
  } else {
    return {
      shouldApply: false,
      data: normalizedCurrent
    };
  }
}
