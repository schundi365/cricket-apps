# Manual Testing Guide: Multi-Asset Trading Platform

## Overview
This guide provides comprehensive manual testing procedures for the Multi-Asset Market Sentiment and Trading Risk Management system across all supported asset types.

## Test Environment Setup

### Prerequisites
1. Start the backend server: `npm run server`
2. Start the frontend client: `npm run client`
3. Ensure both services are running without errors
4. Open browser to `http://localhost:3000`

### API Keys (Optional)
For live data testing, configure these environment variables in `.env`:
- `METALS_API_KEY` - For metals price data
- `FOREX_API_KEY` - For forex price data
- `STOCKS_API_KEY` - For stock index data

**Note**: The system works with fallback data if API keys are not configured.

## Test Categories

### 1. Metals Testing

#### 1.1 Gold (XAU/USD)
**Test Steps:**
1. Navigate to Multi-Asset view
2. Select "Metals" from asset type dropdown
3. Select "Gold" from asset dropdown
4. Verify current price displays correctly
5. Check sentiment indicator shows (Bullish/Bearish/Neutral)
6. Verify safety score displays with category
7. Check entry timing recommendation
8. Enter trading parameters:
   - Trading Capital: $10,000
   - Entry Price: (use current price)
   - Stop Loss Distance: 50 pips
   - Direction: LONG
9. Verify lot size calculation
10. Verify stop loss price < entry price
11. Verify take profit levels (1:1, 1:2, 1:3)
12. Verify max loss ≤ $300 (3% of $10,000)

**Expected Results:**
- Price displays in format: $2,050.25
- Sentiment score: 0-100
- Safety score: 0-100 with category
- Lot size > 0
- All calculations respect 3% risk limit

#### 1.2 Silver (XAG/USD)
**Test Steps:** (Same as Gold)
**Expected Results:**
- Price displays in format: $25.50
- Contract size: 5000 oz
- Pip value: $5

#### 1.3 Copper (HG)
**Test Steps:** (Same as Gold)
**Expected Results:**
- Price displays in format: $4.25
- Contract size: 25000 lbs
- Pip value: $2.50

#### 1.4 Platinum (XPT/USD)
**Test Steps:** (Same as Gold)
**Expected Results:**
- Price displays in format: $1,050.00
- Contract size: 50 oz
- Pip value: $0.50

#### 1.5 Palladium (XPD/USD)
**Test Steps:** (Same as Gold)
**Expected Results:**
- Price displays in format: $1,800.00
- Contract size: 100 oz
- Pip value: $1

### 2. Forex Testing

#### 2.1 EUR/USD
**Test Steps:**
1. Select "Forex" from asset type dropdown
2. Select "EUR/USD" from asset dropdown
3. Verify current price displays correctly
4. Check bid/ask spread
5. Enter trading parameters:
   - Trading Capital: $10,000
   - Entry Price: (use current price)
   - Stop Loss Distance: 50 pips
   - Direction: LONG
6. Verify lot size calculation
7. Verify calculations use correct pip value ($10)

**Expected Results:**
- Price displays in format: 1.1050
- Spread displays in pips
- Contract size: 100,000 units
- Pip value: $10

#### 2.2 GBP/USD
**Test Steps:** (Same as EUR/USD)
**Expected Results:**
- Price displays in format: 1.2750
- Pip value: $10

#### 2.3 USD/JPY
**Test Steps:** (Same as EUR/USD)
**Expected Results:**
- Price displays in format: 145.50
- Pip size: 0.01
- Pip value: ~$9.09

#### 2.4 AUD/USD
**Test Steps:** (Same as EUR/USD)
**Expected Results:**
- Price displays in format: 0.6750
- Pip value: $10

#### 2.5 USD/CHF
**Test Steps:** (Same as EUR/USD)
**Expected Results:**
- Price displays in format: 0.8850
- Pip value: $10

#### 2.6 USD/CAD
**Test Steps:** (Same as EUR/USD)
**Expected Results:**
- Price displays in format: 1.3550
- Pip value: $10

#### 2.7 NZD/USD
**Test Steps:** (Same as EUR/USD)
**Expected Results:**
- Price displays in format: 0.6150
- Pip value: $10

### 3. Stock Indices Testing

#### 3.1 S&P 500 (SPX)
**Test Steps:**
1. Select "Stocks" from asset type dropdown
2. Select "S&P 500" from asset dropdown
3. Verify current price displays correctly
4. Enter trading parameters:
   - Trading Capital: $10,000
   - Entry Price: (use current price)
   - Stop Loss Distance: 50 points
   - Direction: LONG
5. Verify lot size calculation
6. Verify calculations use correct point value ($50)

**Expected Results:**
- Price displays in format: 4,750.25
- Contract size: $50 per point
- Pip size: 0.25
- Pip value: $12.50

#### 3.2 NASDAQ (NDX)
**Test Steps:** (Same as S&P 500)
**Expected Results:**
- Price displays in format: 16,500.00
- Contract size: $20 per point
- Pip value: $5

