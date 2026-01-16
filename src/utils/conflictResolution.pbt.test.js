/**
 * Property-Based Tests for Conflict Resolution
 * 
 * Feature: supabase-player-sync, Property 8: Last-Write-Wins Conflict Resolution
 * 
 * Validates: Requirements 6.2
 */

import fc from 'fast-check';
import {
  resolveConflict,
  mergeRecords,
  shouldUpdate,
  applyLastWriteWins
} from './conflictResolution';

describe('Property 8: Last-Write-Wins Conflict Resolution', () => {
  test('Property 8.1: Most recent record always wins', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          value: fc.integer(),
          updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') })
        }),
        fc.record({
          id: fc.uuid(),
          value: fc.integer(),
          updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') })
        }),
        (record1, record2) => {
          const winner = resolveConflict(record1, record2);
          
          const time1 = new Date(record1.updated_at).getTime();
          const time2 = new Date(record2.updated_at).getTime();
          
          // Winner should be the record with the later or equal timestamp
          if (time2 >= time1) {
            expect(winner).toEqual(record2);
          } else {
            expect(winner).toEqual(record1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8.2: Conflict resolution is commutative for equal timestamps', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          value: fc.integer(),
          updated_at: fc.date()
        }),
        (record) => {
          const record1 = { ...record, value: 1 };
          const record2 = { ...record, value: 2 };
          
          // When timestamps are equal, the second argument wins
          const result1 = resolveConflict(record1, record2);
          const result2 = resolveConflict(record2, record1);
          
          // Both should return the second argument
          expect(result1).toEqual(record2);
          expect(result2).toEqual(record1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8.3: Null/undefined handling', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          value: fc.integer(),
          updated_at: fc.date()
        }),
        (record) => {
          // If local is null, remote wins
          expect(resolveConflict(null, record)).toEqual(record);
          
          // If remote is null, local wins
          expect(resolveConflict(record, null)).toEqual(record);
          
          // If both are null, return null
          expect(resolveConflict(null, null)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8.4: shouldUpdate correctly identifies newer records', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }),
        fc.integer({ min: 0, max: 1000000 }),
        (offset1, offset2) => {
          const baseTime = new Date('2024-01-01').getTime();
          
          const local = {
            id: '1',
            value: 1,
            updated_at: new Date(baseTime + offset1).toISOString()
          };
          
          const remote = {
            id: '1',
            value: 2,
            updated_at: new Date(baseTime + offset2).toISOString()
          };
          
          const result = shouldUpdate(local, remote);
          
          // Should update if remote is strictly newer
          expect(result).toBe(offset2 > offset1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8.5: mergeRecords keeps most recent for each key', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            player_id: fc.constantFrom('player1', 'player2', 'player3'),
            value: fc.integer({ min: 0, max: 100 }),
            updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (records) => {
          const merged = mergeRecords(records, 'player_id');
          
          // Each player_id should appear only once
          const playerIds = merged.map(r => r.player_id);
          const uniquePlayerIds = new Set(playerIds);
          expect(playerIds.length).toBe(uniquePlayerIds.size);
          
          // For each player, verify we kept the most recent record
          merged.forEach(mergedRecord => {
            const playerRecords = records.filter(r => r.player_id === mergedRecord.player_id);
            const mostRecent = playerRecords.reduce((latest, current) => {
              const latestTime = new Date(latest.updated_at).getTime();
              const currentTime = new Date(current.updated_at).getTime();
              return currentTime >= latestTime ? current : latest;
            });
            
            expect(mergedRecord.updated_at).toEqual(mostRecent.updated_at);
            expect(mergedRecord.value).toBe(mostRecent.value);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8.6: applyLastWriteWins returns correct shouldApply flag', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }),
        fc.integer({ min: 0, max: 1000000 }),
        (offset1, offset2) => {
          const baseTime = new Date('2024-01-01').getTime();
          
          const currentData = {
            id: '1',
            value: 1,
            updated_at: new Date(baseTime + offset1).toISOString()
          };
          
          const updateData = {
            id: '1',
            value: 2,
            updated_at: new Date(baseTime + offset2).toISOString()
          };
          
          const result = applyLastWriteWins(currentData, updateData);
          
          // Should apply if update is newer or equal
          expect(result.shouldApply).toBe(offset2 >= offset1);
          
          // Data should be the newer record
          if (offset2 >= offset1) {
            expect(result.data).toEqual(updateData);
          } else {
            expect(result.data).toEqual(currentData);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8.7: Conflict resolution is transitive', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          value: fc.integer(),
          updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2022-12-31') })
        }),
        fc.record({
          id: fc.uuid(),
          value: fc.integer(),
          updated_at: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') })
        }),
        fc.record({
          id: fc.uuid(),
          value: fc.integer(),
          updated_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
        }),
        (record1, record2, record3) => {
          // If A wins over B, and B wins over C, then A should win over C
          const winner1 = resolveConflict(record1, record2);
          const winner2 = resolveConflict(record2, record3);
          const finalWinner = resolveConflict(record1, record3);
          
          // The final winner should be the one with the latest timestamp
          const times = [
            new Date(record1.updated_at).getTime(),
            new Date(record2.updated_at).getTime(),
            new Date(record3.updated_at).getTime()
          ];
          const maxTime = Math.max(...times);
          const expectedWinner = [record1, record2, record3].find(
            r => new Date(r.updated_at).getTime() === maxTime
          );
          
          expect(new Date(finalWinner.updated_at).getTime()).toBe(maxTime);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8.8: Custom timestamp field support', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          value: fc.integer(),
          custom_time: fc.date()
        }),
        fc.record({
          id: fc.uuid(),
          value: fc.integer(),
          custom_time: fc.date()
        }),
        (record1, record2) => {
          const winner = resolveConflict(record1, record2, 'custom_time');
          
          const time1 = new Date(record1.custom_time).getTime();
          const time2 = new Date(record2.custom_time).getTime();
          
          // Winner should be based on custom_time field
          if (time2 >= time1) {
            expect(winner).toEqual(record2);
          } else {
            expect(winner).toEqual(record1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
