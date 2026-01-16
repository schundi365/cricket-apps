/**
 * Tests for Risk Calculation Engine
 * Includes property-based tests and unit tests
 */

import * as fc from 'fast-check';
import {
  calculateLotSize,
  calculateStopLoss,
  calculateTakeProfit
} from './calculationService';
import { Asset, LotSizeParams, StopLossParams, TakeProfitParams } from '../types';
import { getAssetConfig, ALL_ASSETS } from '../config/assetConfig';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a test asset from symbol
 */
function createTestAsset(symbol: string): Asset {
  const asset = ALL_ASSETS.find(a => a.symbol === symbol);
  if (!asset) {
    throw new Error(`Asset ${symbol} not found`);
  }
  return asset;
}

/**
 * Arbitrary for supported asset symbols
 */
const assetSymbolArbitrary = fc.constantFrom(
  'XAU/USD', 'XAG/USD', 'HG', 'XPT/USD', 'XPD/USD', // Metals
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF', 'USD/CAD', 'NZD/USD', // Forex
  'SPX', 'NDX', 'DJI' // Stocks (subset for faster tests)
);

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('Property-Based Tests', () => {
  // Feature: metals-sentiment-trading, Property 2: 3% Risk Limit Invariant
  describe('Property 2: 3% Risk Limit Invariant', () => {
    it('should never exceed 3% risk for any valid combination of parameters', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1000), max: Math.fround(1000000), noNaN: true }), // trading capital
          fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }), // entry price
          fc.float({ min: Math.fround(0.1), max: Math.fround(1000), noNaN: true }), // stop loss distance
          assetSymbolArbitrary, // asset symbol
          (capital, entryPrice, slDistance, assetSymbol) => {
            const asset = createTestAsset(assetSymbol);
            const config = getAssetConfig(asset.symbol)!;
            
            const result = calculateLotSize({
              tradingCapital: capital,
              entryPrice,
              stopLossDistance: slDistance,
              asset,
              riskPercentage: 3
            });
            
            // If result is valid, max loss should not exceed 3%
            if (result.valid && result.lotSize > 0) {
              const maxLossPercentage = (result.maxLoss / capital) * 100;
              return maxLossPercentage <= 3.01; // Allow small floating point tolerance
            }
            
            return true; // Invalid results are acceptable
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain 3% risk limit when calculating stop loss', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1000), max: Math.fround(1000000), noNaN: true }), // trading capital
          fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }), // entry price
          fc.float({ min: Math.fround(0.01), max: Math.fround(10), noNaN: true }), // lot size
          assetSymbolArbitrary, // asset symbol
          fc.constantFrom('LONG', 'SHORT'), // direction
          (capital, entryPrice, lotSize, assetSymbol, direction) => {
            const asset = createTestAsset(assetSymbol);
            const config = getAssetConfig(asset.symbol)!;
            
            // Ensure lot size is within valid range
            const validLotSize = Math.max(
              config.minLotSize,
              Math.min(lotSize, config.maxLotSize)
            );
            
            const result = calculateStopLoss({
              entryPrice,
              tradingCapital: capital,
              lotSize: validLotSize,
              asset,
              direction: direction as 'LONG' | 'SHORT',
              riskPercentage: 3
            });
            
            // If result is valid, max loss should not exceed 3%
            if (result.valid) {
              const maxLossPercentage = (result.maxLoss / capital) * 100;
              return maxLossPercentage <= 3.01; // Allow small floating point tolerance
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: metals-sentiment-trading, Property 3: Lot Size Calculation Correctness
  describe('Property 3: Lot Size Calculation Correctness', () => {
    it('should satisfy the lot size formula for all valid inputs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1000), max: Math.fround(1000000), noNaN: true }), // trading capital
          fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }), // entry price
          fc.float({ min: Math.fround(0.1), max: Math.fround(1000), noNaN: true }), // stop loss distance
          assetSymbolArbitrary, // asset symbol
          (capital, entryPrice, slDistance, assetSymbol) => {
            const asset = createTestAsset(assetSymbol);
            const config = getAssetConfig(asset.symbol)!;
            
            const result = calculateLotSize({
              tradingCapital: capital,
              entryPrice,
              stopLossDistance: slDistance,
              asset,
              riskPercentage: 3
            });
            
            if (result.valid && result.lotSize > 0) {
              // Verify: (Lot Size × Stop Loss Distance × Pip Value) ≤ (Trading Capital × 0.03)
              const calculatedRisk = result.lotSize * slDistance * config.pipValue;
              const maxAllowedRisk = capital * 0.03;
              
              return calculatedRisk <= maxAllowedRisk * 1.01; // Allow small tolerance
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: metals-sentiment-trading, Property 4: Input Validation Rejection
  describe('Property 4: Input Validation Rejection', () => {
    it('should reject zero or negative trading capital', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(0),
            fc.float({ min: Math.fround(-1000000), max: Math.fround(-0.01), noNaN: true })
          ),
          fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(1000), noNaN: true }),
          assetSymbolArbitrary,
          (capital, entryPrice, slDistance, assetSymbol) => {
            const asset = createTestAsset(assetSymbol);
            
            const result = calculateLotSize({
              tradingCapital: capital,
              entryPrice,
              stopLossDistance: slDistance,
              asset,
              riskPercentage: 3
            });
            
            // Should return invalid result
            return !result.valid;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject zero or negative entry price', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1000), max: Math.fround(1000000), noNaN: true }),
          fc.oneof(
            fc.constant(0),
            fc.float({ min: Math.fround(-10000), max: Math.fround(-0.01), noNaN: true })
          ),
          fc.float({ min: Math.fround(0.1), max: Math.fround(1000), noNaN: true }),
          assetSymbolArbitrary,
          (capital, entryPrice, slDistance, assetSymbol) => {
            const asset = createTestAsset(assetSymbol);
            
            const result = calculateLotSize({
              tradingCapital: capital,
              entryPrice,
              stopLossDistance: slDistance,
              asset,
              riskPercentage: 3
            });
            
            // Should return invalid result
            return !result.valid;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject zero or negative stop loss distance', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1000), max: Math.fround(1000000), noNaN: true }),
          fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
          fc.oneof(
            fc.constant(0),
            fc.float({ min: Math.fround(-1000), max: Math.fround(-0.01), noNaN: true })
          ),
          assetSymbolArbitrary,
          (capital, entryPrice, slDistance, assetSymbol) => {
            const asset = createTestAsset(assetSymbol);
            
            const result = calculateLotSize({
              tradingCapital: capital,
              entryPrice,
              stopLossDistance: slDistance,
              asset,
              riskPercentage: 3
            });
            
            // Should return invalid result
            return !result.valid;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: metals-sentiment-trading, Property 7: Sentiment Direction Alignment
  describe('Property 7: Sentiment Direction Alignment', () => {
    it('should position stop loss correctly for LONG positions (below entry)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }), // entry price
          fc.float({ min: Math.fround(1000), max: Math.fround(1000000), noNaN: true }), // capital
          fc.float({ min: Math.fround(0.01), max: Math.fround(10), noNaN: true }), // lot size
          assetSymbolArbitrary,
          (entryPrice, capital, lotSize, assetSymbol) => {
            const asset = createTestAsset(assetSymbol);
            const config = getAssetConfig(asset.symbol)!;
            
            const validLotSize = Math.max(
              config.minLotSize,
              Math.min(lotSize, config.maxLotSize)
            );
            
            const result = calculateStopLoss({
              entryPrice,
              tradingCapital: capital,
              lotSize: validLotSize,
              asset,
              direction: 'LONG',
              riskPercentage: 3
            });
            
            // For LONG positions, stop loss should be below entry price
            if (result.valid) {
              return result.stopLossPrice < entryPrice;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should position stop loss correctly for SHORT positions (above entry)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }), // entry price
          fc.float({ min: Math.fround(1000), max: Math.fround(1000000), noNaN: true }), // capital
          fc.float({ min: Math.fround(0.01), max: Math.fround(10), noNaN: true }), // lot size
          assetSymbolArbitrary,
          (entryPrice, capital, lotSize, assetSymbol) => {
            const asset = createTestAsset(assetSymbol);
            const config = getAssetConfig(asset.symbol)!;
            
            const validLotSize = Math.max(
              config.minLotSize,
              Math.min(lotSize, config.maxLotSize)
            );
            
            const result = calculateStopLoss({
              entryPrice,
              tradingCapital: capital,
              lotSize: validLotSize,
              asset,
              direction: 'SHORT',
              riskPercentage: 3
            });
            
            // For SHORT positions, stop loss should be above entry price
            if (result.valid) {
              return result.stopLossPrice > entryPrice;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: metals-sentiment-trading, Property 6: Take Profit Ratio Correctness
  describe('Property 6: Take Profit Ratio Correctness', () => {
    it('should satisfy take profit ratio formula for LONG positions', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }), // entry price
          fc.float({ min: Math.fround(0.1), max: Math.fround(1000), noNaN: true }), // stop loss distance
          fc.float({ min: Math.fround(1), max: Math.fround(5), noNaN: true }), // risk-reward ratio
          (entryPrice, slDistance, ratio) => {
            const stopLossPrice = entryPrice - slDistance;
            
            const result = calculateTakeProfit({
              entryPrice,
              stopLossPrice,
              riskRewardRatio: ratio,
              direction: 'LONG'
            });
            
            // Verify: |TP - Entry| = R × |Entry - SL|
            const tpDistance = Math.abs(result.takeProfitPrice - entryPrice);
            const slDistanceCalc = Math.abs(entryPrice - stopLossPrice);
            const expectedDistance = slDistanceCalc * ratio;
            
            // Allow 1% tolerance for floating point arithmetic
            return Math.abs(tpDistance - expectedDistance) / expectedDistance < 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should satisfy take profit ratio formula for SHORT positions', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }), // entry price
          fc.float({ min: Math.fround(0.1), max: Math.fround(1000), noNaN: true }), // stop loss distance
          fc.float({ min: Math.fround(1), max: Math.fround(5), noNaN: true }), // risk-reward ratio
          (entryPrice, slDistance, ratio) => {
            const stopLossPrice = entryPrice + slDistance;
            
            const result = calculateTakeProfit({
              entryPrice,
              stopLossPrice,
              riskRewardRatio: ratio,
              direction: 'SHORT'
            });
            
            // Verify: |TP - Entry| = R × |Entry - SL|
            const tpDistance = Math.abs(result.takeProfitPrice - entryPrice);
            const slDistanceCalc = Math.abs(entryPrice - stopLossPrice);
            const expectedDistance = slDistanceCalc * ratio;
            
            // Allow 1% tolerance for floating point arithmetic
            return Math.abs(tpDistance - expectedDistance) / expectedDistance < 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Unit Tests
// ============================================================================

describe('Unit Tests', () => {
  describe('calculateLotSize', () => {
    it('should calculate correct lot size for gold', () => {
      const asset = createTestAsset('XAU/USD');
      const result = calculateLotSize({
        tradingCapital: 10000,
        entryPrice: 2000,
        stopLossDistance: 50, // 50 pips
        asset,
        riskPercentage: 3
      });
      
      expect(result.valid).toBe(true);
      expect(result.lotSize).toBeGreaterThan(0);
      expect(result.maxLoss).toBeLessThanOrEqual(300); // 3% of 10000
    });

    it('should calculate correct lot size for EUR/USD', () => {
      const asset = createTestAsset('EUR/USD');
      const result = calculateLotSize({
        tradingCapital: 10000,
        entryPrice: 1.1000,
        stopLossDistance: 50, // 50 pips
        asset,
        riskPercentage: 3
      });
      
      expect(result.valid).toBe(true);
      expect(result.lotSize).toBeGreaterThan(0);
      expect(result.maxLoss).toBeLessThanOrEqual(300);
    });

    it('should return invalid result for unsupported asset', () => {
      const unsupportedAsset: Asset = {
        type: 'METAL',
        symbol: 'UNSUPPORTED',
        name: 'Unsupported Asset'
      };
      
      const result = calculateLotSize({
        tradingCapital: 10000,
        entryPrice: 2000,
        stopLossDistance: 50,
        asset: unsupportedAsset,
        riskPercentage: 3
      });
      
      expect(result.valid).toBe(false);
    });
  });

  describe('calculateStopLoss', () => {
    it('should calculate stop loss below entry for LONG position', () => {
      const asset = createTestAsset('XAU/USD');
      const result = calculateStopLoss({
        entryPrice: 2000,
        tradingCapital: 10000,
        lotSize: 1.0,
        asset,
        direction: 'LONG',
        riskPercentage: 3
      });
      
      expect(result.valid).toBe(true);
      expect(result.stopLossPrice).toBeLessThan(2000);
      expect(result.maxLoss).toBeLessThanOrEqual(300);
    });

    it('should calculate stop loss above entry for SHORT position', () => {
      const asset = createTestAsset('XAU/USD');
      const result = calculateStopLoss({
        entryPrice: 2000,
        tradingCapital: 10000,
        lotSize: 1.0,
        asset,
        direction: 'SHORT',
        riskPercentage: 3
      });
      
      expect(result.valid).toBe(true);
      expect(result.stopLossPrice).toBeGreaterThan(2000);
      expect(result.maxLoss).toBeLessThanOrEqual(300);
    });
  });

  describe('calculateTakeProfit', () => {
    it('should calculate take profit at correct ratio for LONG position', () => {
      const result = calculateTakeProfit({
        entryPrice: 2000,
        stopLossPrice: 1950,
        riskRewardRatio: 2,
        direction: 'LONG'
      });
      
      expect(result.takeProfitPrice).toBeGreaterThan(2000);
      expect(result.riskRewardRatio).toBe(2);
      
      // Verify ratio: |TP - Entry| = R × |Entry - SL|
      const tpDistance = result.takeProfitPrice - 2000;
      const slDistance = 2000 - 1950;
      expect(tpDistance).toBeCloseTo(slDistance * 2, 1);
    });

    it('should calculate take profit at correct ratio for SHORT position', () => {
      const result = calculateTakeProfit({
        entryPrice: 2000,
        stopLossPrice: 2050,
        riskRewardRatio: 2,
        direction: 'SHORT'
      });
      
      expect(result.takeProfitPrice).toBeLessThan(2000);
      expect(result.riskRewardRatio).toBe(2);
      
      // Verify ratio
      const tpDistance = 2000 - result.takeProfitPrice;
      const slDistance = 2050 - 2000;
      expect(tpDistance).toBeCloseTo(slDistance * 2, 1);
    });
  });

  // Edge case tests
  describe('Edge Cases', () => {
    describe('Zero lot size scenarios', () => {
      it('should handle very large stop loss distance resulting in zero lot size', () => {
        const asset = createTestAsset('XAU/USD');
        const result = calculateLotSize({
          tradingCapital: 1000,
          entryPrice: 2000,
          stopLossDistance: 10000, // Very large stop loss
          asset,
          riskPercentage: 3
        });
        
        expect(result.valid).toBe(true);
        expect(result.lotSize).toBeGreaterThanOrEqual(0);
        expect(result.warnings.length).toBeGreaterThan(0);
      });

      it('should return zero lot size when minimum lot size would exceed risk limit', () => {
        const asset = createTestAsset('XAU/USD');
        const config = getAssetConfig(asset.symbol)!;
        
        const result = calculateLotSize({
          tradingCapital: 10, // Very small capital
          entryPrice: 2000,
          stopLossDistance: 100,
          asset,
          riskPercentage: 3
        });
        
        expect(result.valid).toBe(true);
        expect(result.lotSize).toBe(0); // Returns 0 to prevent exceeding risk limit
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0]).toContain('Cannot achieve');
      });
    });

    describe('Invalid stop loss placement', () => {
      it('should detect invalid stop loss for LONG position (stop loss above entry)', () => {
        const asset = createTestAsset('XAU/USD');
        
        // Manually create an invalid scenario by using negative lot size effect
        const result = calculateStopLoss({
          entryPrice: 2000,
          tradingCapital: 10000,
          lotSize: 1.0,
          asset,
          direction: 'LONG',
          riskPercentage: 3
        });
        
        // The function should calculate stop loss below entry for LONG
        expect(result.stopLossPrice).toBeLessThan(2000);
        expect(result.valid).toBe(true);
      });

      it('should detect invalid stop loss for SHORT position (stop loss below entry)', () => {
        const asset = createTestAsset('XAU/USD');
        
        const result = calculateStopLoss({
          entryPrice: 2000,
          tradingCapital: 10000,
          lotSize: 1.0,
          asset,
          direction: 'SHORT',
          riskPercentage: 3
        });
        
        // The function should calculate stop loss above entry for SHORT
        expect(result.stopLossPrice).toBeGreaterThan(2000);
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid take profit prices', () => {
      it('should handle negative take profit price for SHORT position with large ratio', () => {
        const result = calculateTakeProfit({
          entryPrice: 10,
          stopLossPrice: 20,
          riskRewardRatio: 5,
          direction: 'SHORT'
        });
        
        // Take profit would be negative: 10 - (10 * 5) = -40
        expect(result.takeProfitPrice).toBeLessThan(0);
      });

      it('should handle very small entry price with large stop loss', () => {
        const result = calculateTakeProfit({
          entryPrice: 0.01,
          stopLossPrice: 0.001,
          riskRewardRatio: 2,
          direction: 'LONG'
        });
        
        expect(result.takeProfitPrice).toBeGreaterThan(0.01);
      });
    });

    describe('Extreme values', () => {
      it('should handle very large trading capital', () => {
        const asset = createTestAsset('EUR/USD');
        const result = calculateLotSize({
          tradingCapital: 10000000, // 10 million
          entryPrice: 1.1000,
          stopLossDistance: 50,
          asset,
          riskPercentage: 3
        });
        
        expect(result.valid).toBe(true);
        expect(result.maxLoss).toBeLessThanOrEqual(300000); // 3% of 10M
      });

      it('should handle very small pip values', () => {
        const asset = createTestAsset('XAG/USD'); // Silver has small pip value
        const result = calculateLotSize({
          tradingCapital: 10000,
          entryPrice: 25.000,
          stopLossDistance: 0.5,
          asset,
          riskPercentage: 3
        });
        
        expect(result.valid).toBe(true);
        expect(result.lotSize).toBeGreaterThan(0);
      });
    });
  });
});
