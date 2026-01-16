const axios = require('axios');
const NodeCache = require('node-cache');

// Cache rates for 10 seconds to avoid excessive API calls
const cache = new NodeCache({ stdTTL: 10 });

const FOREX_API_KEY = process.env.FOREX_API_KEY;
const API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

class ForexService {
  async getRates(baseCurrency = 'USD') {
    const cacheKey = `rates_${baseCurrency}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/${baseCurrency}`);
      const data = {
        base: response.data.base,
        date: response.data.date,
        rates: response.data.rates
      };
      
      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching rates:', error.message);
      throw new Error('Failed to fetch exchange rates');
    }
  }

  async convert(from, to, amount) {
    const rates = await this.getRates(from);
    const rate = rates.rates[to];
    
    if (!rate) {
      throw new Error(`Exchange rate not found for ${from}/${to}`);
    }

    return {
      from,
      to,
      amount,
      rate,
      result: amount * rate,
      timestamp: new Date().toISOString()
    };
  }

  async getMultiplePairRates(pairs) {
    const results = {};
    
    for (const pair of pairs) {
      const [from, to] = pair.split('/');
      try {
        const rates = await this.getRates(from);
        results[pair] = {
          rate: rates.rates[to],
          change: this.calculateChange(pair, rates.rates[to]),
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error(`Error fetching ${pair}:`, error.message);
      }
    }
    
    return results;
  }

  calculateChange(pair, currentRate) {
    const previousKey = `prev_${pair}`;
    const previousRate = cache.get(previousKey);
    
    if (previousRate) {
      const change = ((currentRate - previousRate) / previousRate) * 100;
      cache.set(previousKey, currentRate);
      return change.toFixed(4);
    }
    
    cache.set(previousKey, currentRate);
    return 0;
  }

  async getSupportedCurrencies() {
    const rates = await this.getRates('USD');
    return Object.keys(rates.rates).sort();
  }
}

module.exports = new ForexService();
