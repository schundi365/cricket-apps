/**
 * Multi-Asset Price Service
 * Fetches and caches real-time prices from multiple asset class APIs
 */

import NodeCache from 'node-cache';
import axios, { AxiosError } from 'axios';
import { Asset, AssetPrice, PricePoint, TimePeriod, PriceUpdateCallback } from '../types';
import { errorHandler, DataSource, ErrorType } from './errorHandler';

export class PriceService {
  private cache: NodeCache;
  private subscribers: Map<string, Set<PriceUpdateCallback>>;
  private updateIntervals: Map<string, NodeJS.Timeout>;
  private pendingRequests: Map<string, Promise<AssetPrice>>;

  constructor() {
    // Initialize cache with 30-second TTL
    this.cache = new NodeCache({ stdTTL: 30, checkperiod: 10 });
    this.subscribers = new Map();
    this.updateIntervals = new Map();
    this.pendingRequests = new Map();
  }

  /**
   * Get current price for an asset (with caching)
   * Validates: Requirements 11.1, 11.2
   */
  async getCurrentPrice(asset: Asset): Promise<AssetPrice> {
    const cacheKey = this.getCacheKey(asset);
    
    // Check cache first
    const cachedPrice = this.cache.get<AssetPrice>(cacheKey);
    if (cachedPrice) {
      return cachedPrice;
    }

    // Check if there's already a pending request for this asset
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Fetch from API if not cached and no pending request
    const pricePromise = this.fetchPriceFromAPI(asset).then(price => {
      // Store in cache
      this.cache.set(cacheKey, price);
      
      // Notify subscribers
      this.notifySubscribers(asset, price);
      
      // Remove from pending requests
      this.pendingRequests.delete(cacheKey);
      
      return price;
    }).catch(error => {
      // Remove from pending requests on error
      this.pendingRequests.delete(cacheKey);
      throw error;
    });
    
    // Store the pending request
    this.pendingRequests.set(cacheKey, pricePromise);
    
    return pricePromise;
  }

  /**
   * Get price history for an asset
   * Validates: Requirements 11.1, 11.2
   */
  async getPriceHistory(asset: Asset, period: TimePeriod): Promise<PricePoint[]> {
    const cacheKey = `${this.getCacheKey(asset)}_history_${period}`;
    
    // Check cache first
    const cachedHistory = this.cache.get<PricePoint[]>(cacheKey);
    if (cachedHistory) {
      return cachedHistory;
    }

    // Fetch from API if not cached
    const history = await this.fetchHistoryFromAPI(asset, period);
    
    // Store in cache
    this.cache.set(cacheKey, history);
    
    return history;
  }

  /**
   * Subscribe to price updates for an asset
   * Validates: Requirements 11.2, 11.6
   */
  subscribeToUpdates(asset: Asset, callback: PriceUpdateCallback): void {
    const key = this.getCacheKey(asset);
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);
    
