import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TrendingDashboard.css';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1' 
  : 'http://localhost:5000/api/v1';

function TrendingDashboard({ onAssetSelect }) {
  const [trendingAssets, setTrendingAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [assetTypeFilter, setAssetTypeFilter] = useState('ALL');
  const [minSafetyScore, setMinSafetyScore] = useState(0);
  const [minMomentum, setMinMomentum] = useState(0);
  const [trendDirection, setTrendDirection] = useState('BOTH');
  
  // Sorting state
  const [sortBy, setSortBy] = useState('momentum'); // momentum, priceChange, safetyScore

  useEffect(() => {
    fetchTrendingAssets();
    const interval = setInterval(fetchTrendingAssets, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [assetTypeFilter, minSafetyScore, minMomentum, trendDirection]);

  const fetchTrendingAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      
      if (assetTypeFilter !== 'ALL') {
        params.assetTypes = assetTypeFilter;
      }
      
      if (minSafetyScore > 0) {
        params.minSafetyScore = minSafetyScore;
      }
      
      if (minMomentum > 0) {
        params.minMomentum = minMomentum;
      }
      
      if (trendDirection !== 'BOTH') {
        params.trendDirection = trendDirection;
      }
      
      const response = await axios.get(`${API_URL}/trending`, { params });
      setTrendingAssets(response.data.data || []);
    } catch (err) {
      console.error('Error fetching trending assets:', err);
      setError('Failed to load trending assets');
    } finally {
      setLoading(false);
    }
  };

  const getSortedAssets = () => {
    const sorted = [...trendingAssets];
    
    switch (sortBy) {
      case 'momentum':
        return sorted.sort((a, b) => b.momentum - a.momentum);
      case 'priceChange':
        return sorted.sort((a, b) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h));
      case 'safetyScore':
        return sorted.sort((a, b) => b.safetyScore - a.safetyScore);
      default:
        return sorted;
    }
  };

  const handleAssetClick = (asset) => {
    if (onAssetSelect) {
      onAssetSelect(asset);
    }
  };

  const getTrendCategoryDisplay = (category) => {
    const categoryMap = {
      'STRONG_UPTREND': { text: 'Strong ↑', class: 'strong-up' },
      'MODERATE_UPTREND': { text: 'Moderate ↑', class: 'moderate-up' },
      'STRONG_DOWNTREND': { text: 'Strong ↓', class: 'strong-down' },
      'MODERATE_DOWNTREND': { text: 'Moderate ↓', class: 'moderate-down' }
    };
    return categoryMap[category] || { text: category, class: 'neutral' };
  };

  const getSafetyCategory = (score) => {
    if (score >= 80) return { text: 'Very Safe', class: 'very-safe' };
    if (score >= 60) return { text: 'Safe', class: 'safe' };
    if (score >= 40) return { text: 'Moderate', class: 'moderate' };
    if (score >= 20) return { text: 'Risky', class: 'risky' };
    return { text: 'Very Risky', class: 'very-risky' };
  };

  const formatPriceChange = (change) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const sortedAssets = getSortedAssets();

  return (
    <div className="trending-dashboard">
      <div className="dashboard-header">
        <h2>🔥 Trending Assets</h2>
        <button className="refresh-btn" onClick={fetchTrendingAssets} disabled={loading}>
          {loading ? '⟳' : '↻'} Refresh
        </button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Asset Type:</label>
          <select value={assetTypeFilter} onChange={(e) => setAssetTypeFilter(e.target.value)}>
            <option value="ALL">All Assets</option>
            <option value="METAL">Metals</option>
            <option value="FOREX">Forex</option>
            <option value="STOCK">Stocks</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Min Safety Score:</label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={minSafetyScore}
            onChange={(e) => setMinSafetyScore(Number(e.target.value))}
          />
          <span className="filter-value">{minSafetyScore}</span>
        </div>

        <div className="filter-group">
          <label>Min Momentum:</label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={minMomentum}
            onChange={(e) => setMinMomentum(Number(e.target.value))}
          />
          <span className="filter-value">{minMomentum}</span>
        </div>

        <div className="filter-group">
          <label>Trend Direction:</label>
          <select value={trendDirection} onChange={(e) => setTrendDirection(e.target.value)}>
            <option value="BOTH">Both</option>
            <option value="UP">Uptrend</option>
            <option value="DOWN">Downtrend</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="momentum">Momentum</option>
            <option value="priceChange">Price Change</option>
            <option value="safetyScore">Safety Score</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && trendingAssets.length === 0 ? (
        <div className="loading-message">Loading trending assets...</div>
      ) : (
        <div className="trending-grid">
          {sortedAssets.length === 0 ? (
            <div className="no-results">No trending assets match your filters</div>
          ) : (
            sortedAssets.map((asset, index) => {
              const trendDisplay = getTrendCategoryDisplay(asset.trendCategory);
              const safetyDisplay = getSafetyCategory(asset.safetyScore);
              
              return (
                <div 
                  key={`${asset.asset.type}-${asset.asset.symbol}-${index}`}
                  className="trending-card"
                  onClick={() => handleAssetClick(asset)}
                >
                  <div className="card-header">
                    <div className="asset-info">
                      <div className="asset-symbol">{asset.asset.symbol}</div>
                      <div className="asset-name">{asset.asset.name}</div>
                    </div>
                    <div className="asset-type-badge">{asset.asset.type}</div>
                  </div>

                  <div className="card-body">
                    <div className="metric-row">
                      <span className="metric-label">Price:</span>
                      <span className="metric-value">${asset.currentPrice.toFixed(2)}</span>
                    </div>

                    <div className="metric-row">
                      <span className="metric-label">24h Change:</span>
                      <span className={`metric-value ${asset.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                        {formatPriceChange(asset.priceChange24h)}
                      </span>
                    </div>

                    <div className="metric-row">
                      <span className="metric-label">Momentum:</span>
                      <div className="momentum-bar">
                        <div 
                          className="momentum-fill" 
                          style={{ width: `${asset.momentum}%` }}
                        />
                        <span className="momentum-value">{asset.momentum.toFixed(0)}</span>
                      </div>
                    </div>

                    <div className="metric-row">
                      <span className="metric-label">Trend:</span>
                      <span className={`trend-badge ${trendDisplay.class}`}>
                        {trendDisplay.text}
                      </span>
                    </div>

                    <div className="metric-row">
                      <span className="metric-label">Safety:</span>
                      <span className={`safety-badge ${safetyDisplay.class}`}>
                        {safetyDisplay.text} ({asset.safetyScore.toFixed(0)})
                      </span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button className="select-btn">Select Asset →</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default TrendingDashboard;
