const express = require('express');
const router = express.Router();
const { AssetConfigService } = require('../config/assetConfig');

const configService = new AssetConfigService();

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

// GET /api/v1/assets/:assetType/:symbol/config
router.get('/:assetType/:symbol/config', validateAssetType, validateSymbol, async (req, res) => {
  try {
    const { assetType, symbol } = req.params;
    
    const asset = {
      type: assetType,
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase()
    };
    
    const config = configService.getConfig(asset);
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Config endpoint error:', error);
    
    if (error.message.includes('not found') || error.message.includes('not supported')) {
      return res.status(404).json({
        error: 'Asset configuration not found',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch asset configuration',
      message: error.message
    });
  }
});

// GET /api/v1/assets/supported
router.get('/supported', (req, res) => {
  try {
    const { type } = req.query;
    
    const supportedAssets = {
      metals: [
        { symbol: 'GOLD', name: 'Gold', type: 'METAL' },
        { symbol: 'SILVER', name: 'Silver', type: 'METAL' },
        { symbol: 'COPPER', name: 'Copper', type: 'METAL' },
        { symbol: 'PLATINUM', name: 'Platinum', type: 'METAL' },
        { symbol: 'PALLADIUM', name: 'Palladium', type: 'METAL' }
      ],
      forex: [
        { symbol: 'EURUSD', name: 'EUR/USD', type: 'FOREX' },
        { symbol: 'GBPUSD', name: 'GBP/USD', type: 'FOREX' },
        { symbol: 'USDJPY', name: 'USD/JPY', type: 'FOREX' },
        { symbol: 'AUDUSD', name: 'AUD/USD', type: 'FOREX' },
        { symbol: 'USDCHF', name: 'USD/CHF', type: 'FOREX' },
        { symbol: 'USDCAD', name: 'USD/CAD', type: 'FOREX' },
        { symbol: 'NZDUSD', name: 'NZD/USD', type: 'FOREX' }
      ],
      stocks: [
        { symbol: 'SPX', name: 'S&P 500', type: 'STOCK' },
        { symbol: 'NDX', name: 'NASDAQ 100', type: 'STOCK' },
        { symbol: 'DJI', name: 'Dow Jones', type: 'STOCK' },
        { symbol: 'FTSE', name: 'FTSE 100', type: 'STOCK' },
        { symbol: 'DAX', name: 'DAX', type: 'STOCK' },
        { symbol: 'N225', name: 'Nikkei 225', type: 'STOCK' }
      ]
    };
    
    // Filter by type if specified
    if (type) {
      const filterType = type.toLowerCase();
      if (!supportedAssets[filterType]) {
        return res.status(400).json({
          error: 'Invalid type filter',
          message: 'Type must be one of: metals, forex, stocks'
        });
      }
      
      return res.json({
        success: true,
        data: supportedAssets[filterType],
        count: supportedAssets[filterType].length,
        type: filterType
      });
    }
    
    // Return all assets
    const allAssets = [
      ...supportedAssets.metals,
      ...supportedAssets.forex,
      ...supportedAssets.stocks
    ];
    
    res.json({
      success: true,
      data: {
        all: allAssets,
        byType: supportedAssets
      },
      count: allAssets.length
    });
  } catch (error) {
    console.error('Supported assets endpoint error:', error);
    
    res.status(500).json({
      error: 'Failed to fetch supported assets',
      message: error.message
    });
  }
});

module.exports = router;
