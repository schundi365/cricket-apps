/**
 * Safety Score Service
 * Assesses trade safety based on volatility, liquidity, and risk metrics
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */

import {
  Asset,
  SafetyScore,
  SafetyCategory,
  SafetyComponents,
  PricePoint,
  AssetPrice
} from '../types';
import { PriceService } from './priceService';
import { SentimentService } from './sentimentService';

export class SafetyService {
  private priceService: PriceService;
  private sentimentService: SentimentService;

  constructor(priceService: PriceService, sentimentService: SentimentService) {
    this.priceService = priceService;
    this.sentimentService = sentimentService;
  }

  /**
   * Calculate safety score for an asset
   * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
   */
  async calculateSafetyScore(asset: Asset): Promise<SafetyScore> {
    try {
      // Fetch required data
      const currentPrice = await this.priceService.getCurrentPrice(asset);
      const history = await this.priceService.getPriceHistory(asset, '1W');
      const sentiment = await this.sentimentService.getSentiment(asset);

      // Calculate individual component scores
      const components = this.calculateComponents(currentPrice, history, sentiment.indicators.rsi);

      // Calculate overall score with weighted components
      const overallScore = this.calculateOverallScore(components);

      // Categorize safety score
      const category = this.categorizeSafetyScore(overallScore);

      // Generate recommendation
      const recommendation = this.generateRecommendation(category, components);

      return {
        asset,
        overallScore,
        category,
        components,
        recommendation,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(
        `Failed to calculate safety score for ${asset.symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate all safety components
   * Validates: Requirements 8.2, 8.3, 8.4, 8.5
   */
  private calculateComponents(
    currentPrice: AssetPrice,
    history: PricePoint[],
    rsi: number
  ): SafetyComponents {
    // Calculate volatility score (lower volatility = higher score)
    const volatilityScore = this.calculateVolatilityScore(history, currentPrice.price);

    // Calculate liquidity score (higher volume = higher score)
    const liquidityScore = this.calculateLiquidityScore(history, currentPrice.volume);

    // Calculate spread score (tighter spread = higher score)
    const spreadScore = this.calculateSpreadScore(currentPrice);

    // Calculate trend strength score (ADX-based)
    const trendStrengthScore = this.calculateTrendStrengthScore(history);

    // Calculate market conditions score
    const marketConditionsScore = this.calculateMarketConditionsScore(history, rsi);

    return {
      volatilityScore,
      liquidityScore,
      spreadScore,
      trendStrengthScore,
      marketConditionsScore
    };
  }

  /**
   * Calculate volatility score (0-100)
   * Lower volatility = higher score
   * Validates: Requirements 8.2
   */
  private calculateVolatilityScore(history: PricePoint[], currentPrice: number): number {
    if (history.length < 2) return 50;

    // Calculate ATR (Average True Range)
    const atr = this.calculateATR(history);

    // Calculate ATR as percentage of price
    const atrPercent = (atr / currentPrice) * 100;

    // Convert to score (lower ATR% = higher score)
    // Typical ATR% ranges: 0.5% (very low) to 5% (very high)
    let score = 100 - atrPercent * 20;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate Average True Range (ATR)
   */
  private calculateATR(history: PricePoint[], period: number = 14): number {
    if (history.length < 2) return 0;

    const trueRanges: number[] = [];

    for (let i = 1; i < history.length; i++) {
      const tr = Math.max(
        history[i].high - history[i].low,
        Math.abs(history[i].high - history[i - 1].close),
        Math.abs(history[i].low - history[i - 1].close)
      );
      trueRanges.push(tr);
    }

    // Calculate average of true ranges
    const effectivePeriod = Math.min(period, trueRanges.length);
    const recentTRs = trueRanges.slice(-effectivePeriod);
    const atr = recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;

    return atr;
  }

  /**
   * Calculate liquidity score (0-100)
   * Higher volume = higher score
   * Validates: Requirements 8.3
   */
  private calculateLiquidityScore(history: PricePoint[], currentVolume?: number): number {
    // Filter points with volume data
    const withVolume = history.filter(p => p.volume !== undefined && p.volume > 0);

    if (withVolume.length === 0) {
      // No volume data available, return neutral score
      return 50;
    }

    // Calculate average volume
    const avgVolume = withVolume.reduce((sum, p) => sum + (p.volume || 0), 0) / withVolume.length;

    if (avgVolume === 0) return 50;

    // Compare current volume to average
    const volumeRatio = currentVolume ? currentVolume / avgVolume : 1;

    // Convert to score (higher ratio = higher score)
    // Ratio of 1 = 50, Ratio of 2 = 100, Ratio of 0.5 = 25
    let score = 50 + (volumeRatio - 1) * 50;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate spread score (0-100)
   * Tighter spread = higher score
   * Validates: Requirements 8.4
   */
  private calculateSpreadScore(currentPrice: AssetPrice): number {
    // Calculate spread as percentage of price
    const spreadPercent = (currentPrice.spread / currentPrice.price) * 100;

    // Convert to score (lower spread% = higher score)
    // Typical spreads: 0.01% (very tight) to 0.5% (wide)
    let score = 100 - spreadPercent * 200;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate trend strength score (0-100)
   * Based on ADX (Average Directional Index)
   * Validates: Requirements 8.5
   */
  private calculateTrendStrengthScore(history: PricePoint[]): number {
    if (history.length < 3) return 50;

    // Calculate ADX
    const adx = this.calculateADX(history);

    // ADX ranges from 0-100, directly use as score
    // Higher ADX = stronger trend = higher safety
    return Math.max(0, Math.min(100, adx));
  }

  /**
   * Calculate ADX (Average Directional Index)
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
   * Calculate market conditions score (0-100)
   * Based on overall market volatility and RSI
   * Validates: Requirements 8.5
   */
  private calculateMarketConditionsScore(history: PricePoint[], rsi: number): number {
    if (history.length < 2) return 50;

    // Calculate overall market volatility
    const volatility = this.calculateVolatility(history);

    // Lower volatility = better conditions
    let volatilityComponent = 100 - volatility * 10;
    volatilityComponent = Math.max(0, Math.min(100, volatilityComponent));

    // RSI component: extreme values indicate overbought/oversold (less favorable)
    // Ideal RSI is around 40-60 (neutral)
    let rsiComponent = 100;
    if (rsi > 70 || rsi < 30) {
      // Extreme RSI reduces score
      const distanceFromExtreme = rsi > 70 ? rsi - 70 : 30 - rsi;
      rsiComponent = 100 - distanceFromExtreme * 2;
    }
    rsiComponent = Math.max(0, Math.min(100, rsiComponent));

    // Combine components (70% volatility, 30% RSI)
    const score = volatilityComponent * 0.7 + rsiComponent * 0.3;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate volatility using standard deviation
   */
  private calculateVolatility(history: PricePoint[]): number {
    if (history.length < 2) return 0;

    // Calculate returns
    const returns: number[] = [];
    for (let i = 1; i < history.length; i++) {
      const returnValue = (history[i].close - history[i - 1].close) / history[i - 1].close;
      returns.push(returnValue);
    }

    // Calculate mean
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    // Calculate variance
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

    // Standard deviation (volatility)
    const stdDev = Math.sqrt(variance);

    // Return as percentage
    return stdDev * 100;
  }

  /**
   * Calculate overall safety score with weighted components
   * Weights: volatility 30%, liquidity 25%, spread 20%, trend 15%, conditions 10%
   * Validates: Requirements 8.1
   */
  private calculateOverallScore(components: SafetyComponents): number {
    const score =
      components.volatilityScore * 0.3 +
      components.liquidityScore * 0.25 +
      components.spreadScore * 0.2 +
      components.trendStrengthScore * 0.15 +
      components.marketConditionsScore * 0.1;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Categorize safety score
   * Validates: Requirements 8.6
   */
  private categorizeSafetyScore(score: number): SafetyCategory {
    if (score >= 80) {
      return 'VERY_SAFE';
    } else if (score >= 60) {
      return 'SAFE';
    } else if (score >= 40) {
      return 'MODERATE';
    } else if (score >= 20) {
      return 'RISKY';
    } else {
      return 'VERY_RISKY';
    }
  }

  /**
   * Generate recommendation based on category and components
   * Validates: Requirements 8.6
   */
  private generateRecommendation(category: SafetyCategory, components: SafetyComponents): string {
    const recommendations: Record<SafetyCategory, string> = {
      VERY_SAFE:
        'Excellent trading conditions. Low volatility, good liquidity, and tight spreads make this a favorable opportunity.',
      SAFE:
        'Good trading conditions. Asset shows reasonable stability and liquidity. Suitable for most trading strategies.',
      MODERATE:
        'Moderate trading conditions. Exercise caution and use appropriate risk management. Consider smaller position sizes.',
      RISKY:
        'Elevated risk conditions. High volatility or poor liquidity detected. Only trade with strict risk controls and smaller positions.',
      VERY_RISKY:
        'High risk conditions. Significant volatility, liquidity concerns, or unfavorable market conditions. Avoid trading or use minimal position sizes.'
    };

    let recommendation = recommendations[category];

    // Add specific warnings based on component scores
    const warnings: string[] = [];

    if (components.volatilityScore < 40) {
      warnings.push('High volatility detected');
    }
    if (components.liquidityScore < 40) {
      warnings.push('Low liquidity');
    }
    if (components.spreadScore < 40) {
      warnings.push('Wide spreads');
    }
    if (components.trendStrengthScore < 30) {
      warnings.push('Weak or unclear trend');
    }
    if (components.marketConditionsScore < 40) {
      warnings.push('Unfavorable market conditions');
    }

    if (warnings.length > 0) {
      recommendation += ' Concerns: ' + warnings.join(', ') + '.';
    }

    return recommendation;
  }

  /**
   * Get bulk safety scores for multiple assets
   * Optimized for parallel processing
   * Validates: Requirements 8.1, 8.7
   */
  async getBulkSafetyScores(assets: Asset[]): Promise<Map<string, SafetyScore>> {
    const results = new Map<string, SafetyScore>();

    // Calculate safety scores in parallel
    const promises = assets.map(async asset => {
      try {
        const safetyScore = await this.calculateSafetyScore(asset);
        const key = `${asset.type}_${asset.symbol}`;
        return { key, safetyScore };
      } catch (error) {
        console.error(`Failed to calculate safety score for ${asset.symbol}:`, error);
        return null;
      }
    });

    const settled = await Promise.allSettled(promises);

    // Collect successful results
    settled.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        results.set(result.value.key, result.value.safetyScore);
      }
    });

    return results;
  }
}
