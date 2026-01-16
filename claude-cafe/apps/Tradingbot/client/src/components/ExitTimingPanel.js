import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ExitTimingPanel.css';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1' 
  : 'http://localhost:5000/api/v1';

function ExitTimingPanel({ asset, entryPrice, direction = 'LONG', refreshTrigger }) {
  const [exitRec, setExitRec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (asset && asset.type && asset.symbol && entryPrice) {
      fetchExitRecommendation();
    }
  }, [asset, entryPrice, direction, refreshTrigger]); // React to all relevant changes

  const fetchExitRecommendation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${API_URL}/assets/${asset.type}/${asset.symbol}/exit`,
        {
          params: {
            entryPrice: entryPrice,
            direction: direction
          }
        }
      );
      
      if (response.data.success) {
        setExitRec(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching exit recommendation:', err);
      setError('Failed to load exit recommendation');
    } finally {
      setLoading(false);
    }
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 70) return '#4caf50';
    if (probability >= 50) return '#8bc34a';
    if (probability >= 30) return '#ffc107';
    return '#ff9800';
  };

  if (!asset) {
    return (
      <div className="exit-timing-panel">
        <h3>Exit Strategy</h3>
        <p className="no-asset">Select an asset to view exit strategy</p>
      </div>
    );
  }

  if (!entryPrice) {
    return (
      <div className="exit-timing-panel">
        <h3>Exit Strategy</h3>
        <p className="no-data">Enter an entry price to view exit strategy</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="exit-timing-panel">
        <h3>Exit Strategy</h3>
        <div className="loading">Loading exit recommendation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exit-timing-panel">
        <h3>Exit Strategy</h3>
        <div className="error-message">{error}</div>
        <button className="retry-btn" onClick={fetchExitRecommendation}>Retry</button>
      </div>
    );
  }

  if (!exitRec) {
    return (
      <div className="exit-timing-panel">
        <h3>Exit Strategy</h3>
        <p className="no-data">No exit recommendation available</p>
      </div>
    );
  }

  return (
    <div className="exit-timing-panel">
      <h3>Exit Strategy</h3>
      
      <div className="direction-badge">
        <span className={`direction-label ${direction.toLowerCase()}`}>
          {direction === 'LONG' ? '📈' : '📉'} {direction} Position
        </span>
        <span className="entry-price-label">
          Entry: ${entryPrice.toFixed(2)}
        </span>
      </div>

      <div className="take-profit-section">
        <h4>🎯 Take Profit Levels</h4>
        
        {exitRec.takeProfitLevels.map((level, index) => (
          <div key={index} className="exit-level-card tp-card">
            <div className="level-header">
              <span className="level-number">TP {index + 1}</span>
              <span className="level-price">${level.price.toFixed(2)}</span>
            </div>
            
            <div className="level-details">
              <div className="detail-row">
                <span className="detail-label">Reasoning:</span>
                <span className="detail-value">{level.reasoning}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Technical Basis:</span>
                <span className="detail-value technical">{level.technicalBasis}</span>
              </div>
              
              <div className="probability-bar">
                <span className="probability-label">Probability</span>
                <div className="probability-meter">
                  <div 
                    className="probability-fill"
                    style={{ 
                      width: `${level.probability}%`,
                      background: getProbabilityColor(level.probability)
                    }}
                  />
                  <span className="probability-value">{level.probability.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="stop-loss-section">
        <h4>🛡️ Stop Loss</h4>
        
        <div className="exit-level-card sl-card">
          <div className="level-header">
            <span className="level-number">Stop Loss</span>
            <span className="level-price">${exitRec.stopLossLevel.price.toFixed(2)}</span>
          </div>
          
          <div className="level-details">
            <div className="detail-row">
              <span className="detail-label">Reasoning:</span>
              <span className="detail-value">{exitRec.stopLossLevel.reasoning}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Technical Basis:</span>
              <span className="detail-value technical">{exitRec.stopLossLevel.technicalBasis}</span>
            </div>
            
            <div className="probability-bar">
              <span className="probability-label">Probability</span>
              <div className="probability-meter">
                <div 
                  className="probability-fill"
                  style={{ 
                    width: `${exitRec.stopLossLevel.probability}%`,
                    background: getProbabilityColor(exitRec.stopLossLevel.probability)
                  }}
                />
                <span className="probability-value">{exitRec.stopLossLevel.probability.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {exitRec.trailingStopSuggestion && (
        <div className="trailing-stop-section">
          <h4>📊 Trailing Stop Suggestion</h4>
          <div className="trailing-info">
            <span className="trailing-label">Distance:</span>
            <span className="trailing-value">{exitRec.trailingStopSuggestion} points</span>
          </div>
          <p className="trailing-note">
            Consider using a trailing stop to lock in profits as the price moves in your favor.
          </p>
        </div>
      )}

      {exitRec.timeBasedExit && (
        <div className="time-based-exit">
          <h4>⏰ Time-Based Exit</h4>
          <p>{exitRec.timeBasedExit}</p>
        </div>
      )}

      <div className="exit-footer">
        <button className="refresh-btn" onClick={fetchExitRecommendation}>
          ↻ Refresh
        </button>
      </div>
    </div>
  );
}

export default ExitTimingPanel;
