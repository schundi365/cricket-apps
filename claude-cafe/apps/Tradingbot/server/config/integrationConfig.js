/**
 * Integration Configuration
 * Centralizes caching, retry logic, and service integration settings
 */

const NodeCache = require('node-cache');

// Cache Configuration
const CACHE_CONFIG = {
  // Price data cache - 30 seconds TTL
  priceCache: {
    stdTTL: 30,
    checkperiod: 60,
    useClones: false
  },
  
  // Sentiment analysis cache - 5 minutes TTL
  sentimentCache: {
    stdTTL: 300,
    checkperiod: 120,
    useClones: false
  },
  
  // Trending assets cache - 2 minutes TTL
  trendingCache: {
    stdTTL: 120,
    checkperiod: 60,
    useClones: false
  },
  
  // Safety scores cache - 5 minutes TTL
  safetyCache: {
    stdTTL: 300,
    checkperiod: 120,
    useClones: false
  },
  
  // Timing recommendations cache - 1 minute TTL
  timingCache: {
    stdTTL: 60,
    checkperiod: 30,
    useClones: false
  }
};

// Retry Configuration
const RETRY_CONFIG = {
  maxRetries: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  
  // Calculate delay with exponential backoff
  getDelay: (attempt) => {
    const delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
    return Math.min(delay, RETRY_CONFIG.maxDelay);
  }
};

// WebSocket Configuration
const WEBSOCKET_CONFIG = {
  heartbeatInterval: 30000, // 30 seconds
  reconnectDelay: 5000, // 5 seconds
  maxReconnectAttempts: 10,
  subscriptionTimeout: 5000 // 5 seconds
};

// API Configuration
const API_CONFIG = {
  timeout: 10000, // 10 seconds
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: 100
  }
};

// Create cache instances
const caches = {
  price: new NodeCache(CACHE_CONFIG.priceCache),
  sentiment: new NodeCache(CACHE_CONFIG.sentimentCache),
  trending: new NodeCache(CACHE_CONFIG.trendingCache),
  safety: new NodeCache(CACHE_CONFIG.safetyCache),
  timing: new NodeCache(CACHE_CONFIG.timingCache)
};

// Retry helper function
async function retryWithBackoff(fn, context = 'operation') {
  let lastError;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === RETRY_CONFIG.maxRetries) {
        console.error(`${context} failed after ${attempt} attempts:`, error.message);
        throw error;
      }
      
      const delay = RETRY_CONFIG.getDelay(attempt);
      console.warn(`${context} failed (attempt ${attempt}/${RETRY_CONFIG.maxRetries}), retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Cache helper functions
function getCacheKey(prefix, ...parts) {
  return `${prefix}:${parts.join(':')}`;
}

function getCachedOrFetch(cache, key, fetchFn, ttl = null) {
  return async () => {
    // Try to get from cache
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    // Fetch fresh data
    const data = await fetchFn();
    
    // Store in cache
    if (ttl !== null) {
      cache.set(key, data, ttl);
    } else {
      cache.set(key, data);
    }
    
    return data;
  };
}

// Clear all caches
function clearAllCaches() {
  Object.values(caches).forEach(cache => cache.flushAll());
  console.log('All caches cleared');
}

// Get cache statistics
function getCacheStats() {
  const stats = {};
  
  Object.entries(caches).forEach(([name, cache]) => {
    stats[name] = {
      keys: cache.keys().length,
      hits: cache.getStats().hits,
      misses: cache.getStats().misses,
      hitRate: cache.getStats().hits / (cache.getStats().hits + cache.getStats().misses) || 0
    };
  });
  
  return stats;
}

module.exports = {
  CACHE_CONFIG,
  RETRY_CONFIG,
  WEBSOCKET_CONFIG,
  API_CONFIG,
  caches,
  retryWithBackoff,
  getCacheKey,
  getCachedOrFetch,
  clearAllCaches,
  getCacheStats
};
