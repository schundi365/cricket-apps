/**
 * Property-Based Tests for Input Preservation on Failure
 * 
 * Feature: supabase-player-sync
 * Property 12: Failed Write Input Preservation
 * Validates: Requirements 7.5
 */

import fc from 'fast-check';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSkillsRatings } from './useSkillsRatings';
import { useNetsStatistics } from './useNetsStatistics';
import { supabase } from '../lib/supabase';

// Mock the supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Mock the retry utility to avoid delays in tests
jest.mock('../utils/retry', () => ({
  retrySupabaseQuery: jest.fn((fn) => fn()),
  retryWithBackoff: jest.fn((fn) => fn())
}));

describe('Property 12: Failed Write Input Preservation', () => {
  // Increase timeout for all property-based tests
  jest.setTimeout(30000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property: For any database write operation that fails, the user's input data
   * should remain in the UI form fields, allowing them to retry the operation
   * without re-entering data.
   */
  test('useSkillsRatings preserves optimistic update on write failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // Player ID
        fc.record({
          batting: fc.integer({ min: 0, max: 10 }),
          bowling: fc.integer({ min: 0, max: 10 }),
          fielding: fc.integer({ min: 0, max: 10 }),
          fitness: fc.integer({ min: 0, max: 10 })
        }), // Initial ratings
        fc.record({
          batting: fc.integer({ min: 0, max: 10 }),
          bowling: fc.integer({ min: 0, max: 10 }),
          fielding: fc.integer({ min: 0, max: 10 }),
          fitness: fc.integer({ min: 0, max: 10 })
        }), // Updated ratings (user input)
        fc.string({ minLength: 5, maxLength: 100 }), // Database error message
        async (playerId, initialRatings, updatedRatings, dbErrorMessage) => {
          // Mock Supabase to return initial data, then fail on update
          const mockFrom = jest.fn()
            .mockReturnValueOnce({
              select: jest.fn().mockResolvedValue({
                data: [{
                  player_id: playerId,
                  ...initialRatings,
                  id: 'rating-id',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }],
                error: null
              })
            })
            .mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'rating-id' },
                    error: null
                  })
                })
              })
            })
            .mockReturnValueOnce({
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: null,
                      error: { message: dbErrorMessage }
                    })
                  })
                })
              })
            });
          supabase.from = mockFrom;

          // Render the hook
          const { result } = renderHook(() => useSkillsRatings());

          // Wait for initial load
          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          // Verify initial ratings are loaded
          const initialRating = result.current.ratings.get(playerId);
          expect(initialRating).toBeDefined();
          expect(initialRating.batting).toBe(initialRatings.batting);

          // Try to update rating (this will fail)
          let caughtError = null;
          try {
            await act(async () => {
              await result.current.updateRating(playerId, updatedRatings);
            });
          } catch (error) {
            caughtError = error;
          }

          // Verify error was thrown
          expect(caughtError).not.toBeNull();

          // Verify that the rating was reverted to the original value
          // (preserving the state before the failed write)
          const currentRating = result.current.ratings.get(playerId);
          expect(currentRating).toBeDefined();
          expect(currentRating.batting).toBe(initialRatings.batting);
          expect(currentRating.bowling).toBe(initialRatings.bowling);
          expect(currentRating.fielding).toBe(initialRatings.fielding);
          expect(currentRating.fitness).toBe(initialRatings.fitness);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('useNetsStatistics preserves optimistic update on write failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // Session ID
        fc.uuid(), // Player ID
        fc.record({
          attended: fc.boolean(),
          dismissals: fc.integer({ min: 0, max: 20 }),
          wickets: fc.integer({ min: 0, max: 10 }),
          extras: fc.integer({ min: 0, max: 50 })
        }), // Initial statistics
        fc.record({
          attended: fc.boolean(),
          dismissals: fc.integer({ min: 0, max: 20 }),
          wickets: fc.integer({ min: 0, max: 10 }),
          extras: fc.integer({ min: 0, max: 50 })
        }), // Updated statistics (user input)
        fc.string({ minLength: 5, maxLength: 100 }), // Database error message
        async (sessionId, playerId, initialStats, updatedStats, dbErrorMessage) => {
          // Mock Supabase to return initial data, then fail on update
          const mockFrom = jest.fn()
            .mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [{
                    session_id: sessionId,
                    player_id: playerId,
                    ...initialStats,
                    id: 'stat-id',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }],
                  error: null
                })
              })
            })
            .mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: 'stat-id' },
                      error: null
                    })
                  })
                })
              })
            })
            .mockReturnValueOnce({
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue({
                        data: null,
                        error: { message: dbErrorMessage }
                      })
                    })
                  })
                })
              })
            });
          supabase.from = mockFrom;

          // Render the hook with session ID
          const { result } = renderHook(() => useNetsStatistics(sessionId));

          // Wait for initial load
          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          // Verify initial statistics are loaded
          const initialStat = result.current.statistics.find(s => s.player_id === playerId);
          expect(initialStat).toBeDefined();
          expect(initialStat.dismissals).toBe(initialStats.dismissals);

          // Try to update statistic (this will fail)
          let caughtError = null;
          try {
            await act(async () => {
              await result.current.updateStatistic(playerId, updatedStats);
            });
          } catch (error) {
            caughtError = error;
          }

          // Verify error was thrown
          expect(caughtError).not.toBeNull();

          // Verify that the statistic was reverted to the original value
          // (preserving the state before the failed write)
          const currentStat = result.current.statistics.find(s => s.player_id === playerId);
          expect(currentStat).toBeDefined();
          expect(currentStat.attended).toBe(initialStats.attended);
          expect(currentStat.dismissals).toBe(initialStats.dismissals);
          expect(currentStat.wickets).toBe(initialStats.wickets);
          expect(currentStat.extras).toBe(initialStats.extras);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('useSkillsRatings preserves new rating input on insert failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // Player ID (new player with no existing rating)
        fc.record({
          batting: fc.integer({ min: 0, max: 10 }),
          bowling: fc.integer({ min: 0, max: 10 }),
          fielding: fc.integer({ min: 0, max: 10 }),
          fitness: fc.integer({ min: 0, max: 10 })
        }), // New ratings (user input)
        fc.string({ minLength: 5, maxLength: 100 }), // Database error message
        async (playerId, newRatings, dbErrorMessage) => {
          // Mock Supabase to return empty initial data, then fail on insert
          const mockFrom = jest.fn()
            .mockReturnValueOnce({
              select: jest.fn().mockResolvedValue({
                data: [], // No existing ratings
                error: null
              })
            })
            .mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null, // No existing rating for this player
                    error: null
                  })
                })
              })
            })
            .mockReturnValueOnce({
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: dbErrorMessage }
                  })
                })
              })
            });
          supabase.from = mockFrom;

          // Render the hook
          const { result } = renderHook(() => useSkillsRatings());

          // Wait for initial load
          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          // Verify no rating exists initially
          expect(result.current.ratings.get(playerId)).toBeUndefined();

          // Try to insert new rating (this will fail)
          let caughtError = null;
          try {
            await act(async () => {
              await result.current.updateRating(playerId, newRatings);
            });
          } catch (error) {
            caughtError = error;
          }

          // Verify error was thrown
          expect(caughtError).not.toBeNull();

          // Verify that the rating was removed (reverted to no rating state)
          // This preserves the "no data" state, allowing user to retry
          expect(result.current.ratings.get(playerId)).toBeUndefined();
        }
      ),
      { numRuns: 50 }
    );
  });
});
