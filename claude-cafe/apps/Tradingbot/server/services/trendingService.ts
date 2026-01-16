/**
 * Trending Assets Service
 * Identifies and ranks assets showing strong directional movement
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 10.7
 */

import {
  Asset,
  AssetType,
  TrendingAsset,
  TrendAnalysis,
  TrendingFilters,
  TrendCategory,
  TrendDirection,
  PricePoint,
  MarketSentiment
} from '../types';
import { PriceService } from './priceService';
import { SentimentService } from './sentimentService';
import { SafetyService } from './safetyService';

export class TrendingService {
  private priceService: PriceService;
  private sentimentService: SentimentService;
  private safetyService?: SafetyService;

  constructor(
    priceService: PriceService,
    sentimentService: SentimentService,
    safetyService?: SafetyService
  ) {
    this.priceService = priceService;
    this.sentimentService = sentimentService;
    this.safetyService = safetyService;
  }

  /**
   * Analyze trend for an individual asset
   * Validates: Requirements 7.1, 7.2, 7.3
   */
  async analyzeTrend(asset: Asset): Promise<TrendAnalysis> {
    try {
      // Fetch price history for trend analysis
      const history = await this.priceService.getPriceHistory(asset, '1W');

      if (history.length < 3) {
        throw new Error(`Insufficient price history for trend analysis of ${asset.symbol}`);
      }

      // Calculate momentum score (0-100)
      const momentum = this.calculateMomentumScore(history);

      // Determine trend direction and strength
      const direction = this.determineTrendDirection(history);
      const strength = this.calculateTrendStrength(history);

      // Identify support and resistance levels
      const { supportLevel, resistanceLevel } = this.identifySupportResistance(history);

      // Calculate trend line (slope and intercept)
      const trendLine = this.calculateTrendLine(history);

      // Estimate duration
      const duration = this.estimateTrendDuration(history, direction);

      return {
        direction,
        strength,
        duration,
        supportLevel,
        resistanceLevel,
        trendLine
      };
    } catch (error) {
      throw new Error(
        `Failed to analyze trend for ${asset.symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate momentum score (0-100)
   * Combines price velocity and acceleration
   * Validates: Requirements 7.2
   */
  private calculateMomentumScore(history: PricePoint[]): number {
    if (history.length < 2) return 50;

    // Calculate price velocity (rate of change)
    const firstPrice = history[0].close;
    const lastPrice = history[history.length - 1].close;
    const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;

    // Calculate acceleration (change in velocity)
    const midPoint = Math.floor(history.length / 2);
    const firstHalfChange = this.calculatePriceChange(history.slice(0, midPoint + 1));
    const secondHalfChange = this.calculatePriceChange(history.slice(midPoint));
    const acceleration = secondHalfChange - firstHalfChange;

    // Calculate volume trend if available
    const volumeTrend = this.calculateVolumeTrend(history);

    // Combine factors
    let momentum = 50; // Start neutral

    // Velocity contribution (±30 points)
    momentum += priceChange * 5;

    // Acceleration contribution (±15 points)
    momentum += acceleration * 3;

    // Volume trend contribution (±5 points)
    momentum += volumeTrend * 5;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, momentum));
  }

  /**
   * Calculate price change percentage
   */
  private calculatePriceChange(history: PricePoint[]): number {
    if (history.length < 2) return 0;

    const firstPrice = history[0].close;
    const lastPrice = history[history.length - 1].close;

    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }

  /**
   * Calculate volume trend (-1 to 1)
   * Returns 0 if volume data not available
   */
  private calculateVolumeTrend(history: PricePoint[]): number {
    // Filter points with volume data
    const withVolume = history.filter(p => p.volume !== undefined && p.volume > 0);

    if (withVolume.length < 2) return 0;

    // Compare first half to second half
    const midPoint = Math.floor(withVolume.length / 2);
    const firstHalfAvg =
      withVolume.slice(0, midPoint).reduce((sum, p) => sum + (p.volume || 0), 0) / midPoint;
    const secondHalfAvg =
      withVolume.slice(midPoint).reduce((sum, p) => sum + (p.volume || 0), 0) /
      (withVolume.length - midPoint);

    if (firstHalfAvg === 0) return 0;

    const volumeChange = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;

    // Clamp to -1 to 1
    return Math.max(-1, Math.min(1, volumeChange));
  }

  /**
   * Determine trend direction
   * Validates: Requirements 7.1, 7.2
   */
  private determineTrendDirection(history: PricePoint[]): TrendDirection {
    if (history.length < 2) return 'SIDEWAYS';

    const priceChange = this.calculatePriceChange(history);

    // Calculate trend line slope
    const trendLine = this.calculateTrendLine(history);
    const slope = trendLine.slope;

    // Determine direction based on price change and slope
    if (priceChange > 1 && slope > 0) {
      return 'UP';
    } else if (priceChange < -1 && slope < 0) {
      return 'DOWN';
    } else {
      return 'SIDEWAYS';
    }
  }

  /**
   * Calculate trend strength (0-100)
   * Based on consistency of price movement
   * Validates: Requirements 7.2, 7.3
   */
  private calculateTrendStrength(history: PricePoint[]): number {
    if (history.length < 3) return 0;

    // Calculate R-squared of trend line (how well prices fit the trend)
    const trendLine = this.calculateTrendLine(history);
    const rSquared = this.calculateRSquared(history, trendLine);

    // Calculate ADX-like measure (Average Directional Index)
    const adx = this.calculateADX(history);

    // Combine R-squared and ADX
    const strength = rSquared * 0.4 + adx * 0.6;

    return Math.max(0, Math.min(100, strength * 100));
  }

  /**
   * Calculate R-squared for trend line fit
   */
  private calculateRSquared(history: PricePoint[], trendLine: { slope: number; intercept: number }): number {
    if (history.length < 2) return 0;

    // Calculate mean of actual prices
    const meanPrice = history.reduce((sum, p) => sum + p.close, 0) / history.length;

    // Calculate total sum of squares and residual sum of squares
    let totalSS = 0;
    let residualSS = 0;

    history.forEach((point, index) => {
      const actual = point.close;
      const predicted = trendLine.slope * index + trendLine.intercept;

      totalSS += Math.pow(actual - meanPrice, 2);
      residualSS += Math.pow(actual - predicted, 2);
    });

    if (totalSS === 0) return 0;

    const rSquared = 1 - residualSS / totalSS;

    return Math.max(0, Math.min(1, rSquared));
  }

  /**
   * Calculate ADX (Average Directional Index)
   * Simplified version for trend strength
   */
  private calculateADX(history: PricePoint[], period: number = 14): number {
    if (history.length < period + 1) {
      period = Math.max(2, Math.floor(history.length / 2));
    }

    // Calculate directional movements
    const plusDM: number[] = [];
    const minusDM: number[] = [];
    const trueRanges: number[] = [];

    for (let i = 1; i < history.length; i++) {
      const highDiff = history[i].high - history[i - 1].high;
      const lowDiff = history[i - 1].low - history[i].low;

      // Plus Directional Movement
      plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);

      // Minus Directional Movement
      minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

      // True Range
      const tr = Math.max(
        history[i].high - history[i].low,
        Math.abs(history[i].high - history[i - 1].close),
        Math.abs(history[i].low - history[i - 1].close)
      );
      trueRanges.push(tr);
    }

    // Calculate smoothed averages
    const avgPlusDM = this.smoothedAverage(plusDM, period);
    const avgMinusDM = this.smoothedAverage(minusDM, period);
    const avgTR = this.smoothedAverage(trueRanges, period);

    if (avgTR === 0) return 0;

    // Calculate Directional Indicators
    const plusDI = (avgPlusDM / avgTR) * 100;
    const minusDI = (avgMinusDM / avgTR) * 100;

    // Calculate DX
    const diSum = plusDI + minusDI;
    if (diSum === 0) return 0;

    const dx = (Math.abs(plusDI - minusDI) / diSum) * 100;

    return dx;
  }

  /**
   * Calculate smoothed average (similar to EMA)
   */
  private smoothedAverage(values: number[], period: number): number {
    if (values.length === 0) return 0;
    if (values.length < period) {
      period = values.length;
    }

    // Start with simple average
    let avg = values.slice(0, period).reduce((sum, v) => sum + v, 0) / period;

    // Smooth remaining values
    for (let i = period; i < values.length; i++) {
      avg = (avg * (period - 1) + values[i]) / period;
    }

    return avg;
  }

  /**
   * Identify support and resistance levels
   * Validates: Requirements 7.3
   */
  private identifySupportResistance(history: PricePoint[]): {
    supportLevel: number;
    resistanceLevel: number;
  } {
    if (history.length < 3) {
      const price = history[history.length - 1].close;
      return {
        supportLevel: price * 0.98,
        resistanceLevel: price * 1.02
      };
    }

    // Find local minima (support) and maxima (resistance)
    const localMinima: number[] = [];
    const localMaxima: number[] = [];

    for (let i = 1; i < history.length - 1; i++) {
      const prev = history[i - 1].close;
      const curr = history[i].close;
      const next = history[i + 1].close;

      if (curr < prev && curr < next) {
        localMinima.push(history[i].low);
      }
      if (curr > prev && curr > next) {
        localMaxima.push(history[i].high);
      }
    }

    // Calculate support as average of recent lows
    const supportLevel =
      localMinima.length > 0
        ? localMinima.reduce((sum, v) => sum + v, 0) / localMinima.length
        : Math.min(...history.map(p => p.low));

    // Calculate resistance as average of recent highs
    const resistanceLevel =
      localMaxima.length > 0
        ? localMaxima.reduce((sum, v) => sum + v, 0) / localMaxima.length
        : Math.max(...history.map(p => p.high));

    return { supportLevel, resistanceLevel };
  }

  /**
   * Calculate trend line using linear regression
   * Validates: Requirements 7.3
   */
  private calculateTrendLine(history: PricePoint[]): { slope: number; intercept: number } {
    if (history.length < 2) {
      return { slope: 0, intercept: history[0]?.close || 0 };
    }

    const n = history.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    history.forEach((point, index) => {
      const x = index;
      const y = point.close;

      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    // Calculate slope and intercept
    const denominator = n * sumXX - sumX * sumX;

    if (denominator === 0) {
      return { slope: 0, intercept: sumY / n };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Estimate trend duration
   */
  private estimateTrendDuration(history: PricePoint[], direction: TrendDirection): string {
    if (direction === 'SIDEWAYS') {
      return 'N/A';
    }

    // Find when the trend started (when direction changed)
    let trendStart = 0;
    const currentDirection = direction === 'UP' ? 1 : -1;

    for (let i = history.length - 1; i > 0; i--) {
      const change = history[i].close - history[i - 1].close;
      const pointDirection = change > 0 ? 1 : -1;

      if (pointDirection !== currentDirection) {
        trendStart = i;
        break;
      }
    }

    const trendLength = history.length - trendStart;

    // Estimate duration based on data points
    if (trendLength <= 24) {
      return `${trendLength} hours`;
    } else if (trendLength <= 168) {
      const days = Math.floor(trendLength / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    } else {
      const weeks = Math.floor(trendLength / 168);
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    }
  }

  /**
   * Get trending assets with filtering
   * Validates: Requirements 7.1, 7.4, 7.5, 10.7
   */
  async getTrendingAssets(filters?: TrendingFilters): Promise<TrendingAsset[]> {
    try {
      // Get all supported assets
      const allAssets = this.getAllSupportedAssets();

      // Filter by asset type if specified
      const assetsToAnalyze = filters?.assetTypes
        ? allAssets.filter(asset => filters.assetTypes!.includes(asset.type))
        : allAssets;

      // Analyze all assets in parallel
      const trendingPromises = assetsToAnalyze.map(async asset => {
        try {
          return await this.analyzeTrendingAsset(asset);
        } catch (error) {
          console.error(`Failed to analyze ${asset.symbol}:`, error);
          return null;
        }
      });

      const results = await Promise.all(trendingPromises);

      // Filter out failed analyses
      let trendingAssets = results.filter((asset): asset is TrendingAsset => asset !== null);

      // Apply filters
      if (filters) {
        trendingAssets = this.applyFilters(trendingAssets, filters);
      }

      // Sort by momentum strength (highest to lowest)
      trendingAssets.sort((a, b) => b.momentum - a.momentum);

      return trendingAssets;
    } catch (error) {
      throw new Error(
        `Failed to get trending assets: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Analyze a single asset for trending
   */
  private async analyzeTrendingAsset(asset: Asset): Promise<TrendingAsset> {
    // Get price data
    const currentPrice = await this.priceService.getCurrentPrice(asset);
    const history24h = await this.priceService.getPriceHistory(asset, '1D');
    const history7d = await this.priceService.getPriceHistory(asset, '1W');

    // Calculate price changes
    const priceChange24h = this.calculatePriceChange(history24h);
    const priceChange7d = this.calculatePriceChange(history7d);

    // Calculate momentum
    const momentum = this.calculateMomentumScore(history7d);

    // Categorize trend
    const trendCategory = this.categorizeTrend(momentum, priceChange24h);

    // Get sentiment
    const sentiment = await this.sentimentService.getSentiment(asset);

    // Get safety score if service available
    let safetyScore = 50; // Default neutral score
    if (this.safetyService) {
      try {
        const safety = await this.safetyService.calculateSafetyScore(asset);
        safetyScore = safety.overallScore;
      } catch (error) {
        console.warn(`Failed to get safety score for ${asset.symbol}, using default`);
      }
    }

    return {
      asset,
      priceChange24h,
      priceChange7d,
      momentum,
      trendCategory,
      safetyScore,
      sentiment,
      currentPrice: currentPrice.price,
      timestamp: new Date()
    };
  }

  /**
   * Categorize trend based on momentum and price change
   * Validates: Requirements 7.4
   */
  private categorizeTrend(momentum: number, priceChange24h: number): TrendCategory {
    // Strong Uptrend: Momentum > 70, Price change > 3%
    if (momentum > 70 && priceChange24h > 3) {
      return 'STRONG_UPTREND';
    }

    // Moderate Uptrend: Momentum 50-70, Price change 1-3%
    if (momentum >= 50 && momentum <= 70 && priceChange24h >= 1 && priceChange24h <= 3) {
      return 'MODERATE_UPTREND';
    }

    // Strong Downtrend: Momentum > 70, Price change < -3%
    if (momentum > 70 && priceChange24h < -3) {
      return 'STRONG_DOWNTREND';
    }

    // Moderate Downtrend: Momentum 50-70, Price change -3% to -1%
    if (momentum >= 50 && momentum <= 70 && priceChange24h >= -3 && priceChange24h <= -1) {
      return 'MODERATE_DOWNTREND';
    }

    // Default to moderate based on direction
    if (priceChange24h > 0) {
      return 'MODERATE_UPTREND';
    } else {
      return 'MODERATE_DOWNTREND';
    }
  }

  /**
   * Apply filters to trending assets
   * Validates: Requirements 10.7
   */
  private applyFilters(assets: TrendingAsset[], filters: TrendingFilters): TrendingAsset[] {
    let filtered = assets;

    // Filter by minimum momentum
    if (filters.minMomentum !== undefined) {
      filtered = filtered.filter(asset => asset.momentum >= filters.minMomentum!);
    }

    // Filter by minimum safety score
    if (filters.minSafetyScore !== undefined) {
      filtered = filtered.filter(asset => asset.safetyScore >= filters.minSafetyScore!);
    }

    // Filter by trend direction
    if (filters.trendDirection) {
      if (filters.trendDirection === 'UP') {
        filtered = filtered.filter(
          asset =>
            asset.trendCategory === 'STRONG_UPTREND' || asset.trendCategory === 'MODERATE_UPTREND'
        );
      } else if (filters.trendDirection === 'DOWN') {
        filtered = filtered.filter(
          asset =>
            asset.trendCategory === 'STRONG_DOWNTREND' || asset.trendCategory === 'MODERATE_DOWNTREND'
        );
      }
    }

    return filtered;
  }

  /**
   * Get all supported assets
   */
  private getAllSupportedAssets(): Asset[] {
    const assets: Asset[] = [];

    // Metals
    const metals = ['GOLD', 'SILVER', 'COPPER', 'PLATINUM', 'PALLADIUM'];
    metals.forEach(symbol => {
      assets.push({
        type: 'METAL',
        symbol,
        name: symbol.charAt(0) + symbol.slice(1).toLowerCase()
      });
    });

    // Forex
    const forex = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF', 'USD/CAD', 'NZD/USD'];
    forex.forEach(symbol => {
      assets.push({
        type: 'FOREX',
        symbol,
        name: symbol
      });
    });

    // Stocks
    const stocks = [
      { symbol: 'SPX', name: 'S&P 500' },
      { symbol: 'NDX', name: 'NASDAQ' },
      { symbol: 'DJI', name: 'Dow Jones' },
      { symbol: 'FTSE', name: 'FTSE 100' },
      { symbol: 'DAX', name: 'DAX' },
      { symbol: 'N225', name: 'Nikkei 225' }
    ];
    stocks.forEach(({ symbol, name }) => {
      assets.push({
        type: 'STOCK',
        symbol,
        name
      });
    });

    return assets;
  }
}
