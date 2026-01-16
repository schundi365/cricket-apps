/**
 * Tests for asset configuration
 */

import * as fc from 'fast-check';
import {
  METALS,
  FOREX_PAIRS,
  STOCK_INDICES,
  ALL_ASSETS,
  ASSET_CONFIGS,
  getAssetConfig,
  getAssetsByType,
  getAssetBySymbol,
  isAssetSupported,
  getSupportedSymbols
} from './assetConfig';

describe('Asset Configuration', () => {
  describe('Asset Arrays', () => {
    it('should have 5 metals', () => {
      expect(METALS).toHaveLength(5);
      expect(METALS.every(m => m.type === 'METAL')).toBe(true);
    });

    it('should have 7 forex pairs', () => {
      expect(FOREX_PAIRS).toHaveLength(7);
      expect(FOREX_PAIRS.every(f => f.type === 'FOREX')).toBe(true);
    });

    it('should have 6 stock indices', () => {
      expect(STOCK_INDICES).toHaveLength(6);
      expect(STOCK_INDICES.every(s => s.type === 'STOCK')).toBe(true);
    });

    it('should have 18 total assets', () => {
      expect(ALL_ASSETS).toHaveLength(18);
    });
  });

  describe('Asset Configuration Map', () => {
    it('should have configuration for all assets', () => {
      ALL_ASSETS.forEach(asset => {
        const config = ASSET_CONFIGS[asset.symbol];
        expect(config).toBeDefined();
        expect(config.symbol).toBe(asset.symbol);
      });
    });

    it('should have valid pip values for all assets', () => {
      Object.values(ASSET_CONFIGS).forEach(config => {
        expect(config.pipSize).toBeGreaterThan(0);
        expect(config.pipValue).toBeGreaterThan(0);
      });
    });

    it('should have valid lot size constraints', () => {
      Object.values(ASSET_CONFIGS).forEach(config => {
        expect(config.minLotSize).toBeGreaterThan(0);
        expect(config.maxLotSize).toBeGreaterThan(config.minLotSize);
        expect(config.lotStepSize).toBeGreaterThan(0);
      });
    });
  });

  describe('Helper Functions', () => {
    it('should get asset config by symbol', () => {
      const goldConfig = getAssetConfig('XAU/USD');
      expect(goldConfig).toBeDefined();
      expect(goldConfig?.symbol).toBe('XAU/USD');
      expect(goldConfig?.contractSize).toBe(100);
    });

    it('should return undefined for unknown symbol', () => {
      const config = getAssetConfig('UNKNOWN');
      expect(config).toBeUndefined();
    });

    it('should get assets by type', () => {
      const metals = getAssetsByType('METAL');
      expect(metals).toHaveLength(5);
      
      const forex = getAssetsByType('FOREX');
      expect(forex).toHaveLength(7);
      
      const stocks = getAssetsByType('STOCK');
      expect(stocks).toHaveLength(6);
    });

    it('should get asset by symbol', () => {
      const gold = getAssetBySymbol('XAU/USD');
      expect(gold).toBeDefined();
      expect(gold?.name).toBe('Gold');
    });

    it('should check if asset is supported', () => {
      expect(isAssetSupported('XAU/USD')).toBe(true);
      expect(isAssetSupported('EUR/USD')).toBe(true);
      expect(isAssetSupported('SPX')).toBe(true);
      expect(isAssetSupported('UNKNOWN')).toBe(false);
    });

    it('should get all supported symbols', () => {
      const symbols = getSupportedSymbols();
      expect(symbols).toHaveLength(18);
      expect(symbols).toContain('XAU/USD');
      expect(symbols).toContain('EUR/USD');
      expect(symbols).toContain('SPX');
    });
  });

  describe('Property-Based Tests', () => {
    it('should always find config for any supported symbol', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...getSupportedSymbols()),
          (symbol) => {
            const config = getAssetConfig(symbol);
            expect(config).toBeDefined();
            expect(config?.symbol).toBe(symbol);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent asset type for all assets of same type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('METAL', 'FOREX', 'STOCK'),
          (type) => {
            const assets = getAssetsByType(type as any);
            const allSameType = assets.every(asset => asset.type === type);
            expect(allSameType).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
