/**
 * Basic tests to verify type definitions and setup
 */

import * as fc from 'fast-check';
import {
  Asset,
  AssetType,
  AssetPrice,
  MarketSentiment,
  SafetyScore,
  TrendingAsset
} from './index';

describe('Core Types', () => {
  describe('Asset Type', () => {
    it('should create a valid metal asset', () => {
      const asset: Asset = {
        type: 'METAL',
        symbol: 'XAU/USD',
        name: 'Gold'
      };
      
      expect(asset.type).toBe('METAL');
      expect(asset.symbol).toBe('XAU/USD');
      expect(asset.name).toBe('Gold');
    });

    it('should create a valid forex asset', () => {
      const asset: Asset = {
        type: 'FOREX',
        symbol: 'EUR/USD',
        name: 'Euro / US Dollar'
      };
      
      expect(asset.type).toBe('FOREX');
      expect(asset.symbol).toBe('EUR/USD');
    });

    it('should create a valid stock asset', () => {
      const asset: Asset = {
        type: 'STOCK',
        symbol: 'SPX',
        name: 'S&P 500'
      };
      
      expect(asset.type).toBe('STOCK');
      expect(asset.symbol).toBe('SPX');
    });
  });

  describe('AssetPrice Type', () => {
    it('should create a valid asset price', () => {
      const asset: Asset = {
        type: 'METAL',
        symbol: 'XAU/USD',
        name: 'Gold'
      };

      const price: AssetPrice = {
        asset,
        price: 2000.50,
        currency: 'USD',
        timestamp: new Date(),
        bid: 2000.45,
        ask: 2000.55,
        spread: 0.10,
        volume: 1000000
      };

      expect(price.price).toBe(2000.50);
      expect(price.spread).toBe(0.10);
      expect(price.bid).toBeLessThan(price.ask);
    });
  });

  describe('Property-Based Tests', () => {
    it('should handle any valid asset type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('METAL', 'FOREX', 'STOCK'),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (type, symbol, name) => {
            const asset: Asset = {
              type: type as AssetType,
              symbol,
              name
            };
            
            expect(asset.type).toBe(type);
            expect(asset.symbol).toBe(symbol);
            expect(asset.name).toBe(name);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle any valid price with bid < ask', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
          fc.float({ min: Math.fround(0.001), max: Math.fround(10), noNaN: true }),
          (price, spreadAmount) => {
            const bid = price - spreadAmount / 2;
            const ask = price + spreadAmount / 2;
            const spread = ask - bid;
            
            expect(bid).toBeLessThan(ask);
            expect(spread).toBeGreaterThan(0);
            expect(Math.abs(spread - spreadAmount)).toBeLessThan(0.01);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
