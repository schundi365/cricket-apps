import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RiskCalculationDisplay.css';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1' 
  : 'http://localhost:5000/api/v1';

function RiskCalculationDisplay({ parameters }) {
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (parameters && parameters.valid) {
      performCalculation();
    } else {
      setCalculation(null);
    }
  }, [parameters]); // Automatically recalculate when any parameter changes

  const performCalculation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate lot size
      const lotSizeResponse = await axios.post(`${API_URL}/calculate/lot-size`, {
        tradingCapital: parameters.tradingCapital,
        entryPrice: parameters.entryPrice,
        stopLossDistance: parameters.stopLossDistance,
        asset: parameters.asset,
        riskPercentage: 3
      });

      if (!lotSizeResponse.data.success) {
        throw new Error('Failed to calculate lot size');
      }

      const lotSizeData = lotSizeResponse.data.data;

      // Calculate stop loss
      const stopLossResponse = await axios.post(`${API_URL}/calculate/stop-loss`, {
        entryPrice: parameters.entryPrice,
        tradingCapital: parameters.tradingCapital,
        lotSize: lotSizeData.lotSize,
        asset: parameters.asset,
        direction: parameters.direction,
        riskPercentage: 3
      });

      if (!stopLossResponse.data.success) {
        throw new Error('Failed to calculate stop loss');
      }

      const stopLossData = stopLossResponse.data.data;

      // Calculate take profit levels for different risk-reward ratios
      const takeProfitLevels = [];
      const ratios = [1, 2, 3];

      for (const ratio of ratios) {
        const tpResponse = await axios.post(`${API_URL}/calculate/take-profit`, {
          entryPrice: parameters.entryPrice,
          stopLossPrice: stopLossData.stopLossPrice,
          riskRewardRatio: ratio,
          direction: parameters.direction
        });

        if (tpResponse.data.success) {
          takeProfitLevels.push({
            ratio,
            ...tpResponse.data.data
          });
        }
      }

      setCalculation({
        lotSize: lotSizeData,
        stopLoss: stopLossData,
        takeProfitLevels
      });

    } catch (err) {
      console.error('Error performing calculation:', err);
      setError('Failed to calculate risk parameters. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return 'N/A';
    
    // Format based on asset type
    if (parameters?.asset?.type === 'FOREX') {
      return price.toFixed(5);
    } else if (parameters?.asset?.type === 'STOCK') {
      return price.toFixed(2);
    } else {
      return price.toFixed(2);
    }
  };

  const formatLotSize = (lotSize) => {
    if (!lotSize || isNaN(lotSize)) return 'N/A';
    
    // Format with appropriate precision
    if (lotSize < 0.01) {
      return lotSize.toFixed(4);
    } else if (lotSize < 1) {
      return lotSize.toFixed(3);
    } else {
      return lotSize.toFixed(2);
    }
  };

  const formatDistance = (distance) => {
    if (!distance || isNaN(distance)) return 'N/A';
    return distance.toFixed(2);
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  const formatPercentage = (percentage) => {
    if (!percentage || isNaN(percentage)) return '0.00%';
    return `${percentage.toFixed(2)}%`;
  };

  if (!parameters) {
    return (
      <div className="risk-calculation-display">
        <h3>Risk Calculation</h3>
        <p className="no-parameters">Configure trading parameters to see calculations</p>
      </div>
    );
  }

  if (!parameters.valid) {
    return (
      <div className="risk-calculation-display">
        <h3>Risk Calculation</h3>
        <p className="invalid-parameters">Please correct the errors in trading parameters</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="risk-calculation-display">
        <h3>Risk Calculation</h3>
        <div className="loading">Calculating risk parameters...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="risk-calculation-display">
        <h3>Risk Calculation</h3>
        <div className="error-message">{error}</div>
        <button className="retry-btn" onClick={performCalculation}>Retry</button>
      </div>
    );
  }

  if (!calculation) {
    return (
      <div className="risk-calculation-display">
        <h3>Risk Calculation</h3>
        <p className="no-data">No calculation data available</p>
      </div>
    );
  }

  return (
    <div className="risk-calculation-display">
      <h3>Risk Calculation Results</h3>

      {/* Lot Size Section */}
      <div className="calculation-section">
        <h4>📊 Position Size</h4>
        <div className="calculation-grid">
          <div className="calc-item">
            <span className="calc-label">Lot Size:</span>
            <span className="calc-value highlight">
              {formatLotSize(calculation.lotSize.lotSize)} lots
            </span>
          </div>
          <div className="calc-item">
            <span className="calc-label">Units:</span>
            <span className="calc-value">
              {calculation.lotSize.units.toLocaleString()}
            </span>
          </div>
        </div>
        {calculation.lotSize.warnings && calculation.lotSize.warnings.length > 0 && (
          <div className="warnings">
            {calculation.lotSize.warnings.map((warning, index) => (
              <div key={index} className="warning-item">⚠️ {warning}</div>
            ))}
          </div>
        )}
      </div>

      {/* Stop Loss Section */}
      <div className="calculation-section">
        <h4>🛑 Stop Loss</h4>
        <div className="calculation-grid">
          <div className="calc-item">
            <span className="calc-label">Stop Loss Price:</span>
            <span className="calc-value highlight">
              ${formatPrice(calculation.stopLoss.stopLossPrice)}
            </span>
          </div>
          <div className="calc-item">
            <span className="calc-label">Distance (Pips):</span>
            <span className="calc-value">
              {formatDistance(calculation.stopLoss.distanceInPips)}
            </span>
          </div>
          <div className="calc-item">
            <span className="calc-label">Distance (Currency):</span>
            <span className="calc-value">
              ${formatDistance(calculation.stopLoss.distanceInCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* Take Profit Section */}
      <div className="calculation-section">
        <h4>🎯 Take Profit Levels</h4>
        {calculation.takeProfitLevels.map((tp, index) => (
          <div key={index} className="tp-level">
            <div className="tp-header">
              <span className="tp-ratio">1:{tp.ratio} Risk-Reward</span>
            </div>
            <div className="calculation-grid">
              <div className="calc-item">
                <span className="calc-label">Target Price:</span>
                <span className="calc-value highlight">
                  ${formatPrice(tp.takeProfitPrice)}
                </span>
              </div>
              <div className="calc-item">
                <span className="calc-label">Distance (Pips):</span>
                <span className="calc-value">
                  {formatDistance(tp.distanceInPips)}
                </span>
              </div>
              <div className="calc-item">
                <span className="calc-label">Potential Profit:</span>
                <span className="calc-value profit">
                  {formatCurrency(tp.potentialProfit)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Risk Summary Section */}
      <div className="calculation-section risk-summary">
        <h4>⚖️ Risk Summary</h4>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Maximum Loss:</span>
            <span className="summary-value loss">
              {formatCurrency(calculation.stopLoss.maxLoss)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Risk Percentage:</span>
            <span className={`summary-value ${calculation.lotSize.riskPercentage > 3 ? 'risk-exceeded' : 'risk-ok'}`}>
              {formatPercentage(calculation.lotSize.riskPercentage)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Trading Capital:</span>
            <span className="summary-value">
              {formatCurrency(parameters.tradingCapital)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Entry Price:</span>
            <span className="summary-value">
              ${formatPrice(parameters.entryPrice)}
            </span>
          </div>
        </div>
      </div>

      <button className="recalculate-btn" onClick={performCalculation}>
        ↻ Recalculate
      </button>
    </div>
  );
}

export default RiskCalculationDisplay;
