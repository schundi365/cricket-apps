# Implementation Plan: Multi-Asset Market Sentiment and Trading Risk Management

## Overview

This implementation plan breaks down the development of a comprehensive trading system that analyzes metals, forex, and stocks. The system will provide sentiment analysis, identify trending opportunities, assess safety scores, suggest entry/exit timing, and calculate risk-managed trading parameters with a 3% maximum loss limit.

The implementation follows an incremental approach, building core functionality first, then adding analysis features, and finally integrating everything with the UI.

**Current State**: The project has a working forex trading application with basic price display and WebSocket support. Core TypeScript types, asset configurations, and the price service with caching have been implemented and tested. The remaining tasks focus on implementing the analysis services (sentiment, trending, safety, timing), risk calculation engine, API endpoints, and frontend components for the multi-asset trading system.

## Tasks

- [x] 1. Set up project structure and core types
  - Create directory structure for services (price, sentiment, trending, safety, timing, calculation)
  - Define TypeScript interfaces for all core types (Asset, AssetPrice, MarketSentiment, TrendingAsset, SafetyScore, etc.)
  - Set up testing framework (Jest for unit tests, fast-check for property tests)
  - Create asset configuration data for metals, forex, and stocks
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. Implement Multi-Asset Price Service
  - [x] 2.1 Create price data service with caching
    - Implement getCurrentPrice() for metals, forex, and stocks
    - Implement getPriceHistory() with time period support
    - Add node-cache integration with 30-second TTL
    - Implement price update subscriptions
    - _Requirements: 11.1, 11.2_

  - [x] 2.2 Write property test for price caching
    - **Property: Price Cache Consistency**
    - **Validates: Requirements 11.5**

  - [x] 2.3 Implement external API integrations
    - Integrate metals API (metals-api.com or similar)
    - Integrate forex API (exchangerate-api.com or similar)
    - Integrate stocks API (twelvedata.com or similar)
    - Replace mock implementations with real API calls
    - _Requirements: 11.1, 11.7_

  - [ ] 2.4 Write unit tests for API error handling
    - Test connection failures and retries
    - Test fallback mechanisms
    - _Requirements: 11.3, 11.7_

- [x] 3. Implement Asset Configuration Service
  - [x] 3.1 Create asset configuration lookup
    - Implement getConfig() for all asset types
    - Define configurations for all metals (gold, silver, copper, platinum, palladium)
    - Define configurations for all forex pairs (EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CHF, USD/CAD, NZD/USD)
    - Define configurations for all stock indices (SPX, NDX, DJI, FTSE, DAX, N225)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 3.2 Write property test for asset configuration
    - **Property 5: Asset-Specific Configuration Application**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.6**

- [x] 4. Implement Risk Calculation Engine
  - [x] 4.1 Create lot size calculation
    - Implement calculateLotSize() with 3% risk limit
    - Apply asset-specific pip values and contract sizes
    - Add validation for invalid inputs
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 4.2 Write property test for 3% risk limit
    - **Property 2: 3% Risk Limit Invariant**
    - **Validates: Requirements 2.2, 3.1, 3.2, 5.1, 5.2**

  - [x] 4.3 Write property test for lot size calculation
    - **Property 3: Lot Size Calculation Correctness**
    - **Validates: Requirements 2.1**

  - [x] 4.4 Write property test for input validation
    - **Property 4: Input Validation Rejection**
    - **Validates: Requirements 2.4**

  - [x] 4.5 Create stop loss calculation
    - Implement calculateStopLoss() respecting 3% limit
    - Support both LONG and SHORT directions
    - Display as both price and distance
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 4.6 Write property test for sentiment direction alignment
    - **Property 7: Sentiment Direction Alignment**
    - **Validates: Requirements 3.5**

  - [x] 4.7 Create take profit calculation
    - Implement calculateTakeProfit() with risk-reward ratios
    - Support custom ratios
    - Calculate potential profit amounts
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 4.8 Write property test for take profit ratio
    - **Property 6: Take Profit Ratio Correctness**
    - **Validates: Requirements 4.1, 4.3**

  - [x] 4.9 Write unit tests for edge cases
    - Test zero lot size scenarios
    - Test invalid stop loss placement
    - Test invalid take profit prices
    - _Requirements: 2.3, 3.3, 4.4_

