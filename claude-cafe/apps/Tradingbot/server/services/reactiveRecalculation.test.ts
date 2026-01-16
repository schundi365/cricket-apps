/**
 * Property-Based Tests for Reactive Recalculation
 * Feature: metals-sentiment-trading
 * Property 16: Reactive Recalculation
 * Validates: Requirements 5.5, 10.2
 */

import * as fc from 'fast-check';
import { calculateLotSize, calculateStopLoss, calculateTakeProfit } from './calculationService';
import { getAssetConfig } from '../config/assetConfig';
import { Asset, AssetType } from '../types';

/**
 * Property 16: Reactive Recalculation
 * 
 * For any change to trading capital, entry price, stop loss distance, or asset selection,
 * the system should automatically recalculate all dependent values (lot size, stop loss price,
 * take profit levels, max loss, safety score, entry/exit recommendations) and update the
 * display without requiring manual refresh.
 * 
 * This property tests that:
 * 1. When trading capital changes, lot size and risk calculations update
 * 2. When entry price changes, stop loss and take profit prices update
 * 3. When stop loss distance changes, lot size and risk calculations update
 * 4. When asset changes, all calculations use the new asset's configuration
 * 5. All dependent values are recalculated consistently
 */

// Helper to create a valid asset
const createAsset = (type: AssetType, symbol: string): Asset => {
  return {
    type,
    symbol,
    name: symbol
  };
};

// Arbitraries for generating test data
const assetArbitrary = fc.constantFrom(
  { type: 'METAL' as AssetType, symbol: 'XAU/USD' },
  { type: 'METAL' as AssetType, symbol: 'XAG/USD' },
  { type: 'FOREX' as AssetType, symbol: 'EUR/USD' },
  { type: 'FOREX' as AssetType, symbol: 'GBP/USD' },
  { type: 'STOCK' as AssetType, symbol: 'SPX' }
);

const tradingCapitalArbitrary = fc.float({ min: 1000, max: 100000 });
const entryPriceArbitrary = fc.float({ min: 1, max: 10000 });
const stopLossDistanceArbitrary = fc.float({ min: 1, max: 500 });

