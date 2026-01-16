const express = require('express');
const router = express.Router();
const { RiskCalculationEngine } = require('../services/calculationService');
const { AssetConfigService } = require('../config/assetConfig');
const { TimingService } = require('../services/timingService');
const { PriceDataService } = require('../services/priceService');
const { SentimentAnalysisService } = require('../services/sentimentService');
const { SafetyScoreService } = require('../services/safetyService');

const calculationEngine = new RiskCalculationEngine(new AssetConfigService());
const priceService = new PriceDataService();
const sentimentService = new SentimentAnalysisService(priceService);
const safetyService = new SafetyScoreService(priceService, sentimentService);
const timingService = new TimingService(priceService, sentimentService, safetyService);

// Validation helper
const validatePositiveNumber = (value, fieldName) => {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  return num;
};

const validateAsset = (asset) => {
  if (!asset || !asset.type || !asset.symbol) {
    throw new Error('Asset must include type and symbol');
  }
  
  const validTypes = ['METAL', 'FOREX', 'STOCK'];
  if (!validTypes.includes(asset.type.toUpperCase())) {
    throw new Error(`Asset type must be one of: ${validTypes.join(', ')}`);
  }
  
  return {
    type: asset.type.toUpperCase(),
    symbol: asset.symbol.toUpperCase(),
    name: asset.name || asset.symbol.toUpperCase()
  };
};

// POST /api/v1/calculate/lot-size
router.post('/lot-size', async (req, res) => {
  try {
    const { tradingCapital, entryPrice, stopLossDistance, asset, riskPercentage } = req.body;
    
    // Validate inputs
    const validatedCapital = validatePositiveNumber(tradingCapital, 'tradingCapital');
    const validatedEntry = validatePositiveNumber(entryPrice, 'entryPrice');
    const validatedStopLoss = validatePositiveNumber(stopLossDistance, 'stopLossDistance');
    const validatedAsset = validateAsset(asset);
    
    let validatedRisk = 3; // default
    if (riskPercentage !== undefined) {
      validatedRisk = validatePositiveNumber(riskPercentage, 'riskPercentage');
      if (validatedRisk > 3) {
        return res.status(400).json({
          error: 'Risk percentage exceeds limit',
          message: 'Risk percentage cannot exceed 3%'
        });
      }
    }
    
    const params = {
      tradingCapital: validatedCapital,
      entryPrice: validatedEntry,
      stopLossDistance: validatedStopLoss,
      asset: validatedAsset,
      riskPercentage: validatedRisk
    };
    
    const result = calculationEngine.calculateLotSize(params);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Lot size calculation error:', error);
    
    if (error.message.includes('must be')) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to calculate lot size',
      message: error.message
    });
  }
});

// POST /api/v1/calculate/stop-loss
router.post('/stop-loss', async (req, res) => {
  try {
    const { entryPrice, tradingCapital, lotSize, asset, direction, riskPercentage, technicalStopLoss } = req.body;
    
    // Validate inputs
    const validatedEntry = validatePositiveNumber(entryPrice, 'entryPrice');
    const validatedCapital = validatePositiveNumber(tradingCapital, 'tradingCapital');
    const validatedLotSize = validatePositiveNumber(lotSize, 'lotSize');
    const validatedAsset = validateAsset(asset);
    
    if (!direction || (direction.toUpperCase() !== 'LONG' && direction.toUpperCase() !== 'SHORT')) {
      return res.status(400).json({
        error: 'Invalid direction',
        message: 'direction must be either LONG or SHORT'
      });
    }
    
    let validatedRisk = 3; // default
    if (riskPercentage !== undefined) {
      validatedRisk = validatePositiveNumber(riskPercentage, 'riskPercentage');
      if (validatedRisk > 3) {
        return res.status(400).json({
          error: 'Risk percentage exceeds limit',
          message: 'Risk percentage cannot exceed 3%'
        });
      }
    }
    
    const params = {
      entryPrice: validatedEntry,
      tradingCapital: validatedCapital,
      lotSize: validatedLotSize,
      asset: validatedAsset,
      direction: direction.toUpperCase(),
      riskPercentage: validatedRisk,
      technicalStopLoss: technicalStopLoss ? parseFloat(technicalStopLoss) : undefined
    };
    
    const result = calculationEngine.calculateStopLoss(params);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Stop loss calculation error:', error);
    
    if (error.message.includes('must be') || error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to calculate stop loss',
      message: error.message
    });
  }
});

