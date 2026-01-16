import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './LivePriceDisplay.css';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1' 
  : 'http://localhost:5000/api/v1';

function LivePriceDisplay({ asset }) {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    if (asset && asset.type && asset.symbol) {
      // Initial fetch
      fetchPrice();
      
      // Set up WebSocket connection for real-time updates
      connectWebSocket();
      
      // Fallback polling every 30 seconds
      const pollingInterval = setInterval(() => {
        if (!wsConnected) {
          fetchPrice();
        }
      }, 30000);

      return () => {
        clearInterval(pollingInterval);
        disconnectWebSocket();
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
    }
  }, [asset]);

  const fetchPrice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${API_URL}/assets/${asset.type}/${asset.symbol}/price`
      );
      
      if (response.data.success) {
        setPriceData(response.data.data);
        setLastUpdate(new Date(response.data.data.timestamp));
      }
    } catch (err) {
      console.error('Error fetching price:', err);
      setError('Failed to load price data');
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    try {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}/ws/prices`
        : 'ws://localhost:5000/ws/prices';
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected for price updates');
        setWsConnected(true);
        setError(null);
        
        // Subscribe to asset price updates
        ws.send(JSON.stringify({
          type: 'subscribe',
          asset: {
            type: asset.type,
            symbol: asset.symbol
          }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'price_update' && 
              message.data.asset.symbol === asset.symbol) {
            setPriceData(message.data);
            setLastUpdate(new Date(message.data.timestamp));
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connectWebSocket();
        }, 5000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error connecting WebSocket:', err);
      setWsConnected(false);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsConnected(false);
  };

  const getDataFreshness = () => {
    if (!lastUpdate) return 'unknown';
    
    const now = new Date();
    const ageInSeconds = Math.floor((now - lastUpdate) / 1000);
    
    if (ageInSeconds < 60) return 'live'; // Less than 1 minute
    if (ageInSeconds < 300) return 'cached'; // Less than 5 minutes
    return 'stale'; // More than 5 minutes
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000);
    
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    
    return timestamp.toLocaleTimeString();
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return 'N/A';
    
    if (asset.type === 'FOREX') {
      return price.toFixed(5);
    } else if (asset.type === 'STOCK') {
      return price.toFixed(2);
    } else {
      return price.toFixed(2);
    }
  };

  const formatSpread = (spread) => {
    if (!spread || isNaN(spread)) return 'N/A';
    
    if (asset.type === 'FOREX') {
      return spread.toFixed(5);
    } else {
      return spread.toFixed(2);
    }
  };

  if (!asset) {
    return (
      <div className="live-price-display">
        <h3>Live Price</h3>
        <p className="no-asset">Select an asset to view live prices</p>
      </div>
    );
  }

  if (loading && !priceData) {
    return (
      <div className="live-price-display">
        <h3>Live Price</h3>
        <div className="loading">Loading price data...</div>
      </div>
    );
  }

  if (error && !priceData) {
    return (
      <div className="live-price-display">
        <h3>Live Price</h3>
        <div className="error-message">{error}</div>
        <button className="retry-btn" onClick={fetchPrice}>Retry</button>
      </div>
    );
  }

  if (!priceData) {
    return (
      <div className="live-price-display">
        <h3>Live Price</h3>
        <p className="no-data">No price data available</p>
      </div>
    );
  }

  const freshness = getDataFreshness();

  return (
    <div className="live-price-display">
      <div className="price-header">
        <h3>Live Price</h3>
        <div className="connection-status">
          <span className={`status-indicator ${wsConnected ? 'connected' : 'disconnected'}`}>
            {wsConnected ? '🟢 Live' : '🔴 Polling'}
          </span>
        </div>
      </div>

      <div className="price-main">
        <div className="current-price">
          <span className="price-label">Current Price</span>
          <span className="price-value">${formatPrice(priceData.price)}</span>
        </div>
      </div>

      <div className="price-details">
        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Bid:</span>
            <span className="detail-value bid">${formatPrice(priceData.bid)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Ask:</span>
            <span className="detail-value ask">${formatPrice(priceData.ask)}</span>
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Spread:</span>
            <span className="detail-value">{formatSpread(priceData.spread)}</span>
          </div>
          {priceData.volume && (
            <div className="detail-item">
              <span className="detail-label">Volume:</span>
              <span className="detail-value">{priceData.volume.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="price-footer">
        <div className="update-info">
          <span className="update-label">Last Update:</span>
          <span className="update-time">{formatTimestamp(lastUpdate)}</span>
        </div>
        <div className={`freshness-indicator ${freshness}`}>
          {freshness === 'live' && (
            <>
              <span className="freshness-icon">🟢</span>
              <span className="freshness-text">Live</span>
            </>
          )}
          {freshness === 'cached' && (
            <>
              <span className="freshness-icon">🟡</span>
              <span className="freshness-text">Cached</span>
            </>
          )}
          {freshness === 'stale' && (
            <>
              <span className="freshness-icon">🔴</span>
              <span className="freshness-text">Stale</span>
            </>
          )}
        </div>
      </div>

      <button className="refresh-btn" onClick={fetchPrice}>
        ↻ Refresh
      </button>
    </div>
  );
}

export default LivePriceDisplay;
