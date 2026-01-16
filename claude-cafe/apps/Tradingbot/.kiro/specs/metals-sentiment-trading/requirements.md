# Requirements Document

## Introduction

This document specifies the requirements for a comprehensive market sentiment analysis and trading risk management system. The system will provide market sentiment indicators for metals (gold, silver, copper, platinum, palladium), forex currency pairs, and stocks. It will identify trending opportunities, assess safety scores based on risk management criteria, suggest optimal entry and exit times, and calculate appropriate lot sizes, stop loss, and take profit levels based on a maximum risk limit of 3% per trade.

## Glossary

- **System**: The comprehensive market sentiment and trading risk management application
- **Metals_Market**: Financial markets for trading precious and industrial metals (gold, silver, copper, platinum, palladium)
- **Forex_Market**: Foreign exchange market for trading currency pairs (EUR/USD, GBP/USD, USD/JPY, etc.)
- **Stock_Market**: Equity markets for trading company shares and indices
- **Asset**: Any tradeable instrument including metals, forex pairs, or stocks
- **Market_Sentiment**: Aggregate market opinion indicating bullish, bearish, or neutral outlook
- **Trending_Asset**: Asset showing strong directional price movement with high momentum
- **Safety_Score**: Numerical rating (0-100) indicating trade safety based on volatility, liquidity, and risk metrics
- **Lot_Size**: The quantity of units to trade in a single transaction
- **Stop_Loss**: Price level at which a losing trade is automatically closed to limit losses
- **Take_Profit**: Price level at which a winning trade is automatically closed to secure gains
- **Risk_Limit**: Maximum percentage of trading capital that can be lost on a single trade (3%)
- **Trading_Capital**: Total available funds for trading
- **Entry_Price**: Price at which a trade position is opened
- **Exit_Price**: Price at which a trade position is closed
- **Entry_Signal**: Technical or fundamental indicator suggesting optimal time to open a position
- **Exit_Signal**: Technical or fundamental indicator suggesting optimal time to close a position
- **Risk_Reward_Ratio**: Ratio of potential profit to potential loss in a trade
- **Volatility**: Measure of price fluctuation intensity over a time period
- **Liquidity**: Ease of buying or selling an asset without significant price impact

## Requirements

### Requirement 1: Multi-Asset Market Sentiment Analysis

**User Story:** As a trader, I want to view current market sentiment for metals, forex, and stocks, so that I can make informed trading decisions across multiple asset classes.

#### Acceptance Criteria

1. WHEN a user selects an asset (metal, forex pair, or stock), THE System SHALL retrieve and display current market sentiment
2. WHEN displaying sentiment, THE System SHALL show sentiment indicator as bullish, bearish, or neutral
3. WHEN sentiment data is retrieved, THE System SHALL display the sentiment strength as a percentage or score (0-100)
4. THE System SHALL support major forex pairs (EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CHF, USD/CAD, NZD/USD)
5. THE System SHALL support major stock indices (S&P 500, NASDAQ, Dow Jones, FTSE 100, DAX, Nikkei 225)
6. WHEN sentiment data is unavailable, THE System SHALL display an appropriate error message and maintain current state
7. THE System SHALL update sentiment data at regular intervals without requiring manual refresh

### Requirement 2: Lot Size Calculation

**User Story:** As a trader, I want the system to calculate appropriate lot sizes, so that I can maintain proper risk management aligned with my 3% risk limit.

#### Acceptance Criteria

1. WHEN a user provides trading capital and entry price, THE System SHALL calculate the maximum lot size based on the 3% risk limit
2. WHEN a user provides stop loss distance, THE System SHALL adjust lot size to ensure maximum loss does not exceed 3% of trading capital
3. WHEN calculated lot size is zero or negative, THE System SHALL display a warning that the trade parameters exceed risk limits
4. WHEN trading capital is invalid (zero, negative, or non-numeric), THE System SHALL prevent calculation and display validation error
5. THE System SHALL display the calculated lot size with appropriate precision for the selected metal

### Requirement 3: Stop Loss Calculation

**User Story:** As a trader, I want the system to calculate optimal stop loss levels, so that I can protect my capital while allowing reasonable price fluctuation.

#### Acceptance Criteria

1. WHEN a user provides entry price and trading capital, THE System SHALL calculate stop loss price that limits loss to 3% of capital
2. WHEN a user provides a custom stop loss distance, THE System SHALL validate that it does not exceed the 3% risk limit
3. WHEN stop loss would be at or beyond entry price for the trade direction, THE System SHALL display an error indicating invalid stop loss placement
4. THE System SHALL display stop loss as both absolute price and distance from entry in points/pips
5. WHEN market sentiment is bearish, THE System SHALL suggest stop loss levels appropriate for short positions

### Requirement 4: Take Profit Calculation

**User Story:** As a trader, I want the system to suggest take profit levels, so that I can set realistic profit targets based on risk-reward ratios.

#### Acceptance Criteria

1. WHEN a user provides entry price and stop loss, THE System SHALL calculate take profit levels for common risk-reward ratios (1:1, 1:2, 1:3)
2. WHEN displaying take profit levels, THE System SHALL show both absolute price and distance from entry
3. THE System SHALL allow users to input custom risk-reward ratios and calculate corresponding take profit levels
4. WHEN take profit calculation results in invalid price (negative or zero), THE System SHALL display appropriate error message
5. THE System SHALL display potential profit amount in currency for each take profit level

### Requirement 5: Risk Management Validation

**User Story:** As a trader, I want the system to validate all trade parameters against the 3% risk limit, so that I never accidentally exceed my maximum acceptable loss.

#### Acceptance Criteria

