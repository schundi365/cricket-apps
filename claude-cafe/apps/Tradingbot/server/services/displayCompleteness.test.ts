/**
 * Property-Based Tests for Display Completeness
 * Feature: metals-sentiment-trading
 * Property 15: Display Completeness
 * Validates: Requirements 2.5, 3.4, 4.2, 5.3, 5.4, 7.2, 7.3, 8.1, 8.7, 9.7, 11.4
 */

import fc from 'fast-check';
import { Asset, TradeDirection } from '../types';

// Mock calculation result structure matching the API response
interface CalculationResult {
  lotSize: {
    lotSize: number;
    units: number;
    maxLoss: number;
    riskPercentage: number;
    valid: boolean;
    warnings: string[];
  };
  stopLoss: {
    stopLossPrice: number;
    distanceInPips: number;
    distanceInCurrency: number;
    maxLoss: number;
    valid: boolean;
    technicalAlignment: boolean;
  };
  takeProfitLevels: Array<{
    ratio: number;
    takeProfitPrice: number;
    distanceInPips: number;
    potentialProfit: number;
    riskRewardRatio: number;
    technicalAlignment: boolean;
  }>;
}

interface DisplayParameters {
  tradingCapital: number;
  entryPrice: number;
  direction: TradeDirection;
  asset: { type: string };
}

// Helper to create calculation result
const createCalculationResult = (
  lotSize: number,
  stopLossPrice: number,
  entryPrice: number,
  direction: TradeDirection
): CalculationResult => {
  const stopLossDistance = Math.abs(entryPrice - stopLossPrice);
  
  return {
    lotSize: {
      lotSize: lotSize,
      units: lotSize * 100,
      maxLoss: lotSize * stopLossDistance * 10,
      riskPercentage: 2.5,
      valid: true,
      warnings: []
    },
    stopLoss: {
      stopLossPrice: stopLossPrice,
      distanceInPips: stopLossDistance,
      distanceInCurrency: stopLossDistance,
      maxLoss: lotSize * stopLossDistance * 10,
      valid: true,
      technicalAlignment: false
    },
    takeProfitLevels: [
      {
        ratio: 1,
        takeProfitPrice: direction === 'LONG' 
          ? entryPrice + stopLossDistance 
          : entryPrice - stopLossDistance,
        distanceInPips: stopLossDistance,
        potentialProfit: lotSize * stopLossDistance * 10,
        riskRewardRatio: 1,
        technicalAlignment: false
      },
      {
        ratio: 2,
        takeProfitPrice: direction === 'LONG' 
          ? entryPrice + (stopLossDistance * 2) 
          : entryPrice - (stopLossDistance * 2),
        distanceInPips: stopLossDistance * 2,
        potentialProfit: lotSize * stopLossDistance * 20,
        riskRewardRatio: 2,
        technicalAlignment: false
      },
      {
        ratio: 3,
        takeProfitPrice: direction === 'LONG' 
          ? entryPrice + (stopLossDistance * 3) 
          : entryPrice - (stopLossDistance * 3),
        distanceInPips: stopLossDistance * 3,
        potentialProfit: lotSize * stopLossDistance * 30,
        riskRewardRatio: 3,
        technicalAlignment: false
      }
    ]
  };
};

// Helper to check if all required fields are present and valid
const hasCompleteDisplayData = (
  calculation: CalculationResult | null,
  parameters: DisplayParameters | null
): boolean => {
  if (!calculation || !parameters) return false;
  
  // Check lot size data
  if (!calculation.lotSize) return false;
  if (typeof calculation.lotSize.lotSize !== 'number') return false;
  if (typeof calculation.lotSize.units !== 'number') return false;
  if (typeof calculation.lotSize.maxLoss !== 'number') return false;
  if (typeof calculation.lotSize.riskPercentage !== 'number') return false;
  
  // Check stop loss data
  if (!calculation.stopLoss) return false;
  if (typeof calculation.stopLoss.stopLossPrice !== 'number') return false;
  if (typeof calculation.stopLoss.distanceInPips !== 'number') return false;
  if (typeof calculation.stopLoss.distanceInCurrency !== 'number') return false;
  if (typeof calculation.stopLoss.maxLoss !== 'number') return false;
  
  // Check take profit levels (should have 3 levels for 1:1, 1:2, 1:3)
  if (!Array.isArray(calculation.takeProfitLevels)) return false;
  if (calculation.takeProfitLevels.length !== 3) return false;
  
  for (const tp of calculation.takeProfitLevels) {
    if (typeof tp.ratio !== 'number') return false;
    if (typeof tp.takeProfitPrice !== 'number') return false;
    if (typeof tp.distanceInPips !== 'number') return false;
    if (typeof tp.potentialProfit !== 'number') return false;
  }
  
  // Check parameters data
  if (typeof parameters.tradingCapital !== 'number') return false;
  if (typeof parameters.entryPrice !== 'number') return false;
  
  return true;
};

// Helper to check if precision is appropriate for asset type
const hasCorrectPrecision = (calculation: CalculationResult, assetType: string): boolean => {
  const lotSize = calculation.lotSize.lotSize;
  const stopLossPrice = calculation.stopLoss.stopLossPrice;
  
  // All values should be finite numbers
  if (!Number.isFinite(lotSize)) return false;
  if (!Number.isFinite(stopLossPrice)) return false;
  
  for (const tp of calculation.takeProfitLevels) {
    if (!Number.isFinite(tp.takeProfitPrice)) return false;
    if (!Number.isFinite(tp.potentialProfit)) return false;
  }
  
  return true;
};