#### 3.3 Dow Jones (DJI)
**Test Steps:** (Same as S&P 500)
**Expected Results:**
- Price displays in format: 37,500.00
- Contract size: $10 per point
- Pip value: $10

#### 3.4 FTSE 100 (FTSE)
**Test Steps:** (Same as S&P 500)
**Expected Results:**
- Price displays in format: 7,650.00
- Appropriate contract size for UK index

#### 3.5 DAX (DAX)
**Test Steps:** (Same as S&P 500)
**Expected Results:**
- Price displays in format: 16,800.00
- Appropriate contract size for German index

#### 3.6 Nikkei 225 (N225)
**Test Steps:** (Same as S&P 500)
**Expected Results:**
- Price displays in format: 33,500.00
- Appropriate contract size for Japanese index

### 4. Trending Assets Dashboard Testing

**Test Steps:**
1. View the Trending Dashboard on page load
2. Verify assets are displayed from all three types (Metals, Forex, Stocks)
3. Verify each asset shows:
   - Current price
   - 24h price change %
   - Momentum score
   - Safety score
   - Trend category
4. Test filtering by asset type:
   - Select "Metals only"
   - Verify only metals display
   - Select "Forex only"
   - Verify only forex pairs display
   - Select "Stocks only"
   - Verify only stock indices display
5. Test filtering by minimum safety score:
   - Set minimum to 50
   - Verify all displayed assets have safety score ≥ 50
6. Test filtering by minimum momentum:
   - Set minimum to 60
   - Verify all displayed assets have momentum ≥ 60
7. Verify sorting by momentum (highest first)
8. Click on a trending asset
9. Verify it populates the trading form

**Expected Results:**
- Dashboard displays 18 assets total (5 metals + 7 forex + 6 stocks)
- Filters work correctly
- Sorting is correct (descending by momentum)
- Clicking asset populates form

### 5. Sentiment Analysis Testing

**Test Steps:**
1. Select any asset
2. View sentiment display
3. Verify sentiment indicator (Bullish/Bearish/Neutral)
4. Verify sentiment score (0-100)
5. Verify sentiment strength (Weak/Moderate/Strong)
6. Check key indicators display:
   - 24h price change
   - 7d price change
   - RSI value
   - MACD signal

**Expected Results:**
- Sentiment matches price movement direction
- Score is reasonable (not always 0 or 100)
- Indicators are present and reasonable

### 6. Safety Score Testing

**Test Steps:**
1. Select any asset
2. View safety score card
3. Verify overall score (0-100)
4. Verify category (Very Safe/Safe/Moderate/Risky/Very Risky)
5. Check component scores:
   - Volatility score
   - Liquidity score
   - Spread score
   - Trend strength score
   - Market conditions score
6. Verify recommendation text

**Expected Results:**
- Overall score matches category ranges:
  - Very Safe: 80-100
  - Safe: 60-79
  - Moderate: 40-59
  - Risky: 20-39
  - Very Risky: 0-19
- Component scores are present
- Recommendation is appropriate for score

### 7. Entry/Exit Timing Testing

**Test Steps:**
1. Select any asset
2. View entry timing panel
3. Verify recommendation (Immediate/Wait/Avoid)
4. Check confidence level (0-100)
5. View reasoning points
6. Check technical indicators:
   - RSI
   - MACD
   - Moving averages
   - Support/resistance levels
7. View exit timing panel
8. Check take profit levels
9. Check stop loss level
10. Verify technical basis for each level

**Expected Results:**
- Entry recommendation is present
- Reasoning is provided
- Technical indicators are displayed
- Exit levels are reasonable
- Take profit > entry price (for LONG)
- Stop loss < entry price (for LONG)

### 8. Risk Calculation Testing

**Test Steps:**
1. Select any asset
2. Enter trading parameters:
   - Trading Capital: $10,000
   - Entry Price: (current price)
   - Stop Loss Distance: 50
   - Direction: LONG
3. Verify lot size displays
4. Verify stop loss price displays
5. Verify take profit levels display (1:1, 1:2, 1:3)
6. Verify max loss displays
7. Verify actual risk percentage displays
8. Test with different capital amounts:
   - $1,000
   - $5,000
   - $50,000
9. Test with different stop loss distances:
   - 20
   - 100
   - 200
10. Test SHORT direction
11. Verify stop loss > entry price for SHORT

**Expected Results:**
- Lot size > 0
- Max loss ≤ 3% of trading capital
- Stop loss price is correct direction from entry
- Take profit prices increase with ratio
- Calculations update reactively when parameters change

### 9. Risk Warning Testing

**Test Steps:**
1. Enter parameters that would exceed 3% risk:
   - Trading Capital: $1,000
   - Stop Loss Distance: 500 (very large)
2. Verify warning banner displays
3. Verify warning explains the issue
4. Verify calculation is prevented or lot size is very small

**Expected Results:**
- Warning displays prominently
- Message is clear
- System prevents excessive risk

### 10. Real-Time Updates Testing

