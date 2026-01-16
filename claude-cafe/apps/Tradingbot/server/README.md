# Multi-Asset Market Sentiment and Trading Risk Management System

## Project Structure

```
server/
├── types/
│   ├── index.ts              # Core TypeScript type definitions
│   └── index.test.ts         # Type definition tests
├── config/
│   ├── assetConfig.ts        # Asset configuration data (metals, forex, stocks)
│   └── assetConfig.test.ts   # Asset configuration tests
├── services/
│   ├── priceService.ts       # Multi-asset price fetching and caching
│   ├── sentimentService.ts   # Market sentiment analysis
│   ├── trendingService.ts    # Trending assets discovery
│   ├── safetyService.ts      # Safety score calculation
│   ├── timingService.ts      # Entry/exit timing recommendations
│   └── calculationService.ts # Risk calculation engine (lot size, stop loss, take profit)
└── index.js                  # Main server entry point
```

## Core Types

The system defines comprehensive TypeScript interfaces for:

- **Asset Types**: Metal, Forex, Stock
- **Price Data**: AssetPrice, PricePoint, TimePeriod
- **Sentiment Analysis**: MarketSentiment, SentimentIndicators, SentimentScore
- **Trending Assets**: TrendingAsset, TrendAnalysis, TrendingFilters
- **Safety Scores**: SafetyScore, SafetyComponents, SafetyCategory
- **Entry/Exit Timing**: EntryRecommendation, ExitRecommendation, TechnicalSignals
- **Risk Calculations**: LotSizeParams/Result, StopLossParams/Result, TakeProfitParams/Result
- **Asset Configuration**: AssetConfig, TradingHours

## Supported Assets

### Metals (5)
- Gold (XAU/USD)
- Silver (XAG/USD)
- Copper (HG)
- Platinum (XPT/USD)
- Palladium (XPD/USD)

### Forex Pairs (7)
- EUR/USD
- GBP/USD
- USD/JPY
- AUD/USD
- USD/CHF
- USD/CAD
- NZD/USD

### Stock Indices (6)
- S&P 500 (SPX)
- NASDAQ 100 (NDX)
- Dow Jones (DJI)
- FTSE 100 (FTSE)
- DAX (DAX)
- Nikkei 225 (N225)

## Asset Configuration

Each asset has specific trading parameters:
- Contract size
- Pip/point size and value
- Lot size constraints (min, max, step)
- Display decimals
- Trading hours
- Margin requirements

## Testing

The project uses:
- **Jest** for unit testing
- **fast-check** for property-based testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Development

The project is set up with TypeScript for type safety and better developer experience. Service implementations will be added in subsequent tasks following the implementation plan.

## Requirements

This implementation satisfies:
- Requirement 6.1: Support for gold, silver, copper, platinum, and palladium
- Requirement 6.2: Support for major forex pairs with appropriate pip values
- Requirement 6.3: Support for major stock indices with appropriate point values