// POST /api/v1/calculate/take-profit
router.post('/take-profit', async (req, res) => {
  try {
    const { entryPrice, stopLossPrice, riskRewardRatio, direction, technicalTargets } = req.body;
    
    // Validate inputs
    const validatedEntry = validatePositiveNumber(entryPrice, 'entryPrice');
    const validatedStopLoss = validatePositiveNumber(stopLossPrice, 'stopLossPrice');
    const validatedRatio = validatePositiveNumber(riskRewardRatio, 'riskRewardRatio');
    
    if (!direction || (direction.toUpperCase() !== 'LONG' && direction.toUpperCase() !== 'SHORT')) {
      return res.status(400).json({
        error: 'Invalid direction',
        message: 'direction must be either LONG or SHORT'
      });
    }
    
    const params = {
      entryPrice: validatedEntry,
      stopLossPrice: validatedStopLoss,
      riskRewardRatio: validatedRatio,
      direction: direction.toUpperCase(),
      technicalTargets: technicalTargets ? technicalTargets.map(t => parseFloat(t)) : undefined
    };
    
    const result = calculationEngine.calculateTakeProfit(params);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Take profit calculation error:', error);
    
    if (error.message.includes('must be') || error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to calculate take profit',
      message: error.message
    });
  }
});

// POST /api/v1/calculate/full
router.post('/full', async (req, res) => {
  try {
    const { 
      tradingCapital, 
      entryPrice, 
      stopLossDistance, 
      asset, 
      direction,
      riskPercentage,
      useTimingRecommendations 
    } = req.body;
    
    // Validate inputs
    const validatedCapital = validatePositiveNumber(tradingCapital, 'tradingCapital');
    const validatedEntry = validatePositiveNumber(entryPrice, 'entryPrice');
    const validatedStopLoss = validatePositiveNumber(stopLossDistance, 'stopLossDistance');
    const validatedAsset = validateAsset(asset);
    
    if (!direction || (direction.toUpperCase() !== 'LONG' && direction.toUpperCase() !== 'SHORT')) {
      return res.status(400).json({
        error: 'Invalid direction',
        message: 'direction must be either LONG or SHORT'
      });
    }
    
    let validatedRisk = 3; // default
    if (riskPercentage !== undefined) {
      validatedRisk = validatePositiveNumber(riskPercentage, 'riskPercentage');
      if (validatedRisk > 3) {
        return res.status(400).json({
          error: 'Risk percentage exceeds limit',
          message: 'Risk percentage cannot exceed 3%'
        });
      }
    }
    
    // Calculate lot size
    const lotSizeResult = calculationEngine.calculateLotSize({
      tradingCapital: validatedCapital,
      entryPrice: validatedEntry,
      stopLossDistance: validatedStopLoss,
      asset: validatedAsset,
      riskPercentage: validatedRisk
    });
    
    // Calculate stop loss
    const stopLossResult = calculationEngine.calculateStopLoss({
      entryPrice: validatedEntry,
      tradingCapital: validatedCapital,
      lotSize: lotSizeResult.lotSize,
      asset: validatedAsset,
      direction: direction.toUpperCase(),
      riskPercentage: validatedRisk
    });
    
    // Calculate take profit levels for common ratios
    const takeProfitLevels = [1, 2, 3].map(ratio => {
      const tpResult = calculationEngine.calculateTakeProfit({
        entryPrice: validatedEntry,
        stopLossPrice: stopLossResult.stopLossPrice,
        riskRewardRatio: ratio,
        direction: direction.toUpperCase()
      });
      return {
        ratio,
        ...tpResult
      };
    });
    
    // Get timing recommendations if requested
    let entryRecommendation = null;
    let exitRecommendation = null;
    let safetyScore = null;
    
    if (useTimingRecommendations) {
      try {
        [entryRecommendation, exitRecommendation, safetyScore] = await Promise.all([
          timingService.getEntryRecommendation(validatedAsset),
          timingService.getExitRecommendation(validatedAsset, validatedEntry, direction.toUpperCase()),
          safetyService.calculateSafetyScore(validatedAsset)
        ]);
      } catch (error) {
        console.warn('Failed to fetch timing recommendations:', error.message);
        // Continue without timing recommendations
      }
    }
    
    // Validate overall risk
    const riskValidation = calculationEngine.validateRisk({
      asset: validatedAsset,
      tradingCapital: validatedCapital,
      entryPrice: validatedEntry,
      stopLossDistance: validatedStopLoss,
      direction: direction.toUpperCase(),
      riskPercentage: validatedRisk
    });
    
    res.json({
      success: true,
      data: {
        lotSize: lotSizeResult,
        stopLoss: stopLossResult,
        takeProfitLevels,
        riskValidation,
        entryRecommendation,
        exitRecommendation,
        safetyScore
      }
    });
  } catch (error) {
    console.error('Full calculation error:', error);
    
    if (error.message.includes('must be') || error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to perform full calculation',
      message: error.message
    });
  }
});

module.exports = router;
