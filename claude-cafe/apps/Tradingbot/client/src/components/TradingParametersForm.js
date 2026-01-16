import React, { useState, useEffect } from 'react';
import './TradingParametersForm.css';
import ValidationError from './ValidationError';
import useValidation, { validators } from '../hooks/useValidation';

function TradingParametersForm({ asset, onParametersChange }) {
  const [tradingCapital, setTradingCapital] = useState('10000');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLossDistance, setStopLossDistance] = useState('');
  const [direction, setDirection] = useState('LONG');
  const [useTimingRecommendations, setUseTimingRecommendations] = useState(false);

  // Real-time validation
  const capitalValidation = useValidation(tradingCapital, [
    validators.required('Trading Capital'),
    validators.positive('Trading Capital'),
    validators.minValue('Trading Capital', 100)
  ]);

  const entryPriceValidation = useValidation(entryPrice, [
    validators.required('Entry Price'),
    validators.positive('Entry Price')
  ]);

  const stopLossValidation = useValidation(stopLossDistance, [
    validators.required('Stop Loss Distance'),
    validators.positive('Stop Loss Distance')
  ]);

  // Auto-populate entry price when asset changes
  useEffect(() => {
    if (asset && asset.currentPrice) {
      setEntryPrice(asset.currentPrice.toString());
    }
  }, [asset]);

  // Validate and notify parent of parameter changes
  // This triggers reactive recalculation in parent components
  useEffect(() => {
    const isFormValid = capitalValidation.isValid && 
                        entryPriceValidation.isValid && 
                        stopLossValidation.isValid;

    if (isFormValid && asset) {
      // All inputs valid, notify parent for reactive recalculation
      if (onParametersChange) {
        onParametersChange({
          tradingCapital: parseFloat(tradingCapital),
          entryPrice: parseFloat(entryPrice),
          stopLossDistance: parseFloat(stopLossDistance),
          direction,
          useTimingRecommendations,
          asset,
          valid: true
        });
      }
    } else {
      // Invalid inputs
      if (onParametersChange) {
        onParametersChange({
          tradingCapital: parseFloat(tradingCapital) || 0,
          entryPrice: parseFloat(entryPrice) || 0,
          stopLossDistance: parseFloat(stopLossDistance) || 0,
          direction,
          useTimingRecommendations,
          asset,
          valid: false
        });
      }
    }
  }, [tradingCapital, entryPrice, stopLossDistance, direction, useTimingRecommendations, asset, 
      capitalValidation.isValid, entryPriceValidation.isValid, stopLossValidation.isValid]);

  const handleCapitalChange = (e) => {
    setTradingCapital(e.target.value);
  };

  const handleEntryPriceChange = (e) => {
    setEntryPrice(e.target.value);
  };

  const handleStopLossDistanceChange = (e) => {
    setStopLossDistance(e.target.value);
  };

  const handleDirectionChange = (e) => {
    setDirection(e.target.value);
  };

  const handleTimingRecommendationsChange = (e) => {
    setUseTimingRecommendations(e.target.checked);
  };

  if (!asset) {
    return (
      <div className="trading-parameters-form">
        <h3>Trading Parameters</h3>
        <p className="no-asset">Select an asset to configure trading parameters</p>
      </div>
    );
  }

  return (
    <div className="trading-parameters-form">
      <h3>Trading Parameters</h3>

      <div className="form-group">
        <label htmlFor="tradingCapital">
          Trading Capital ($)
          <span className="required">*</span>
        </label>
        <input
          type="number"
          id="tradingCapital"
          value={tradingCapital}
          onChange={handleCapitalChange}
          placeholder="10000"
          min="0"
          step="100"
          className={!capitalValidation.isValid ? 'error' : ''}
        />
        <ValidationError error={capitalValidation.error} show={!capitalValidation.isValid} />
        <span className="field-hint">Total capital available for trading</span>
      </div>

      <div className="form-group">
        <label htmlFor="entryPrice">
          Entry Price ($)
          <span className="required">*</span>
        </label>
        <input
          type="number"
          id="entryPrice"
          value={entryPrice}
          onChange={handleEntryPriceChange}
          placeholder="Current price"
          min="0"
          step="0.01"
          className={!entryPriceValidation.isValid ? 'error' : ''}
        />
        <ValidationError error={entryPriceValidation.error} show={!entryPriceValidation.isValid} />
        <span className="field-hint">Price at which you plan to enter the trade</span>
      </div>

      <div className="form-group">
        <label htmlFor="stopLossDistance">
          Stop Loss Distance
          <span className="required">*</span>
        </label>
        <input
          type="number"
          id="stopLossDistance"
          value={stopLossDistance}
          onChange={handleStopLossDistanceChange}
          placeholder="50"
          min="0"
          step="0.1"
          className={!stopLossValidation.isValid ? 'error' : ''}
        />
        <ValidationError error={stopLossValidation.error} show={!stopLossValidation.isValid} />
        <span className="field-hint">Distance from entry to stop loss (in pips/points)</span>
      </div>

      <div className="form-group">
        <label>
          Trade Direction
          <span className="required">*</span>
        </label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="direction"
              value="LONG"
              checked={direction === 'LONG'}
              onChange={handleDirectionChange}
            />
            <span className="radio-text">
              📈 Long (Buy)
            </span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="direction"
              value="SHORT"
              checked={direction === 'SHORT'}
              onChange={handleDirectionChange}
            />
            <span className="radio-text">
              📉 Short (Sell)
            </span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={useTimingRecommendations}
            onChange={handleTimingRecommendationsChange}
          />
          <span className="checkbox-text">
            Use timing recommendations for entry/exit levels
          </span>
        </label>
        <span className="field-hint">
          Automatically adjust parameters based on technical analysis
        </span>
      </div>

      <div className="form-info">
        <div className="info-item">
          <span className="info-label">Risk Limit:</span>
          <span className="info-value">3% Maximum</span>
        </div>
        <div className="info-item">
          <span className="info-label">Asset:</span>
          <span className="info-value">{asset.symbol}</span>
        </div>
      </div>
    </div>
  );
}

export default TradingParametersForm;
