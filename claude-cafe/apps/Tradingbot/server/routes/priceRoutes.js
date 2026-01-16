const express = require('express');
const router = express.Router();
const { PriceDataService } = require('../services/priceService');
const { AssetType } = require('../types');

const priceService = new PriceDataService();

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

// GET /api/v1/assets/:assetType/:symbol/price
router.get('/:assetType/:symbol/price', validateAssetType, validateSymbol, async (req, res) => {
  try {
    const { assetType, symbol } = req.params;
    
    const asset = {
      type: assetType,
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase()
    };
    
    const price = await priceService.getCurrentPrice(asset);
    
    res.json({
      success: true,
      data: price
    });
  } catch (error) {
    console.error('Price endpoint error:', error);
    
    if (error.message.includes('not found') || error.message.includes('not supported')) {
      return res.status(404).json({
        error: 'Asset not found',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch price',
      message: error.message
    });
  }
});

// GET /api/v1/assets/:assetType/:symbol/history
router.get('/:assetType/:symbol/history', validateAssetType, validateSymbol, async (req, res) => {
  try {
    const { assetType, symbol } = req.params;
    const { period = '1D' } = req.query;
    
    const validPeriods = ['1H', '4H', '1D', '1W', '1M'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        error: 'Invalid period',
        message: `Period must be one of: ${validPeriods.join(', ')}`,
        received: period
      });
    }
    
    const asset = {
      type: assetType,
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase()
    };
    
    const history = await priceService.getPriceHistory(asset, period);
    
    res.json({
      success: true,
      data: {
        asset,
        period,
        history,
        count: history.length
      }
    });
  } catch (error) {
    console.error('Price history endpoint error:', error);
    
    if (error.message.includes('not found') || error.message.includes('not supported')) {
      return res.status(404).json({
        error: 'Asset not found',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch price history',
      message: error.message
    });
  }
});

module.exports = router;