    // Start periodic updates if not already running
    if (!this.updateIntervals.has(key)) {
      const interval = setInterval(async () => {
        try {
          const price = await this.fetchPriceFromAPI(asset);
          this.cache.set(key, price);
          this.notifySubscribers(asset, price);
        } catch (error) {
          console.error(`Error updating price for ${key}:`, error);
        }
      }, 30000); // Update every 30 seconds
      
      this.updateIntervals.set(key, interval);
    }
  }

  /**
   * Get last update time for an asset
   * Validates: Requirements 11.4, 11.5
   */
  getLastUpdateTime(asset: Asset): Date {
    const cacheKey = this.getCacheKey(asset);
    const cachedPrice = this.cache.get<AssetPrice>(cacheKey);
    
    if (cachedPrice) {
      return cachedPrice.timestamp;
    }
    
    // Return epoch if no cached data
    return new Date(0);
  }

  /**
   * Generate cache key for an asset
   */
  private getCacheKey(asset: Asset): string {
    return `${asset.type}_${asset.symbol}`;
  }

  /**
   * Fetch price from external API
   * Implements exponential backoff retry logic
   * Validates: Requirements 11.1, 11.7
   */
  private async fetchPriceFromAPI(asset: Asset): Promise<AssetPrice> {
    const dataSource = this.getDataSource(asset.type);
    
    const fetchFn = async () => {
      const price = await this.callExternalAPI(asset);
      errorHandler.markConnectionSuccess(dataSource);
      return price;
    };

    const fallbackFn = async () => {
      console.log(`Using fallback price for ${asset.symbol}`);
      return this.getFallbackPrice(asset);
    };

    try {
      return await errorHandler.handleAPIError(
        errorHandler.createAPIError(
          dataSource,
          `Fetching price for ${asset.symbol}`,
          undefined,
          true
        ),
        fetchFn,
        fallbackFn
      );
    } catch (error) {
      // If all retries and fallback fail, throw
      throw new Error(`Failed to fetch price for ${asset.symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch price history from external API
   */
  private async fetchHistoryFromAPI(asset: Asset, period: TimePeriod): Promise<PricePoint[]> {
    // Mock implementation - replace with actual API calls
    return this.callExternalHistoryAPI(asset, period);
  }

  /**
   * Call external API based on asset type
   * Integrates with metals-api.com, exchangerate-api.com, and twelvedata.com
   * Validates: Requirements 11.1, 11.7
   */
  private async callExternalAPI(asset: Asset): Promise<AssetPrice> {
    switch (asset.type) {
      case 'METAL':
        return this.fetchMetalPrice(asset);
      case 'FOREX':
        return this.fetchForexPrice(asset);
      case 'STOCK':
        return this.fetchStockPrice(asset);
      default:
        throw new Error(`Unsupported asset type: ${asset.type}`);
    }
  }

  /**
   * Fetch metal price from metals-api.com
   * API: https://metals-api.com/
   */
  private async fetchMetalPrice(asset: Asset): Promise<AssetPrice> {
    const apiKey = process.env.METALS_API_KEY;
    
    if (!apiKey) {
      console.warn('METALS_API_KEY not configured, using fallback data');
      return this.getFallbackPrice(asset);
    }

    try {
      // Metals API uses base currency USD and symbols like XAU, XAG, etc.
      const metalSymbol = this.getMetalSymbol(asset.symbol);
      const url = `https://metals-api.com/api/latest?access_key=${apiKey}&base=USD&symbols=${metalSymbol}`;
      
      const response = await axios.get(url, { timeout: 10000 });
      
      if (!response.data.success) {
        const error = errorHandler.createAPIError(
          DataSource.METALS,
          `Metals API error: ${response.data.error?.info || 'Unknown error'}`,
          response.status,
          true
        );
        throw error;
      }

      // Metals API returns rates as 1 USD = X units of metal
      // We need to invert to get price in USD per unit
      const rate = response.data.rates[metalSymbol];
      if (!rate) {
        const error = errorHandler.createAPIError(
          DataSource.METALS,
          `No rate found for ${metalSymbol}`,
          response.status,
          false
        );
        throw error;
      }

      const price = 1 / rate;
      const spread = price * 0.0002; // 0.02% typical spread for metals

      return {
        asset,
        price,
        currency: 'USD',
        timestamp: new Date(response.data.timestamp * 1000),
        bid: price - spread / 2,
        ask: price + spread / 2,
        spread,
        volume: undefined // Metals API doesn't provide volume
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiError = errorHandler.createAPIError(
          DataSource.METALS,
          `Metals API error for ${asset.symbol}: ${error.message}`,
          error.response?.status,
          true
        );
        throw apiError;
      }
      throw error;
    }
  }

  /**
   * Fetch forex price from exchangerate-api.com
   * API: https://www.exchangerate-api.com/
   */
  private async fetchForexPrice(asset: Asset): Promise<AssetPrice> {
    const apiKey = process.env.FOREX_API_KEY;
    
    if (!apiKey) {
      console.warn('FOREX_API_KEY not configured, using fallback data');
      return this.getFallbackPrice(asset);
    }

    try {
      // Parse forex pair (e.g., "EUR/USD" -> base: EUR, quote: USD)
      const [base, quote] = asset.symbol.split('/');
      const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${base}/${quote}`;
      
      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.data.result !== 'success') {
        throw new Error(`Forex API error: ${response.data['error-type'] || 'Unknown error'}`);
      }

      const price = response.data.conversion_rate;
      const spread = price * 0.0001; // 0.01% typical spread for major forex pairs

      return {
        asset,
        price,
        currency: quote,
        timestamp: new Date(response.data.time_last_update_unix * 1000),
        bid: price - spread / 2,
        ask: price + spread / 2,
        spread,
        volume: undefined // ExchangeRate API doesn't provide volume
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Forex API error for ${asset.symbol}:`, error.message);
      }
      return this.getFallbackPrice(asset);
    }
  }

  /**
   * Fetch stock/index price from twelvedata.com
   * API: https://twelvedata.com/
   */
  private async fetchStockPrice(asset: Asset): Promise<AssetPrice> {
    const apiKey = process.env.STOCKS_API_KEY;
    
    if (!apiKey) {
      console.warn('STOCKS_API_KEY not configured, using fallback data');
      return this.getFallbackPrice(asset);
    }

    try {
      const url = `https://api.twelvedata.com/price?symbol=${asset.symbol}&apikey=${apiKey}`;
      
      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.data.status === 'error') {
        throw new Error(`Stocks API error: ${response.data.message || 'Unknown error'}`);
      }

      const price = parseFloat(response.data.price);
      const spread = price * 0.0005; // 0.05% typical spread for indices

      return {
        asset,
        price,
        currency: 'USD',
        timestamp: new Date(),
        bid: price - spread / 2,
        ask: price + spread / 2,
        spread,
        volume: undefined // Basic price endpoint doesn't include volume
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Stocks API error for ${asset.symbol}:`, error.message);
      }
      return this.getFallbackPrice(asset);
    }
  }

  /**
   * Get metal symbol for API (e.g., "GOLD" -> "XAU")
   */
  private getMetalSymbol(symbol: string): string {
    const metalMap: Record<string, string> = {
      'GOLD': 'XAU',
      'SILVER': 'XAG',
      'COPPER': 'XCU',
      'PLATINUM': 'XPT',
      'PALLADIUM': 'XPD'
    };
    return metalMap[symbol] || symbol;
  }

  /**
   * Get fallback price when API is unavailable
   * Uses mock data to maintain functionality
   */
  private getFallbackPrice(asset: Asset): AssetPrice {
    const basePrice = this.getBasePriceForAsset(asset);
    const spread = basePrice * 0.0001;
    
    return {
      asset,
      price: basePrice,
      currency: 'USD',
      timestamp: new Date(),
      bid: basePrice - spread / 2,
      ask: basePrice + spread / 2,
      spread,
      volume: Math.random() * 1000000
    };
  }

  /**
   * Call external history API
   * Integrates with twelvedata.com for historical data
   * Validates: Requirements 11.1, 11.2
   */
  private async callExternalHistoryAPI(asset: Asset, period: TimePeriod): Promise<PricePoint[]> {
    const apiKey = process.env.STOCKS_API_KEY;
    
    if (!apiKey) {
      console.warn('STOCKS_API_KEY not configured for history, using fallback data');
      return this.getFallbackHistory(asset, period);
    }

    try {
      // TwelveData supports historical data for stocks, forex, and some commodities
      const interval = this.getIntervalForPeriod(period);
      const outputSize = this.getOutputSizeForPeriod(period);
      
      const url = `https://api.twelvedata.com/time_series?symbol=${asset.symbol}&interval=${interval}&outputsize=${outputSize}&apikey=${apiKey}`;
      
      const response = await axios.get(url, { timeout: 15000 });
      
      if (response.data.status === 'error') {
        throw new Error(`History API error: ${response.data.message || 'Unknown error'}`);
      }

      if (!response.data.values || response.data.values.length === 0) {
        throw new Error('No historical data available');
      }

      // Convert TwelveData format to PricePoint format
      const points: PricePoint[] = response.data.values.map((item: any) => ({
        timestamp: new Date(item.datetime),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: item.volume ? parseFloat(item.volume) : undefined
      }));

      return points.reverse(); // TwelveData returns newest first, we want oldest first
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`History API error for ${asset.symbol}:`, error.message);
      }
      return this.getFallbackHistory(asset, period);
    }
  }

  /**
   * Get interval string for TwelveData API based on period
   */
  private getIntervalForPeriod(period: TimePeriod): string {
    const intervalMap: Record<TimePeriod, string> = {
      '1H': '1min',
      '4H': '5min',
      '1D': '1h',
      '1W': '1day',
      '1M': '1day'
    };
    return intervalMap[period] || '1h';
  }

  /**
   * Get output size for TwelveData API based on period
   */
  private getOutputSizeForPeriod(period: TimePeriod): number {
    const sizeMap: Record<TimePeriod, number> = {
      '1H': 60,
      '4H': 48,
      '1D': 24,
      '1W': 168,
      '1M': 30
    };
    return sizeMap[period] || 24;
  }

  /**
   * Get fallback historical data when API is unavailable
   */
  private getFallbackHistory(asset: Asset, period: TimePeriod): PricePoint[] {
    const basePrice = this.getBasePriceForAsset(asset);
    const points: PricePoint[] = [];
    const now = Date.now();
    
    // Generate mock historical data
    const intervals = this.getIntervalsForPeriod(period);
    for (let i = 0; i < intervals; i++) {
      const timestamp = new Date(now - i * 3600000); // 1 hour intervals
      const variance = (Math.random() - 0.5) * basePrice * 0.02; // ±2% variance
      const price = basePrice + variance;
      
      points.push({
        timestamp,
        open: price,
        high: price * 1.005,
        low: price * 0.995,
        close: price,
        volume: Math.random() * 1000000
      });
    }
    
    return points.reverse();
  }

  /**
   * Get base price for asset (mock data)
   */
  private getBasePriceForAsset(asset: Asset): number {
    const prices: Record<string, number> = {
      'GOLD': 2000,
      'SILVER': 25,
      'COPPER': 4,
      'PLATINUM': 1000,
      'PALLADIUM': 1500,
      'EUR/USD': 1.10,
      'GBP/USD': 1.27,
      'USD/JPY': 150,
      'AUD/USD': 0.66,
      'USD/CHF': 0.88,
      'USD/CAD': 1.35,
      'NZD/USD': 0.61,
      'SPX': 4500,
      'NDX': 15000,
      'DJI': 35000,
      'FTSE': 7500,
      'DAX': 16000,
      'N225': 33000
    };
    
    return prices[asset.symbol] || 100;
  }

  /**
   * Get number of intervals for a time period
   */
  private getIntervalsForPeriod(period: TimePeriod): number {
    const intervals: Record<TimePeriod, number> = {
      '1H': 60,
      '4H': 240,
      '1D': 24,
      '1W': 168,
      '1M': 720
    };
    
    return intervals[period] || 24;
  }

  /**
   * Notify subscribers of price updates
   */
  private notifySubscribers(asset: Asset, price: AssetPrice): void {
    const key = this.getCacheKey(asset);
    const callbacks = this.subscribers.get(key);
    
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(price);
        } catch (error) {
          console.error('Error in price update callback:', error);
        }
      });
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get data source from asset type
   */
  private getDataSource(assetType: string): DataSource {
    switch (assetType) {
      case 'METAL':
        return DataSource.METALS;
      case 'FOREX':
        return DataSource.FOREX;
      case 'STOCK':
        return DataSource.STOCKS;
      default:
        return DataSource.CACHE;
    }
  }

  /**
   * Cleanup method to clear intervals
   */
  destroy(): void {
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();
    this.subscribers.clear();
    this.cache.flushAll();
  }
}
