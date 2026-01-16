/**
 * Property-Based Tests for Error Message Display
 * 
 * Feature: supabase-player-sync
 * Property 11: Error Message Display
 * Validates: Requirements 7.2, 8.5
 */

import fc from 'fast-check';
import { renderHook, waitFor } from '@testing-library/react';
import { usePlayers } from './usePlayers';
import { useSkillsRatings } from './useSkillsRatings';
import { useNetsSessions } from './useNetsSessions';
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

describe('Property 11: Error Message Display', () => {
  // Increase timeout for all property-based tests
  jest.setTimeout(30000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property: For any operation that fails after all retries, the system should
   * display a user-friendly error message describing the failure.
   */
  test('usePlayers displays user-friendly error message on fetch failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 100 }), // Database error message
        async (dbErrorMessage) => {
          // Mock Supabase to return an error
          const mockFrom = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { message: dbErrorMessage }
              })
            })
          });
          supabase.from = mockFrom;

          // Render the hook
          const { result } = renderHook(() => usePlayers());

          // Wait for the hook to finish loading
          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          // Verify error is set
          expect(result.current.error).not.toBeNull();
          
          // Verify error message is user-friendly (not the raw database error)
          expect(result.current.error.message).toContain('Unable to load players');
          expect(result.current.error.message).toContain('check your connection');
          
          // Verify original error is preserved for debugging
          expect(result.current.error.originalError).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  test('useSkillsRatings displays user-friendly error message on fetch failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 100 }), // Database error message
        async (dbErrorMessage) => {
          // Mock Supabase to return an error
          const mockFrom = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: null,
              error: { message: dbErrorMessage }
            })
          });
          supabase.from = mockFrom;

          // Render the hook
          const { result } = renderHook(() => useSkillsRatings());

          // Wait for the hook to finish loading
          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          // Verify error is set
          expect(result.current.error).not.toBeNull();
          
          // Verify error message is user-friendly
          expect(result.current.error.message).toContain('Unable to load skills ratings');
          expect(result.current.error.message).toContain('check your connection');
          
          // Verify original error is preserved
          expect(result.current.error.originalError).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  test('useNetsSessions displays user-friendly error message on fetch failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 100 }), // Database error message
        async (dbErrorMessage) => {
          // Mock Supabase to return an error
          const mockFrom = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { message: dbErrorMessage }
              })
            })
          });
          supabase.from = mockFrom;

          // Render the hook
          const { result } = renderHook(() => useNetsSessions());

          // Wait for the hook to finish loading
          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          // Verify error is set
          expect(result.current.error).not.toBeNull();
          
          // Verify error message is user-friendly
          expect(result.current.error.message).toContain('Unable to load nets sessions');
          expect(result.current.error.message).toContain('check your connection');
          
          // Verify original error is preserved
          expect(result.current.error.originalError).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  test('useNetsStatistics displays user-friendly error message on fetch failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 100 }), // Database error message
        fc.uuid(), // Session ID
        async (dbErrorMessage, sessionId) => {
          // Mock Supabase to return an error
          const mockFrom = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: dbErrorMessage }
              })
            })
          });
          supabase.from = mockFrom;

          // Render the hook with a session ID
          const { result } = renderHook(() => useNetsStatistics(sessionId));

          // Wait for the hook to finish loading
          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          // Verify error is set
          expect(result.current.error).not.toBeNull();
          
          // Verify error message is user-friendly
          expect(result.current.error.message).toContain('Unable to load nets statistics');
          expect(result.current.error.message).toContain('check your connection');
          
          // Verify original error is preserved
          expect(result.current.error.originalError).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  test('updateRating throws user-friendly error message on write failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // Player ID
        fc.record({
          batting: fc.integer({ min: 0, max: 10 }),
          bowling: fc.integer({ min: 0, max: 10 }),
          fielding: fc.integer({ min: 0, max: 10 }),
          fitness: fc.integer({ min: 0, max: 10 })
        }), // Ratings
        fc.string({ minLength: 5, maxLength: 100 }), // Database error message
        async (playerId, ratings, dbErrorMessage) => {
          // Mock Supabase to return success for initial fetch, then error for update
          const mockFrom = jest.fn()
            .mockReturnValueOnce({
              select: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
            .mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
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

          // Try to update rating
          let caughtError = null;
          try {
            await result.current.updateRating(playerId, ratings);
          } catch (error) {
            caughtError = error;
          }

          // Verify error was thrown
          expect(caughtError).not.toBeNull();
          
          // Verify error message is user-friendly
          expect(caughtError.message).toContain('Unable to save skills rating');
          expect(caughtError.message).toContain('check your connection');
          
          // Verify original error is preserved
          expect(caughtError.originalError).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });
});
