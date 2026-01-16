/**
 * Property-Based Tests for Offline Queue
 * 
 * Feature: supabase-player-sync, Property 9: Offline Queue Preservation
 * 
 * Validates: Requirements 6.3
 */

import fc from 'fast-check';
import {
  queueOperation,
  getQueuedOperations,
  clearQueue,
  removeOperation,
  syncQueue
} from './offlineQueue';

// Clear queue before each test
beforeEach(() => {
  clearQueue();
  localStorage.clear();
});

afterEach(() => {
  clearQueue();
  localStorage.clear();
});

describe('Property 9: Offline Queue Preservation', () => {
  test('Property 9.1: Queued operations are preserved in localStorage', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('update_rating', 'update_statistic', 'create_session'),
            data: fc.record({
              playerId: fc.uuid(),
              value: fc.integer({ min: 0, max: 10 })
            })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (operations) => {
          // Queue all operations
          const queuedIds = operations.map(op => queueOperation(op));

          // Retrieve queued operations
          const retrieved = getQueuedOperations();

          // Verify all operations are preserved
          expect(retrieved.length).toBe(operations.length);
          
          // Verify each operation has required fields
          retrieved.forEach((op, index) => {
            expect(op.type).toBe(operations[index].type);
            expect(op.data).toEqual(operations[index].data);
            expect(op.timestamp).toBeDefined();
            expect(op.id).toBeDefined();
          });

          // Verify operations can be retrieved after page reload (simulated by re-reading)
          const reloaded = getQueuedOperations();
          expect(reloaded.length).toBe(operations.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9.2: Operations are synced in timestamp order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom('update_rating', 'update_statistic', 'create_session'),
            data: fc.record({
              playerId: fc.uuid(),
              value: fc.integer({ min: 0, max: 10 })
            }),
            timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (operations) => {
          // Queue operations with specific timestamps
          operations.forEach(op => {
            queueOperation({
              type: op.type,
              data: op.data,
              timestamp: op.timestamp
            });
          });

          // Track execution order
          const executionOrder = [];
          
          // Create executors that track order
          const executors = {
            update_rating: async (data) => {
              executionOrder.push(data);
            },
            update_statistic: async (data) => {
              executionOrder.push(data);
            },
            create_session: async (data) => {
              executionOrder.push(data);
            }
          };

          // Sync queue
          await syncQueue(executors);

          // Verify operations were executed in timestamp order
          const sortedOperations = [...operations].sort((a, b) => a.timestamp - b.timestamp);
          expect(executionOrder.length).toBe(operations.length);
          
          executionOrder.forEach((executed, index) => {
            expect(executed).toEqual(sortedOperations[index].data);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9.3: Successfully synced operations are removed from queue', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom('update_rating', 'update_statistic', 'create_session'),
            data: fc.record({
              playerId: fc.uuid(),
              value: fc.integer({ min: 0, max: 10 })
            })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (operations) => {
          // Queue operations
          operations.forEach(op => queueOperation(op));

          // Verify queue has operations
          const beforeSync = getQueuedOperations();
          expect(beforeSync.length).toBe(operations.length);

          // Create executors that succeed
          const executors = {
            update_rating: async () => Promise.resolve(),
            update_statistic: async () => Promise.resolve(),
            create_session: async () => Promise.resolve()
          };

          // Sync queue
          const result = await syncQueue(executors);

          // Verify all operations synced successfully
          expect(result.synced).toBe(operations.length);
          expect(result.failed).toBe(0);

          // Verify queue is empty after sync
          const afterSync = getQueuedOperations();
          expect(afterSync.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9.4: Failed operations remain in queue', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom('update_rating', 'update_statistic', 'create_session'),
            data: fc.record({
              playerId: fc.uuid(),
              value: fc.integer({ min: 0, max: 10 })
            })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (operations) => {
          // Queue operations
          operations.forEach(op => queueOperation(op));

          // Create executors that fail
          const executors = {
            update_rating: async () => { throw new Error('Network error'); },
            update_statistic: async () => { throw new Error('Network error'); },
            create_session: async () => { throw new Error('Network error'); }
          };

          // Sync queue
          const result = await syncQueue(executors);

          // Verify all operations failed
          expect(result.synced).toBe(0);
          expect(result.failed).toBe(operations.length);

          // Verify all operations remain in queue
          const afterSync = getQueuedOperations();
          expect(afterSync.length).toBe(operations.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9.5: Queue operations can be individually removed', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('update_rating', 'update_statistic', 'create_session'),
            data: fc.record({
              playerId: fc.uuid(),
              value: fc.integer({ min: 0, max: 10 })
            })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        fc.integer({ min: 0, max: 9 }),
        (operations, removeIndex) => {
          // Ensure removeIndex is valid
          const validIndex = removeIndex % operations.length;

          // Queue operations
          const queuedIds = operations.map(op => queueOperation(op));

          // Remove one operation
          removeOperation(queuedIds[validIndex]);

          // Verify queue has one less operation
          const afterRemove = getQueuedOperations();
          expect(afterRemove.length).toBe(operations.length - 1);

          // Verify removed operation is not in queue
          const removedOpExists = afterRemove.some(op => op.id === queuedIds[validIndex]);
          expect(removedOpExists).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9.6: Queue persists across localStorage operations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('update_rating', 'update_statistic', 'create_session'),
            data: fc.record({
              playerId: fc.uuid(),
              value: fc.integer({ min: 0, max: 10 })
            })
          }),
          { minLength: 1, maxLength: 15 }
        ),
        (operations) => {
          // Queue operations
          operations.forEach(op => queueOperation(op));

          // Get queue
          const queue1 = getQueuedOperations();
          expect(queue1.length).toBe(operations.length);

          // Simulate page reload by getting queue again
          const queue2 = getQueuedOperations();
          expect(queue2.length).toBe(operations.length);

          // Verify data is identical
          queue1.forEach((op, index) => {
            expect(op.id).toBe(queue2[index].id);
            expect(op.type).toBe(queue2[index].type);
            expect(op.data).toEqual(queue2[index].data);
            expect(op.timestamp).toBe(queue2[index].timestamp);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