describe('Property 16: Reactive Recalculation', () => {
  
  test('should recalculate lot size when trading capital changes', () => {
    fc.assert(
      fc.property(
        assetArbitrary,
        entryPriceArbitrary,
        stopLossDistanceArbitrary,
        tradingCapitalArbitrary,
        tradingCapitalArbitrary,
        (assetData, entryPrice, slDistance, capital1, capital2) => {
          // Skip if capitals are too similar
          if (Math.abs(capital1 - capital2) < 100) return true;
          
          const asset = createAsset(assetData.type, assetData.symbol);
          
          // Calculate with first capital
          const result1 = calculateLotSize({
            tradingCapital: capital1,
            entryPrice,
            stopLossDistance: slDistance,
            asset,
            riskPercentage: 3
          });
          
          // Calculate with second capital (simulating reactive recalculation)
          const result2 = calculateLotSize({
            tradingCapital: capital2,
            entryPrice,
            stopLossDistance: slDistance,
            asset,
            riskPercentage: 3
          });
          
          // Lot size should change proportionally to capital change
          if (result1.valid && result2.valid) {
            const capitalRatio = capital2 / capital1;
            const lotSizeRatio = result2.lotSize / result1.lotSize;
            
            // Allow 5% tolerance for rounding
            return Math.abs(capitalRatio - lotSizeRatio) < 0.05 * capitalRatio;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should recalculate stop loss price when entry price changes', () => {
    fc.assert(
      fc.property(
        assetArbitrary,
        tradingCapitalArbitrary,
        entryPriceArbitrary,
        entryPriceArbitrary,
        stopLossDistanceArbitrary,
        (assetData, capital, entryPrice1, entryPrice2, slDistance) => {
          // Skip if entry prices are too similar
          if (Math.abs(entryPrice1 - entryPrice2) < 0.1) return true;
          
          const asset = createAsset(assetData.type, assetData.symbol);
          
          // Calculate lot size first
          const lotSizeResult = calculateLotSize({
            tradingCapital: capital,
            entryPrice: entryPrice1,
            stopLossDistance: slDistance,
            asset,
            riskPercentage: 3
          });
          
          if (!lotSizeResult.valid) return true;
          
          // Calculate stop loss with first entry price
          const sl1 = calculateStopLoss({
            entryPrice: entryPrice1,
            tradingCapital: capital,
            lotSize: lotSizeResult.lotSize,
            asset,
            direction: 'LONG',
            riskPercentage: 3
          });
          
          // Calculate stop loss with second entry price (simulating reactive recalculation)
          const sl2 = calculateStopLoss({
            entryPrice: entryPrice2,
            tradingCapital: capital,
            lotSize: lotSizeResult.lotSize,
            asset,
            direction: 'LONG',
            riskPercentage: 3
          });
          
          // Stop loss prices should be different when entry prices differ
          if (sl1.valid && sl2.valid) {
            return sl1.stopLossPrice !== sl2.stopLossPrice;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should recalculate take profit when entry or stop loss changes', () => {
    fc.assert(
      fc.property(
        assetArbitrary,
        tradingCapitalArbitrary,
        entryPriceArbitrary,
        stopLossDistanceArbitrary,
        fc.constantFrom(1, 2, 3),
        (assetData, capital, entryPrice, slDistance, ratio) => {
          const asset = createAsset(assetData.type, assetData.symbol);
          
          // Calculate lot size and stop loss
          const lotSizeResult = calculateLotSize({
            tradingCapital: capital,
            entryPrice,
            stopLossDistance: slDistance,
            asset,
            riskPercentage: 3
          });
          
          if (!lotSizeResult.valid) return true;
          
          const slResult = calculateStopLoss({
            entryPrice,
            tradingCapital: capital,
            lotSize: lotSizeResult.lotSize,
            asset,
            direction: 'LONG',
            riskPercentage: 3
          });
          
          if (!slResult.valid) return true;
          
          // Calculate take profit
          const tpResult = calculateTakeProfit({
            entryPrice,
            stopLossPrice: slResult.stopLossPrice,
            riskRewardRatio: ratio,
            direction: 'LONG'
          });
          
          // Take profit should maintain the risk-reward ratio
          const actualRatio = tpResult.riskRewardRatio;
          return Math.abs(actualRatio - ratio) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should recalculate all values when asset changes', () => {
    fc.assert(
      fc.property(
        assetArbitrary,
        assetArbitrary,
        tradingCapitalArbitrary,
        entryPriceArbitrary,
        stopLossDistanceArbitrary,
        (assetData1, assetData2, capital, entryPrice, slDistance) => {
          // Skip if assets are the same
          if (assetData1.type === assetData2.type && assetData1.symbol === assetData2.symbol) {
            return true;
          }
          
          const asset1 = createAsset(assetData1.type, assetData1.symbol);
          const asset2 = createAsset(assetData2.type, assetData2.symbol);
          
          // Calculate with first asset
          const result1 = calculateLotSize({
            tradingCapital: capital,
            entryPrice,
            stopLossDistance: slDistance,
            asset: asset1,
            riskPercentage: 3
          });
          
          // Calculate with second asset (simulating reactive recalculation)
          const result2 = calculateLotSize({
            tradingCapital: capital,
            entryPrice,
            stopLossDistance: slDistance,
            asset: asset2,
            riskPercentage: 3
          });
          
          // Get configurations for both assets
          const config1 = getAssetConfig(asset1.symbol);
          const config2 = getAssetConfig(asset2.symbol);
          
          // If pip values differ, lot sizes should differ
          if (result1.valid && result2.valid && config1 && config2 && config1.pipValue !== config2.pipValue) {
            return result1.lotSize !== result2.lotSize;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should maintain 3% risk limit across all recalculations', () => {
    fc.assert(
      fc.property(
        assetArbitrary,
        tradingCapitalArbitrary,
        entryPriceArbitrary,
        stopLossDistanceArbitrary,
        (assetData, capital, entryPrice, slDistance) => {
          const asset = createAsset(assetData.type, assetData.symbol);
          
          // Perform calculation
          const lotSizeResult = calculateLotSize({
            tradingCapital: capital,
            entryPrice,
            stopLossDistance: slDistance,
            asset,
            riskPercentage: 3
          });
          
          if (!lotSizeResult.valid) return true;
          
          const slResult = calculateStopLoss({
            entryPrice,
            tradingCapital: capital,
            lotSize: lotSizeResult.lotSize,
            asset,
            direction: 'LONG',
            riskPercentage: 3
          });
          
          // Risk percentage should never exceed 3%
          if (slResult.valid) {
            const riskPercentage = (slResult.maxLoss / capital) * 100;
            return riskPercentage <= 3.01; // Allow tiny floating point tolerance
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should recalculate consistently when multiple parameters change', () => {
    fc.assert(
      fc.property(
        assetArbitrary,
        tradingCapitalArbitrary,
        tradingCapitalArbitrary,
        entryPriceArbitrary,
        entryPriceArbitrary,
        stopLossDistanceArbitrary,
        stopLossDistanceArbitrary,
        (assetData, capital1, capital2, entry1, entry2, sl1, sl2) => {
          // Skip if values are too similar
          if (Math.abs(capital1 - capital2) < 100 && 
              Math.abs(entry1 - entry2) < 0.1 && 
              Math.abs(sl1 - sl2) < 1) {
            return true;
          }
          
          const asset = createAsset(assetData.type, assetData.symbol);
          
          // Calculate with first set of parameters
          const result1 = calculateLotSize({
            tradingCapital: capital1,
            entryPrice: entry1,
            stopLossDistance: sl1,
            asset,
            riskPercentage: 3
          });
          
          // Calculate with second set of parameters (simulating multiple reactive changes)
          const result2 = calculateLotSize({
            tradingCapital: capital2,
            entryPrice: entry2,
            stopLossDistance: sl2,
            asset,
            riskPercentage: 3
          });
          
          // Both calculations should maintain risk limit
          if (result1.valid && result2.valid) {
            return result1.riskPercentage <= 3.01 && result2.riskPercentage <= 3.01;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should recalculate stop loss distance when lot size changes', () => {
    fc.assert(
      fc.property(
        assetArbitrary,
        tradingCapitalArbitrary,
        entryPriceArbitrary,
        stopLossDistanceArbitrary,
        stopLossDistanceArbitrary,
        (assetData, capital, entryPrice, slDistance1, slDistance2) => {
          // Skip if distances are too similar
          if (Math.abs(slDistance1 - slDistance2) < 1) return true;
          
          const asset = createAsset(assetData.type, assetData.symbol);
          
          // Calculate with first stop loss distance
          const result1 = calculateLotSize({
            tradingCapital: capital,
            entryPrice,
            stopLossDistance: slDistance1,
            asset,
            riskPercentage: 3
          });
          
          // Calculate with second stop loss distance (simulating reactive recalculation)
          const result2 = calculateLotSize({
            tradingCapital: capital,
            entryPrice,
            stopLossDistance: slDistance2,
            asset,
            riskPercentage: 3
          });
          
          // Lot size should be inversely proportional to stop loss distance
          if (result1.valid && result2.valid && result1.lotSize > 0 && result2.lotSize > 0) {
            const distanceRatio = slDistance2 / slDistance1;
            const lotSizeRatio = result1.lotSize / result2.lotSize; // Note: inverse
            
            // Allow 10% tolerance for rounding and constraints
            return Math.abs(distanceRatio - lotSizeRatio) < 0.1 * distanceRatio;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
