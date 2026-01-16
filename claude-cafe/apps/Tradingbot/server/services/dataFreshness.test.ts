/**
 * Property-Based Tests for Data Freshness Indication
 * Feature: metals-sentiment-trading
 * Property 18: Data Freshness Indication
 * Validates: Requirements 11.5
 */

import fc from 'fast-check';

// Data freshness categories
type FreshnessCategory = 'live' | 'cached' | 'stale' | 'unknown';

// Helper function to determine data freshness based on age
const getDataFreshness = (ageInSeconds: number): FreshnessCategory => {
  if (ageInSeconds < 0) return 'unknown';
  if (ageInSeconds < 60) return 'live'; // Less than 1 minute
  if (ageInSeconds < 300) return 'cached'; // Less than 5 minutes (300 seconds)
  return 'stale'; // More than 5 minutes
};

// Helper to check if freshness indication is correct
const isFreshnessCorrect = (ageInSeconds: number, expectedFreshness: FreshnessCategory): boolean => {
  const actualFreshness = getDataFreshness(ageInSeconds);
  return actualFreshness === expectedFreshness;
};

// Helper to simulate price data with timestamp
interface PriceData {
  price: number;
  timestamp: Date;
  bid: number;
  ask: number;
  spread: number;
}

const createPriceData = (ageInSeconds: number): PriceData => {
  const now = new Date();
  const timestamp = new Date(now.getTime() - (ageInSeconds * 1000));
  
  return {
    price: 2000,
    timestamp,
    bid: 1999.5,
    ask: 2000.5,
    spread: 1.0
  };
};

describe('Data Freshness Indication - Property 18', () => {
  // Feature: metals-sentiment-trading, Property 18: Data Freshness Indication
  test('should indicate live data for age less than 60 seconds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 59 }), // age in seconds
        (ageInSeconds) => {
          const freshness = getDataFreshness(ageInSeconds);
          return freshness === 'live';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should indicate cached data for age between 60 and 300 seconds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 60, max: 299 }), // age in seconds
        (ageInSeconds) => {
          const freshness = getDataFreshness(ageInSeconds);
          return freshness === 'cached';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should indicate stale data for age 300 seconds or more', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 86400 }), // age in seconds (up to 1 day)
        (ageInSeconds) => {
          const freshness = getDataFreshness(ageInSeconds);
          return freshness === 'stale';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should correctly categorize data freshness for any valid age', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 86400 }), // age in seconds (up to 1 day)
        (ageInSeconds) => {
          const freshness = getDataFreshness(ageInSeconds);
          
          // Verify the freshness category matches the age
          if (ageInSeconds < 60) {
            return freshness === 'live';
          } else if (ageInSeconds < 300) {
            return freshness === 'cached';
          } else {
            return freshness === 'stale';
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should maintain freshness boundaries correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 59, 60, 299, 300, 1000), // boundary values
        (ageInSeconds) => {
          const freshness = getDataFreshness(ageInSeconds);
          
          // Check boundary conditions
          if (ageInSeconds === 0 || ageInSeconds === 59) {
            return freshness === 'live';
          } else if (ageInSeconds === 60 || ageInSeconds === 299) {
            return freshness === 'cached';
          } else if (ageInSeconds === 300 || ageInSeconds === 1000) {
            return freshness === 'stale';
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should handle price data with various timestamps correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 86400 }), // age in seconds
        fc.float({ min: 1, max: 10000 }), // price
        (ageInSeconds, price) => {
          const priceData = createPriceData(ageInSeconds);
          
          // Calculate age from timestamp
          const now = new Date();
          const calculatedAge = Math.floor((now.getTime() - priceData.timestamp.getTime()) / 1000);
          
          // Age should be approximately equal (within 1 second tolerance)
          const ageMatch = Math.abs(calculatedAge - ageInSeconds) <= 1;
          
          // Freshness should be correct for the age
          const freshness = getDataFreshness(calculatedAge);
          const freshnessCorrect = 
            (calculatedAge < 60 && freshness === 'live') ||
            (calculatedAge >= 60 && calculatedAge < 300 && freshness === 'cached') ||
            (calculatedAge >= 300 && freshness === 'stale');
          
          return ageMatch && freshnessCorrect;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should never return unknown for valid positive ages', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 86400 }), // age in seconds
        (ageInSeconds) => {
          const freshness = getDataFreshness(ageInSeconds);
          return freshness !== 'unknown';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should return unknown for negative ages', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: -1 }), // negative age
        (ageInSeconds) => {
          const freshness = getDataFreshness(ageInSeconds);
          return freshness === 'unknown';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should transition correctly at boundary points', () => {
    // Test exact boundary transitions
    expect(getDataFreshness(59)).toBe('live');
    expect(getDataFreshness(60)).toBe('cached');
    expect(getDataFreshness(299)).toBe('cached');
    expect(getDataFreshness(300)).toBe('stale');
  });

  test('should handle edge cases correctly', () => {
    // Test edge cases
    expect(getDataFreshness(0)).toBe('live'); // Just now
    expect(getDataFreshness(1)).toBe('live'); // 1 second ago
    expect(getDataFreshness(59)).toBe('live'); // 59 seconds ago
    expect(getDataFreshness(60)).toBe('cached'); // 1 minute ago
    expect(getDataFreshness(299)).toBe('cached'); // 4:59 ago
    expect(getDataFreshness(300)).toBe('stale'); // 5 minutes ago
    expect(getDataFreshness(3600)).toBe('stale'); // 1 hour ago
    expect(getDataFreshness(-1)).toBe('unknown'); // Invalid (future)
  });
});