**Test Steps:**
1. Select any asset
2. Note the current price
3. Wait 30 seconds (cache TTL)
4. Verify data freshness indicator updates
5. Check WebSocket connection status
6. Verify price updates automatically

**Expected Results:**
- Data freshness indicator shows:
  - "Live" for data < 30s old
  - "Cached" for data 30-60s old
  - "Stale" for data > 60s old
- WebSocket status shows connected
- Prices update without manual refresh

### 11. Error Handling Testing

**Test Steps:**
1. Disconnect from internet
2. Verify connection status indicators show disconnected
3. Verify error messages display appropriately
4. Reconnect to internet
5. Verify system recovers automatically
6. Test with invalid inputs:
   - Trading Capital: 0
   - Trading Capital: -1000
   - Stop Loss Distance: 0
7. Verify validation errors display

**Expected Results:**
- Connection status updates correctly
- Error messages are clear and helpful
- System recovers gracefully
- Validation prevents invalid inputs

### 12. Cross-Asset Switching Testing

**Test Steps:**
1. Select Gold (Metal)
2. Enter trading parameters
3. Note calculations
4. Switch to EUR/USD (Forex)
5. Verify parameters reset or update
6. Note calculations use different pip values
7. Switch to S&P 500 (Stock)
8. Verify calculations use different contract sizes

**Expected Results:**
- Switching works smoothly
- Calculations are correct for each asset type
- No errors occur during switching
- UI updates appropriately

## Test Results Documentation

### Test Execution Log

| Test ID | Asset Type | Asset | Status | Notes |
|---------|------------|-------|--------|-------|
| 1.1 | Metal | Gold | ☐ Pass ☐ Fail | |
| 1.2 | Metal | Silver | ☐ Pass ☐ Fail | |
| 1.3 | Metal | Copper | ☐ Pass ☐ Fail | |
| 1.4 | Metal | Platinum | ☐ Pass ☐ Fail | |
| 1.5 | Metal | Palladium | ☐ Pass ☐ Fail | |
| 2.1 | Forex | EUR/USD | ☐ Pass ☐ Fail | |
| 2.2 | Forex | GBP/USD | ☐ Pass ☐ Fail | |
| 2.3 | Forex | USD/JPY | ☐ Pass ☐ Fail | |
| 2.4 | Forex | AUD/USD | ☐ Pass ☐ Fail | |
| 2.5 | Forex | USD/CHF | ☐ Pass ☐ Fail | |
| 2.6 | Forex | USD/CAD | ☐ Pass ☐ Fail | |
| 2.7 | Forex | NZD/USD | ☐ Pass ☐ Fail | |
| 3.1 | Stock | S&P 500 | ☐ Pass ☐ Fail | |
| 3.2 | Stock | NASDAQ | ☐ Pass ☐ Fail | |
| 3.3 | Stock | Dow Jones | ☐ Pass ☐ Fail | |
| 3.4 | Stock | FTSE 100 | ☐ Pass ☐ Fail | |
| 3.5 | Stock | DAX | ☐ Pass ☐ Fail | |
| 3.6 | Stock | Nikkei 225 | ☐ Pass ☐ Fail | |
| 4 | All | Trending Dashboard | ☐ Pass ☐ Fail | |
| 5 | All | Sentiment Analysis | ☐ Pass ☐ Fail | |
| 6 | All | Safety Scores | ☐ Pass ☐ Fail | |
| 7 | All | Entry/Exit Timing | ☐ Pass ☐ Fail | |
| 8 | All | Risk Calculation | ☐ Pass ☐ Fail | |
| 9 | All | Risk Warnings | ☐ Pass ☐ Fail | |
| 10 | All | Real-Time Updates | ☐ Pass ☐ Fail | |
| 11 | All | Error Handling | ☐ Pass ☐ Fail | |
| 12 | All | Cross-Asset Switching | ☐ Pass ☐ Fail | |

### Issues Found

| Issue ID | Severity | Description | Asset/Feature | Status |
|----------|----------|-------------|---------------|--------|
| | High/Medium/Low | | | Open/Fixed |

### Calculation Verification

For each asset type, verify calculations manually:

#### Example: Gold Calculation Verification
- Trading Capital: $10,000
- Entry Price: $2,000
- Stop Loss Distance: 50 pips
- Risk Percentage: 3%

**Manual Calculation:**
- Max Loss = $10,000 × 0.03 = $300
- Pip Value = $1 (for gold)
- Lot Size = $300 / (50 pips × $1) = 6 oz
- Stop Loss Price = $2,000 - 50 = $1,950
- Take Profit (1:2) = $2,000 + (50 × 2) = $2,100

**System Calculation:**
- Lot Size: _____ (should be ~6)
- Stop Loss: _____ (should be ~$1,950)
- Take Profit (1:2): _____ (should be ~$2,100)
- Max Loss: _____ (should be ≤$300)

☐ Calculations match
☐ Calculations differ (explain): _____

## Sign-Off

**Tester Name:** _____________________
**Date:** _____________________
**Overall Result:** ☐ Pass ☐ Fail
**Comments:** _____________________

