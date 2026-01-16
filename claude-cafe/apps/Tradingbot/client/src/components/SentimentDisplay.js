import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SentimentDisplay.css';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1' 
  : 'http://localhost:5000/api/v1';

function SentimentDisplay({ asset, refreshTrigger }) {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (asset && asset.type && asset.symbol) {
      fetchSentiment();
    }
  }, [asset, refreshTrigger]); // React to both asset changes and manual refresh triggers

  const fetchSentiment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${API_URL}/assets/${asset.type}/${asset.symbol}/sentiment`
      );
      
      if (response.data.success) {
        setSentiment(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching sentiment:', err);
      setError('Failed to load sentiment data');
    } finally {
      setLoading(false);
    }
  };

  if (!asset) {
    return (
      <div className="sentiment-display">
        <h3>Market Sentiment</h3>
        <p className="no-asset">Select an asset to view sentiment</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="sentiment-display">
        <h3>Market Sentiment</h3>
        <div className="loading">Loading sentiment data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sentiment-display">
        <h3>Market Sentiment</h3>
        <div className="error-message">{error}</div>
        <button className="retry-btn" onClick={fetchSentiment}>Retry</button>
      </div>
    );
  }

  if (!sentiment) {
    return (
      <div className="sentiment-display">
        <h3>Market Sentiment</h3>
        <p className="no-data">No sentiment data available</p>
      </div>
    );
  }

  const getSentimentClass = (sentimentType) => {
    return sentimentType.toLowerCase();
  };

  const getSentimentIcon = (sentimentType) => {
    switch (sentimentType) {
      case 'BULLISH':
        return '📈';
      case 'BEARISH':
        return '📉';
      case 'NEUTRAL':
        return '➡️';
      default:
        return '❓';
    }
  };

  const getStrengthClass = (strength) => {
    return strength.toLowerCase();
  };

  return (
    <div className="sentiment-display">
      <h3>Market Sentiment</h3>
      
      <div className={`sentiment-indicator ${getSentimentClass(sentiment.sentiment)}`}>
        <div className="sentiment-icon">{getSentimentIcon(sentiment.sentiment)}</div>
        <div className="sentiment-info">
          <div className="sentiment-label">{sentiment.sentiment}</div>
          <div className={`sentiment-strength ${getStrengthClass(sentiment.strength)}`}>
            {sentiment.strength} Strength
          </div>
        </div>
      </div>

      <div className="sentiment-score-bar">
        <div className="score-label">Sentiment Score</div>
        <div className="score-bar-container">
          <div 
            className={`score-bar-fill ${getSentimentClass(sentiment.sentiment)}`}
            style={{ width: `${sentiment.score}%` }}
          />
          <span className="score-value">{sentiment.score.toFixed(0)}/100</span>
        </div>
      </div>

      <div className="key-indicators">
        <h4>Key Indicators</h4>
        
        <div className="indicator-grid">
          <div className="indicator-item">
            <span className="indicator-label">24h Change</span>
            <span className={`indicator-value ${sentiment.indicators.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
              {sentiment.indicators.priceChange24h >= 0 ? '+' : ''}
              {sentiment.indicators.priceChange24h.toFixed(2)}%
            </span>
          </div>

          <div className="indicator-item">
            <span className="indicator-label">7d Change</span>
            <span className={`indicator-value ${sentiment.indicators.priceChange7d >= 0 ? 'positive' : 'negative'}`}>
              {sentiment.indicators.priceChange7d >= 0 ? '+' : ''}
              {sentiment.indicators.priceChange7d.toFixed(2)}%
            </span>
          </div>

          <div className="indicator-item">
            <span className="indicator-label">Volatility</span>
            <span className="indicator-value">
              {sentiment.indicators.volatility.toFixed(2)}%
            </span>
          </div>

          <div className="indicator-item">
            <span className="indicator-label">Momentum</span>
            <span className="indicator-value">
              {sentiment.indicators.momentum.toFixed(0)}
            </span>
          </div>

          <div className="indicator-item">
            <span className="indicator-label">RSI</span>
            <span className={`indicator-value ${
              sentiment.indicators.rsi > 70 ? 'overbought' : 
              sentiment.indicators.rsi < 30 ? 'oversold' : ''
            }`}>
              {sentiment.indicators.rsi.toFixed(1)}
              {sentiment.indicators.rsi > 70 && ' (Overbought)'}
              {sentiment.indicators.rsi < 30 && ' (Oversold)'}
            </span>
          </div>

          <div className="indicator-item">
            <span className="indicator-label">MACD Signal</span>
            <span className={`indicator-value macd-${sentiment.indicators.macdSignal.toLowerCase()}`}>
              {sentiment.indicators.macdSignal}
            </span>
          </div>
        </div>
      </div>

      <div className="sentiment-footer">
        <button className="refresh-btn" onClick={fetchSentiment}>
          ↻ Refresh
        </button>
        <span className="last-update">
          Updated: {new Date(sentiment.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

export default SentimentDisplay;