- [x] 5. Checkpoint - Ensure core calculation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Sentiment Analysis Service
  - [x] 6.1 Create sentiment calculation logic
    - Implement calculateSentimentScore() using price history
    - Calculate price momentum (24h, 7d changes)
    - Calculate volatility using standard deviation
    - Calculate RSI (Relative Strength Index)
    - Determine MACD signal
    - Map score to sentiment categories (Bullish/Bearish/Neutral)
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 6.2 Write property test for sentiment retrieval
    - **Property 1: Multi-Asset Sentiment Retrieval**
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [x] 6.3 Implement bulk sentiment analysis
    - Implement getBulkSentiment() for multiple assets
    - Optimize for parallel API calls
    - _Requirements: 1.1_

  - [x] 6.4 Write unit tests for sentiment edge cases
    - Test with unavailable sentiment data
    - Test with insufficient price history
    - _Requirements: 1.6_

- [x] 7. Implement Trending Assets Service
  - [x] 7.1 Create trend analysis logic
    - Implement analyzeTrend() for individual assets
    - Calculate momentum score (0-100)
    - Determine trend direction and strength
    - Identify support and resistance levels
    - Calculate trend line (slope and intercept)
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.2 Implement trending assets discovery
    - Implement getTrendingAssets() with filtering
    - Categorize trends (Strong/Moderate Uptrend/Downtrend)
    - Sort by momentum strength
    - Support filtering by asset type, momentum, safety score
    - _Requirements: 7.1, 7.4, 7.5, 10.7_

  - [x] 7.3 Write property test for trending categorization
    - **Property 8: Trending Assets Categorization**
    - **Validates: Requirements 7.4**

  - [x] 7.4 Write property test for trending sorting
    - **Property 9: Trending Assets Sorting**
    - **Validates: Requirements 7.5**

  - [x] 7.5 Write property test for filter application
    - **Property 20: Filter Application Correctness**
    - **Validates: Requirements 10.7**

- [x] 8. Implement Safety Score Service
  - [x] 8.1 Create safety score calculation
    - Implement calculateSafetyScore() with weighted components
    - Calculate volatility score (lower volatility = higher score)
    - Calculate liquidity score (higher volume = higher score)
    - Calculate spread score (tighter spread = higher score)
    - Calculate trend strength score (ADX-based)
    - Calculate market conditions score
    - Combine with weights: volatility 30%, liquidity 25%, spread 20%, trend 15%, conditions 10%
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 8.2 Implement safety score categorization
    - Map scores to categories (Very Safe, Safe, Moderate, Risky, Very Risky)
    - Generate recommendations based on category
    - _Requirements: 8.6_

  - [x] 8.3 Write property test for safety score monotonicity
    - **Property 10: Safety Score Monotonicity**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5**

  - [x] 8.4 Write property test for safety score categorization
    - **Property 11: Safety Score Categorization**
    - **Validates: Requirements 8.6**

  - [x] 8.5 Write property test for safety score filtering
    - **Property 12: Safety Score Filtering**
    - **Validates: Requirements 8.8**

  - [x] 8.6 Implement bulk safety score calculation
    - Implement getBulkSafetyScores() for multiple assets
    - Optimize for parallel processing
    - _Requirements: 8.1, 8.7_

- [x] 9. Implement Entry/Exit Timing Service
  - [x] 9.1 Create entry recommendation logic
    - Implement getEntryRecommendation() with technical analysis
    - Analyze trend alignment, support/resistance, momentum, volume
    - Calculate RSI, MACD, moving averages
    - Determine recommendation (Immediate, Wait, Avoid)
    - Generate reasoning and wait conditions
    - Determine time horizon (Scalp, Day Trade, Swing Trade, Position Trade)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.7_

  - [x] 9.2 Write property test for entry recommendation completeness
    - **Property 13: Entry Recommendation Completeness**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

  - [x] 9.3 Create exit recommendation logic
    - Implement getExitRecommendation() with technical levels
    - Calculate take profit levels based on Fibonacci extensions and resistance
    - Calculate stop loss based on support levels and ATR
    - Suggest trailing stop distances
    - _Requirements: 9.5, 9.6_

  - [x] 9.4 Write property test for exit technical alignment
    - **Property 14: Exit Recommendation Technical Alignment**
    - **Validates: Requirements 9.5, 9.6**

  - [x] 9.5 Write unit tests for timing edge cases
    - Test with insufficient data for technical analysis
    - Test with extreme volatility
    - Test with conflicting signals
    - _Requirements: 9.4_

