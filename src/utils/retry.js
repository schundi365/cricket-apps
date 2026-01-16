/**
 * Retry Utility with Exponential Backoff
 * 
 * Provides retry logic for failed operations with exponentially increasing delays.
 * 
 * Requirements: 7.1
 */

/**
 * Sleep for a specified number of milliseconds
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * 
 * Retries up to 3 times with delays of 1s, 2s, 4s between attempts.
 * 
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in milliseconds (default: 1000)
 * @param {Function} options.onRetry - Callback called before each retry with (attempt, error)
 * @returns {Promise<any>} Result of the function
 * @throws {Error} The last error if all retries fail
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    onRetry = null
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Try to execute the function
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate exponential backoff delay: 1s, 2s, 4s
      const delay = initialDelay * Math.pow(2, attempt);
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error);
      }
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  // This should never be reached, but throw the last error just in case
  throw lastError;
}

/**
 * Wrap a Supabase query with retry logic
 * 
 * @param {Function} queryFn - Async function that performs a Supabase query
 * @param {Object} options - Retry options (same as retryWithBackoff)
 * @returns {Promise<any>} Result of the query
 */
export async function retrySupabaseQuery(queryFn, options = {}) {
  return retryWithBackoff(queryFn, {
    ...options,
    onRetry: (attempt, error) => {
      console.warn(`Supabase query failed, retrying (attempt ${attempt}/3):`, error.message);
      if (options.onRetry) {
        options.onRetry(attempt, error);
      }
    }
  });
}
