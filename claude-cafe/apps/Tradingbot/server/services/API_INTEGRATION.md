# External API Integration Guide

This document explains how the price service integrates with external APIs for metals, forex, and stocks data.

## Overview

The `PriceService` integrates with three external data providers:
- **Metals API** (metals-api.com) - For precious metals prices
- **ExchangeRate API** (exchangerate-api.com) - For forex currency pairs
- **TwelveData API** (twelvedata.com) - For stock indices and historical data

## Fallback Mechanism

The service implements a graceful fallback mechanism:
1. If API keys are not configured, the service uses mock data
2. If API calls fail, the service falls back to mock data
3. This ensures the application continues to function even without API access

## API Configuration

### 1. Metals API (metals-api.com)

**Get API Key:**
- Visit https://metals-api.com/
- Sign up for a free account
- Copy your API key

**Configure:**
```bash
# Add to .env file
METALS_API_KEY=your_metals_api_key_here
```

**Supported Metals:**
- Gold (GOLD → XAU)
- Silver (SILVER → XAG)
- Copper (COPPER → XCU)
- Platinum (PLATINUM → XPT)
- Palladium (PALLADIUM → XPD)

**API Details:**
- Endpoint: `https://metals-api.com/api/latest`
- Rate Limit: Varies by plan (free tier typically 50-100 requests/month)
- Data Format: Returns rates as 1 USD = X units of metal (inverted in code)

### 2. ExchangeRate API (exchangerate-api.com)

**Get API Key:**
- Visit https://www.exchangerate-api.com/
- Sign up for a free account
- Copy your API key

**Configure:**
```bash
# Add to .env file
FOREX_API_KEY=your_forex_api_key_here
```

**Supported Forex Pairs:**
- EUR/USD, GBP/USD, USD/JPY, AUD/USD
- USD/CHF, USD/CAD, NZD/USD

**API Details:**
- Endpoint: `https://v6.exchangerate-api.com/v6/{apikey}/pair/{base}/{quote}`
- Rate Limit: 1,500 requests/month (free tier)
- Data Format: Direct conversion rate

### 3. TwelveData API (twelvedata.com)

**Get API Key:**
- Visit https://twelvedata.com/
- Sign up for a free account
- Copy your API key

**Configure:**
```bash
# Add to .env file
STOCKS_API_KEY=your_stocks_api_key_here
```

**Supported Indices:**
- S&P 500 (SPX)
- NASDAQ (NDX)
- Dow Jones (DJI)
- FTSE 100 (FTSE)
- DAX (DAX)
- Nikkei 225 (N225)

**API Details:**
- Price Endpoint: `https://api.twelvedata.com/price`
- History Endpoint: `https://api.twelvedata.com/time_series`
- Rate Limit: 800 requests/day (free tier)
- Data Format: OHLCV (Open, High, Low, Close, Volume)

## Error Handling

The service implements robust error handling:

### Retry Logic
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Maximum 5 retry attempts
- Automatic fallback to mock data after retries exhausted

### Timeout Configuration
- Current price requests: 10 second timeout
- Historical data requests: 15 second timeout

### Error Types Handled
1. **Network Errors**: Connection timeouts, DNS failures
2. **API Errors**: Invalid API key, rate limit exceeded, invalid symbol
3. **Data Errors**: Missing data, invalid format

## Testing Without API Keys

The service is designed to work without API keys for development and testing:

```bash
# Run tests without API keys
npm test

# The service will use fallback data and log warnings
# This is expected behavior and tests will pass
```

## Production Deployment

For production deployment:

1. **Obtain API keys** from all three providers
2. **Configure environment variables** in your hosting platform
3. **Monitor API usage** to stay within rate limits
4. **Set up alerts** for API failures

### Environment Variables Checklist
```bash
METALS_API_KEY=your_metals_api_key
FOREX_API_KEY=your_forex_api_key
STOCKS_API_KEY=your_stocks_api_key
```

## Rate Limit Management

To avoid hitting rate limits:

1. **Caching**: Service uses 30-second TTL cache
2. **Request Deduplication**: Concurrent requests for same asset are deduplicated
3. **Subscription Model**: Use `subscribeToUpdates()` for real-time data instead of polling

## API Response Examples

### Metals API Response
```json
{
  "success": true,
  "timestamp": 1704067200,
  "base": "USD",
  "rates": {
    "XAU": 0.0005
  }
}
```

### ExchangeRate API Response
```json
{
  "result": "success",
  "time_last_update_unix": 1704067200,
  "base_code": "EUR",
  "target_code": "USD",
  "conversion_rate": 1.10
}
```

### TwelveData API Response
```json
{
  "price": "4500.25"
}
```

## Troubleshooting

### Issue: "API key not configured" warnings
**Solution**: Add API keys to `.env` file or use fallback data for development

### Issue: Rate limit exceeded
**Solution**: 
- Upgrade to paid API plan
- Reduce polling frequency
- Rely more on caching

### Issue: Invalid symbol errors
**Solution**: Verify symbol format matches API requirements (e.g., "XAU" not "GOLD" for Metals API)

### Issue: Timeout errors
**Solution**:
- Check network connectivity
- Verify API service status
- Increase timeout values if needed

## Future Enhancements

Potential improvements for production:
1. Add secondary API providers for redundancy
2. Implement circuit breaker pattern
3. Add API health monitoring
4. Implement request queuing for rate limit management
5. Add WebSocket support for real-time data where available
