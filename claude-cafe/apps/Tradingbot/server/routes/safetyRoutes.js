const express = require('express');
const router = express.Router();
const { SafetyScoreService } = require('../services/safetyService');
const { PriceDataService } = require('../services/priceService');
const { SentimentAnalysisService } = require('../services/sentimentService');

const priceService = new PriceDataService();
const sentimentService = new SentimentAnalysisService(priceService);
const safetyService = new SafetyScoreService(priceService, sentimentService);

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

// GET /api/v1/assets/:assetType/:symbol/safety
router.get('/assets/:assetType/:symbol/safety', validateAssetType, validateSymbol, async (req, res) => {
  try {
    const { assetType, symbol } = req.params;
    
    const asset = {
      type: assetType,
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase()
    };
    
    const safetyScore = await safetyService.calculateSafetyScore(asset);
    
    res.json({
      success: true,
      data: safetyScore
    });
  } catch (error) {
    console.error('Safety score endpoint error:', error);
    
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
      error: 'Failed to calculate safety score',
      message: error.message
    });
  }
});

// GET /api/v1/safety/bulk
router.get('/bulk', async (req, res) => {
  try {
    const { assets } = req.query;
    
    if (!assets) {
      return res.status(400).json({
        error: 'Missing assets parameter',
        message: 'Please provide assets as a comma-separated list (e.g., METAL:GOLD,FOREX:EURUSD)'
      });
    }
    
    // Parse assets from query string
    // Format: METAL:GOLD,FOREX:EURUSD,STOCK:SPX
    const assetList = assets.split(',').map(assetStr => {
      const [type, symbol] = assetStr.trim().split(':');
      if (!type || !symbol) {
        throw new Error(`Invalid asset format: ${assetStr}. Expected format: TYPE:SYMBOL`);
      }
      return {
        type: type.toUpperCase(),
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase()
      };
    });
    
    const safetyMap = await safetyService.getBulkSafetyScores(assetList);
    
    // Convert Map to object for JSON response
    const safetyData = {};
    safetyMap.forEach((value, key) => {
      safetyData[key] = value;
    });
    
    res.json({
      success: true,
      data: safetyData,
      count: Object.keys(safetyData).length
    });
  } catch (error) {
    console.error('Bulk safety score endpoint error:', error);
    
    if (error.message.includes('Invalid asset format')) {
      return res.status(400).json({
        error: 'Invalid request format',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch bulk safety scores',
      message: error.message
    });
  }
});

module.exports = router;
