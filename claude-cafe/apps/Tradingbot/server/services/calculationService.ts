/**
 * Risk Calculation Engine
 * Calculates lot sizes, stop loss, and take profit levels with 3% risk limit enforcement
 */

import {
  Asset,
  LotSizeParams,
  LotSizeResult,
  StopLossParams,
  StopLossResult,
  TakeProfitParams,
  TakeProfitResult,
  TradeDirection,
  ValidationError
} from '../types';
import { getAssetConfig } from '../config/assetConfig';

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate numeric input
 */
function validateNumericInput(value: number, fieldName: string): ValidationError | null {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid number`,
      code: 'INVALID_TYPE'
    };
  }
  
  if (value <= 0) {
    return {
      field: fieldName,
      message: `${fieldName} must be greater than zero`,
      code: 'INVALID_VALUE'
    };
  }
  
  return null;
}

/**
 * Validate asset configuration exists
 */
function validateAsset(asset: Asset): ValidationError | null {
  const config = getAssetConfig(asset.symbol);
  
  if (!config) {
    return {
      field: 'asset',
      message: `Asset ${asset.symbol} is not supported`,
      code: 'UNSUPPORTED_ASSET'
    };
  }
  
  return null;
}

// ============================================================================
// Lot Size Calculation
// ============================================================================

/**
 * Calculate lot size based on trading capital, entry price, stop loss distance, and 3% risk limit
 * 
 * Formula: Lot Size = (Trading Capital × Risk %) / (Stop Loss Distance × Pip Value)
 * 
 * @param params - Lot size calculation parameters
 * @returns Lot size result with validation status
 */
export function calculateLotSize(params: LotSizeParams): LotSizeResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  // Validate inputs
  const capitalError = validateNumericInput(params.tradingCapital, 'tradingCapital');
  if (capitalError) errors.push(capitalError);
  
  const entryError = validateNumericInput(params.entryPrice, 'entryPrice');
  if (entryError) errors.push(entryError);
  
  const slError = validateNumericInput(params.stopLossDistance, 'stopLossDistance');
  if (slError) errors.push(slError);
  
  const assetError = validateAsset(params.asset);
  if (assetError) errors.push(assetError);
  
  // If validation failed, return invalid result
  if (errors.length > 0) {
    return {
      lotSize: 0,
      units: 0,
      maxLoss: 0,
      riskPercentage: 0,
      valid: false,
      warnings: []
    };
  }
  
  // Get asset configuration
  const config = getAssetConfig(params.asset.symbol)!;
  
  // Calculate maximum risk amount
  const maxRiskAmount = params.tradingCapital * (params.riskPercentage / 100);
  
  // Calculate lot size
  // Lot Size = Risk Amount / (Stop Loss Distance × Pip Value)
  const lotSize = maxRiskAmount / (params.stopLossDistance * config.pipValue);
  
  // Round to lot step size
  const roundedLotSize = Math.floor(lotSize / config.lotStepSize) * config.lotStepSize;
  
  // Calculate actual values
  const actualLotSize = Math.max(config.minLotSize, Math.min(roundedLotSize, config.maxLotSize));
  const units = actualLotSize * config.contractSize;
  const maxLoss = actualLotSize * params.stopLossDistance * config.pipValue;
  const actualRiskPercentage = (maxLoss / params.tradingCapital) * 100;
  
  // Check if the actual risk exceeds the limit due to minimum lot size constraint
  if (actualRiskPercentage > params.riskPercentage) {
    warnings.push(`Cannot achieve ${params.riskPercentage}% risk with current parameters. Actual risk would be ${actualRiskPercentage.toFixed(2)}%. Consider reducing stop loss distance or increasing capital.`);
    
    // Return zero lot size to prevent exceeding risk limit
    return {
      lotSize: 0,
      units: 0,
      maxLoss: 0,
      riskPercentage: 0,
      valid: true,
      warnings
    };
  }
  
  // Check for warnings
  if (actualLotSize < roundedLotSize) {
    if (actualLotSize === config.minLotSize) {
      warnings.push(`Lot size adjusted to minimum allowed: ${config.minLotSize}`);
    } else if (actualLotSize === config.maxLotSize) {
      warnings.push(`Lot size adjusted to maximum allowed: ${config.maxLotSize}`);
    }
  }
  
  if (roundedLotSize <= 0) {
    warnings.push('Stop loss distance is too large for the given capital and risk percentage');
  }
  
  return {
    lotSize: actualLotSize,
    units,
    maxLoss,
    riskPercentage: actualRiskPercentage,
    valid: true,
    warnings
  };
}

// ============================================================================
// Stop Loss Calculation
// ============================================================================

/**
 * Calculate stop loss price based on entry price, trading capital, and direction
 * 
 * @param params - Stop loss calculation parameters
 * @returns Stop loss result with price and distance
 */
export function calculateStopLoss(params: StopLossParams): StopLossResult {
  const errors: ValidationError[] = [];
  
  // Validate inputs
  const entryError = validateNumericInput(params.entryPrice, 'entryPrice');
  if (entryError) errors.push(entryError);
  
  const capitalError = validateNumericInput(params.tradingCapital, 'tradingCapital');
  if (capitalError) errors.push(capitalError);
  
  const lotSizeError = validateNumericInput(params.lotSize, 'lotSize');
  if (lotSizeError) errors.push(lotSizeError);
  
  const assetError = validateAsset(params.asset);
  if (assetError) errors.push(assetError);
  
  // If validation failed, return invalid result
  if (errors.length > 0) {
    return {
      stopLossPrice: 0,
      distanceInPips: 0,
      distanceInCurrency: 0,
      maxLoss: 0,
      valid: false,
      technicalAlignment: false
    };
  }
  
  // Get asset configuration
  const config = getAssetConfig(params.asset.symbol)!;
  
  // Calculate maximum risk amount
  const maxRiskAmount = params.tradingCapital * (params.riskPercentage / 100);
  
  // Calculate stop loss distance in pips
  // Distance = Risk Amount / (Lot Size × Pip Value)
  const distanceInPips = maxRiskAmount / (params.lotSize * config.pipValue);
  
  // Calculate stop loss price based on direction
  let stopLossPrice: number;
  if (params.direction === 'LONG') {
    stopLossPrice = params.entryPrice - (distanceInPips * config.pipSize);
  } else {
    stopLossPrice = params.entryPrice + (distanceInPips * config.pipSize);
  }
  
  // Validate stop loss placement
  const valid = params.direction === 'LONG' 
    ? stopLossPrice < params.entryPrice 
    : stopLossPrice > params.entryPrice;
  
  // Calculate distance in currency
  const distanceInCurrency = distanceInPips * config.pipSize;
  
  // Calculate max loss
  const maxLoss = params.lotSize * distanceInPips * config.pipValue;
  
  // Check technical alignment if provided
  const technicalAlignment = params.technicalStopLoss 
    ? Math.abs(stopLossPrice - params.technicalStopLoss) / params.entryPrice < 0.02 // Within 2%
    : false;
  
  return {
    stopLossPrice,
    distanceInPips,
    distanceInCurrency,
    maxLoss,
    valid,
    technicalAlignment
  };
}

// ============================================================================
// Take Profit Calculation
// ============================================================================

/**
 * Calculate take profit price based on entry price, stop loss, and risk-reward ratio
 * 
 * Formula: Take Profit Distance = Stop Loss Distance × Risk-Reward Ratio
 * 
 * Note: This function requires asset and lotSize to be added to TakeProfitParams
 * for proper pip and profit calculations. For now, it returns simplified values.
 * 
 * @param params - Take profit calculation parameters
 * @returns Take profit result with price and potential profit
 */
export function calculateTakeProfit(params: TakeProfitParams): TakeProfitResult {
  // Calculate stop loss distance
  const stopLossDistance = Math.abs(params.entryPrice - params.stopLossPrice);
  
  // Calculate take profit distance
  const takeProfitDistance = stopLossDistance * params.riskRewardRatio;
  
  // Calculate take profit price based on direction
  let takeProfitPrice: number;
  if (params.direction === 'LONG') {
    takeProfitPrice = params.entryPrice + takeProfitDistance;
  } else {
    takeProfitPrice = params.entryPrice - takeProfitDistance;
  }
  
  // Validate take profit price
  const valid = takeProfitPrice > 0;
  
  // For proper calculations, we need asset config and lot size
  // These should be added to TakeProfitParams in future iterations
  const distanceInPips = takeProfitDistance;
  const potentialProfit = takeProfitDistance;
  
  // Check technical alignment if provided
  const technicalAlignment = params.technicalTargets && params.technicalTargets.length > 0
    ? params.technicalTargets.some(target => Math.abs(takeProfitPrice - target) / params.entryPrice < 0.02)
    : false;
  
  return {
    takeProfitPrice,
    distanceInPips,
    potentialProfit,
    riskRewardRatio: params.riskRewardRatio,
    technicalAlignment
  };
}
