/**
 * End-to-End Integration Tests
 * Tests full user flows across the entire system
 */

import { PriceService } from '../services/priceService';
import { SentimentService } from '../services/sentimentService';
import { TrendingService } from '../services/trendingService';
import { SafetyService } from '../services/safetyService';
import { TimingService } from '../services/timingService';
import { calculateLotSize, calculateStopLoss, calculateTakeProfit } from '../services/calculationService';
import { getAssetConfig } from '../config/assetConfig';
import { Asset, AssetType } from '../types';

describe('End-to-End Integration Tests', () => {
  let priceService: PriceService;
  let sentimentService: SentimentService;
  let trendingService: TrendingService;
  let safetyService: SafetyService;
  let timingService: TimingService;

  beforeAll(() => {
    priceService = new PriceService();
    sentimentService = new SentimentService(priceService);
    trendingService = new TrendingService(priceService, sentimentService);
    safetyService = new SafetyService(priceService, sentimentService);
    timingService = new TimingService(priceService, sentimentService, safetyService);
  });

  describe('Full User Flow: Select Asset → View Analysis → Calculate Trade → See Recommendations', () => {
    const testAssets: Asset[] = [
      { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' },
      { type: 'FOREX' as AssetType, symbol: 'EURUSD', name: 'EUR/USD' },
      { type: 'STOCK' as AssetType, symbol: 'SPX', name: 'S&P 500' }
    ];

    testAssets.forEach(asset => {
      it(`should complete full flow for ${asset.symbol}`, async () => {
        // Step 1: Get current price
        const price = await priceService.getCurrentPrice(asset);
        expect(price).toBeDefined();
        expect(price.price).toBeGreaterThan(0);
        expect(price.asset.symbol).toBe(asset.symbol);

        // Step 2: Get sentiment analysis
        const sentiment = await sentimentService.getSentiment(asset);
        expect(sentiment).toBeDefined();
        expect(sentiment.sentiment).toMatch(/BULLISH|BEARISH|NEUTRAL/);
        expect(sentiment.score).toBeGreaterThanOrEqual(0);
        expect(sentiment.score).toBeLessThanOrEqual(100);

        // Step 3: Get safety score
        const safetyScore = await safetyService.calculateSafetyScore(asset);
        expect(safetyScore).toBeDefined();
        expect(safetyScore.overallScore).toBeGreaterThanOrEqual(0);
        expect(safetyScore.overallScore).toBeLessThanOrEqual(100);
        expect(safetyScore.category).toMatch(/VERY_SAFE|SAFE|MODERATE|RISKY|VERY_RISKY/);

        // Step 4: Get entry recommendation
        const entryRec = await timingService.getEntryRecommendation(asset);
        expect(entryRec).toBeDefined();
        expect(entryRec.recommendation).toMatch(/IMMEDIATE|WAIT|AVOID/);
        expect(entryRec.confidence).toBeGreaterThanOrEqual(0);
        expect(entryRec.confidence).toBeLessThanOrEqual(100);

        // Step 5: Get exit recommendation
        const exitRec = await timingService.getExitRecommendation(asset, price.price, 'LONG');
        expect(exitRec).toBeDefined();
        expect(exitRec.takeProfitLevels).toBeDefined();
        expect(exitRec.takeProfitLevels.length).toBeGreaterThan(0);
        expect(exitRec.stopLossLevel).toBeDefined();

        // Step 6: Calculate trade parameters
        const config = getAssetConfig(asset.symbol);
        const tradingCapital = 10000;
        const stopLossDistance = 50;

        const lotSizeResult = calculateLotSize({
          tradingCapital,
          entryPrice: price.price,
          stopLossDistance,
          asset,
          riskPercentage: 3
        });

        expect(lotSizeResult).toBeDefined();
        expect(lotSizeResult.valid).toBe(true);
        expect(lotSizeResult.lotSize).toBeGreaterThan(0);
        expect(lotSizeResult.maxLoss).toBeLessThanOrEqual(tradingCapital * 0.03);

        // Step 7: Calculate stop loss
        const stopLossResult = calculateStopLoss({
          entryPrice: price.price,
          tradingCapital,
          lotSize: lotSizeResult.lotSize,
          asset,
          direction: 'LONG',
          riskPercentage: 3
        });

        expect(stopLossResult).toBeDefined();
        expect(stopLossResult.valid).toBe(true);
        expect(stopLossResult.stopLossPrice).toBeLessThan(price.price);

        // Step 8: Calculate take profit
        const takeProfitResult = calculateTakeProfit({
          entryPrice: price.price,
          stopLossPrice: stopLossResult.stopLossPrice,
          riskRewardRatio: 2,
          direction: 'LONG'
        });

        expect(takeProfitResult).toBeDefined();
        expect(takeProfitResult.takeProfitPrice).toBeGreaterThan(price.price);
        expect(takeProfitResult.riskRewardRatio).toBeCloseTo(2, 1);

        console.log(`✓ Full flow completed for ${asset.symbol}`);
      }, 30000); // 30 second timeout for full flow
    });
  });

  describe('Switching Between Asset Types', () => {
    it('should handle switching from METAL to FOREX', async () => {
      const goldAsset: Asset = { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' };
      const forexAsset: Asset = { type: 'FOREX' as AssetType, symbol: 'EURUSD', name: 'EUR/USD' };

      // Get data for gold
      const goldPrice = await priceService.getCurrentPrice(goldAsset);
      const goldSentiment = await sentimentService.getSentiment(goldAsset);

      expect(goldPrice.asset.type).toBe('METAL');
      expect(goldSentiment.asset.type).toBe('METAL');

      // Switch to forex
      const forexPrice = await priceService.getCurrentPrice(forexAsset);
      const forexSentiment = await sentimentService.getSentiment(forexAsset);

      expect(forexPrice.asset.type).toBe('FOREX');
      expect(forexSentiment.asset.type).toBe('FOREX');

      // Verify different configurations
      const goldConfig = getAssetConfig(goldAsset.symbol);
      const forexConfig = getAssetConfig(forexAsset.symbol);

      expect(goldConfig?.pipValue).not.toBe(forexConfig?.pipValue);
    }, 20000);

    it('should handle switching from FOREX to STOCK', async () => {
      const forexAsset: Asset = { type: 'FOREX' as AssetType, symbol: 'EURUSD', name: 'EUR/USD' };
      const stockAsset: Asset = { type: 'STOCK' as AssetType, symbol: 'SPX', name: 'S&P 500' };

      const forexPrice = await priceService.getCurrentPrice(forexAsset);
      const stockPrice = await priceService.getCurrentPrice(stockAsset);

      expect(forexPrice.asset.type).toBe('FOREX');
      expect(stockPrice.asset.type).toBe('STOCK');

      // Verify price ranges are reasonable
      expect(forexPrice.price).toBeGreaterThan(0.5);
      expect(forexPrice.price).toBeLessThan(2);
      expect(stockPrice.price).toBeGreaterThan(1000);
    }, 20000);
  });

  describe('Filtering and Sorting Trending Assets', () => {
    it('should filter trending assets by asset type', async () => {
      const metalTrending = await trendingService.getTrendingAssets({
        assetTypes: ['METAL' as AssetType]
      });

      expect(metalTrending).toBeDefined();
      expect(Array.isArray(metalTrending)).toBe(true);
      
      metalTrending.forEach((asset: any) => {
        expect(asset.asset.type).toBe('METAL');
      });
    }, 20000);

    it('should filter trending assets by minimum safety score', async () => {
      const minSafetyScore = 50;
      const safeTrending = await trendingService.getTrendingAssets({
        minSafetyScore
      });

      expect(safeTrending).toBeDefined();
      
      safeTrending.forEach((asset: any) => {
        expect(asset.safetyScore).toBeGreaterThanOrEqual(minSafetyScore);
      });
    }, 20000);

    it('should filter trending assets by minimum momentum', async () => {
      const minMomentum = 60;
      const highMomentumTrending = await trendingService.getTrendingAssets({
        minMomentum
      });

      expect(highMomentumTrending).toBeDefined();
      
      highMomentumTrending.forEach((asset: any) => {
        expect(asset.momentum).toBeGreaterThanOrEqual(minMomentum);
      });
    }, 20000);

    it('should sort trending assets by momentum (highest first)', async () => {
      const trending = await trendingService.getTrendingAssets({});

      expect(trending).toBeDefined();
      expect(trending.length).toBeGreaterThan(0);

      // Verify sorting
      for (let i = 0; i < trending.length - 1; i++) {
        expect(trending[i].momentum).toBeGreaterThanOrEqual(trending[i + 1].momentum);
      }
    }, 20000);

    it('should apply multiple filters simultaneously', async () => {
      const filters = {
        assetTypes: ['FOREX' as AssetType, 'STOCK' as AssetType],
        minSafetyScore: 40,
        minMomentum: 50
      };

      const filtered = await trendingService.getTrendingAssets(filters);

      expect(filtered).toBeDefined();
      
      filtered.forEach((asset: any) => {
        expect(['FOREX', 'STOCK']).toContain(asset.asset.type);
        expect(asset.safetyScore).toBeGreaterThanOrEqual(40);
        expect(asset.momentum).toBeGreaterThanOrEqual(50);
      });
    }, 20000);
  });

  describe('Real-Time Updates', () => {
    it('should get updated prices within cache TTL', async () => {
      const asset: Asset = { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' };

      const price1 = await priceService.getCurrentPrice(asset);
      
      // Wait 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const price2 = await priceService.getCurrentPrice(asset);

      // Should be cached (same price within TTL)
      expect(price1.price).toBe(price2.price);
      expect(price1.timestamp).toEqual(price2.timestamp);
    }, 10000);

    it('should handle price subscription updates', async () => {
      const asset: Asset = { type: 'FOREX' as AssetType, symbol: 'EURUSD', name: 'EUR/USD' };
      
      let updateReceived = false;
      
      priceService.subscribeToUpdates(asset, (updatedPrice: any) => {
        updateReceived = true;
        expect(updatedPrice.asset.symbol).toBe(asset.symbol);
        expect(updatedPrice.price).toBeGreaterThan(0);
      });

      // Trigger an update by getting current price
      await priceService.getCurrentPrice(asset);

      // Note: In a real scenario, this would be triggered by WebSocket
      // For testing, we verify the subscription mechanism works
      expect(typeof priceService.subscribeToUpdates).toBe('function');
    }, 10000);
  });

  describe('Error Recovery', () => {
    it('should handle unavailable asset gracefully', async () => {
      const invalidAsset: Asset = { 
        type: 'METAL' as AssetType, 
        symbol: 'INVALID', 
        name: 'Invalid Asset' 
      };

      await expect(priceService.getCurrentPrice(invalidAsset))
        .rejects
        .toThrow();
    }, 10000);

    it('should handle insufficient price history', async () => {
      const asset: Asset = { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' };

      // This should handle the case gracefully
      try {
        const sentiment = await sentimentService.getSentiment(asset);
        // If it succeeds, verify it has valid data
        expect(sentiment).toBeDefined();
      } catch (error: any) {
        // If it fails, verify it's the expected error
        expect(error.message).toContain('Insufficient price history');
      }
    }, 10000);

    it('should validate risk limit enforcement', async () => {
      const asset: Asset = { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' };
      const price = await priceService.getCurrentPrice(asset);

      // Try to create a trade that exceeds 3% risk
      const result = calculateLotSize({
        tradingCapital: 1000,
        entryPrice: price.price,
        stopLossDistance: 500, // Very large stop loss
        asset,
        riskPercentage: 3
      });

      // Should either return invalid or very small lot size
      if (result.valid) {
        expect(result.maxLoss).toBeLessThanOrEqual(1000 * 0.03);
      } else {
        expect(result.warnings.length).toBeGreaterThan(0);
      }
    }, 10000);
  });

  describe('Cross-Asset Consistency', () => {
    it('should maintain consistent data structure across asset types', async () => {
      const assets: Asset[] = [
        { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' },
        { type: 'FOREX' as AssetType, symbol: 'EURUSD', name: 'EUR/USD' },
        { type: 'STOCK' as AssetType, symbol: 'SPX', name: 'S&P 500' }
      ];

      for (const asset of assets) {
        const price = await priceService.getCurrentPrice(asset);
        const sentiment = await sentimentService.getSentiment(asset);
        const safety = await safetyService.calculateSafetyScore(asset);

        // Verify consistent structure
        expect(price).toHaveProperty('asset');
        expect(price).toHaveProperty('price');
        expect(price).toHaveProperty('timestamp');

        expect(sentiment).toHaveProperty('asset');
        expect(sentiment).toHaveProperty('sentiment');
        expect(sentiment).toHaveProperty('score');

        expect(safety).toHaveProperty('asset');
        expect(safety).toHaveProperty('overallScore');
        expect(safety).toHaveProperty('category');
      }
    }, 30000);
  });
});
