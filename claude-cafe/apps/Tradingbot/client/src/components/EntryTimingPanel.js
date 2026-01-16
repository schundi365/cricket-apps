import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EntryTimingPanel.css';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1' 
  : 'http://localhost:5000/api/v1';

function EntryTimingPanel({ asset, refreshTrigger }) {
  const [entryRec, setEntryRec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (asset && asset.type && asset.symbol) {
      fetchEntryRecommendation();
    }
  }, [asset, refreshTrigger]); // React to both asset changes and manual refresh triggers

  const fetchEntryRecommendation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${API_URL}/assets/${asset.type}/${asset.symbol}/entry`
      );
      
      if (response.data.success) {
        setEntryRec(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching entry recommendation:', err);
      setError('Failed to load entry recommendation');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationClass = (rec) => {
    return rec.toLowerCase();
  };

  const getRecommendationIcon = (rec) => {
    switch (rec) {
      case 'IMMEDIATE':
        return '🚀';
      case 'WAIT':
        return '⏳';
      case 'AVOID':
        return '🛑';
      default:
        return '❓';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#4caf50';
    if (confidence >= 60) return '#8bc34a';
    if (confidence >= 40) return '#ffc107';
    return '#ff9800';
  };

  const getTimeHorizonLabel = (horizon) => {
    const labels = {
      'SCALP': 'Scalp (Minutes)',
      'DAY_TRADE': 'Day Trade (Hours)',
      'SWING_TRADE': 'Swing Trade (Days)',
      'POSITION_TRADE': 'Position Trade (Weeks)'
    };
    return labels[horizon] || horizon;
  };

  if (!asset) {
    return (
      <div className="entry-timing-panel">
        <h3>Entry Timing</h3>
        <p className="no-asset">Select an asset to view entry timing</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="entry-timing-panel">
        <h3>Entry Timing</h3>
        <div className="loading">Loading entry recommendation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="entry-timing-panel">
        <h3>Entry Timing</h3>
        <div className="error-message">{error}</div>
        <button className="retry-btn" onClick={fetchEntryRecommendation}>Retry</button>
      </div>
    );
  }

  if (!entryRec) {
    return (
      <div className="entry-timing-panel">
        <h3>Entry Timing</h3>
        <p className="no-data">No entry recommendation available</p>
      </div>
    );
  }

  return (
    <div className="entry-timing-panel">
      <h3>Entry Timing</h3>
      
      <div className={`recommendation-badge ${getRecommendationClass(entryRec.recommendation)}`}>
        <div className="badge-icon">{getRecommendationIcon(entryRec.recommendation)}</div>
        <div className="badge-content">
          <div className="badge-label">{entryRec.recommendation}</div>
          <div className="confidence-bar">
            <div className="confidence-label">Confidence</div>
            <div className="confidence-meter">
              <div 
                className="confidence-fill"
                style={{ 
                  width: `${entryRec.confidence}%`,
                  background: getConfidenceColor(entryRec.confidence)
                }}
              />
              <span className="confidence-value">{entryRec.confidence.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {entryRec.suggestedEntryPrice && (
        <div className="suggested-entry">
          <span className="entry-label">Suggested Entry Price:</span>
          <span className="entry-price">${entryRec.suggestedEntryPrice.toFixed(2)}</span>
        </div>
      )}

      {entryRec.waitCondition && (
        <div className="wait-condition">
          <h4>Wait For:</h4>
          <p>{entryRec.waitCondition}</p>
        </div>
      )}

      <div className="reasoning-section">
        <h4>Reasoning</h4>
        <ul className="reasoning-list">
          {entryRec.reasoning.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      </div>

      <div className="technical-indicators">
        <h4>Technical Indicators</h4>
        
        <div className="indicator-grid">
          <div className="indicator-box">
            <span className="indicator-name">Trend Alignment</span>
            <span className={`indicator-status ${entryRec.technicalIndicators.trendAlignment ? 'positive' : 'negative'}`}>
              {entryRec.technicalIndicators.trendAlignment ? '✓ Aligned' : '✗ Not Aligned'}
            </span>
          </div>

          <div className="indicator-box">
            <span className="indicator-name">Volume Confirmation</span>
            <span className={`indicator-status ${entryRec.technicalIndicators.volumeConfirmation ? 'positive' : 'negative'}`}>
              {entryRec.technicalIndicators.volumeConfirmation ? '✓ Confirmed' : '✗ Not Confirmed'}
            </span>
          </div>

          <div className="indicator-box">
            <span className="indicator-name">Momentum</span>
            <span className={`indicator-status momentum-${entryRec.technicalIndicators.momentum.toLowerCase()}`}>
              {entryRec.technicalIndicators.momentum}
            </span>
          </div>

          <div className="indicator-box">
            <span className="indicator-name">RSI</span>
            <span className="indicator-value">
              {entryRec.technicalIndicators.rsi.toFixed(1)}
            </span>
          </div>

          <div className="indicator-box">
            <span className="indicator-name">Support</span>
            <span className="indicator-value">
              ${entryRec.technicalIndicators.supportResistance.support.toFixed(2)}
            </span>
          </div>

          <div className="indicator-box">
            <span className="indicator-name">Resistance</span>
            <span className="indicator-value">
              ${entryRec.technicalIndicators.supportResistance.resistance.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="macd-section">
          <h5>MACD</h5>
          <div className="macd-values">
            <div className="macd-item">
              <span>Value:</span>
              <span>{entryRec.technicalIndicators.macd.value.toFixed(4)}</span>
            </div>
            <div className="macd-item">
              <span>Signal:</span>
              <span>{entryRec.technicalIndicators.macd.signal.toFixed(4)}</span>
            </div>
            <div className="macd-item">
              <span>Histogram:</span>
              <span className={entryRec.technicalIndicators.macd.histogram >= 0 ? 'positive' : 'negative'}>
                {entryRec.technicalIndicators.macd.histogram.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        <div className="ma-section">
          <h5>Moving Averages</h5>
          <div className="ma-values">
            <div className="ma-item">
              <span>MA 20:</span>
              <span>${entryRec.technicalIndicators.movingAverages.ma20.toFixed(2)}</span>
            </div>
            <div className="ma-item">
              <span>MA 50:</span>
              <span>${entryRec.technicalIndicators.movingAverages.ma50.toFixed(2)}</span>
            </div>
            <div className="ma-item">
              <span>MA 200:</span>
              <span>${entryRec.technicalIndicators.movingAverages.ma200.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="time-horizon">
        <h4>Time Horizon</h4>
        <div className="horizon-badge">
          {getTimeHorizonLabel(entryRec.timeHorizon)}
        </div>
      </div>

      <div className="entry-footer">
        <button className="refresh-btn" onClick={fetchEntryRecommendation}>
          ↻ Refresh
        </button>
        <span className="last-update">
          Updated: {new Date(entryRec.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

export default EntryTimingPanel;