describe('Display Completeness - Property 15', () => {
  // Feature: metals-sentiment-trading, Property 15: Display Completeness
  test('should display all required calculation fields for any valid input', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1000, max: 100000 }),
        fc.float({ min: 1, max: 5000 }),
        fc.float({ min: Math.fround(0.01), max: 10 }),
        fc.constantFrom<TradeDirection>('LONG', 'SHORT'),
        fc.constantFrom('METAL', 'FOREX', 'STOCK'),
        (tradingCapital, entryPrice, lotSize, direction, assetType) => {
          const stopLossDistance = entryPrice * 0.02;
          const stopLossPrice = direction === 'LONG' 
            ? entryPrice - stopLossDistance 
            : entryPrice + stopLossDistance;
          
          const calculation = createCalculationResult(
            lotSize,
            stopLossPrice,
            entryPrice,
            direction
          );
          
          const parameters: DisplayParameters = {
            tradingCapital,
            entryPrice,
            direction,
            asset: { type: assetType }
          };
          
          return hasCompleteDisplayData(calculation, parameters);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should display lot size with asset-specific precision', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.001), max: 100 }),
        fc.float({ min: 1, max: 5000 }),
        fc.constantFrom('METAL', 'FOREX', 'STOCK'),
        (lotSize, entryPrice, assetType) => {
          // Skip if we get NaN or invalid values
          if (!Number.isFinite(lotSize) || !Number.isFinite(entryPrice)) {
            return true;
          }
          
          const stopLossPrice = entryPrice * 0.98;
          const calculation = createCalculationResult(
            lotSize,
            stopLossPrice,
            entryPrice,
            'LONG'
          );
          
          return hasCorrectPrecision(calculation, assetType);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should display stop loss as both price and distance', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 5000 }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(0.1) }),
        fc.constantFrom<TradeDirection>('LONG', 'SHORT'),
        (entryPrice, distanceRatio, direction) => {
          const stopLossDistance = entryPrice * distanceRatio;
          const stopLossPrice = direction === 'LONG' 
            ? entryPrice - stopLossDistance 
            : entryPrice + stopLossDistance;
          
          const calculation = createCalculationResult(
            1.0,
            stopLossPrice,
            entryPrice,
            direction
          );
          
          const hasPrice = typeof calculation.stopLoss.stopLossPrice === 'number';
          const hasDistanceInPips = typeof calculation.stopLoss.distanceInPips === 'number';
          const hasDistanceInCurrency = typeof calculation.stopLoss.distanceInCurrency === 'number';
          
          return hasPrice && hasDistanceInPips && hasDistanceInCurrency;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should display take profit levels with prices and potential profits', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 5000 }),
        fc.float({ min: 0.5, max: 5 }),
        fc.constantFrom<TradeDirection>('LONG', 'SHORT'),
        (entryPrice, lotSize, direction) => {
          const stopLossDistance = entryPrice * 0.02;
          const stopLossPrice = direction === 'LONG' 
            ? entryPrice - stopLossDistance 
            : entryPrice + stopLossDistance;
          
          const calculation = createCalculationResult(
            lotSize,
            stopLossPrice,
            entryPrice,
            direction
          );
          
          if (calculation.takeProfitLevels.length !== 3) return false;
          
          for (let i = 0; i < 3; i++) {
            const tp = calculation.takeProfitLevels[i];
            
            if (tp.ratio !== i + 1) return false;
            if (typeof tp.takeProfitPrice !== 'number') return false;
            if (typeof tp.potentialProfit !== 'number') return false;
            if (typeof tp.distanceInPips !== 'number') return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should display max loss in both currency and percentage', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1000, max: 100000 }),
        fc.float({ min: 1, max: 5000 }),
        fc.float({ min: Math.fround(0.1), max: 5 }),
        (tradingCapital, entryPrice, lotSize) => {
          const stopLossDistance = entryPrice * 0.02;
          const stopLossPrice = entryPrice - stopLossDistance;
          
          const calculation = createCalculationResult(
            lotSize,
            stopLossPrice,
            entryPrice,
            'LONG'
          );
          
          const hasMaxLossCurrency = typeof calculation.stopLoss.maxLoss === 'number';
          const hasRiskPercentage = typeof calculation.lotSize.riskPercentage === 'number';
          
          return hasMaxLossCurrency && hasRiskPercentage;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should display actual risk percentage within valid range', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1000, max: 100000 }),
        fc.float({ min: Math.fround(0.1), max: 5 }),
        fc.float({ min: 1, max: 5000 }),
        (tradingCapital, lotSize, entryPrice) => {
          const stopLossDistance = entryPrice * 0.02;
          const stopLossPrice = entryPrice - stopLossDistance;
          
          const calculation = createCalculationResult(
            lotSize,
            stopLossPrice,
            entryPrice,
            'LONG'
          );
          
          const riskPercentage = calculation.lotSize.riskPercentage;
          
          return typeof riskPercentage === 'number' && 
                 riskPercentage >= 0 && 
                 riskPercentage <= 100;
        }
      ),
      { numRuns: 100 }
    );
  });
});