1. WHEN any trade parameter is modified, THE System SHALL recalculate and validate that maximum loss remains at or below 3%
2. WHEN calculated risk exceeds 3%, THE System SHALL display a prominent warning and prevent trade execution
3. WHEN all parameters are valid, THE System SHALL display a confirmation showing actual risk percentage
4. THE System SHALL display the maximum loss amount in currency alongside the percentage
5. WHEN trading capital changes, THE System SHALL automatically recalculate all dependent values

### Requirement 6: Asset-Specific Configuration

**User Story:** As a trader, I want the system to handle different assets with their specific trading characteristics, so that calculations are accurate for each asset type.

#### Acceptance Criteria

1. THE System SHALL support gold, silver, copper, platinum, and palladium as tradeable metals
2. THE System SHALL support major forex pairs with appropriate pip values and lot sizes
3. THE System SHALL support major stock indices with appropriate point values and contract sizes
4. WHEN an asset is selected, THE System SHALL apply appropriate pip/point values for that asset
5. WHEN an asset is selected, THE System SHALL apply appropriate lot size units (ounces, contracts, shares, etc.)
6. THE System SHALL display current market price for the selected asset
7. WHEN asset-specific data is unavailable, THE System SHALL notify the user and prevent calculations

### Requirement 7: Trending Assets Discovery

**User Story:** As a trader, I want to see which assets are currently trending across metals, forex, and stocks, so that I can identify high-momentum trading opportunities.

#### Acceptance Criteria

1. THE System SHALL analyze and display trending assets across all supported metals, forex pairs, and stocks
2. WHEN displaying trending assets, THE System SHALL show price change percentage over 24 hours
3. WHEN displaying trending assets, THE System SHALL show current momentum score (0-100)
4. THE System SHALL categorize trending assets as "Strong Uptrend", "Moderate Uptrend", "Strong Downtrend", or "Moderate Downtrend"
5. THE System SHALL sort trending assets by momentum strength (highest to lowest)
6. THE System SHALL update trending assets list at regular intervals
7. WHEN a user selects a trending asset, THE System SHALL populate trading parameters with that asset

### Requirement 8: Safety Score Assessment

**User Story:** As a trader, I want to see safety scores for potential trades, so that I can choose the safest opportunities that align with my risk management strategy.

#### Acceptance Criteria

1. WHEN analyzing any asset, THE System SHALL calculate and display a safety score (0-100)
2. WHEN calculating safety score, THE System SHALL consider volatility (lower volatility = higher safety)
3. WHEN calculating safety score, THE System SHALL consider liquidity (higher liquidity = higher safety)
4. WHEN calculating safety score, THE System SHALL consider spread width (tighter spread = higher safety)
5. WHEN calculating safety score, THE System SHALL consider trend strength (stronger trend = higher safety)
6. THE System SHALL categorize safety scores as "Very Safe" (80-100), "Safe" (60-79), "Moderate" (40-59), "Risky" (20-39), or "Very Risky" (0-19)
7. WHEN displaying trending assets, THE System SHALL show the safety score for each asset
8. THE System SHALL allow filtering trending assets by minimum safety score threshold

### Requirement 9: Entry and Exit Timing Suggestions

**User Story:** As a trader, I want the system to suggest optimal entry and exit times for trades, so that I can maximize my probability of success and profit potential.

#### Acceptance Criteria

1. WHEN analyzing an asset, THE System SHALL provide an entry timing recommendation (Immediate, Wait, or Avoid)
2. WHEN recommending "Immediate" entry, THE System SHALL display supporting technical indicators (trend alignment, support/resistance levels, momentum)
3. WHEN recommending "Wait" entry, THE System SHALL display the price level or condition to wait for
4. WHEN recommending "Avoid" entry, THE System SHALL display the reason (high volatility, weak trend, poor risk-reward, etc.)
5. WHEN a trade is being planned, THE System SHALL suggest take profit exit levels based on technical resistance/support
6. WHEN a trade is being planned, THE System SHALL suggest stop loss exit levels based on technical support/resistance
7. THE System SHALL display the expected time horizon for the trade (scalp, day trade, swing trade, position trade)
8. WHEN market conditions change significantly, THE System SHALL update entry/exit recommendations in real-time

### Requirement 10: User Interface and Data Display

**User Story:** As a trader, I want a clear and intuitive interface, so that I can quickly input parameters and view calculated results across multiple assets.

#### Acceptance Criteria

1. WHEN the application loads, THE System SHALL display a dashboard with trending assets, safety scores, and entry recommendations
2. WHEN the application loads, THE System SHALL display input fields for trading capital, entry price, and asset selection
3. WHEN all required inputs are provided, THE System SHALL automatically calculate and display lot size, stop loss, and take profit
4. THE System SHALL display all monetary values with appropriate currency formatting
5. THE System SHALL provide clear labels and tooltips explaining each input and output field
6. WHEN validation errors occur, THE System SHALL display error messages adjacent to the relevant input fields
7. THE System SHALL provide filtering and sorting options for trending assets (by asset type, safety score, momentum)

### Requirement 11: Real-Time Data Integration

**User Story:** As a trader, I want access to real-time or near-real-time market data for all supported assets, so that my trading decisions are based on current market conditions.

#### Acceptance Criteria

1. WHEN the application starts, THE System SHALL connect to market data providers for metals, forex, and stock prices
2. WHEN market data is received, THE System SHALL update displayed prices without page refresh
3. WHEN connection to market data fails, THE System SHALL display connection status and attempt reconnection
4. THE System SHALL display the timestamp of the last successful data update for each asset type
5. WHEN using cached or delayed data, THE System SHALL clearly indicate the data age to the user
6. THE System SHALL support WebSocket connections for real-time price streaming
7. WHEN real-time data is unavailable, THE System SHALL fall back to polling with appropriate intervals
