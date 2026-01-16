const express = require('express');
const router = express.Router();
const { SentimentAnalysisService } = require('../services/sentimentService');
const { PriceDataService } = require('../services/priceService');

const sentimentService = new SentimentAnalysisService(new PriceDataService());

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

// GET /api/v1/assets/:assetType/:symbol/sentiment
router.get('/assets/:assetType/:symbol/sentiment', validateAssetType, validateSymbol, async (req, res) => {
  try {
    const { assetType, symbol } = req.params;
    
    const asset = {
      type: assetType,
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase()
    };
    
    const sentiment = await sentimentService.getSentiment(asset);
    
    res.json({
      success: true,
      data: sentiment
    });
  } catch (error) {
    console.error('Sentiment endpoint error:', error);
    
    if (error.message.includes('not found') || error.message.includes('not supported')) {
      return res.status(404).json({
        error: 'Asset not found',
        message: error.message
      });
    }
    
    if (error.message.includes('Insufficient price history')) {
      return res.status(400).json({
        error: 'Insufficient data',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch sentiment',
      message: error.message
    });
  }
});

// GET /api/v1/sentiment/bulk
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
    
    const sentimentMap = await sentimentService.getBulkSentiment(assetList);
    
    // Convert Map to object for JSON response
    const sentimentData = {};
    sentimentMap.forEach((value, key) => {
      sentimentData[key] = value;
    });
    
    res.json({
      success: true,
      data: sentimentData,
      count: Object.keys(sentimentData).length
    });
  } catch (error) {
    console.error('Bulk sentiment endpoint error:', error);
    
    if (error.message.includes('Invalid asset format')) {
      return res.status(400).json({
        error: 'Invalid request format',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch bulk sentiment',
      message: error.message
    });
  }
});

module.exports = router;
