/**
 * Core type definitions for the Multi-Asset Market Sentiment and Trading Risk Management System
 */

// ============================================================================
// Asset Types
// ============================================================================

export type AssetType = 'METAL' | 'FOREX' | 'STOCK';

export interface Asset {
  type: AssetType;
  symbol: string;
  name: string;
}

export interface AssetPrice {
  asset: Asset;
  price: number;
  currency: string;
  timestamp: Date;
  bid: number;
  ask: number;
  spread: number;
  volume?: number;
}

export interface PricePoint {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type TimePeriod = '1H' | '4H' | '1D' | '1W' | '1M';

// ============================================================================
// Sentiment Analysis Types
// ============================================================================

export type SentimentType = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type SentimentStrength = 'WEAK' | 'MODERATE' | 'STRONG';
export type MACDSignal = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface SentimentIndicators {
  priceChange24h: number;
  priceChange7d: number;
  volatility: number;
  momentum: number;
  rsi: number; // Relative Strength Index
  macdSignal: MACDSignal;
}

export interface MarketSentiment {
  asset: Asset;
  sentiment: SentimentType;
  score: number; // 0-100
  strength: SentimentStrength;
  indicators: SentimentIndicators;
  timestamp: Date;
}

export interface SentimentScore {
  score: number;
  sentiment: SentimentType;
  strength: SentimentStrength;
}

// ============================================================================
// Trending Assets Types
// ============================================================================

export type TrendDirection = 'UP' | 'DOWN' | 'SIDEWAYS';
export type TrendCategory = 'STRONG_UPTREND' | 'MODERATE_UPTREND' | 'STRONG_DOWNTREND' | 'MODERATE_DOWNTREND';

export interface TrendingFilters {
  assetTypes?: AssetType[];
  minMomentum?: number;
  minSafetyScore?: number;
  trendDirection?: 'UP' | 'DOWN' | 'BOTH';
}

export interface TrendingAsset {
  asset: Asset;
  priceChange24h: number;
  priceChange7d: number;
  momentum: number; // 0-100
  trendCategory: TrendCategory;
  safetyScore: number;
  sentiment: MarketSentiment;
  currentPrice: number;
  timestamp: Date;
}

export interface TrendAnalysis {
  direction: TrendDirection;
  strength: number; // 0-100
  duration: string; // e.g., "3 days"
  supportLevel: number;
  resistanceLevel: number;
  trendLine: { slope: number; intercept: number };
}

// ============================================================================
// Safety Score Types
// ============================================================================

export type SafetyCategory = 'VERY_SAFE' | 'SAFE' | 'MODERATE' | 'RISKY' | 'VERY_RISKY';

export interface SafetyComponents {
  volatilityScore: number; // 0-100 (lower volatility = higher score)
  liquidityScore: number; // 0-100 (higher liquidity = higher score)
  spreadScore: number; // 0-100 (tighter spread = higher score)
  trendStrengthScore: number; // 0-100 (stronger trend = higher score)
  marketConditionsScore: number; // 0-100 (favorable conditions = higher score)
}

export interface SafetyScore {
  asset: Asset;
  overallScore: number; // 0-100
  category: SafetyCategory;
  components: SafetyComponents;
  recommendation: string;
  timestamp: Date;
}

// ============================================================================
// Entry/Exit Timing Types
// ============================================================================

export type EntryRecommendationType = 'IMMEDIATE' | 'WAIT' | 'AVOID';
export type TimeHorizon = 'SCALP' | 'DAY_TRADE' | 'SWING_TRADE' | 'POSITION_TRADE';
export type MomentumLevel = 'STRONG' | 'MODERATE' | 'WEAK';

export interface TechnicalSignals {
  trendAlignment: boolean;
  supportResistance: { support: number; resistance: number };
  momentum: MomentumLevel;
  volumeConfirmation: boolean;
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  movingAverages: { ma20: number; ma50: number; ma200: number };
}

export interface EntryRecommendation {
  asset: Asset;
  recommendation: EntryRecommendationType;
  confidence: number; // 0-100
  reasoning: string[];
  technicalIndicators: TechnicalSignals;
  suggestedEntryPrice?: number;
  waitCondition?: string;
  timeHorizon: TimeHorizon;
  timestamp: Date;
}

export interface ExitLevel {
  price: number;
  reasoning: string;
  technicalBasis: string; // e.g., "Resistance at 2050", "Fibonacci 1.618"
  probability: number; // 0-100
}

export interface ExitRecommendation {
  takeProfitLevels: ExitLevel[];
  stopLossLevel: ExitLevel;
  trailingStopSuggestion?: number;
  timeBasedExit?: string;
}

// ============================================================================
// Risk Calculation Types
// ============================================================================

export type TradeDirection = 'LONG' | 'SHORT';

export interface LotSizeParams {
  tradingCapital: number;
  entryPrice: number;
  stopLossDistance: number;
  asset: Asset;
  riskPercentage: number; // default 3%
}

export interface LotSizeResult {
  lotSize: number;
  units: number;
  maxLoss: number;
  riskPercentage: number;
  valid: boolean;
  warnings: string[];
}

export interface StopLossParams {
  entryPrice: number;
  tradingCapital: number;
  lotSize: number;
  asset: Asset;
  direction: TradeDirection;
  riskPercentage: number; // default 3%
  technicalStopLoss?: number; // from timing service
}

export interface StopLossResult {
  stopLossPrice: number;
  distanceInPips: number;
  distanceInCurrency: number;
  maxLoss: number;
  valid: boolean;
  technicalAlignment: boolean;
}

export interface TakeProfitParams {
  entryPrice: number;
  stopLossPrice: number;
  riskRewardRatio: number;
  direction: TradeDirection;
  technicalTargets?: number[]; // from timing service
}

export interface TakeProfitResult {
  takeProfitPrice: number;
  distanceInPips: number;
  potentialProfit: number;
  riskRewardRatio: number;
  technicalAlignment: boolean;
}

export interface TradeParameters {
  asset: Asset;
  tradingCapital: number;
  entryPrice: number;
  stopLossDistance?: number;
  stopLossPrice?: number;
  direction: TradeDirection;
  riskPercentage: number; // fixed at 3%
  customRiskRewardRatio?: number;
  useTimingRecommendations: boolean;
}

export interface TakeProfitLevel {
  ratio: number;
  price: number;
  potentialProfit: number;
  distanceInPips: number;
  technicalAlignment: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface RiskValidation {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface CalculationResult {
  lotSize: number;
  stopLossPrice: number;
  takeProfitLevels: TakeProfitLevel[];
  maxLoss: number;
  riskPercentage: number;
  safetyScore: SafetyScore;
  entryRecommendation: EntryRecommendation;
  exitRecommendation: ExitRecommendation;
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// ============================================================================
// Asset Configuration Types
// ============================================================================

export interface TradingHours {
  open: string; // e.g., "09:30"
  close: string; // e.g., "16:00"
  timezone: string;
  tradingDays: string[]; // e.g., ["MON", "TUE", "WED", "THU", "FRI"]
}

export interface AssetConfig {
  asset: Asset;
  symbol: string;
  contractSize: number;
  pipSize: number;
  pipValue: number;
  minLotSize: number;
  maxLotSize: number;
  lotStepSize: number;
  displayDecimals: number;
  tradingHours: TradingHours;
  marginRequirement: number;
}

// ============================================================================
// Service Callback Types
// ============================================================================

export type PriceUpdateCallback = (price: AssetPrice) => void;