- [x] 10. Checkpoint - Ensure all analysis services tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Backend API Endpoints
  - [x] 11.1 Create price endpoints
    - GET /api/v1/assets/:assetType/:symbol/price
    - GET /api/v1/assets/:assetType/:symbol/history
    - Add request validation and error handling
    - _Requirements: 11.1, 11.2_

  - [x] 11.2 Create sentiment endpoints
    - GET /api/v1/assets/:assetType/:symbol/sentiment
    - GET /api/v1/sentiment/bulk
    - _Requirements: 1.1_

  - [x] 11.3 Create trending endpoints
    - GET /api/v1/trending (with query params for filters)
    - GET /api/v1/trending/:assetType
    - _Requirements: 7.1, 10.7_

  - [x] 11.4 Create safety endpoints
    - GET /api/v1/assets/:assetType/:symbol/safety
    - GET /api/v1/safety/bulk
    - _Requirements: 8.1_

  - [x] 11.5 Create timing endpoints
    - GET /api/v1/assets/:assetType/:symbol/entry
    - GET /api/v1/assets/:assetType/:symbol/exit
    - _Requirements: 9.1, 9.5_

  - [x] 11.6 Create calculation endpoints
    - POST /api/v1/calculate/lot-size
    - POST /api/v1/calculate/stop-loss
    - POST /api/v1/calculate/take-profit
    - POST /api/v1/calculate/full (comprehensive calculation)
    - _Requirements: 2.1, 3.1, 4.1_

  - [x] 11.7 Create configuration endpoints
    - GET /api/v1/assets/:assetType/:symbol/config
    - GET /api/v1/assets/supported
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 11.8 Refactor existing server to use new API structure
    - Migrate from current forex-only endpoints to multi-asset endpoints
    - Update WebSocket implementation to support metals and stocks
    - Maintain backward compatibility where needed
    - _Requirements: All API-related requirements_

  - [x] 11.9 Write integration tests for API endpoints
    - Test full request/response cycle
    - Test error responses
    - Test validation
    - _Requirements: All API-related requirements_

- [x] 12. Implement WebSocket Support
  - [x] 12.1 Create WebSocket server for real-time updates
    - Implement /ws/prices endpoint
    - Support subscription to specific assets
    - Broadcast price updates to subscribed clients
    - Handle connection/disconnection
    - _Requirements: 11.2, 11.6_

  - [x] 12.2 Write property test for price update propagation
    - **Property 17: Price Update Propagation**
    - **Validates: Requirements 11.2**

  - [x] 12.3 Write unit tests for WebSocket edge cases
    - Test disconnection and reconnection
    - Test fallback to polling
    - _Requirements: 11.3, 11.7_

- [x] 13. Implement Frontend Dashboard Component
  - [x] 13.1 Create TrendingDashboard component
    - Display grid of trending assets
    - Show price change, momentum, safety score for each
    - Implement filtering controls (asset type, min safety, min momentum)
    - Implement sorting controls
    - Add click handler to populate trading form
    - _Requirements: 7.1, 7.2, 7.3, 7.7, 8.7, 10.1, 10.7_

  - [x] 13.2 Write property test for trending asset selection
    - **Property 19: Trending Asset Selection Propagation**
    - **Validates: Requirements 7.7**

  - [x] 13.3 Create AssetSelector component
    - Dropdown/tabs for asset type (Metals, Forex, Stocks)
    - Dropdown for specific asset within type
    - Display current price and last update time
    - _Requirements: 1.1, 6.6, 10.2_

  - [x] 13.4 Refactor existing frontend components
    - Update App.js to integrate new multi-asset components
    - Migrate from forex-only UI to multi-asset UI
    - Preserve existing LiveRates, CurrencyConverter, PriceAlerts functionality where applicable
    - _Requirements: 10.1, 10.2_

- [x] 14. Implement Frontend Analysis Display Components
  - [x] 14.1 Create SentimentDisplay component
    - Visual indicator (bullish/bearish/neutral with colors)
    - Display sentiment score (0-100)
    - Display sentiment strength (weak/moderate/strong)
    - Show key indicators (price changes, RSI, MACD)
    - _Requirements: 1.2, 1.3_

  - [x] 14.2 Create SafetyScoreCard component
    - Color-coded overall score display
    - Category label (Very Safe, Safe, etc.)
    - Breakdown of component scores (volatility, liquidity, spread, trend, conditions)
    - Recommendation text
    - _Requirements: 8.1, 8.6_

  - [x] 14.3 Create EntryTimingPanel component
    - Display recommendation (Immediate/Wait/Avoid) with color coding
    - Show confidence level
    - Display reasoning points
    - Show technical indicators (RSI, MACD, MAs, support/resistance)
    - Display suggested entry price for "Wait" recommendations
    - Show time horizon
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.7_

  - [x] 14.4 Create ExitTimingPanel component
    - Display suggested take profit levels with reasoning
    - Display suggested stop loss with reasoning
    - Show technical basis for each level
    - Display probability/confidence for each level
    - _Requirements: 9.5, 9.6_

