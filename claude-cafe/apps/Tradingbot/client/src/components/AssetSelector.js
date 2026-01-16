import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AssetSelector.css';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1' 
  : 'http://localhost:5000/api/v1';

function AssetSelector({ selectedAsset, onAssetChange }) {
  const [assetType, setAssetType] = useState('METAL');
  const [symbol, setSymbol] = useState('GOLD');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Asset definitions
  const assetsByType = {
    METAL: [
      { symbol: 'GOLD', name: 'Gold (XAU/USD)' },
      { symbol: 'SILVER', name: 'Silver (XAG/USD)' },
      { symbol: 'COPPER', name: 'Copper (HG)' },
      { symbol: 'PLATINUM', name: 'Platinum (XPT/USD)' },
      { symbol: 'PALLADIUM', name: 'Palladium (XPD/USD)' }
    ],
    FOREX: [
      { symbol: 'EUR/USD', name: 'Euro/US Dollar' },
      { symbol: 'GBP/USD', name: 'British Pound/US Dollar' },
      { symbol: 'USD/JPY', name: 'US Dollar/Japanese Yen' },
      { symbol: 'AUD/USD', name: 'Australian Dollar/US Dollar' },
      { symbol: 'USD/CHF', name: 'US Dollar/Swiss Franc' },
      { symbol: 'USD/CAD', name: 'US Dollar/Canadian Dollar' },
      { symbol: 'NZD/USD', name: 'New Zealand Dollar/US Dollar' }
    ],
    STOCK: [
      { symbol: 'SPX', name: 'S&P 500' },
      { symbol: 'NDX', name: 'NASDAQ 100' },
      { symbol: 'DJI', name: 'Dow Jones Industrial' },
      { symbol: 'FTSE', name: 'FTSE 100' },
      { symbol: 'DAX', name: 'DAX' },
      { symbol: 'N225', name: 'Nikkei 225' }
    ]
  };

  useEffect(() => {
    fetchCurrentPrice();
    const interval = setInterval(fetchCurrentPrice, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [assetType, symbol]);

  useEffect(() => {
    // Notify parent component of asset change
    if (onAssetChange) {
      onAssetChange({
        type: assetType,
        symbol: symbol,
        name: assetsByType[assetType].find(a => a.symbol === symbol)?.name || symbol,
        currentPrice: currentPrice
      });
    }
  }, [assetType, symbol, currentPrice]);

  const fetchCurrentPrice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/assets/${assetType}/${symbol}/price`);
      
      if (response.data.success) {
        setCurrentPrice(response.data.data.price);
        setLastUpdate(new Date(response.data.data.timestamp));
      }
    } catch (err) {
      console.error('Error fetching price:', err);
      setError('Failed to load price');
    } finally {
      setLoading(false);
    }
  };

  const handleAssetTypeChange = (newType) => {
    setAssetType(newType);
    // Set first asset of new type as default
    const firstAsset = assetsByType[newType][0];
    setSymbol(firstAsset.symbol);
  };

  const handleSymbolChange = (newSymbol) => {
    setSymbol(newSymbol);
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    
    // Format based on asset type
    if (assetType === 'FOREX') {
      return price.toFixed(5);
    } else if (assetType === 'STOCK') {
      return price.toFixed(2);
    } else {
      return price.toFixed(2);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000); // seconds
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    
    return timestamp.toLocaleTimeString();
  };

  const getDataFreshness = () => {
    if (!lastUpdate) return 'unknown';
    
    const now = new Date();
    const diff = Math.floor((now - lastUpdate) / 1000);
    
    if (diff < 60) return 'live';
    if (diff < 300) return 'cached';
    return 'stale';
  };

  const freshnessClass = getDataFreshness();

  return (
    <div className="asset-selector">
      <h3>Select Asset</h3>
      
      <div className="selector-tabs">
        <button
          className={`tab-btn ${assetType === 'METAL' ? 'active' : ''}`}
          onClick={() => handleAssetTypeChange('METAL')}
        >
          🥇 Metals
        </button>
        <button
          className={`tab-btn ${assetType === 'FOREX' ? 'active' : ''}`}
          onClick={() => handleAssetTypeChange('FOREX')}
        >
          💱 Forex
        </button>
        <button
          className={`tab-btn ${assetType === 'STOCK' ? 'active' : ''}`}
          onClick={() => handleAssetTypeChange('STOCK')}
        >
          📈 Stocks
        </button>
      </div>

      <div className="selector-dropdown">
        <label>Asset:</label>
        <select value={symbol} onChange={(e) => handleSymbolChange(e.target.value)}>
          {assetsByType[assetType].map(asset => (
            <option key={asset.symbol} value={asset.symbol}>
              {asset.name}
            </option>
          ))}
        </select>
      </div>

      <div className="price-display">
        <div className="price-row">
          <span className="price-label">Current Price:</span>
          {loading && !currentPrice ? (
            <span className="price-value loading">Loading...</span>
          ) : error ? (
            <span className="price-value error">{error}</span>
          ) : (
            <span className="price-value">${formatPrice(currentPrice)}</span>
          )}
        </div>

        <div className="price-row">
          <span className="price-label">Last Update:</span>
          <span className={`update-time ${freshnessClass}`}>
            {formatTimestamp(lastUpdate)}
            <span className={`freshness-indicator ${freshnessClass}`}>
              {freshnessClass === 'live' && '🟢'}
              {freshnessClass === 'cached' && '🟡'}
              {freshnessClass === 'stale' && '🔴'}
            </span>
          </span>
        </div>
      </div>

      {error && (
        <button className="retry-btn" onClick={fetchCurrentPrice}>
          Retry
        </button>
      )}
    </div>
  );
}

export default AssetSelector;
