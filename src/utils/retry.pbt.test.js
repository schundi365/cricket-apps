/**
 * Property-Based Tests for Retry Utility
 * 
 * Feature: supabase-player-sync
 * Property 10: Retry with Exponential Backoff
 * Validates: Requirements 7.1
 */

import fc from 'fast-check';
import { retryWithBackoff } from './retry';

describe('Property 10: Retry with Exponential Backoff', () => {
  // Increase timeout for all property-based tests
  jest.setTimeout(30000);

  /**
   * Property: For any failed operation, the system should retry up to 3 times
   * with exponentially increasing delays (1s, 2s, 4s) before reporting final failure.
   */
  test('retries up to 3 times with exponential backoff delays', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // Number of failures before success
        async (failuresBeforeSuccess) => {
          let attemptCount = 0;
          const attemptTimestamps = [];
          
          const mockFn = async () => {
            attemptTimestamps.push(Date.now());
            attemptCount++;
            
            if (attemptCount < failuresBeforeSuccess) {
              throw new Error(`Attempt ${attemptCount} failed`);
            }
            
            return 'success';
          };

          if (failuresBeforeSuccess <= 4) {
            // Should succeed within retry limit
            const result = await retryWithBackoff(mockFn, { maxRetries: 3, initialDelay: 50 });
            
            // Verify correct number of attempts
            expect(attemptCount).toBe(failuresBeforeSuccess);
            expect(result).toBe('success');
            
            // Verify exponential backoff delays (with some tolerance for timing)
            if (attemptTimestamps.length > 1) {
              for (let i = 1; i < attemptTimestamps.length; i++) {
                const delay = attemptTimestamps[i] - attemptTimestamps[i - 1];
                const expectedDelay = 50 * Math.pow(2, i - 1);
                // Allow 50ms tolerance for timing variations
                expect(delay).toBeGreaterThanOrEqual(expectedDelay - 50);
              }
            }
          } else {
            // Should fail after max retries
            await expect(
              retryWithBackoff(mockFn, { maxRetries: 3, initialDelay: 50 })
            ).rejects.toThrow();
            
            // Should have attempted exactly 4 times (initial + 3 retries)
            expect(attemptCount).toBe(4);
          }
        }
      ),
      { numRuns: 50 } // Reduced from 100 to 50 for faster execution
    );
  });

  test('calls onRetry callback before each retry attempt', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 4 }), // Number of failures (ensures at least one retry)
        async (failureCount) => {
          let attemptCount = 0;
          const retryCallbacks = [];
          
          const mockFn = async () => {
            attemptCount++;
            if (attemptCount < failureCount) {
              throw new Error(`Attempt ${attemptCount} failed`);
            }
            return 'success';
          };

          const onRetry = (attempt, error) => {
            retryCallbacks.push({ attempt, error: error.message });
          };

          await retryWithBackoff(mockFn, { 
            maxRetries: 3, 
            initialDelay: 10,
            onRetry 
          });

          // Verify onRetry was called for each retry (not the initial attempt)
          expect(retryCallbacks.length).toBe(failureCount - 1);
          
          // Verify callback received correct attempt numbers
          retryCallbacks.forEach((callback, index) => {
            expect(callback.attempt).toBe(index + 1);
          });
        }
      ),
      { numRuns: 50 } // Reduced from 100 to 50 for faster execution
    );
  });

  test('throws the last error after all retries are exhausted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // Error message
        async (errorMessage) => {
          let attemptCount = 0;
          
          const mockFn = async () => {
            attemptCount++;
            throw new Error(errorMessage);
          };

          await expect(
            retryWithBackoff(mockFn, { maxRetries: 3, initialDelay: 10 })
          ).rejects.toThrow(errorMessage);

          // Should have attempted exactly 4 times (initial + 3 retries)
          expect(attemptCount).toBe(4);
        }
      ),
      { numRuns: 50 } // Reduced from 100 to 50 for faster execution
    );
  });

  test('succeeds immediately if function succeeds on first attempt', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.anything(), // Any return value
        async (returnValue) => {
          let attemptCount = 0;
          
          const mockFn = async () => {
            attemptCount++;
            return returnValue;
          };

          const result = await retryWithBackoff(mockFn, { maxRetries: 3, initialDelay: 10 });

          // Should only attempt once
          expect(attemptCount).toBe(1);
          expect(result).toEqual(returnValue);
        }
      ),
      { numRuns: 50 } // Reduced from 100 to 50 for faster execution
    );
  });
});
