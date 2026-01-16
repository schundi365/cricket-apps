/**
 * Sentiment Analysis Service
 * Calculates market sentiment based on price movements and technical indicators
 * Validates: Requirements 1.1, 1.2, 1.3, 1.6
 */

import { 
  Asset, 
  MarketSentiment, 
  SentimentScore, 
  SentimentType, 
  SentimentStrength,
  MACDSignal,
  SentimentIndicators,
  PricePoint 
} from '../types';
import { PriceService } from './priceService';

export class SentimentService {
  private priceService: PriceService;

  constructor(priceService: PriceService) {
    this.priceService = priceService;
  }

  /**
   * Get sentiment for a single asset
   * Validates: Requirements 1.1, 1.2, 1.3
   */
  async getSentiment(asset: Asset): Promise<MarketSentiment> {
    try {
      // Fetch price history for analysis
      const history24h = await this.priceService.getPriceHistory(asset, '1D');
      const history7d = await this.priceService.getPriceHistory(asset, '1W');

      // Check if we have sufficient data
      if (history24h.length < 2 || history7d.length < 2) {
        throw new Error(`Insufficient price history for ${asset.symbol}`);
      }

      // Calculate sentiment score and indicators
      const sentimentScore = this.calculateSentimentScore(history24h, history7d);
      const indicators = this.calculateIndicators(history24h, history7d);

      return {
        asset,
        sentiment: sentimentScore.sentiment,
        score: sentimentScore.score,
        strength: sentimentScore.strength,
        indicators,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get sentiment for ${asset.symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate sentiment score from price history
   * Validates: Requirements 1.1, 1.2, 1.3
   */
  calculateSentimentScore(history24h: PricePoint[], history7d: PricePoint[]): SentimentScore {
    // Calculate price momentum
    const priceChange24h = this.calculatePriceChange(history24h);
    const priceChange7d = this.calculatePriceChange(history7d);

    // Calculate volatility
    const volatility = this.calculateVolatility(history24h);

    // Calculate RSI
    const rsi = this.calculateRSI(history24h);

    // Calculate MACD signal
    const macdSignal = this.calculateMACDSignal(history24h);

    // Combine factors to determine sentiment score (0-100)
    let score = 50; // Start neutral

    // Price momentum contribution (±20 points)
    score += priceChange24h * 10; // 2% change = 20 points
    score += priceChange7d * 5; // 2% change = 10 points

    // RSI contribution (±15 points)
    if (rsi > 70) {
      score += 15; // Overbought = bullish
    } else if (rsi < 30) {
      score -= 15; // Oversold = bearish
    } else {
      score += (rsi - 50) * 0.3; // Gradual contribution
    }

    // MACD contribution (±10 points)
    if (macdSignal === 'BULLISH') {
      score += 10;
    } else if (macdSignal === 'BEARISH') {
      score -= 10;
    }

    // Volatility adjustment (reduce confidence in high volatility)
    // High volatility doesn't change direction but reduces strength
    const volatilityFactor = Math.min(volatility / 5, 1); // Cap at 1

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine sentiment type
    let sentiment: SentimentType;
    if (score >= 55) {
      sentiment = 'BULLISH';
    } else if (score <= 45) {
      sentiment = 'BEARISH';
    } else {
      sentiment = 'NEUTRAL';
    }

    // Determine strength based on distance from neutral and volatility
    let strength: SentimentStrength;
    const distanceFromNeutral = Math.abs(score - 50);
    
    if (volatilityFactor > 0.7) {
      // High volatility reduces strength
      strength = 'WEAK';
    } else if (distanceFromNeutral >= 25) {
      strength = 'STRONG';
    } else if (distanceFromNeutral >= 10) {
      strength = 'MODERATE';
    } else {
      strength = 'WEAK';
    }

    return { score, sentiment, strength };
  }

  /**
   * Calculate all sentiment indicators
   * Validates: Requirements 1.2, 1.3
   */
  private calculateIndicators(history24h: PricePoint[], history7d: PricePoint[]): SentimentIndicators {
    return {
      priceChange24h: this.calculatePriceChange(history24h),
      priceChange7d: this.calculatePriceChange(history7d),
      volatility: this.calculateVolatility(history24h),
      momentum: this.calculateMomentum(history24h),
      rsi: this.calculateRSI(history24h),
      macdSignal: this.calculateMACDSignal(history24h)
    };
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
   * Calculate volatility using standard deviation
   * Validates: Requirements 1.2
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
   * Calculate momentum score (0-100)
   * Validates: Requirements 1.2
   */
  private calculateMomentum(history: PricePoint[]): number {
    if (history.length < 2) return 50;

    // Calculate rate of change
    const priceChange = this.calculatePriceChange(history);
    
    // Calculate acceleration (change in rate of change)
    const midPoint = Math.floor(history.length / 2);
    const firstHalfChange = this.calculatePriceChange(history.slice(0, midPoint + 1));
    const secondHalfChange = this.calculatePriceChange(history.slice(midPoint));
    const acceleration = secondHalfChange - firstHalfChange;

    // Combine velocity and acceleration
    let momentum = 50; // Neutral
    momentum += priceChange * 5; // Velocity contribution
    momentum += acceleration * 3; // Acceleration contribution

    // Clamp to 0-100
    return Math.max(0, Math.min(100, momentum));
  }

  /**
   * Calculate RSI (Relative Strength Index)
   * Validates: Requirements 1.2, 1.3
   */
  private calculateRSI(history: PricePoint[], period: number = 14): number {
    if (history.length < period + 1) {
      // Not enough data, use simplified calculation
      period = Math.max(2, Math.floor(history.length / 2));
    }

    // Calculate price changes
    const changes: number[] = [];
    for (let i = 1; i < history.length; i++) {
      changes.push(history[i].close - history[i - 1].close);
    }

    // Separate gains and losses
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

    // Calculate average gain and loss
    const avgGain = gains.slice(-period).reduce((sum, g) => sum + g, 0) / period;
    const avgLoss = losses.slice(-period).reduce((sum, l) => sum + l, 0) / period;

    // Avoid division by zero
    if (avgLoss === 0) {
      return avgGain > 0 ? 100 : 50;
    }

    // Calculate RS and RSI
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  }

  /**
   * Calculate MACD signal
   * Validates: Requirements 1.2, 1.3
   */
  private calculateMACDSignal(history: PricePoint[]): MACDSignal {
    if (history.length < 26) {
      // Not enough data for standard MACD, use simplified version
      return this.calculateSimplifiedMACDSignal(history);
    }

    // Calculate EMAs
    const ema12 = this.calculateEMA(history, 12);
    const ema26 = this.calculateEMA(history, 26);

    // MACD line
    const macdLine = ema12 - ema26;

    // For signal line, we'd need more history, so use a simplified approach
    // Compare current MACD to recent average
    const recentPrices = history.slice(-9);
    const recentEma12 = this.calculateEMA(recentPrices, Math.min(9, recentPrices.length));
    const recentEma26 = this.calculateEMA(recentPrices, Math.min(9, recentPrices.length));
    const recentMacd = recentEma12 - recentEma26;

    // Determine signal
    if (macdLine > 0 && macdLine > recentMacd) {
      return 'BULLISH';
    } else if (macdLine < 0 && macdLine < recentMacd) {
      return 'BEARISH';
    } else {
      return 'NEUTRAL';
    }
  }

  /**
   * Calculate simplified MACD signal for limited data
   */
  private calculateSimplifiedMACDSignal(history: PricePoint[]): MACDSignal {
    if (history.length < 4) return 'NEUTRAL';

    // Use shorter periods
    const shortPeriod = Math.max(2, Math.floor(history.length / 3));
    const longPeriod = Math.max(3, Math.floor(history.length / 2));

    const emaShort = this.calculateEMA(history, shortPeriod);
    const emaLong = this.calculateEMA(history, longPeriod);

    const diff = emaShort - emaLong;
    const threshold = emaLong * 0.001; // 0.1% threshold

    if (diff > threshold) {
      return 'BULLISH';
    } else if (diff < -threshold) {
      return 'BEARISH';
    } else {
      return 'NEUTRAL';
    }
  }

  /**
   * Calculate Exponential Moving Average
   */
  private calculateEMA(history: PricePoint[], period: number): number {
    if (history.length === 0) return 0;
    if (history.length < period) {
      period = history.length;
    }

    const multiplier = 2 / (period + 1);
    
    // Start with SMA
    let ema = history.slice(0, period).reduce((sum, p) => sum + p.close, 0) / period;

    // Calculate EMA for remaining points
    for (let i = period; i < history.length; i++) {
      ema = (history[i].close - ema) * multiplier + ema;
    }

    return ema;
  }

  /**
   * Get bulk sentiment for multiple assets
   * Optimized for parallel API calls
   * Validates: Requirements 1.1
   */
  async getBulkSentiment(assets: Asset[]): Promise<Map<string, MarketSentiment>> {
    const results = new Map<string, MarketSentiment>();

    // Fetch sentiments in parallel
    const promises = assets.map(async (asset) => {
      try {
        const sentiment = await this.getSentiment(asset);
        const key = `${asset.type}_${asset.symbol}`;
        return { key, sentiment };
      } catch (error) {
        console.error(`Failed to get sentiment for ${asset.symbol}:`, error);
        return null;
      }
    });

    const settled = await Promise.allSettled(promises);

    // Collect successful results
    settled.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        results.set(result.value.key, result.value.sentiment);
      }
    });

    return results;
  }
}
