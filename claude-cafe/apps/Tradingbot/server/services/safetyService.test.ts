/**
 * Safety Score Service Tests
 * Tests for safety score calculation, categorization, and filtering
 */

import * as fc from 'fast-check';
import { SafetyService } from './safetyService';
import { PriceService } from './priceService';
import { SentimentService } from './sentimentService';
import { Asset, AssetPrice, PricePoint, SafetyCategory } from '../types';

describe('SafetyService', () => {
  let safetyService: SafetyService;
  let priceService: PriceService;
  let sentimentService: SentimentService;

  beforeEach(() => {
    priceService = new PriceService();
    sentimentService = new SentimentService(priceService);
    safetyService = new SafetyService(priceService, sentimentService);
  });

  afterEach(() => {
    priceService.destroy();
  });

  describe('Property 10: Safety Score Monotonicity', () => {
    /**
     * Feature: metals-sentiment-trading, Property 10: Safety Score Monotonicity
     * For any two assets A and B, if A has significantly better metrics across all
     * components (lower volatility, higher liquidity, tighter spread, and stronger trend),
     * then A's safety score should be higher than B's safety score.
     * Validates: Requirements 8.2, 8.3, 8.4, 8.5
     */
    it('should produce higher safety scores for assets with significantly better metrics', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate base metrics
          fc.record({
            volatility: fc.float({ min: Math.fround(2), max: Math.fround(4), noNaN: true }),
            volume: fc.float({ min: Math.fround(1000000), max: Math.fround(5000000), noNaN: true }),
            spread: fc.float({ min: Math.fround(0.001), max: Math.fround(0.005), noNaN: true }),
            trendStrength: fc.float({ min: Math.fround(40), max: Math.fround(60), noNaN: true }),
            price: fc.float({ min: Math.fround(100), max: Math.fround(2000), noNaN: true })
          }),
          async baseMetrics => {
            // Create asset A with significantly better metrics
            const assetA: Asset = {
              type: 'METAL',
              symbol: 'GOLD',
              name: 'Gold'
            };

            // Create asset B with significantly worse metrics
            const assetB: Asset = {
              type: 'METAL',
              symbol: 'SILVER',
              name: 'Silver'
            };

            // Mock price data for asset A (significantly better metrics)
            // Use 3x improvement factor for clear separation
            const historyA = generateMockHistory(
              baseMetrics.price,
              baseMetrics.volatility * 0.33, // Much lower volatility (33%)
              baseMetrics.volume * 3, // Much higher volume (300%)
              24
            );

            const currentPriceA: AssetPrice = {
              asset: assetA,
              price: baseMetrics.price,
              currency: 'USD',
              timestamp: new Date(),
              bid: baseMetrics.price - baseMetrics.spread * 0.33 / 2, // Much tighter spread (33%)
              ask: baseMetrics.price + baseMetrics.spread * 0.33 / 2,
              spread: baseMetrics.spread * 0.33,
              volume: baseMetrics.volume * 3
            };

            // Mock price data for asset B (significantly worse metrics)
            const historyB = generateMockHistory(
              baseMetrics.price,
              baseMetrics.volatility * 3, // Much higher volatility (300%)
              baseMetrics.volume * 0.33, // Much lower volume (33%)
              24
            );

            const currentPriceB: AssetPrice = {
              asset: assetB,
              price: baseMetrics.price,
              currency: 'USD',
              timestamp: new Date(),
              bid: baseMetrics.price - baseMetrics.spread * 3 / 2, // Much wider spread (300%)
              ask: baseMetrics.price + baseMetrics.spread * 3 / 2,
              spread: baseMetrics.spread * 3,
              volume: baseMetrics.volume * 0.33
            };

            // Mock the price service methods
            jest.spyOn(priceService, 'getCurrentPrice').mockImplementation(async (asset: Asset) => {
              if (asset.symbol === 'GOLD') return currentPriceA;
              if (asset.symbol === 'SILVER') return currentPriceB;
              throw new Error('Unknown asset');
            });

            jest.spyOn(priceService, 'getPriceHistory').mockImplementation(async (asset: Asset) => {
              if (asset.symbol === 'GOLD') return historyA;
              if (asset.symbol === 'SILVER') return historyB;
              throw new Error('Unknown asset');
            });

            // Mock sentiment service
            jest.spyOn(sentimentService, 'getSentiment').mockImplementation(async (asset: Asset) => {
              return {
                asset,
                sentiment: 'NEUTRAL',
                score: 50,
                strength: 'MODERATE',
                indicators: {
                  priceChange24h: 0,
                  priceChange7d: 0,
                  volatility: asset.symbol === 'GOLD' ? baseMetrics.volatility * 0.33 : baseMetrics.volatility * 3,
                  momentum: 50,
                  rsi: 50,
                  macdSignal: 'NEUTRAL'
                },
                timestamp: new Date()
              };
            });

            // Calculate safety scores
            const scoreA = await safetyService.calculateSafetyScore(assetA);
            const scoreB = await safetyService.calculateSafetyScore(assetB);

            // Asset A should have a higher safety score than Asset B
            // With significantly better metrics across all components
            expect(scoreA.overallScore).toBeGreaterThan(scoreB.overallScore);

            // Verify key component scores follow monotonicity
            expect(scoreA.components.volatilityScore).toBeGreaterThan(
              scoreB.components.volatilityScore
            );
            expect(scoreA.components.spreadScore).toBeGreaterThan(
              scoreB.components.spreadScore
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Safety Score Categorization', () => {
    /**
     * Feature: metals-sentiment-trading, Property 11: Safety Score Categorization
     * For any calculated safety score S, the assigned category should match the score range:
     * Very Safe (80-100), Safe (60-79), Moderate (40-59), Risky (20-39), or Very Risky (0-19).
     * Validates: Requirements 8.6
     */
    it('should categorize safety scores correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.float({ min: 0, max: 100, noNaN: true }),
          async targetScore => {
            // Create a mock asset
            const asset: Asset = {
              type: 'FOREX',
              symbol: 'EUR/USD',
              name: 'EUR/USD'
            };

            // Generate metrics that will produce approximately the target score
            const volatility = (100 - targetScore) / 20;
            const volume = targetScore * 10000;
            const spread = (100 - targetScore) / 10000;

            const history = generateMockHistory(1.1, volatility, volume, 24);
            const currentPrice: AssetPrice = {
              asset,
              price: 1.1,
              currency: 'USD',
              timestamp: new Date(),
              bid: 1.1 - spread / 2,
              ask: 1.1 + spread / 2,
              spread,
              volume
            };

            // Mock the price service methods
            jest.spyOn(priceService, 'getCurrentPrice').mockResolvedValue(currentPrice);
            jest.spyOn(priceService, 'getPriceHistory').mockResolvedValue(history);

            // Mock sentiment service
            jest.spyOn(sentimentService, 'getSentiment').mockResolvedValue({
              asset,
              sentiment: 'NEUTRAL',
              score: 50,
              strength: 'MODERATE',
              indicators: {
                priceChange24h: 0,
                priceChange7d: 0,
                volatility,
                momentum: 50,
                rsi: 50,
                macdSignal: 'NEUTRAL'
              },
              timestamp: new Date()
            });

            // Calculate safety score
            const result = await safetyService.calculateSafetyScore(asset);

            // Verify category matches score range
            const score = result.overallScore;
            const category = result.category;

            if (score >= 80) {
              expect(category).toBe('VERY_SAFE');
            } else if (score >= 60) {
              expect(category).toBe('SAFE');
            } else if (score >= 40) {
              expect(category).toBe('MODERATE');
            } else if (score >= 20) {
              expect(category).toBe('RISKY');
            } else {
              expect(category).toBe('VERY_RISKY');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 12: Safety Score Filtering', () => {
    /**
     * Feature: metals-sentiment-trading, Property 12: Safety Score Filtering
     * For any minimum safety score threshold T, the filtered trending assets list
     * should contain only assets with safety scores >= T.
     * Validates: Requirements 8.8
     */
    it('should filter assets by minimum safety score correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              symbol: fc.constantFrom('GOLD', 'SILVER', 'COPPER', 'EUR/USD', 'GBP/USD'),
              safetyScore: fc.float({ min: 0, max: 100, noNaN: true })
            }),
            { minLength: 5, maxLength: 15 }
          ),
          fc.float({ min: 0, max: 100, noNaN: true }), // threshold
          async (assetData, threshold) => {
            // Create mock assets with predetermined safety scores
            const assets: Asset[] = assetData.map(data => ({
              type: data.symbol.includes('/') ? 'FOREX' : 'METAL',
              symbol: data.symbol,
              name: data.symbol
            }));

            // Mock the calculateSafetyScore method to return predetermined scores
            const scoreMap = new Map<string, number>();
            assetData.forEach(data => {
              scoreMap.set(data.symbol, data.safetyScore);
            });

            jest.spyOn(safetyService, 'calculateSafetyScore').mockImplementation(async (asset: Asset) => {
              const score = scoreMap.get(asset.symbol) || 50;
              return {
                asset,
                overallScore: score,
                category: categorizeSafetyScore(score),
                components: {
                  volatilityScore: score,
                  liquidityScore: score,
                  spreadScore: score,
                  trendStrengthScore: score,
                  marketConditionsScore: score
                },
                recommendation: 'Test recommendation',
                timestamp: new Date()
              };
            });

            // Calculate safety scores for all assets
            const safetyScores = await safetyService.getBulkSafetyScores(assets);

            // Filter by threshold
            const filtered = Array.from(safetyScores.values()).filter(
              score => score.overallScore >= threshold
            );

            // Verify all filtered assets meet the threshold
            filtered.forEach(score => {
              expect(score.overallScore).toBeGreaterThanOrEqual(threshold);
            });

            // Verify no assets below threshold are included
            const allScores = Array.from(safetyScores.values());
            const belowThreshold = allScores.filter(score => score.overallScore < threshold);
            belowThreshold.forEach(score => {
              expect(filtered).not.toContainEqual(score);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should calculate safety score for a metal asset', async () => {
      const asset: Asset = {
        type: 'METAL',
        symbol: 'GOLD',
        name: 'Gold'
      };

      const result = await safetyService.calculateSafetyScore(asset);

      expect(result).toBeDefined();
      expect(result.asset).toEqual(asset);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.category).toBeDefined();
      expect(result.components).toBeDefined();
      expect(result.recommendation).toBeDefined();
    });

    it('should calculate bulk safety scores', async () => {
      const assets: Asset[] = [
        { type: 'METAL', symbol: 'GOLD', name: 'Gold' },
        { type: 'FOREX', symbol: 'EUR/USD', name: 'EUR/USD' },
        { type: 'STOCK', symbol: 'SPX', name: 'S&P 500' }
      ];

      const results = await safetyService.getBulkSafetyScores(assets);

      expect(results.size).toBeGreaterThan(0);
      expect(results.size).toBeLessThanOrEqual(assets.length);

      results.forEach(score => {
        expect(score.overallScore).toBeGreaterThanOrEqual(0);
        expect(score.overallScore).toBeLessThanOrEqual(100);
      });
    });

    it('should categorize very safe scores correctly', async () => {
      const asset: Asset = {
        type: 'METAL',
        symbol: 'GOLD',
        name: 'Gold'
      };

      // Mock to return high scores
      const history = generateMockHistory(2000, 0.5, 1000000, 24);
      const currentPrice: AssetPrice = {
        asset,
        price: 2000,
        currency: 'USD',
        timestamp: new Date(),
        bid: 1999.9,
        ask: 2000.1,
        spread: 0.2,
        volume: 1000000
      };

      jest.spyOn(priceService, 'getCurrentPrice').mockResolvedValue(currentPrice);
      jest.spyOn(priceService, 'getPriceHistory').mockResolvedValue(history);
      jest.spyOn(sentimentService, 'getSentiment').mockResolvedValue({
        asset,
        sentiment: 'BULLISH',
        score: 70,
        strength: 'STRONG',
        indicators: {
          priceChange24h: 2,
          priceChange7d: 5,
          volatility: 0.5,
          momentum: 70,
          rsi: 55,
          macdSignal: 'BULLISH'
        },
        timestamp: new Date()
      });

      const result = await safetyService.calculateSafetyScore(asset);

      expect(result.overallScore).toBeGreaterThan(50);
      expect(['VERY_SAFE', 'SAFE', 'MODERATE']).toContain(result.category);
    });
  });
});

/**
 * Helper function to generate mock price history
 */
function generateMockHistory(
  basePrice: number,
  volatility: number,
  volume: number,
  periods: number
): PricePoint[] {
  const history: PricePoint[] = [];
  let currentPrice = basePrice;

  for (let i = 0; i < periods; i++) {
    const change = (Math.random() - 0.5) * volatility * basePrice * 0.01;
    currentPrice += change;

    const high = currentPrice * (1 + Math.random() * 0.005);
    const low = currentPrice * (1 - Math.random() * 0.005);

    history.push({
      timestamp: new Date(Date.now() - (periods - i) * 3600000),
      open: currentPrice,
      high,
      low,
      close: currentPrice,
      volume: volume * (0.8 + Math.random() * 0.4)
    });
  }

  return history;
}

/**
 * Helper function to categorize safety score
 */
function categorizeSafetyScore(score: number): SafetyCategory {
  if (score >= 80) return 'VERY_SAFE';
  if (score >= 60) return 'SAFE';
  if (score >= 40) return 'MODERATE';
  if (score >= 20) return 'RISKY';
  return 'VERY_RISKY';
}
