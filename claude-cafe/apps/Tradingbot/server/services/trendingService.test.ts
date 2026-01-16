/**
 * Trending Service Tests
 * Tests for trend analysis and trending assets discovery
 */

import fc from 'fast-check';
import { TrendingService } from './trendingService';
import { PriceService } from './priceService';
import { SentimentService } from './sentimentService';
import { Asset, PricePoint, TrendCategory } from '../types';

describe('TrendingService', () => {
  let priceService: PriceService;
  let sentimentService: SentimentService;
  let trendingService: TrendingService;

  beforeEach(() => {
    priceService = new PriceService();
    sentimentService = new SentimentService(priceService);
    trendingService = new TrendingService(priceService, sentimentService);
  });

  afterEach(() => {
    priceService.destroy();
  });

  describe('Property 8: Trending Assets Categorization', () => {
    /**
     * Feature: metals-sentiment-trading, Property 8: Trending Assets Categorization
     * **Validates: Requirements 7.4**
     * 
     * For any asset analyzed for trending, the trend category (Strong Uptrend, Moderate Uptrend,
     * Strong Downtrend, Moderate Downtrend) should correctly correspond to its momentum score
     * and price change percentage according to the defined thresholds.
     */
    it('should categorize trends correctly based on momentum and price change', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100 }), // momentum
          fc.float({ min: -10, max: 10 }), // priceChange24h
          (momentum, priceChange24h) => {
            // Access the private method through a workaround
            const category = (trendingService as any).categorizeTrend(momentum, priceChange24h);

            // Verify categorization logic
            if (momentum > 70 && priceChange24h > 3) {
              return category === 'STRONG_UPTREND';
            } else if (momentum >= 50 && momentum <= 70 && priceChange24h >= 1 && priceChange24h <= 3) {
              return category === 'MODERATE_UPTREND';
            } else if (momentum > 70 && priceChange24h < -3) {
              return category === 'STRONG_DOWNTREND';
            } else if (momentum >= 50 && momentum <= 70 && priceChange24h >= -3 && priceChange24h <= -1) {
              return category === 'MODERATE_DOWNTREND';
            } else {
              // Default categorization based on direction
              if (priceChange24h > 0) {
                return category === 'MODERATE_UPTREND';
              } else {
                return category === 'MODERATE_DOWNTREND';
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should categorize strong uptrend correctly', () => {
      const category = (trendingService as any).categorizeTrend(75, 4);
      expect(category).toBe('STRONG_UPTREND');
    });

    it('should categorize moderate uptrend correctly', () => {
      const category = (trendingService as any).categorizeTrend(60, 2);
      expect(category).toBe('MODERATE_UPTREND');
    });

    it('should categorize strong downtrend correctly', () => {
      const category = (trendingService as any).categorizeTrend(75, -4);
      expect(category).toBe('STRONG_DOWNTREND');
    });

    it('should categorize moderate downtrend correctly', () => {
      const category = (trendingService as any).categorizeTrend(60, -2);
      expect(category).toBe('MODERATE_DOWNTREND');
    });
  });

  describe('Property 9: Trending Assets Sorting', () => {
    /**
     * Feature: metals-sentiment-trading, Property 9: Trending Assets Sorting
     * **Validates: Requirements 7.5**
     * 
     * For any list of trending assets, they should be sorted in descending order
     * by momentum score (highest momentum first).
     */
    it('should sort trending assets by momentum in descending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              assetType: fc.constantFrom('METAL', 'FOREX', 'STOCK'),
              momentum: fc.float({ min: 0, max: 100 })
            }),
            { minLength: 2, maxLength: 10 }
          ),
          async (assetData) => {
            // Mock the analyzeTrendingAsset method to return controlled data
            const originalMethod = (trendingService as any).analyzeTrendingAsset;
            let callIndex = 0;

            (trendingService as any).analyzeTrendingAsset = async (asset: Asset) => {
              const data = assetData[callIndex % assetData.length];
              callIndex++;

              return {
                asset,
                priceChange24h: 1,
                priceChange7d: 2,
                momentum: data.momentum,
                trendCategory: 'MODERATE_UPTREND' as TrendCategory,
                safetyScore: 50,
                sentiment: {
                  asset,
                  sentiment: 'NEUTRAL',
                  score: 50,
                  strength: 'MODERATE',
                  indicators: {
                    priceChange24h: 1,
                    priceChange7d: 2,
                    volatility: 1,
                    momentum: data.momentum,
                    rsi: 50,
                    macdSignal: 'NEUTRAL'
                  },
                  timestamp: new Date()
                },
                currentPrice: 100,
                timestamp: new Date()
              };
            };

            try {
              // Get trending assets (will use mocked data)
              const trending = await trendingService.getTrendingAssets({
                assetTypes: ['METAL']
              });

              // Verify sorting
              for (let i = 0; i < trending.length - 1; i++) {
                if (trending[i].momentum < trending[i + 1].momentum) {
                  return false;
                }
              }

              return true;
            } finally {
              // Restore original method
              (trendingService as any).analyzeTrendingAsset = originalMethod;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should sort specific trending assets correctly', async () => {
      // Mock data with known momentum values
      const mockData = [
        { momentum: 60, symbol: 'GOLD' },
        { momentum: 85, symbol: 'SILVER' },
        { momentum: 45, symbol: 'COPPER' }
      ];

      const originalMethod = (trendingService as any).analyzeTrendingAsset;
      let callIndex = 0;

      (trendingService as any).analyzeTrendingAsset = async (asset: Asset) => {
        const data = mockData.find(d => d.symbol === asset.symbol) || mockData[0];

        return {
          asset,
          priceChange24h: 1,
          priceChange7d: 2,
          momentum: data.momentum,
          trendCategory: 'MODERATE_UPTREND' as TrendCategory,
          safetyScore: 50,
          sentiment: {
            asset,
            sentiment: 'NEUTRAL',
            score: 50,
            strength: 'MODERATE',
            indicators: {
              priceChange24h: 1,
              priceChange7d: 2,
              volatility: 1,
              momentum: data.momentum,
              rsi: 50,
              macdSignal: 'NEUTRAL'
            },
            timestamp: new Date()
          },
          currentPrice: 100,
          timestamp: new Date()
        };
      };

      try {
        const trending = await trendingService.getTrendingAssets({
          assetTypes: ['METAL']
        });

        // Should be sorted: SILVER (85), GOLD (60), COPPER (45)
        expect(trending[0].momentum).toBeGreaterThanOrEqual(trending[1]?.momentum || 0);
        if (trending.length > 1) {
          expect(trending[1].momentum).toBeGreaterThanOrEqual(trending[2]?.momentum || 0);
        }
      } finally {
        (trendingService as any).analyzeTrendingAsset = originalMethod;
      }
    });
  });

  describe('Property 20: Filter Application Correctness', () => {
    /**
     * Feature: metals-sentiment-trading, Property 20: Filter Application Correctness
     * **Validates: Requirements 10.7**
     * 
     * For any combination of filters applied to trending assets (asset type, minimum safety score,
     * minimum momentum, trend direction), the returned list should contain only assets that
     * satisfy all filter criteria.
     */
    it('should apply all filters correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              assetType: fc.constantFrom('METAL', 'FOREX', 'STOCK'),
              momentum: fc.float({ min: 0, max: 100 }),
              safetyScore: fc.float({ min: 0, max: 100 }),
              priceChange24h: fc.float({ min: -10, max: 10 })
            }),
            { minLength: 5, maxLength: 20 }
          ),
          fc.float({ min: 0, max: 100 }), // minMomentum
          fc.float({ min: 0, max: 100 }), // minSafetyScore
          fc.constantFrom('UP', 'DOWN', 'BOTH'), // trendDirection
          (assetData, minMomentum, minSafetyScore, trendDirection) => {
            // Create mock trending assets
            const trendingAssets = assetData.map((data, index) => {
              const asset: Asset = {
                type: data.assetType as any,
                symbol: `ASSET${index}`,
                name: `Asset ${index}`
              };

              const trendCategory: TrendCategory =
                data.priceChange24h > 3
                  ? 'STRONG_UPTREND'
                  : data.priceChange24h > 0
                  ? 'MODERATE_UPTREND'
                  : data.priceChange24h < -3
                  ? 'STRONG_DOWNTREND'
                  : 'MODERATE_DOWNTREND';

              return {
                asset,
                priceChange24h: data.priceChange24h,
                priceChange7d: data.priceChange24h * 2,
                momentum: data.momentum,
                trendCategory,
                safetyScore: data.safetyScore,
                sentiment: {
                  asset,
                  sentiment: 'NEUTRAL' as const,
                  score: 50,
                  strength: 'MODERATE' as const,
                  indicators: {
                    priceChange24h: data.priceChange24h,
                    priceChange7d: data.priceChange24h * 2,
                    volatility: 1,
                    momentum: data.momentum,
                    rsi: 50,
                    macdSignal: 'NEUTRAL' as const
                  },
                  timestamp: new Date()
                },
                currentPrice: 100,
                timestamp: new Date()
              };
            });

            // Apply filters using the private method
            const filters = {
              minMomentum,
              minSafetyScore,
              trendDirection: trendDirection as 'UP' | 'DOWN' | 'BOTH'
            };

            const filtered = (trendingService as any).applyFilters(trendingAssets, filters);

            // Verify all filtered assets meet criteria
            return filtered.every((asset: any) => {
              // Check momentum filter
              if (asset.momentum < minMomentum) return false;

              // Check safety score filter
              if (asset.safetyScore < minSafetyScore) return false;

              // Check trend direction filter
              if (trendDirection === 'UP') {
                if (
                  asset.trendCategory !== 'STRONG_UPTREND' &&
                  asset.trendCategory !== 'MODERATE_UPTREND'
                ) {
                  return false;
                }
              } else if (trendDirection === 'DOWN') {
                if (
                  asset.trendCategory !== 'STRONG_DOWNTREND' &&
                  asset.trendCategory !== 'MODERATE_DOWNTREND'
                ) {
                  return false;
                }
              }

              return true;
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter by minimum momentum', () => {
      const mockAssets = [
        { momentum: 30, safetyScore: 50, trendCategory: 'MODERATE_UPTREND' as TrendCategory },
        { momentum: 60, safetyScore: 50, trendCategory: 'MODERATE_UPTREND' as TrendCategory },
        { momentum: 80, safetyScore: 50, trendCategory: 'STRONG_UPTREND' as TrendCategory }
      ].map((data, index) => ({
        asset: { type: 'METAL' as const, symbol: `ASSET${index}`, name: `Asset ${index}` },
        priceChange24h: 1,
        priceChange7d: 2,
        momentum: data.momentum,
        trendCategory: data.trendCategory,
        safetyScore: data.safetyScore,
        sentiment: {} as any,
        currentPrice: 100,
        timestamp: new Date()
      }));

      const filtered = (trendingService as any).applyFilters(mockAssets, { minMomentum: 50 });

      expect(filtered.length).toBe(2);
      expect(filtered.every((a: any) => a.momentum >= 50)).toBe(true);
    });

    it('should filter by minimum safety score', () => {
      const mockAssets = [
        { momentum: 50, safetyScore: 30, trendCategory: 'MODERATE_UPTREND' as TrendCategory },
        { momentum: 50, safetyScore: 60, trendCategory: 'MODERATE_UPTREND' as TrendCategory },
        { momentum: 50, safetyScore: 80, trendCategory: 'STRONG_UPTREND' as TrendCategory }
      ].map((data, index) => ({
        asset: { type: 'METAL' as const, symbol: `ASSET${index}`, name: `Asset ${index}` },
        priceChange24h: 1,
        priceChange7d: 2,
        momentum: data.momentum,
        trendCategory: data.trendCategory,
        safetyScore: data.safetyScore,
        sentiment: {} as any,
        currentPrice: 100,
        timestamp: new Date()
      }));

      const filtered = (trendingService as any).applyFilters(mockAssets, { minSafetyScore: 50 });

      expect(filtered.length).toBe(2);
      expect(filtered.every((a: any) => a.safetyScore >= 50)).toBe(true);
    });

    it('should filter by trend direction UP', () => {
      const mockAssets = [
        { momentum: 50, safetyScore: 50, trendCategory: 'MODERATE_UPTREND' as TrendCategory },
        { momentum: 50, safetyScore: 50, trendCategory: 'STRONG_DOWNTREND' as TrendCategory },
        { momentum: 50, safetyScore: 50, trendCategory: 'STRONG_UPTREND' as TrendCategory }
      ].map((data, index) => ({
        asset: { type: 'METAL' as const, symbol: `ASSET${index}`, name: `Asset ${index}` },
        priceChange24h: 1,
        priceChange7d: 2,
        momentum: data.momentum,
        trendCategory: data.trendCategory,
        safetyScore: data.safetyScore,
        sentiment: {} as any,
        currentPrice: 100,
        timestamp: new Date()
      }));

      const filtered = (trendingService as any).applyFilters(mockAssets, { trendDirection: 'UP' });

      expect(filtered.length).toBe(2);
      expect(
        filtered.every(
          (a: any) => a.trendCategory === 'STRONG_UPTREND' || a.trendCategory === 'MODERATE_UPTREND'
        )
      ).toBe(true);
    });

    it('should filter by trend direction DOWN', () => {
      const mockAssets = [
        { momentum: 50, safetyScore: 50, trendCategory: 'MODERATE_UPTREND' as TrendCategory },
        { momentum: 50, safetyScore: 50, trendCategory: 'STRONG_DOWNTREND' as TrendCategory },
        { momentum: 50, safetyScore: 50, trendCategory: 'MODERATE_DOWNTREND' as TrendCategory }
      ].map((data, index) => ({
        asset: { type: 'METAL' as const, symbol: `ASSET${index}`, name: `Asset ${index}` },
        priceChange24h: 1,
        priceChange7d: 2,
        momentum: data.momentum,
        trendCategory: data.trendCategory,
        safetyScore: data.safetyScore,
        sentiment: {} as any,
        currentPrice: 100,
        timestamp: new Date()
      }));

      const filtered = (trendingService as any).applyFilters(mockAssets, { trendDirection: 'DOWN' });

      expect(filtered.length).toBe(2);
      expect(
        filtered.every(
          (a: any) =>
            a.trendCategory === 'STRONG_DOWNTREND' || a.trendCategory === 'MODERATE_DOWNTREND'
        )
      ).toBe(true);
    });
  });

  describe('Trend Analysis', () => {
    it('should analyze trend for an asset with sufficient data', async () => {
      const asset: Asset = {
        type: 'METAL',
        symbol: 'GOLD',
        name: 'Gold'
      };

      const analysis = await trendingService.analyzeTrend(asset);

      expect(analysis).toBeDefined();
      expect(analysis.direction).toMatch(/UP|DOWN|SIDEWAYS/);
      expect(analysis.strength).toBeGreaterThanOrEqual(0);
      expect(analysis.strength).toBeLessThanOrEqual(100);
      expect(analysis.supportLevel).toBeGreaterThan(0);
      expect(analysis.resistanceLevel).toBeGreaterThan(0);
      expect(analysis.trendLine).toBeDefined();
      expect(analysis.trendLine.slope).toBeDefined();
      expect(analysis.trendLine.intercept).toBeDefined();
    });

    it('should throw error for asset with insufficient data', async () => {
      const asset: Asset = {
        type: 'METAL',
        symbol: 'INVALID',
        name: 'Invalid'
      };

      // Mock getPriceHistory to return insufficient data
      const originalMethod = priceService.getPriceHistory;
      priceService.getPriceHistory = async () => [];

      try {
        await expect(trendingService.analyzeTrend(asset)).rejects.toThrow();
      } finally {
        priceService.getPriceHistory = originalMethod;
      }
    });
  });

  describe('Momentum Calculation', () => {
    it('should calculate momentum score within valid range', () => {
      const history: PricePoint[] = [
        { timestamp: new Date(), open: 100, high: 102, low: 99, close: 101 },
        { timestamp: new Date(), open: 101, high: 103, low: 100, close: 102 },
        { timestamp: new Date(), open: 102, high: 104, low: 101, close: 103 }
      ];

      const momentum = (trendingService as any).calculateMomentumScore(history);

      expect(momentum).toBeGreaterThanOrEqual(0);
      expect(momentum).toBeLessThanOrEqual(100);
    });

    it('should return neutral momentum for minimal data', () => {
      const history: PricePoint[] = [
        { timestamp: new Date(), open: 100, high: 102, low: 99, close: 100 }
      ];

      const momentum = (trendingService as any).calculateMomentumScore(history);

      expect(momentum).toBe(50);
    });
  });
});