- [x] 15. Implement Frontend Trading Parameters Components
  - [x] 15.1 Create TradingParametersForm component
    - Input field for trading capital with validation
    - Input field for entry price (auto-populated from current price)
    - Input field for stop loss distance
    - Radio buttons for direction (Long/Short)
    - Checkbox to use timing recommendations
    - Real-time validation feedback
    - _Requirements: 10.2, 10.6_

  - [x] 15.2 Create RiskCalculationDisplay component
    - Display calculated lot size with asset-specific precision
    - Display stop loss as price and distance
    - Display take profit levels (1:1, 1:2, 1:3) with prices and potential profits
    - Display max loss in currency and percentage
    - Display actual risk percentage
    - _Requirements: 2.5, 3.4, 4.2, 5.3, 5.4_

  - [x] 15.3 Write property test for display completeness
    - **Property 15: Display Completeness**
    - **Validates: Requirements 2.5, 3.4, 4.2, 5.3, 5.4, 7.2, 7.3, 8.1, 8.7, 9.7, 11.4**

  - [x] 15.4 Create RiskWarningBanner component
    - Display prominent warning when risk exceeds 3%
    - Show specific issues (lot size too large, stop loss too far, etc.)
    - Prevent calculation when invalid
    - _Requirements: 5.2_

  - [x] 15.5 Create LivePriceDisplay component
    - Display current price with bid/ask/spread
    - Display last update timestamp
    - Display data freshness indicator (live/cached/stale)
    - Auto-update via WebSocket
    - _Requirements: 6.6, 11.4, 11.5_

  - [x] 15.6 Write property test for data freshness indication
    - **Property 18: Data Freshness Indication**
    - **Validates: Requirements 11.5**

- [x] 16. Implement Reactive Recalculation
  - [x] 16.1 Add reactive calculation logic
    - Listen for changes to trading capital, entry price, stop loss, asset
    - Automatically recalculate lot size, stop loss, take profit
    - Automatically fetch new sentiment, safety score, timing recommendations
    - Update all displays without manual refresh
    - _Requirements: 5.5, 10.2_

  - [x] 16.2 Write property test for reactive recalculation
    - **Property 16: Reactive Recalculation**
    - **Validates: Requirements 5.5, 10.2**

- [x] 17. Implement Error Handling and User Feedback
  - [x] 17.1 Add comprehensive error handling
    - Implement ErrorHandler class with methods for each error type
    - Add field-specific validation error display
    - Add connection status indicators for each data source
    - Implement retry logic with exponential backoff
    - Add fallback mechanisms (WebSocket → polling, primary → secondary API)
    - _Requirements: 10.6, 11.3, 11.7_

  - [x] 17.2 Add user feedback mechanisms
    - Real-time validation as user types
    - Clear error messages with suggested corrections
    - Connection status indicators (connected/reconnecting/disconnected)
    - Data freshness indicators
    - Loading states for async operations
    - _Requirements: 10.6, 11.3, 11.5_

  - [x] 17.3 Write unit tests for error handling
    - Test all error categories
    - Test retry logic
    - Test fallback mechanisms
    - Test user feedback display
    - _Requirements: 1.6, 2.3, 3.3, 4.4, 6.7, 11.3, 11.7_

- [x] 18. Integration and Final Testing
  - [x] 18.1 Wire all components together
    - Connect frontend components to backend API
    - Set up WebSocket connections
    - Integrate all services in backend
    - Configure caching and retry logic
    - _Requirements: All requirements_

  - [x] 18.2 Write end-to-end integration tests
    - Test full user flow: select asset → view analysis → calculate trade → see recommendations
    - Test switching between asset types
    - Test filtering and sorting trending assets
    - Test real-time updates
    - Test error recovery
    - _Requirements: All requirements_

  - [x] 18.3 Perform manual testing across all asset types
    - Test with metals (gold, silver, copper, platinum, palladium)
    - Test with forex pairs (all 7 major pairs)
    - Test with stock indices (all 6 indices)
    - Verify calculations are correct for each asset type
    - Verify safety scores and timing recommendations are reasonable
    - _Requirements: 1.4, 1.5, 6.1, 6.2, 6.3_

- [ ] 19. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation builds incrementally: core services → analysis services → API → frontend
- All calculations must respect the 3% risk limit
- All displays must show appropriate precision for each asset type
- Error handling must be comprehensive across all data sources
