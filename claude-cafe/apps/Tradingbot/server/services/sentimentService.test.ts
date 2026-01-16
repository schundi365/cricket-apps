/**
 * Tests for Sentiment Analysis Service
 * Includes property-based tests and unit tests
 */

import * as fc from 'fast-check';
import { SentimentService } from './sentimentService';
import { PriceService } from './priceService';
import { Asset, AssetType, PricePoint, MarketSentiment } from '../types';

describe('SentimentService', () => {
  let sentimentService: SentimentService;
  let priceService: PriceService;

  beforeEach(() => {
    priceService = new PriceService();
    sentimentService = new SentimentService(priceService);
  });

  afterEach(() => {
    priceService.destroy();
  });

  // ============================================================================
  // Property-Based Tests
  // ============================================================================

  describe('Property 1: Multi-Asset Sentiment Retrieval', () => {
    // Feature: metals-sentiment-trading, Property 1: Multi-Asset Sentiment Retrieval
    // Validates: Requirements 1.1, 1.2, 1.3
    
    it('should retrieve valid sentiment for any supported asset', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<AssetType>('METAL', 'FOREX', 'STOCK'),
          fc.constantFrom(
            // Metals
            'GOLD', 'SILVER', 'COPPER', 'PLATINUM', 'PALLADIUM',
            // Forex
            'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF', 'USD/CAD', 'NZD/USD',
            // Stocks
            'SPX', 'NDX', 'DJI', 'FTSE', 'DAX', 'N225'
          ),
          async (assetType, symbol) => {
            // Filter valid combinations
            const validCombinations: Record<AssetType, string[]> = {
              'METAL': ['GOLD', 'SILVER', 'COPPER', 'PLATINUM', 'PALLADIUM'],
              'FOREX': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF', 'USD/CAD', 'NZD/USD'],
              'STOCK': ['SPX', 'NDX', 'DJI', 'FTSE', 'DAX', 'N225']
            };

            if (!validCombinations[assetType].includes(symbol)) {
              return true; // Skip invalid combinations
            }

            const asset: Asset = {
              type: assetType,
              symbol,
              name: symbol
            };

            try {
              const sentiment = await sentimentService.getSentiment(asset);

              // Verify sentiment has valid indicator (bullish, bearish, or neutral)
              expect(['BULLISH', 'BEARISH', 'NEUTRAL']).toContain(sentiment.sentiment);

              // Verify score is between 0 and 100
              expect(sentiment.score).toBeGreaterThanOrEqual(0);
              expect(sentiment.score).toBeLessThanOrEqual(100);

              // Verify strength is valid
              expect(['WEAK', 'MODERATE', 'STRONG']).toContain(sentiment.strength);

              // Verify indicators are present
              expect(sentiment.indicators).toBeDefined();
              expect(typeof sentiment.indicators.priceChange24h).toBe('number');
              expect(typeof sentiment.indicators.priceChange7d).toBe('number');
              expect(typeof sentiment.indicators.volatility).toBe('number');
              expect(typeof sentiment.indicators.momentum).toBe('number');
              expect(typeof sentiment.indicators.rsi).toBe('number');
              expect(['BULLISH', 'BEARISH', 'NEUTRAL']).toContain(sentiment.indicators.macdSignal);

              // Verify timestamp is recent
              expect(sentiment.timestamp).toBeInstanceOf(Date);
              expect(Date.now() - sentiment.timestamp.getTime()).toBeLessThan(60000); // Within 1 minute

              return true;
            } catch (error) {
              // Sentiment data unavailable is acceptable per requirement 1.6
              if (error instanceof Error && error.message.includes('Insufficient price history')) {
                return true;
              }
              throw error;
            }
          }
        ),
        { numRuns: 20 } // Reduced runs due to async nature
      );
    });
  });

  // ============================================================================
  // Unit Tests
  // ============================================================================

  describe('calculateSentimentScore', () => {
    it('should calculate bullish sentiment for upward price movement', () => {
      const history24h = generateUpwardTrend(24, 100, 0.02);
      const history7d = generateUpwardTrend(168, 100, 0.01);

      const result = sentimentService.calculateSentimentScore(history24h, history7d);

      expect(result.sentiment).toBe('BULLISH');
      expect(result.score).toBeGreaterThan(50);
    });

    it('should calculate bearish sentiment for downward price movement', () => {
      const history24h = generateDownwardTrend(24, 100, 0.02);
      const history7d = generateDownwardTrend(168, 100, 0.01);

      const result = sentimentService.calculateSentimentScore(history24h, history7d);

      expect(result.sentiment).toBe('BEARISH');
      expect(result.score).toBeLessThan(50);
    });

    it('should calculate neutral sentiment for sideways movement', () => {
      const history24h = generateSidewaysTrend(24, 100, 0.002);
      const history7d = generateSidewaysTrend(168, 100, 0.002);

      const result = sentimentService.calculateSentimentScore(history24h, history7d);

      expect(result.sentiment).toBe('NEUTRAL');
      expect(result.score).toBeGreaterThanOrEqual(40);
      expect(result.score).toBeLessThanOrEqual(60);
    });

    it('should return score between 0 and 100', () => {
      const history24h = generateRandomTrend(24, 100);
      const history7d = generateRandomTrend(168, 100);

      const result = sentimentService.calculateSentimentScore(history24h, history7d);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should determine strength based on score distance from neutral', () => {
      // Strong bullish
      const strongBullish = generateUpwardTrend(24, 100, 0.05);
      const strongBullish7d = generateUpwardTrend(168, 100, 0.03);
      const strongResult = sentimentService.calculateSentimentScore(strongBullish, strongBullish7d);
      expect(strongResult.strength).toBe('STRONG');

      // Weak neutral
      const weakNeutral = generateSidewaysTrend(24, 100, 0.002);
      const weakNeutral7d = generateSidewaysTrend(168, 100, 0.002);
      const weakResult = sentimentService.calculateSentimentScore(weakNeutral, weakNeutral7d);
      expect(weakResult.strength).toBe('WEAK');
    });
  });

  describe('getBulkSentiment', () => {
    it('should retrieve sentiment for multiple assets in parallel', async () => {
      const assets: Asset[] = [
        { type: 'METAL', symbol: 'GOLD', name: 'Gold' },
        { type: 'FOREX', symbol: 'EUR/USD', name: 'Euro/US Dollar' },
        { type: 'STOCK', symbol: 'SPX', name: 'S&P 500' }
      ];

      const results = await sentimentService.getBulkSentiment(assets);

      // Should have results for all assets (or at least attempt them)
      expect(results.size).toBeGreaterThan(0);
      expect(results.size).toBeLessThanOrEqual(assets.length);

      // Each result should be valid
      results.forEach((sentiment, key) => {
        expect(['BULLISH', 'BEARISH', 'NEUTRAL']).toContain(sentiment.sentiment);
        expect(sentiment.score).toBeGreaterThanOrEqual(0);
        expect(sentiment.score).toBeLessThanOrEqual(100);
      });
    });

    it('should handle empty asset list', async () => {
      const results = await sentimentService.getBulkSentiment([]);
      expect(results.size).toBe(0);
    });

    it('should continue processing even if one asset fails', async () => {
      const assets: Asset[] = [
        { type: 'METAL', symbol: 'GOLD', name: 'Gold' },
        { type: 'METAL', symbol: 'INVALID', name: 'Invalid' },
        { type: 'FOREX', symbol: 'EUR/USD', name: 'Euro/US Dollar' }
      ];

      const results = await sentimentService.getBulkSentiment(assets);

      // Should have at least some results despite one failure
      expect(results.size).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases - Requirement 1.6', () => {
    it('should throw error when sentiment data is unavailable', async () => {
      // Create a mock price service that returns insufficient data
      const mockPriceService = {
        getPriceHistory: jest.fn().mockResolvedValue([]),
        getCurrentPrice: jest.fn(),
        subscribeToUpdates: jest.fn(),
        getLastUpdateTime: jest.fn(),
        destroy: jest.fn()
      } as any;

      const service = new SentimentService(mockPriceService);
      const asset: Asset = { type: 'METAL', symbol: 'GOLD', name: 'Gold' };

      await expect(service.getSentiment(asset)).rejects.toThrow('Insufficient price history');
    });

    it('should throw error when price history has less than 2 points', async () => {
      const mockPriceService = {
        getPriceHistory: jest.fn().mockResolvedValue([
          { timestamp: new Date(), open: 100, high: 101, low: 99, close: 100 }
        ]),
        getCurrentPrice: jest.fn(),
        subscribeToUpdates: jest.fn(),
        getLastUpdateTime: jest.fn(),
        destroy: jest.fn()
      } as any;

      const service = new SentimentService(mockPriceService);
      const asset: Asset = { type: 'METAL', symbol: 'GOLD', name: 'Gold' };

      await expect(service.getSentiment(asset)).rejects.toThrow('Insufficient price history');
    });

    it('should handle API errors gracefully', async () => {
      const mockPriceService = {
        getPriceHistory: jest.fn().mockRejectedValue(new Error('API connection failed')),
        getCurrentPrice: jest.fn(),
        subscribeToUpdates: jest.fn(),
        getLastUpdateTime: jest.fn(),
        destroy: jest.fn()
      } as any;

      const service = new SentimentService(mockPriceService);
      const asset: Asset = { type: 'METAL', symbol: 'GOLD', name: 'Gold' };

      await expect(service.getSentiment(asset)).rejects.toThrow('Failed to get sentiment');
    });
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function generateUpwardTrend(points: number, startPrice: number, changeRate: number): PricePoint[] {
  const result: PricePoint[] = [];
  let price = startPrice;

  for (let i = 0; i < points; i++) {
    const change = price * changeRate * (0.8 + Math.random() * 0.4); // 80-120% of change rate
    price += change;
    
    result.push({
      timestamp: new Date(Date.now() - (points - i) * 3600000),
      open: price - change / 2,
      high: price + change * 0.2,
      low: price - change * 0.2,
      close: price,
      volume: Math.random() * 1000000
    });
  }

  return result;
}

function generateDownwardTrend(points: number, startPrice: number, changeRate: number): PricePoint[] {
  const result: PricePoint[] = [];
  let price = startPrice;

  for (let i = 0; i < points; i++) {
    const change = price * changeRate * (0.8 + Math.random() * 0.4);
    price -= change;
    
    result.push({
      timestamp: new Date(Date.now() - (points - i) * 3600000),
      open: price + change / 2,
      high: price + change * 0.2,
      low: price - change * 0.2,
      close: price,
      volume: Math.random() * 1000000
    });
  }

  return result;
}

function generateSidewaysTrend(points: number, basePrice: number, variance: number): PricePoint[] {
  const result: PricePoint[] = [];

  for (let i = 0; i < points; i++) {
    const change = basePrice * variance * (Math.random() - 0.5) * 2;
    const price = basePrice + change;
    
    result.push({
      timestamp: new Date(Date.now() - (points - i) * 3600000),
      open: price - Math.abs(change) * 0.5,
      high: price + Math.abs(change) * 0.3,
      low: price - Math.abs(change) * 0.3,
      close: price,
      volume: Math.random() * 1000000
    });
  }

  return result;
}

function generateRandomTrend(points: number, startPrice: number): PricePoint[] {
  const result: PricePoint[] = [];
  let price = startPrice;

  for (let i = 0; i < points; i++) {
    const change = price * 0.02 * (Math.random() - 0.5);
    price += change;
    
    result.push({
      timestamp: new Date(Date.now() - (points - i) * 3600000),
      open: price - change / 2,
      high: price + Math.abs(change) * 0.5,
      low: price - Math.abs(change) * 0.5,
      close: price,
      volume: Math.random() * 1000000
    });
  }

  return result;
}
