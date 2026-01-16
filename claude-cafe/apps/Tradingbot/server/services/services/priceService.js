"use strict";
/**
 * Multi-Asset Price Service
 * Fetches and caches real-time prices from multiple asset class APIs
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceService = void 0;
var node_cache_1 = __importDefault(require("node-cache"));
var axios_1 = __importDefault(require("axios"));
var PriceService = /** @class */ (function () {
    function PriceService() {
        // Initialize cache with 30-second TTL
        this.cache = new node_cache_1.default({ stdTTL: 30, checkperiod: 10 });
        this.subscribers = new Map();
        this.updateIntervals = new Map();
        this.pendingRequests = new Map();
    }
    /**
     * Get current price for an asset (with caching)
     * Validates: Requirements 11.1, 11.2
     */
    PriceService.prototype.getCurrentPrice = function (asset) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cachedPrice, pendingRequest, pricePromise;
            var _this = this;
            return __generator(this, function (_a) {
                cacheKey = this.getCacheKey(asset);
                cachedPrice = this.cache.get(cacheKey);
                if (cachedPrice) {
                    return [2 /*return*/, cachedPrice];
                }
                pendingRequest = this.pendingRequests.get(cacheKey);
                if (pendingRequest) {
                    return [2 /*return*/, pendingRequest];
                }
                pricePromise = this.fetchPriceFromAPI(asset).then(function (price) {
                    // Store in cache
                    _this.cache.set(cacheKey, price);
                    // Notify subscribers
                    _this.notifySubscribers(asset, price);
                    // Remove from pending requests
                    _this.pendingRequests.delete(cacheKey);
                    return price;
                }).catch(function (error) {
                    // Remove from pending requests on error
                    _this.pendingRequests.delete(cacheKey);
                    throw error;
                });
                // Store the pending request
                this.pendingRequests.set(cacheKey, pricePromise);
                return [2 /*return*/, pricePromise];
            });
        });
    };
    /**
     * Get price history for an asset
     * Validates: Requirements 11.1, 11.2
     */
    PriceService.prototype.getPriceHistory = function (asset, period) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cachedHistory, history;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = "".concat(this.getCacheKey(asset), "_history_").concat(period);
                        cachedHistory = this.cache.get(cacheKey);
                        if (cachedHistory) {
                            return [2 /*return*/, cachedHistory];
                        }
                        return [4 /*yield*/, this.fetchHistoryFromAPI(asset, period)];
                    case 1:
                        history = _a.sent();
                        // Store in cache
                        this.cache.set(cacheKey, history);
                        return [2 /*return*/, history];
                }
            });
        });
    };
    /**
     * Subscribe to price updates for an asset
     * Validates: Requirements 11.2, 11.6
     */
    PriceService.prototype.subscribeToUpdates = function (asset, callback) {
        var _this = this;
        var key = this.getCacheKey(asset);
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);
        // Start periodic updates if not already running
        if (!this.updateIntervals.has(key)) {
            var interval = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
                var price, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.fetchPriceFromAPI(asset)];
                        case 1:
                            price = _a.sent();
                            this.cache.set(key, price);
                            this.notifySubscribers(asset, price);
                            return [3 /*break*/, 3];
                        case 2:
                            error_1 = _a.sent();
                            console.error("Error updating price for ".concat(key, ":"), error_1);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); }, 30000); // Update every 30 seconds
            this.updateIntervals.set(key, interval);
        }
    };
    /**
     * Get last update time for an asset
     * Validates: Requirements 11.4, 11.5
     */
    PriceService.prototype.getLastUpdateTime = function (asset) {
        var cacheKey = this.getCacheKey(asset);
        var cachedPrice = this.cache.get(cacheKey);
        if (cachedPrice) {
            return cachedPrice.timestamp;
        }
        // Return epoch if no cached data
        return new Date(0);
    };
    /**
     * Generate cache key for an asset
     */
    PriceService.prototype.getCacheKey = function (asset) {
        return "".concat(asset.type, "_").concat(asset.symbol);
    };
    /**
     * Fetch price from external API
     * Implements exponential backoff retry logic
     * Validates: Requirements 11.1, 11.7
     */
    PriceService.prototype.fetchPriceFromAPI = function (asset) {
        return __awaiter(this, void 0, void 0, function () {
            var maxRetries, retryDelay, attempt, price, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        maxRetries = 5;
                        retryDelay = 1000;
                        attempt = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempt < maxRetries)) return [3 /*break*/, 7];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, this.callExternalAPI(asset)];
                    case 3:
                        price = _a.sent();
                        return [2 /*return*/, price];
                    case 4:
                        error_2 = _a.sent();
                        if (attempt === maxRetries - 1) {
                            throw new Error("Failed to fetch price for ".concat(asset.symbol, " after ").concat(maxRetries, " attempts"));
                        }
                        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
                        return [4 /*yield*/, this.sleep(retryDelay)];
                    case 5:
                        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
                        _a.sent();
                        retryDelay *= 2;
                        return [3 /*break*/, 6];
                    case 6:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 7: throw new Error("Failed to fetch price for ".concat(asset.symbol));
                }
            });
        });
    };
    /**
     * Fetch price history from external API
     */
    PriceService.prototype.fetchHistoryFromAPI = function (asset, period) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Mock implementation - replace with actual API calls
                return [2 /*return*/, this.callExternalHistoryAPI(asset, period)];
            });
        });
    };
    /**
     * Call external API based on asset type
     * Integrates with metals-api.com, exchangerate-api.com, and twelvedata.com
     * Validates: Requirements 11.1, 11.7
     */
    PriceService.prototype.callExternalAPI = function (asset) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (asset.type) {
                    case 'METAL':
                        return [2 /*return*/, this.fetchMetalPrice(asset)];
                    case 'FOREX':
                        return [2 /*return*/, this.fetchForexPrice(asset)];
                    case 'STOCK':
                        return [2 /*return*/, this.fetchStockPrice(asset)];
                    default:
                        throw new Error("Unsupported asset type: ".concat(asset.type));
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Fetch metal price from metals-api.com
     * API: https://metals-api.com/
     */
    PriceService.prototype.fetchMetalPrice = function (asset) {
        return __awaiter(this, void 0, void 0, function () {
            var apiKey, metalSymbol, url, response, rate, price, spread, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        apiKey = process.env.METALS_API_KEY;
                        if (!apiKey) {
                            console.warn('METALS_API_KEY not configured, using fallback data');
                            return [2 /*return*/, this.getFallbackPrice(asset)];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        metalSymbol = this.getMetalSymbol(asset.symbol);
                        url = "https://metals-api.com/api/latest?access_key=".concat(apiKey, "&base=USD&symbols=").concat(metalSymbol);
                        return [4 /*yield*/, axios_1.default.get(url, { timeout: 10000 })];
                    case 2:
                        response = _b.sent();
                        if (!response.data.success) {
                            throw new Error("Metals API error: ".concat(((_a = response.data.error) === null || _a === void 0 ? void 0 : _a.info) || 'Unknown error'));
                        }
                        rate = response.data.rates[metalSymbol];
                        if (!rate) {
                            throw new Error("No rate found for ".concat(metalSymbol));
                        }
                        price = 1 / rate;
                        spread = price * 0.0002;
                        return [2 /*return*/, {
                                asset: asset,
                                price: price,
                                currency: 'USD',
                                timestamp: new Date(response.data.timestamp * 1000),
                                bid: price - spread / 2,
                                ask: price + spread / 2,
                                spread: spread,
                                volume: undefined // Metals API doesn't provide volume
                            }];
                    case 3:
                        error_3 = _b.sent();
                        if (axios_1.default.isAxiosError(error_3)) {
                            console.error("Metals API error for ".concat(asset.symbol, ":"), error_3.message);
                        }
                        return [2 /*return*/, this.getFallbackPrice(asset)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetch forex price from exchangerate-api.com
     * API: https://www.exchangerate-api.com/
     */
    PriceService.prototype.fetchForexPrice = function (asset) {
        return __awaiter(this, void 0, void 0, function () {
            var apiKey, _a, base, quote, url, response, price, spread, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        apiKey = process.env.FOREX_API_KEY;
                        if (!apiKey) {
                            console.warn('FOREX_API_KEY not configured, using fallback data');
                            return [2 /*return*/, this.getFallbackPrice(asset)];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        _a = asset.symbol.split('/'), base = _a[0], quote = _a[1];
                        url = "https://v6.exchangerate-api.com/v6/".concat(apiKey, "/pair/").concat(base, "/").concat(quote);
                        return [4 /*yield*/, axios_1.default.get(url, { timeout: 10000 })];
                    case 2:
                        response = _b.sent();
                        if (response.data.result !== 'success') {
                            throw new Error("Forex API error: ".concat(response.data['error-type'] || 'Unknown error'));
                        }
                        price = response.data.conversion_rate;
                        spread = price * 0.0001;
                        return [2 /*return*/, {
                                asset: asset,
                                price: price,
                                currency: quote,
                                timestamp: new Date(response.data.time_last_update_unix * 1000),
                                bid: price - spread / 2,
                                ask: price + spread / 2,
                                spread: spread,
                                volume: undefined // ExchangeRate API doesn't provide volume
                            }];
                    case 3:
                        error_4 = _b.sent();
                        if (axios_1.default.isAxiosError(error_4)) {
                            console.error("Forex API error for ".concat(asset.symbol, ":"), error_4.message);
                        }
                        return [2 /*return*/, this.getFallbackPrice(asset)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetch stock/index price from twelvedata.com
     * API: https://twelvedata.com/
     */
    PriceService.prototype.fetchStockPrice = function (asset) {
        return __awaiter(this, void 0, void 0, function () {
            var apiKey, url, response, price, spread, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        apiKey = process.env.STOCKS_API_KEY;
                        if (!apiKey) {
                            console.warn('STOCKS_API_KEY not configured, using fallback data');
                            return [2 /*return*/, this.getFallbackPrice(asset)];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        url = "https://api.twelvedata.com/price?symbol=".concat(asset.symbol, "&apikey=").concat(apiKey);
                        return [4 /*yield*/, axios_1.default.get(url, { timeout: 10000 })];
                    case 2:
                        response = _a.sent();
                        if (response.data.status === 'error') {
                            throw new Error("Stocks API error: ".concat(response.data.message || 'Unknown error'));
                        }
                        price = parseFloat(response.data.price);
                        spread = price * 0.0005;
                        return [2 /*return*/, {
                                asset: asset,
                                price: price,
                                currency: 'USD',
                                timestamp: new Date(),
                                bid: price - spread / 2,
                                ask: price + spread / 2,
                                spread: spread,
                                volume: undefined // Basic price endpoint doesn't include volume
                            }];
                    case 3:
                        error_5 = _a.sent();
                        if (axios_1.default.isAxiosError(error_5)) {
                            console.error("Stocks API error for ".concat(asset.symbol, ":"), error_5.message);
                        }
                        return [2 /*return*/, this.getFallbackPrice(asset)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get metal symbol for API (e.g., "GOLD" -> "XAU")
     */
    PriceService.prototype.getMetalSymbol = function (symbol) {
        var metalMap = {
            'GOLD': 'XAU',
            'SILVER': 'XAG',
            'COPPER': 'XCU',
            'PLATINUM': 'XPT',
            'PALLADIUM': 'XPD'
        };
        return metalMap[symbol] || symbol;
    };
    /**
     * Get fallback price when API is unavailable
     * Uses mock data to maintain functionality
     */
    PriceService.prototype.getFallbackPrice = function (asset) {
        var basePrice = this.getBasePriceForAsset(asset);
        var spread = basePrice * 0.0001;
        return {
            asset: asset,
            price: basePrice,
            currency: 'USD',
            timestamp: new Date(),
            bid: basePrice - spread / 2,
            ask: basePrice + spread / 2,
            spread: spread,
            volume: Math.random() * 1000000
        };
    };
    /**
     * Call external history API
     * Integrates with twelvedata.com for historical data
     * Validates: Requirements 11.1, 11.2
     */
    PriceService.prototype.callExternalHistoryAPI = function (asset, period) {
        return __awaiter(this, void 0, void 0, function () {
            var apiKey, interval, outputSize, url, response, points, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        apiKey = process.env.STOCKS_API_KEY;
                        if (!apiKey) {
                            console.warn('STOCKS_API_KEY not configured for history, using fallback data');
                            return [2 /*return*/, this.getFallbackHistory(asset, period)];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        interval = this.getIntervalForPeriod(period);
                        outputSize = this.getOutputSizeForPeriod(period);
                        url = "https://api.twelvedata.com/time_series?symbol=".concat(asset.symbol, "&interval=").concat(interval, "&outputsize=").concat(outputSize, "&apikey=").concat(apiKey);
                        return [4 /*yield*/, axios_1.default.get(url, { timeout: 15000 })];
                    case 2:
                        response = _a.sent();
                        if (response.data.status === 'error') {
                            throw new Error("History API error: ".concat(response.data.message || 'Unknown error'));
                        }
                        if (!response.data.values || response.data.values.length === 0) {
                            throw new Error('No historical data available');
                        }
                        points = response.data.values.map(function (item) { return ({
                            timestamp: new Date(item.datetime),
                            open: parseFloat(item.open),
                            high: parseFloat(item.high),
                            low: parseFloat(item.low),
                            close: parseFloat(item.close),
                            volume: item.volume ? parseFloat(item.volume) : undefined
                        }); });
                        return [2 /*return*/, points.reverse()]; // TwelveData returns newest first, we want oldest first
                    case 3:
                        error_6 = _a.sent();
                        if (axios_1.default.isAxiosError(error_6)) {
                            console.error("History API error for ".concat(asset.symbol, ":"), error_6.message);
                        }
                        return [2 /*return*/, this.getFallbackHistory(asset, period)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get interval string for TwelveData API based on period
     */
    PriceService.prototype.getIntervalForPeriod = function (period) {
        var intervalMap = {
            '1H': '1min',
            '4H': '5min',
            '1D': '1h',
            '1W': '1day',
            '1M': '1day'
        };
        return intervalMap[period] || '1h';
    };
    /**
     * Get output size for TwelveData API based on period
     */
    PriceService.prototype.getOutputSizeForPeriod = function (period) {
        var sizeMap = {
            '1H': 60,
            '4H': 48,
            '1D': 24,
            '1W': 168,
            '1M': 30
        };
        return sizeMap[period] || 24;
    };
    /**
     * Get fallback historical data when API is unavailable
     */
    PriceService.prototype.getFallbackHistory = function (asset, period) {
        var basePrice = this.getBasePriceForAsset(asset);
        var points = [];
        var now = Date.now();
        // Generate mock historical data
        var intervals = this.getIntervalsForPeriod(period);
        for (var i = 0; i < intervals; i++) {
            var timestamp = new Date(now - i * 3600000); // 1 hour intervals
            var variance = (Math.random() - 0.5) * basePrice * 0.02; // ±2% variance
            var price = basePrice + variance;
            points.push({
                timestamp: timestamp,
                open: price,
                high: price * 1.005,
                low: price * 0.995,
                close: price,
                volume: Math.random() * 1000000
            });
        }
        return points.reverse();
    };
    /**
     * Get base price for asset (mock data)
     */
    PriceService.prototype.getBasePriceForAsset = function (asset) {
        var prices = {
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
    };
    /**
     * Get number of intervals for a time period
     */
    PriceService.prototype.getIntervalsForPeriod = function (period) {
        var intervals = {
            '1H': 60,
            '4H': 240,
            '1D': 24,
            '1W': 168,
            '1M': 720
        };
        return intervals[period] || 24;
    };
    /**
     * Notify subscribers of price updates
     */
    PriceService.prototype.notifySubscribers = function (asset, price) {
        var key = this.getCacheKey(asset);
        var callbacks = this.subscribers.get(key);
        if (callbacks) {
            callbacks.forEach(function (callback) {
                try {
                    callback(price);
                }
                catch (error) {
                    console.error('Error in price update callback:', error);
                }
            });
        }
    };
    /**
     * Sleep utility for retry delays
     */
    PriceService.prototype.sleep = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    /**
     * Cleanup method to clear intervals
     */
    PriceService.prototype.destroy = function () {
        this.updateIntervals.forEach(function (interval) { return clearInterval(interval); });
        this.updateIntervals.clear();
        this.subscribers.clear();
        this.cache.flushAll();
    };
    return PriceService;
}());
exports.PriceService = PriceService;
