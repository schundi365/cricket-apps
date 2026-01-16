/**
 * Entry/Exit Timing Service
 * Suggests optimal entry and exit times based on technical analysis
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */

import {
  Asset,
  EntryRecommendation,
  ExitRecommendation,
  EntryRecommendationType,
  TimeHorizon,
  TechnicalSignals,
  ExitLevel,
  MomentumLevel,
  TradeDirection,
  PricePoint
} from '../types';
import { PriceService } from './priceService';
import { SentimentService } from './sentimentService';
import { SafetyService } from './safetyService';

export class TimingService {
  private priceService: PriceService;
  private sentimentService: SentimentService;
  private safetyService: SafetyService;

  constructor(
    priceService: PriceService,
    sentimentService: SentimentService,
    safetyService: SafetyService
  ) {
    this.priceService = priceService;
    this.sentimentService = sentimentService;
    this.safetyService = safetyService;
  }

  /**
   * Get entry recommendation with technical analysis
   * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.7
   */
  async getEntryRecommendation(asset: Asset): Promise<EntryRecommendation> {
    try {
      // Fetch required data
      const currentPrice = await this.priceService.getCurrentPrice(asset);
      const history = await this.priceService.getPriceHistory(asset, '1W');
      const sentiment = await this.sentimentService.getSentiment(asset);
      const safetyScore = await this.safetyService.calculateSafetyScore(asset);

      if (history.length < 3) {
        throw new Error(`Insufficient price history for timing analysis of ${asset.symbol}`);
      }

      // Calculate technical indicators
      const technicalIndicators = this.calculateTechnicalSignals(history, currentPrice.price);

      // Analyze trend alignment
      const trendAligned = this.analyzeTrendAlignment(sentiment, technicalIndicators);

      // Calculate support and resistance
      const { support, resistance } = this.calculateSupportResistance(history);

      // Determine momentum level
      const momentum = this.determineMomentumLevel(sentiment.indicators.momentum);

      // Check volume confirmation
      const volumeConfirmation = this.checkVolumeConfirmation(history);

      // Calculate risk-reward ratio
      const riskReward = this.calculateRiskReward(
        currentPrice.price,
        support,
        resistance,
        sentiment.sentiment
      );

      // Determine recommendation
      const { recommendation, reasoning, waitCondition, suggestedEntryPrice } =
        this.determineRecommendation(
          trendAligned,
          momentum,
          volumeConfirmation,
          riskReward,
          safetyScore.overallScore,
          currentPrice.price,
          support,
          resistance,
          sentiment.sentiment
        );

      // Calculate confidence level
      const confidence = this.calculateConfidence(
        recommendation,
        trendAligned,
        momentum,
        volumeConfirmation,
        riskReward,
        safetyScore.overallScore
      );

      // Determine time horizon
      const timeHorizon = this.determineTimeHorizon(
        sentiment.indicators.volatility,
        technicalIndicators.movingAverages,
        currentPrice.price
      );

      return {
        asset,
        recommendation,
        confidence,
        reasoning,
        technicalIndicators,
        suggestedEntryPrice,
        waitCondition,
        timeHorizon,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(
        `Failed to get entry recommendation for ${asset.symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate technical signals
   * Validates: Requirements 9.1, 9.2
   */
  private calculateTechnicalSignals(history: PricePoint[], currentPrice: number): TechnicalSignals {
    // Calculate RSI
    const rsi = this.calculateRSI(history);

    // Calculate MACD
    const macd = this.calculateMACD(history);

    // Calculate moving averages
    const movingAverages = this.calculateMovingAverages(history);

    // Calculate support and resistance
    const supportResistance = this.calculateSupportResistance(history);

    // Determine trend alignment
    const trendAlignment = this.isTrendAligned(currentPrice, movingAverages);

    // Determine momentum level
    const momentum = this.determineMomentumLevel(this.calculateMomentum(history));

    // Check volume confirmation
    const volumeConfirmation = this.checkVolumeConfirmation(history);

    return {
      trendAlignment,
      supportResistance,
      momentum,
      volumeConfirmation,
      rsi,
      macd,
      movingAverages
    };
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(history: PricePoint[], period: number = 14): number {
    if (history.length < period + 1) {
      period = Math.max(2, Math.floor(history.length / 2));
    }

    // Calculate price changes
    const changes: number[] = [];
    for (let i = 1; i < history.length; i++) {
      changes.push(history[i].close - history[i - 1].close);
    }

    // Separate gains and losses
    const gains = changes.map(c => (c > 0 ? c : 0));
    const losses = changes.map(c => (c < 0 ? Math.abs(c) : 0));

    // Calculate average gain and loss
    const avgGain = gains.slice(-period).reduce((sum, g) => sum + g, 0) / period;
    const avgLoss = losses.slice(-period).reduce((sum, l) => sum + l, 0) / period;

    // Avoid division by zero
    if (avgLoss === 0) {
      return avgGain > 0 ? 100 : 50;
    }

    // Calculate RS and RSI
    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return rsi;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(
    history: PricePoint[]
  ): { value: number; signal: number; histogram: number } {
    if (history.length < 26) {
      // Use simplified MACD for limited data
      return this.calculateSimplifiedMACD(history);
    }

    // Calculate EMAs
    const ema12 = this.calculateEMA(history, 12);
    const ema26 = this.calculateEMA(history, 26);

    // MACD line
    const macdValue = ema12 - ema26;

    // Signal line (9-period EMA of MACD)
    // For simplicity, use a shorter period if not enough data
    const signalPeriod = Math.min(9, Math.floor(history.length / 3));
    const recentEma12 = this.calculateEMA(history.slice(-signalPeriod), signalPeriod);
    const recentEma26 = this.calculateEMA(history.slice(-signalPeriod), signalPeriod);
    const signalValue = recentEma12 - recentEma26;

    // Histogram
    const histogram = macdValue - signalValue;

    return {
      value: macdValue,
      signal: signalValue,
      histogram
    };
  }

  /**
   * Calculate simplified MACD for limited data
   */
  private calculateSimplifiedMACD(
    history: PricePoint[]
  ): { value: number; signal: number; histogram: number } {
    if (history.length < 4) {
      return { value: 0, signal: 0, histogram: 0 };
    }

    const shortPeriod = Math.max(2, Math.floor(history.length / 3));
    const longPeriod = Math.max(3, Math.floor(history.length / 2));

    const emaShort = this.calculateEMA(history, shortPeriod);
    const emaLong = this.calculateEMA(history, longPeriod);

    const macdValue = emaShort - emaLong;
    const signalValue = macdValue * 0.9; // Simplified signal

    return {
      value: macdValue,
      signal: signalValue,
      histogram: macdValue - signalValue
    };
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
   * Calculate moving averages (20, 50, 200 periods)
   */
  private calculateMovingAverages(
    history: PricePoint[]
  ): { ma20: number; ma50: number; ma200: number } {
    const ma20 = this.calculateSMA(history, Math.min(20, history.length));
    const ma50 = this.calculateSMA(history, Math.min(50, history.length));
    const ma200 = this.calculateSMA(history, Math.min(200, history.length));

    return { ma20, ma50, ma200 };
  }

  /**
   * Calculate Simple Moving Average
   */
  private calculateSMA(history: PricePoint[], period: number): number {
    if (history.length === 0) return 0;
    if (history.length < period) {
      period = history.length;
    }

    const recentPrices = history.slice(-period);
    const sum = recentPrices.reduce((acc, p) => acc + p.close, 0);

    return sum / period;
  }

  /**
   * Calculate support and resistance levels
   */
  private calculateSupportResistance(history: PricePoint[]): { support: number; resistance: number } {
    if (history.length < 3) {
      const price = history[history.length - 1].close;
      return {
        support: price * 0.98,
        resistance: price * 1.02
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
    const support =
      localMinima.length > 0
        ? localMinima.reduce((sum, v) => sum + v, 0) / localMinima.length
        : Math.min(...history.map(p => p.low));

    // Calculate resistance as average of recent highs
    const resistance =
      localMaxima.length > 0
        ? localMaxima.reduce((sum, v) => sum + v, 0) / localMaxima.length
        : Math.max(...history.map(p => p.high));

    return { support, resistance };
  }

  /**
   * Check if trend is aligned (price above/below moving averages)
   */
  private isTrendAligned(
    currentPrice: number,
    movingAverages: { ma20: number; ma50: number; ma200: number }
  ): boolean {
    // Bullish alignment: price > MA20 > MA50 > MA200
    const bullishAlignment =
      currentPrice > movingAverages.ma20 &&
      movingAverages.ma20 > movingAverages.ma50 &&
      movingAverages.ma50 > movingAverages.ma200;

    // Bearish alignment: price < MA20 < MA50 < MA200
    const bearishAlignment =
      currentPrice < movingAverages.ma20 &&
      movingAverages.ma20 < movingAverages.ma50 &&
      movingAverages.ma50 < movingAverages.ma200;

    return bullishAlignment || bearishAlignment;
  }

  /**
   * Calculate momentum score
   */
  private calculateMomentum(history: PricePoint[]): number {
    if (history.length < 2) return 50;

    // Calculate rate of change
    const firstPrice = history[0].close;
    const lastPrice = history[history.length - 1].close;
    const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;

    // Calculate acceleration
    const midPoint = Math.floor(history.length / 2);
    const firstHalfChange = this.calculatePriceChange(history.slice(0, midPoint + 1));
    const secondHalfChange = this.calculatePriceChange(history.slice(midPoint));
    const acceleration = secondHalfChange - firstHalfChange;

    // Combine velocity and acceleration
    let momentum = 50;
    momentum += priceChange * 5;
    momentum += acceleration * 3;

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
   * Determine momentum level
   */
  private determineMomentumLevel(momentum: number): MomentumLevel {
    if (momentum >= 70) {
      return 'STRONG';
    } else if (momentum >= 50) {
      return 'MODERATE';
    } else {
      return 'WEAK';
    }
  }

  /**
   * Check volume confirmation
   */
  private checkVolumeConfirmation(history: PricePoint[]): boolean {
    // Filter points with volume data
    const withVolume = history.filter(p => p.volume !== undefined && p.volume > 0);

    if (withVolume.length < 2) {
      // No volume data, assume neutral
      return true;
    }

    // Calculate average volume
    const avgVolume = withVolume.reduce((sum, p) => sum + (p.volume || 0), 0) / withVolume.length;

    // Check if recent volume is above average
    const recentVolume = withVolume[withVolume.length - 1].volume || 0;

    return recentVolume >= avgVolume * 0.8; // Allow 20% below average
  }

  /**
   * Analyze trend alignment with sentiment
   */
  private analyzeTrendAlignment(
    sentiment: any,
    technicalIndicators: TechnicalSignals
  ): boolean {
    // Check if sentiment matches technical trend
    const isBullish = sentiment.sentiment === 'BULLISH';
    const isBearish = sentiment.sentiment === 'BEARISH';

    // Check if MACD confirms
    const macdBullish = technicalIndicators.macd.histogram > 0;
    const macdBearish = technicalIndicators.macd.histogram < 0;

    // Check if RSI confirms
    const rsiBullish = technicalIndicators.rsi > 50;
    const rsiBearish = technicalIndicators.rsi < 50;

    // Trend is aligned if sentiment and technical indicators agree
    const bullishAlignment = isBullish && macdBullish && rsiBullish;
    const bearishAlignment = isBearish && macdBearish && rsiBearish;

    return bullishAlignment || bearishAlignment || technicalIndicators.trendAlignment;
  }

  /**
   * Calculate risk-reward ratio
   */
  private calculateRiskReward(
    currentPrice: number,
    support: number,
    resistance: number,
    sentiment: string
  ): number {
    if (sentiment === 'BULLISH') {
      // For long: risk = current - support, reward = resistance - current
      const risk = currentPrice - support;
      const reward = resistance - currentPrice;

      if (risk <= 0) return 0;
      return reward / risk;
    } else if (sentiment === 'BEARISH') {
      // For short: risk = resistance - current, reward = current - support
      const risk = resistance - currentPrice;
      const reward = currentPrice - support;

      if (risk <= 0) return 0;
      return reward / risk;
    } else {
      // Neutral sentiment
      const riskUp = resistance - currentPrice;
      const riskDown = currentPrice - support;
      const avgRisk = (riskUp + riskDown) / 2;

      if (avgRisk <= 0) return 0;
      return 1; // Neutral risk-reward
    }
  }

  /**
   * Determine entry recommendation
   * Validates: Requirements 9.1, 9.2, 9.3, 9.4
   */
  private determineRecommendation(
    trendAligned: boolean,
    momentum: MomentumLevel,
    volumeConfirmation: boolean,
    riskReward: number,
    safetyScore: number,
    currentPrice: number,
    support: number,
    resistance: number,
    sentiment: string
  ): {
    recommendation: EntryRecommendationType;
    reasoning: string[];
    waitCondition?: string;
    suggestedEntryPrice?: number;
  } {
    const reasoning: string[] = [];

    // IMMEDIATE entry conditions
    if (
      trendAligned &&
      momentum === 'STRONG' &&
      volumeConfirmation &&
      riskReward >= 2.0 &&
      safetyScore >= 60
    ) {
      reasoning.push('Strong trend alignment with momentum confirmation');
      reasoning.push(`Favorable risk-reward ratio: ${riskReward.toFixed(2)}:1`);
      reasoning.push('Volume confirms the move');
      reasoning.push(`Safety score is favorable: ${safetyScore.toFixed(0)}/100`);

      return {
        recommendation: 'IMMEDIATE',
        reasoning
      };
    }

    // WAIT conditions
    if (trendAligned && momentum !== 'WEAK' && riskReward >= 1.5) {
      // Price near resistance (for bullish) or support (for bearish)
      const nearResistance = sentiment === 'BULLISH' && currentPrice > resistance * 0.98;
      const nearSupport = sentiment === 'BEARISH' && currentPrice < support * 1.02;

      if (nearResistance) {
        reasoning.push('Trend is favorable but price is near resistance');
        reasoning.push('Wait for pullback to better entry level');

        const suggestedEntry = resistance * 0.95; // 5% below resistance

        return {
          recommendation: 'WAIT',
          reasoning,
          waitCondition: `Wait for pullback to ${suggestedEntry.toFixed(2)} or below`,
          suggestedEntryPrice: suggestedEntry
        };
      }

      if (nearSupport) {
        reasoning.push('Trend is favorable but price is near support');
        reasoning.push('Wait for bounce to better entry level');

        const suggestedEntry = support * 1.05; // 5% above support

        return {
          recommendation: 'WAIT',
          reasoning,
          waitCondition: `Wait for bounce to ${suggestedEntry.toFixed(2)} or above`,
          suggestedEntryPrice: suggestedEntry
        };
      }

      // Weak volume confirmation
      if (!volumeConfirmation) {
        reasoning.push('Trend and momentum are favorable');
        reasoning.push('Waiting for volume confirmation');

        return {
          recommendation: 'WAIT',
          reasoning,
          waitCondition: 'Wait for increased volume to confirm the move'
        };
      }

      // Moderate conditions
      reasoning.push('Trend is present but conditions are not optimal');
      reasoning.push('Consider waiting for stronger confirmation');

      return {
        recommendation: 'WAIT',
        reasoning,
        waitCondition: 'Wait for stronger momentum or better risk-reward setup'
      };
    }

    // AVOID conditions
    reasoning.push('Entry conditions are not favorable');

    if (!trendAligned) {
      reasoning.push('No clear trend alignment detected');
    }

    if (momentum === 'WEAK') {
      reasoning.push('Momentum is weak');
    }

    if (riskReward < 1.5) {
      reasoning.push(`Poor risk-reward ratio: ${riskReward.toFixed(2)}:1`);
    }

    if (safetyScore < 40) {
      reasoning.push(`Low safety score: ${safetyScore.toFixed(0)}/100`);
    }

    return {
      recommendation: 'AVOID',
      reasoning
    };
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(
    recommendation: EntryRecommendationType,
    trendAligned: boolean,
    momentum: MomentumLevel,
    volumeConfirmation: boolean,
    riskReward: number,
    safetyScore: number
  ): number {
    let confidence = 50; // Start neutral

    // Recommendation type contribution
    if (recommendation === 'IMMEDIATE') {
      confidence += 30;
    } else if (recommendation === 'WAIT') {
      confidence += 10;
    } else {
      confidence -= 20;
    }

    // Trend alignment contribution
    if (trendAligned) {
      confidence += 15;
    }

    // Momentum contribution
    if (momentum === 'STRONG') {
      confidence += 15;
    } else if (momentum === 'MODERATE') {
      confidence += 5;
    }

    // Volume confirmation contribution
    if (volumeConfirmation) {
      confidence += 10;
    }

    // Risk-reward contribution
    if (riskReward >= 3.0) {
      confidence += 15;
    } else if (riskReward >= 2.0) {
      confidence += 10;
    } else if (riskReward >= 1.5) {
      confidence += 5;
    }

    // Safety score contribution
    confidence += (safetyScore - 50) * 0.2;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Determine time horizon
   * Validates: Requirements 9.7
   */
  private determineTimeHorizon(
    volatility: number,
    movingAverages: { ma20: number; ma50: number; ma200: number },
    currentPrice: number
  ): TimeHorizon {
    // High volatility suggests shorter time frames
    if (volatility > 5) {
      return 'SCALP';
    }

    // Check distance from moving averages
    const distanceFromMA20 = Math.abs(currentPrice - movingAverages.ma20) / currentPrice;
    const distanceFromMA50 = Math.abs(currentPrice - movingAverages.ma50) / currentPrice;

    // Very close to MA20 suggests day trading
    if (distanceFromMA20 < 0.01) {
      return 'DAY_TRADE';
    }

    // Close to MA50 suggests swing trading
    if (distanceFromMA50 < 0.03) {
      return 'SWING_TRADE';
    }

    // Far from moving averages or low volatility suggests position trading
    if (volatility < 2) {
      return 'POSITION_TRADE';
    }

    // Default to swing trade
    return 'SWING_TRADE';
  }

  /**
   * Get exit recommendation with technical levels
   * Validates: Requirements 9.5, 9.6
   */
  async getExitRecommendation(
    asset: Asset,
    entryPrice: number,
    direction: TradeDirection
  ): Promise<ExitRecommendation> {
    try {
      // Fetch required data
      const history = await this.priceService.getPriceHistory(asset, '1W');

      if (history.length < 3) {
        throw new Error(`Insufficient price history for exit analysis of ${asset.symbol}`);
      }

      // Calculate support and resistance
      const { support, resistance } = this.calculateSupportResistance(history);

      // Calculate ATR for stop loss
      const atr = this.calculateATR(history);

      // Calculate Fibonacci levels
      const fibonacciLevels = this.calculateFibonacciLevels(history, direction);

      // Calculate take profit levels
      const takeProfitLevels = this.calculateTakeProfitLevels(
        entryPrice,
        direction,
        resistance,
        support,
        fibonacciLevels,
        atr
      );

      // Calculate stop loss level
      const stopLossLevel = this.calculateStopLossLevel(
        entryPrice,
        direction,
        support,
        resistance,
        atr
      );

      // Calculate trailing stop suggestion
      const trailingStopSuggestion = atr * 2; // 2x ATR for trailing stop

      // Determine time-based exit
      const timeBasedExit = this.determineTimeBasedExit(history);

      return {
        takeProfitLevels,
        stopLossLevel,
        trailingStopSuggestion,
        timeBasedExit
      };
    } catch (error) {
      throw new Error(
        `Failed to get exit recommendation for ${asset.symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate ATR (Average True Range)
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
   * Calculate Fibonacci extension levels
   */
  private calculateFibonacciLevels(history: PricePoint[], direction: TradeDirection): number[] {
    if (history.length < 3) return [];

    // Find swing high and swing low
    const prices = history.map(p => p.close);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const range = high - low;

    if (direction === 'LONG') {
      // Fibonacci extensions above high
      return [
        high + range * 0.618, // 61.8% extension
        high + range * 1.0, // 100% extension
        high + range * 1.618 // 161.8% extension
      ];
    } else {
      // Fibonacci extensions below low
      return [
        low - range * 0.618, // 61.8% extension
        low - range * 1.0, // 100% extension
        low - range * 1.618 // 161.8% extension
      ];
    }
  }

  /**
   * Calculate take profit levels
   * Validates: Requirements 9.5
   */
  private calculateTakeProfitLevels(
    entryPrice: number,
    direction: TradeDirection,
    resistance: number,
    support: number,
    fibonacciLevels: number[],
    atr: number
  ): ExitLevel[] {
    const levels: ExitLevel[] = [];

    if (direction === 'LONG') {
      // TP1: Near resistance
      levels.push({
        price: resistance,
        reasoning: 'First resistance level based on recent price action',
        technicalBasis: `Resistance at ${resistance.toFixed(2)}`,
        probability: 70
      });

      // TP2: Fibonacci 61.8% extension
      if (fibonacciLevels[0]) {
        levels.push({
          price: fibonacciLevels[0],
          reasoning: 'Fibonacci 61.8% extension level',
          technicalBasis: `Fibonacci 0.618 at ${fibonacciLevels[0].toFixed(2)}`,
          probability: 50
        });
      }

      // TP3: Fibonacci 161.8% extension
      if (fibonacciLevels[2]) {
        levels.push({
          price: fibonacciLevels[2],
          reasoning: 'Extended target at Fibonacci 161.8%',
          technicalBasis: `Fibonacci 1.618 at ${fibonacciLevels[2].toFixed(2)}`,
          probability: 30
        });
      }

      // TP4: ATR-based target
      const atrTarget = entryPrice + atr * 3;
      levels.push({
        price: atrTarget,
        reasoning: 'Conservative target based on 3x ATR',
        technicalBasis: `3x ATR target at ${atrTarget.toFixed(2)}`,
        probability: 60
      });
    } else {
      // SHORT positions
      // TP1: Near support
      levels.push({
        price: support,
        reasoning: 'First support level based on recent price action',
        technicalBasis: `Support at ${support.toFixed(2)}`,
        probability: 70
      });

      // TP2: Fibonacci 61.8% extension
      if (fibonacciLevels[0]) {
        levels.push({
          price: fibonacciLevels[0],
          reasoning: 'Fibonacci 61.8% extension level',
          technicalBasis: `Fibonacci 0.618 at ${fibonacciLevels[0].toFixed(2)}`,
          probability: 50
        });
      }

      // TP3: Fibonacci 161.8% extension
      if (fibonacciLevels[2]) {
        levels.push({
          price: fibonacciLevels[2],
          reasoning: 'Extended target at Fibonacci 161.8%',
          technicalBasis: `Fibonacci 1.618 at ${fibonacciLevels[2].toFixed(2)}`,
          probability: 30
        });
      }

      // TP4: ATR-based target
      const atrTarget = entryPrice - atr * 3;
      levels.push({
        price: atrTarget,
        reasoning: 'Conservative target based on 3x ATR',
        technicalBasis: `3x ATR target at ${atrTarget.toFixed(2)}`,
        probability: 60
      });
    }

    // Sort by probability (highest first)
    return levels.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Calculate stop loss level
   * Validates: Requirements 9.6
   */
  private calculateStopLossLevel(
    entryPrice: number,
    direction: TradeDirection,
    support: number,
    resistance: number,
    atr: number
  ): ExitLevel {
    if (direction === 'LONG') {
      // Stop loss below support or 2x ATR, whichever is closer
      const supportBasedSL = support * 0.98; // 2% below support
      const atrBasedSL = entryPrice - atr * 2;

      // Use the closer one (less risk)
      const stopLossPrice = Math.max(supportBasedSL, atrBasedSL);

      return {
        price: stopLossPrice,
        reasoning: 'Stop loss placed below support with ATR buffer',
        technicalBasis:
          stopLossPrice === supportBasedSL
            ? `Support-based at ${stopLossPrice.toFixed(2)}`
            : `2x ATR-based at ${stopLossPrice.toFixed(2)}`,
        probability: 90
      };
    } else {
      // SHORT positions
      // Stop loss above resistance or 2x ATR, whichever is closer
      const resistanceBasedSL = resistance * 1.02; // 2% above resistance
      const atrBasedSL = entryPrice + atr * 2;

      // Use the closer one (less risk)
      const stopLossPrice = Math.min(resistanceBasedSL, atrBasedSL);

      return {
        price: stopLossPrice,
        reasoning: 'Stop loss placed above resistance with ATR buffer',
        technicalBasis:
          stopLossPrice === resistanceBasedSL
            ? `Resistance-based at ${stopLossPrice.toFixed(2)}`
            : `2x ATR-based at ${stopLossPrice.toFixed(2)}`,
        probability: 90
      };
    }
  }

  /**
   * Determine time-based exit suggestion
   */
  private determineTimeBasedExit(history: PricePoint[]): string | undefined {
    // Calculate average holding period based on volatility
    const volatility = this.calculateVolatility(history);

    if (volatility > 5) {
      return 'Consider exiting within 1-2 hours due to high volatility';
    } else if (volatility > 3) {
      return 'Consider exiting within 1 day for day trading strategy';
    } else if (volatility > 1.5) {
      return 'Consider holding for 3-5 days for swing trading';
    } else {
      return 'Consider holding for 1-4 weeks for position trading';
    }
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
}

