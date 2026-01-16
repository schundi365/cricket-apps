/**
 * Asset Configuration Data
 * Defines trading parameters for all supported metals, forex pairs, and stock indices
 */

import { Asset, AssetConfig, AssetType } from '../types';

// ============================================================================
// Asset Definitions
// ============================================================================

export const METALS: Asset[] = [
  { type: 'METAL', symbol: 'XAU/USD', name: 'Gold' },
  { type: 'METAL', symbol: 'XAG/USD', name: 'Silver' },
  { type: 'METAL', symbol: 'HG', name: 'Copper' },
  { type: 'METAL', symbol: 'XPT/USD', name: 'Platinum' },
  { type: 'METAL', symbol: 'XPD/USD', name: 'Palladium' }
];

export const FOREX_PAIRS: Asset[] = [
  { type: 'FOREX', symbol: 'EUR/USD', name: 'Euro / US Dollar' },
  { type: 'FOREX', symbol: 'GBP/USD', name: 'British Pound / US Dollar' },
  { type: 'FOREX', symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen' },
  { type: 'FOREX', symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar' },
  { type: 'FOREX', symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc' },
  { type: 'FOREX', symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar' },
  { type: 'FOREX', symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar' }
];

export const STOCK_INDICES: Asset[] = [
  { type: 'STOCK', symbol: 'SPX', name: 'S&P 500' },
  { type: 'STOCK', symbol: 'NDX', name: 'NASDAQ 100' },
  { type: 'STOCK', symbol: 'DJI', name: 'Dow Jones Industrial Average' },
  { type: 'STOCK', symbol: 'FTSE', name: 'FTSE 100' },
  { type: 'STOCK', symbol: 'DAX', name: 'DAX' },
  { type: 'STOCK', symbol: 'N225', name: 'Nikkei 225' }
];

export const ALL_ASSETS: Asset[] = [...METALS, ...FOREX_PAIRS, ...STOCK_INDICES];

// ============================================================================
// Asset Configuration Map
// ============================================================================

const DEFAULT_TRADING_HOURS = {
  open: '00:00',
  close: '23:59',
  timezone: 'UTC',
  tradingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI']
};

const STOCK_TRADING_HOURS = {
  open: '09:30',
  close: '16:00',
  timezone: 'America/New_York',
  tradingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI']
};

export const ASSET_CONFIGS: Record<string, AssetConfig> = {
  // ============================================================================
  // Metals Configuration
  // ============================================================================
  'XAU/USD': {
    asset: METALS[0],
    symbol: 'XAU/USD',
    contractSize: 100, // 100 oz
    pipSize: 0.01,
    pipValue: 1.0,
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStepSize: 0.01,
    displayDecimals: 2,
    tradingHours: DEFAULT_TRADING_HOURS,
    marginRequirement: 0.01 // 1%
  },
  'XAG/USD': {
    asset: METALS[1],
    symbol: 'XAG/USD',
    contractSize: 5000, // 5000 oz
    pipSize: 0.001,
    pipValue: 5.0,
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStepSize: 0.01,
    displayDecimals: 3,
    tradingHours: DEFAULT_TRADING_HOURS,
    marginRequirement: 0.01
  },
  'HG': {
    asset: METALS[2],
    symbol: 'HG',
    contractSize: 25000, // 25000 lbs
    pipSize: 0.0001,
    pipValue: 2.5,
    minLotSize: 0.01,
    maxLotSize: 50,
    lotStepSize: 0.01,
    displayDecimals: 4,
    tradingHours: DEFAULT_TRADING_HOURS,
    marginRequirement: 0.02
  },
  'XPT/USD': {
    asset: METALS[3],
    symbol: 'XPT/USD',
    contractSize: 50, // 50 oz
    pipSize: 0.01,
    pipValue: 0.5,
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStepSize: 0.01,
    displayDecimals: 2,
    tradingHours: DEFAULT_TRADING_HOURS,
    marginRequirement: 0.01
  },
  'XPD/USD': {
    asset: METALS[4],
    symbol: 'XPD/USD',
    contractSize: 100, // 100 oz
    pipSize: 0.01,
    pipValue: 1.0,
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStepSize: 0.01,
    displayDecimals: 2,
    tradingHours: DEFAULT_TRADING_HOURS,
    marginRequirement: 0.01
  },

  // ============================================================================
  // Forex Configuration
  // ============================================================================
  'EUR/USD': {
    asset: FOREX_PAIRS[0],
    symbol: 'EUR/USD',
    contractSize: 100000, // 100,000 units
    pipSize: 0.0001,
    pipValue: 10.0,
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStepSize: 0.01,
    displayDecimals: 5,
    tradingHours: DEFAULT_TRADING_HOURS,
    marginRequirement: 0.01
  },
  'GBP/USD': {
    asset: FOREX_PAIRS[1],
    symbol: 'GBP/USD',
    contractSize: 100000,
    pipSize: 0.0001,
    pipValue: 10.0,
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStepSize: 0.01,
    displayDecimals: 5,
    tradingHours: DEFAULT_TRADING_HOURS,
    marginRequirement: 0.01
  },
  'USD/JPY': {
    asset: FOREX_PAIRS[2],
    symbol: 'USD/JPY',
    contractSize: 100000,
    pipSize: 0.01,
    pipValue: 9.09, // Approximate, varies with exchange rate
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStepSize: 0.01,
    displayDecimals: 3,
    tradingHours: DEFAULT_TRADING_HOURS,
    marginRequirement: 0.01
  },
  'AUD/USD': {
    asset: FOREX_PAIRS[3],
    symbol: 'AUD/USD',
    contractSize: 100000,
    pipSize: 0.0001,
    pipValue: 10.0,
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStepSize: 0.01,
    displayDecimals: 5,
    tradingHours: DEFAULT_TRADING_HOURS,
    marginRequirement: 0.01
  },
  'USD/CHF': {
    asset: FOREX_PAIRS[4],
    symbol: 'USD/CHF',
    contractSize: 100000,
    pipSize: 0.0001,
    pipValue: 10.0,
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStepSize: 0.01,
    displayDecimals: 5,
    tradingHours: DEFAULT_TRADING_HOURS,
    marginRequirement: 0.01
  },
  'USD/CAD': {
    asset: FOREX_PAIRS[5],
    symbol: 'USD/CAD',
    contractSize: 100000,
    pipSize: 0.0001,
    pipValue: 10.0,
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStepSize: 0.01,
    displayDecimals: 5,
    tradingHours: DEFAULT_TRADING_HOURS,
    marginRequirement: 0.01
  },
  'NZD/USD': {
    asset: FOREX_PAIRS[6],
    symbol: 'NZD/USD',
    contractSize: 100000,
    pipSize: 0.0001,
    pipValue: 10.0,
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStepSize: 0.01,
    displayDecimals: 5,
    tradingHours: DEFAULT_TRADING_HOURS,
    marginRequirement: 0.01
  },

  // ============================================================================
  // Stock Indices Configuration
  // ============================================================================
  'SPX': {
    asset: STOCK_INDICES[0],
    symbol: 'SPX',
    contractSize: 50, // $50 per point
    pipSize: 0.25,
    pipValue: 12.5, // $50 * 0.25
    minLotSize: 1,
    maxLotSize: 100,
    lotStepSize: 1,
    displayDecimals: 2,
    tradingHours: STOCK_TRADING_HOURS,
    marginRequirement: 0.05
  },
  'NDX': {
    asset: STOCK_INDICES[1],
    symbol: 'NDX',
    contractSize: 20, // $20 per point
    pipSize: 0.25,
    pipValue: 5.0, // $20 * 0.25
    minLotSize: 1,
    maxLotSize: 100,
    lotStepSize: 1,
    displayDecimals: 2,
    tradingHours: STOCK_TRADING_HOURS,
    marginRequirement: 0.05
  },
  'DJI': {
    asset: STOCK_INDICES[2],
    symbol: 'DJI',
    contractSize: 10, // $10 per point
    pipSize: 1.0,
    pipValue: 10.0, // $10 * 1.0
    minLotSize: 1,
    maxLotSize: 100,
    lotStepSize: 1,
    displayDecimals: 2,
    tradingHours: STOCK_TRADING_HOURS,
    marginRequirement: 0.05
  },
  'FTSE': {
    asset: STOCK_INDICES[3],
    symbol: 'FTSE',
    contractSize: 10, // £10 per point
    pipSize: 0.5,
    pipValue: 5.0, // £10 * 0.5
    minLotSize: 1,
    maxLotSize: 100,
    lotStepSize: 1,
    displayDecimals: 2,
    tradingHours: {
      open: '08:00',
      close: '16:30',
      timezone: 'Europe/London',
      tradingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI']
    },
    marginRequirement: 0.05
  },
  'DAX': {
    asset: STOCK_INDICES[4],
    symbol: 'DAX',
    contractSize: 25, // €25 per point
    pipSize: 0.5,
    pipValue: 12.5, // €25 * 0.5
    minLotSize: 1,
    maxLotSize: 100,
    lotStepSize: 1,
    displayDecimals: 2,
    tradingHours: {
      open: '09:00',
      close: '17:30',
      timezone: 'Europe/Berlin',
      tradingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI']
    },
    marginRequirement: 0.05
  },
  'N225': {
    asset: STOCK_INDICES[5],
    symbol: 'N225',
    contractSize: 1000, // ¥1000 per point
    pipSize: 5.0,
    pipValue: 5000, // ¥1000 * 5.0
    minLotSize: 1,
    maxLotSize: 100,
    lotStepSize: 1,
    displayDecimals: 2,
    tradingHours: {
      open: '09:00',
      close: '15:00',
      timezone: 'Asia/Tokyo',
      tradingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI']
    },
    marginRequirement: 0.05
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get asset configuration by symbol
 */
export function getAssetConfig(symbol: string): AssetConfig | undefined {
  return ASSET_CONFIGS[symbol];
}

/**
 * Get all assets of a specific type
 */
export function getAssetsByType(type: AssetType): Asset[] {
  switch (type) {
    case 'METAL':
      return METALS;
    case 'FOREX':
      return FOREX_PAIRS;
    case 'STOCK':
      return STOCK_INDICES;
    default:
      return [];
  }
}

/**
 * Get asset by symbol
 */
export function getAssetBySymbol(symbol: string): Asset | undefined {
  return ALL_ASSETS.find(asset => asset.symbol === symbol);
}

/**
 * Check if an asset is supported
 */
export function isAssetSupported(symbol: string): boolean {
  return symbol in ASSET_CONFIGS;
}

/**
 * Get all supported asset symbols
 */
export function getSupportedSymbols(): string[] {
  return Object.keys(ASSET_CONFIGS);
}
