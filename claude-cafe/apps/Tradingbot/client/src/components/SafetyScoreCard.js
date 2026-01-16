import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SafetyScoreCard.css';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1' 
  : 'http://localhost:5000/api/v1';

function SafetyScoreCard({ asset, refreshTrigger }) {
  const [safetyScore, setSafetyScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (asset && asset.type && asset.symbol) {
      fetchSafetyScore();
    }
  }, [asset, refreshTrigger]); // React to both asset changes and manual refresh triggers

  const fetchSafetyScore = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${API_URL}/assets/${asset.type}/${asset.symbol}/safety`
      );
      
      if (response.data.success) {
        setSafetyScore(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching safety score:', err);
      setError('Failed to load safety score');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryClass = (category) => {
    return category.toLowerCase().replace(/_/g, '-');
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'VERY_SAFE':
        return '🛡️';
      case 'SAFE':
        return '✅';
      case 'MODERATE':
        return '⚠️';
      case 'RISKY':
        return '⚡';
      case 'VERY_RISKY':
        return '🚨';
      default:
        return '❓';
    }
  };

  const getCategoryLabel = (category) => {
    return category.replace(/_/g, ' ');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#8bc34a';
    if (score >= 40) return '#ffc107';
    if (score >= 20) return '#ff9800';
    return '#f44336';
  };

  if (!asset) {
    return (
      <div className="safety-score-card">
        <h3>Safety Score</h3>
        <p className="no-asset">Select an asset to view safety score</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="safety-score-card">
        <h3>Safety Score</h3>
        <div className="loading">Loading safety score...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="safety-score-card">
        <h3>Safety Score</h3>
        <div className="error-message">{error}</div>
        <button className="retry-btn" onClick={fetchSafetyScore}>Retry</button>
      </div>
    );
  }

  if (!safetyScore) {
    return (
      <div className="safety-score-card">
        <h3>Safety Score</h3>
        <p className="no-data">No safety score available</p>
      </div>
    );
  }

  return (
    <div className="safety-score-card">
      <h3>Safety Score</h3>
      
      <div className={`overall-score ${getCategoryClass(safetyScore.category)}`}>
        <div className="score-circle" style={{ 
          background: `conic-gradient(${getScoreColor(safetyScore.overallScore)} ${safetyScore.overallScore * 3.6}deg, #e0e0e0 0deg)` 
        }}>
          <div className="score-inner">
            <div className="score-number">{safetyScore.overallScore.toFixed(0)}</div>
            <div className="score-max">/100</div>
          </div>
        </div>
        
        <div className="category-info">
          <div className="category-icon">{getCategoryIcon(safetyScore.category)}</div>
          <div className="category-label">{getCategoryLabel(safetyScore.category)}</div>
        </div>
      </div>

      <div className="component-scores">
        <h4>Component Breakdown</h4>
        
        <div className="component-item">
          <div className="component-header">
            <span className="component-label">Volatility</span>
            <span className="component-value">{safetyScore.components.volatilityScore.toFixed(0)}</span>
          </div>
          <div className="component-bar">
            <div 
              className="component-fill"
              style={{ 
                width: `${safetyScore.components.volatilityScore}%`,
                background: getScoreColor(safetyScore.components.volatilityScore)
              }}
            />
          </div>
          <div className="component-note">Lower volatility = Higher score</div>
        </div>

        <div className="component-item">
          <div className="component-header">
            <span className="component-label">Liquidity</span>
            <span className="component-value">{safetyScore.components.liquidityScore.toFixed(0)}</span>
          </div>
          <div className="component-bar">
            <div 
              className="component-fill"
              style={{ 
                width: `${safetyScore.components.liquidityScore}%`,
                background: getScoreColor(safetyScore.components.liquidityScore)
              }}
            />
          </div>
          <div className="component-note">Higher liquidity = Higher score</div>
        </div>

        <div className="component-item">
          <div className="component-header">
            <span className="component-label">Spread</span>
            <span className="component-value">{safetyScore.components.spreadScore.toFixed(0)}</span>
          </div>
          <div className="component-bar">
            <div 
              className="component-fill"
              style={{ 
                width: `${safetyScore.components.spreadScore}%`,
                background: getScoreColor(safetyScore.components.spreadScore)
              }}
            />
          </div>
          <div className="component-note">Tighter spread = Higher score</div>
        </div>

        <div className="component-item">
          <div className="component-header">
            <span className="component-label">Trend Strength</span>
            <span className="component-value">{safetyScore.components.trendStrengthScore.toFixed(0)}</span>
          </div>
          <div className="component-bar">
            <div 
              className="component-fill"
              style={{ 
                width: `${safetyScore.components.trendStrengthScore}%`,
                background: getScoreColor(safetyScore.components.trendStrengthScore)
              }}
            />
          </div>
          <div className="component-note">Stronger trend = Higher score</div>
        </div>

        <div className="component-item">
          <div className="component-header">
            <span className="component-label">Market Conditions</span>
            <span className="component-value">{safetyScore.components.marketConditionsScore.toFixed(0)}</span>
          </div>
          <div className="component-bar">
            <div 
              className="component-fill"
              style={{ 
                width: `${safetyScore.components.marketConditionsScore}%`,
                background: getScoreColor(safetyScore.components.marketConditionsScore)
              }}
            />
          </div>
          <div className="component-note">Favorable conditions = Higher score</div>
        </div>
      </div>

      <div className="recommendation-box">
        <h4>Recommendation</h4>
        <p>{safetyScore.recommendation}</p>
      </div>

      <div className="safety-footer">
        <button className="refresh-btn" onClick={fetchSafetyScore}>
          ↻ Refresh
        </button>
        <span className="last-update">
          Updated: {new Date(safetyScore.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

export default SafetyScoreCard;
