const express = require('express');
const router = express.Router();
const { TrendingAssetsService } = require('../services/trendingService');
const { PriceDataService } = require('../services/priceService');
const { SentimentAnalysisService } = require('../services/sentimentService');

const priceService = new PriceDataService();
const sentimentService = new SentimentAnalysisService(priceService);
const trendingService = new TrendingAssetsService(priceService, sentimentService);

// GET /api/v1/trending (with query params for filters)
router.get('/', async (req, res) => {
  try {
    const { assetTypes, minMomentum, minSafetyScore, trendDirection } = req.query;
    
    const filters = {};
    
    // Parse assetTypes if provided
    if (assetTypes) {
      const types = assetTypes.split(',').map(t => t.trim().toUpperCase());
      const validTypes = ['METAL', 'FOREX', 'STOCK'];
      
      const invalidTypes = types.filter(t => !validTypes.includes(t));
      if (invalidTypes.length > 0) {
        return res.status(400).json({
          error: 'Invalid asset types',
          message: `Invalid types: ${invalidTypes.join(', ')}. Valid types: ${validTypes.join(', ')}`
        });
      }
      
      filters.assetTypes = types;
    }
    
    // Parse minMomentum if provided
    if (minMomentum !== undefined) {
      const momentum = parseFloat(minMomentum);
      if (isNaN(momentum) || momentum < 0 || momentum > 100) {
        return res.status(400).json({
          error: 'Invalid minMomentum',
          message: 'minMomentum must be a number between 0 and 100'
        });
      }
      filters.minMomentum = momentum;
    }
    
    // Parse minSafetyScore if provided
    if (minSafetyScore !== undefined) {
      const safetyScore = parseFloat(minSafetyScore);
      if (isNaN(safetyScore) || safetyScore < 0 || safetyScore > 100) {
        return res.status(400).json({
          error: 'Invalid minSafetyScore',
          message: 'minSafetyScore must be a number between 0 and 100'
        });
      }
      filters.minSafetyScore = safetyScore;
    }
    
    // Parse trendDirection if provided
    if (trendDirection) {
      const direction = trendDirection.toUpperCase();
      const validDirections = ['UP', 'DOWN', 'BOTH'];
      
      if (!validDirections.includes(direction)) {
        return res.status(400).json({
          error: 'Invalid trendDirection',
          message: `trendDirection must be one of: ${validDirections.join(', ')}`
        });
      }
      
      filters.trendDirection = direction;
    }
    
    const trendingAssets = await trendingService.getTrendingAssets(filters);
    
    res.json({
      success: true,
      data: trendingAssets,
      count: trendingAssets.length,
      filters: filters
    });
  } catch (error) {
    console.error('Trending endpoint error:', error);
    
    res.status(500).json({
      error: 'Failed to fetch trending assets',
      message: error.message
    });
  }
});

// GET /api/v1/trending/:assetType
router.get('/:assetType', async (req, res) => {
  try {
    const { assetType } = req.params;
    const validTypes = ['METAL', 'FOREX', 'STOCK'];
    
    const type = assetType.toUpperCase();
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid asset type',
        message: `Asset type must be one of: ${validTypes.join(', ')}`,
        received: assetType
      });
    }
    
    const filters = {
      assetTypes: [type]
    };
    
    const trendingAssets = await trendingService.getTrendingAssets(filters);
    
    res.json({
      success: true,
      data: trendingAssets,
      count: trendingAssets.length,
      assetType: type
    });
  } catch (error) {
    console.error('Trending by type endpoint error:', error);
    
    res.status(500).json({
      error: 'Failed to fetch trending assets',
      message: error.message
    });
  }
});

module.exports = router;
