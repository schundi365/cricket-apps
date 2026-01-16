const express = require('express');
const router = express.Router();
const { TimingService } = require('../services/timingService');
const { PriceDataService } = require('../services/priceService');
const { SentimentAnalysisService } = require('../services/sentimentService');
const { SafetyScoreService } = require('../services/safetyService');

const priceService = new PriceDataService();
const sentimentService = new SentimentAnalysisService(priceService);
const safetyService = new SafetyScoreService(priceService, sentimentService);
const timingService = new TimingService(priceService, sentimentService, safetyService);

// Validation middleware
const validateAssetType = (req, res, next) => {
  const { assetType } = req.params;
  const validTypes = ['METAL', 'FOREX', 'STOCK'];
  
  if (!validTypes.includes(assetType.toUpperCase())) {
    return res.status(400).json({
      error: 'Invalid asset type',
      message: `Asset type must be one of: ${validTypes.join(', ')}`,
      received: assetType
    });
  }
  
  req.params.assetType = assetType.toUpperCase();
  next();
};

const validateSymbol = (req, res, next) => {
  const { symbol } = req.params;
  
  if (!symbol || symbol.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid symbol',
      message: 'Symbol is required and cannot be empty'
    });
  }
  
  next();
};

// GET /api/v1/assets/:assetType/:symbol/entry
router.get('/assets/:assetType/:symbol/entry', validateAssetType, validateSymbol, async (req, res) => {
  try {
    const { assetType, symbol } = req.params;
    
    const asset = {
      type: assetType,
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase()
    };
    
    const entryRecommendation = await timingService.getEntryRecommendation(asset);
    
    res.json({
      success: true,
      data: entryRecommendation
    });
  } catch (error) {
    console.error('Entry timing endpoint error:', error);
    
    if (error.message.includes('not found') || error.message.includes('not supported')) {
      return res.status(404).json({
        error: 'Asset not found',
        message: error.message
      });
    }
    
    if (error.message.includes('Insufficient')) {
      return res.status(400).json({
        error: 'Insufficient data',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to get entry recommendation',
      message: error.message
    });
  }
});

// GET /api/v1/assets/:assetType/:symbol/exit
router.get('/assets/:assetType/:symbol/exit', validateAssetType, validateSymbol, async (req, res) => {
  try {
    const { assetType, symbol } = req.params;
    const { entryPrice, direction } = req.query;
    
    // Validate required query parameters
    if (!entryPrice) {
      return res.status(400).json({
        error: 'Missing entryPrice parameter',
        message: 'entryPrice is required as a query parameter'
      });
    }
    
    if (!direction) {
      return res.status(400).json({
        error: 'Missing direction parameter',
        message: 'direction is required as a query parameter (LONG or SHORT)'
      });
    }
    
    const parsedEntryPrice = parseFloat(entryPrice);
    if (isNaN(parsedEntryPrice) || parsedEntryPrice <= 0) {
      return res.status(400).json({
        error: 'Invalid entryPrice',
        message: 'entryPrice must be a positive number'
      });
    }
    
    const parsedDirection = direction.toUpperCase();
    if (parsedDirection !== 'LONG' && parsedDirection !== 'SHORT') {
      return res.status(400).json({
        error: 'Invalid direction',
        message: 'direction must be either LONG or SHORT'
      });
    }
    
    const asset = {
      type: assetType,
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase()
    };
    
    const exitRecommendation = await timingService.getExitRecommendation(
      asset,
      parsedEntryPrice,
      parsedDirection
    );
    
    res.json({
      success: true,
      data: exitRecommendation
    });
  } catch (error) {
    console.error('Exit timing endpoint error:', error);
    
    if (error.message.includes('not found') || error.message.includes('not supported')) {
      return res.status(404).json({
        error: 'Asset not found',
        message: error.message
      });
    }
    
    if (error.message.includes('Insufficient')) {
      return res.status(400).json({
        error: 'Insufficient data',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to get exit recommendation',
      message: error.message
    });
  }
});

module.exports = router;
