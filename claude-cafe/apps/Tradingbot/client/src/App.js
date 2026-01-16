import React, { useState, useEffect } from 'react';
import './App.css';
import TrendingDashboard from './components/TrendingDashboard';
import AssetSelector from './components/AssetSelector';
import SentimentDisplay from './components/SentimentDisplay';
import SafetyScoreCard from './components/SafetyScoreCard';
import EntryTimingPanel from './components/EntryTimingPanel';
import ExitTimingPanel from './components/ExitTimingPanel';
import TradingParametersForm from './components/TradingParametersForm';
import RiskCalculationDisplay from './components/RiskCalculationDisplay';
import RiskWarningBanner from './components/RiskWarningBanner';
import LivePriceDisplay from './components/LivePriceDisplay';
import CurrencyConverter from './components/CurrencyConverter';
import LiveRates from './components/LiveRates';
import PriceAlerts from './components/PriceAlerts';
import ConnectionStatus from './components/ConnectionStatus';

function App() {
  const [wsConnected, setWsConnected] = useState(false);
  const [ws, setWs] = useState(null);
  const [liveRates, setLiveRates] = useState({});
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [viewMode, setViewMode] = useState('multi-asset'); // 'multi-asset' or 'forex-only'
  const [tradingParameters, setTradingParameters] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger for reactive updates

  useEffect(() => {
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://${window.location.host}/ws/prices`
      : 'ws://localhost:5000/ws/prices';
    
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    let reconnectTimeout;

    const connectWebSocket = () => {
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        reconnectAttempts = 0;
        
        // Subscribe to forex pairs for legacy support
        websocket.send(JSON.stringify({
          type: 'subscribe',
          pairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF']
        }));
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'rates_update') {
            setLiveRates(message.data);
          } else if (message.type === 'price_update') {
            // Handle multi-asset price updates
            console.log('Price update received:', message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++;
            connectWebSocket();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };

      setWs(websocket);
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const handleTrendingAssetSelect = (asset) => {
    setSelectedAsset(asset);
    // Scroll to asset selector
    document.querySelector('.asset-selector')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAssetChange = (asset) => {
    setSelectedAsset(asset);
    // Trigger refresh of all analysis components when asset changes
    setRefreshTrigger(prev => prev + 1);
  };

  const handleParametersChange = (params) => {
    setTradingParameters(params);
    // Reactive recalculation happens automatically in RiskCalculationDisplay
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📊 Multi-Asset Trading Platform</h1>
        <div className="header-controls">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'multi-asset' ? 'active' : ''}`}
              onClick={() => setViewMode('multi-asset')}
            >
              Multi-Asset
            </button>
            <button
              className={`toggle-btn ${viewMode === 'forex-only' ? 'active' : ''}`}
              onClick={() => setViewMode('forex-only')}
            >
              Forex Only
            </button>
          </div>
          <ConnectionStatus />
        </div>
      </header>
      
      <div className="container">
        {viewMode === 'multi-asset' ? (
          <>
            <TrendingDashboard onAssetSelect={handleTrendingAssetSelect} />
            
            <div className="trading-section">
              <AssetSelector 
                selectedAsset={selectedAsset}
                onAssetChange={handleAssetChange}
              />
              
              {selectedAsset && (
                <div className="selected-asset-info">
                  <h3>Selected Asset</h3>
                  <p><strong>Type:</strong> {selectedAsset.asset?.type || selectedAsset.type}</p>
                  <p><strong>Symbol:</strong> {selectedAsset.asset?.symbol || selectedAsset.symbol}</p>
                  <p><strong>Name:</strong> {selectedAsset.asset?.name || selectedAsset.name}</p>
                  {selectedAsset.currentPrice && (
                    <p><strong>Price:</strong> ${selectedAsset.currentPrice.toFixed(2)}</p>
                  )}
                </div>
              )}
            </div>

            {selectedAsset && (
              <div className="analysis-grid">
                <SentimentDisplay asset={selectedAsset} refreshTrigger={refreshTrigger} />
                <SafetyScoreCard asset={selectedAsset} refreshTrigger={refreshTrigger} />
                <EntryTimingPanel asset={selectedAsset} refreshTrigger={refreshTrigger} />
                <ExitTimingPanel 
                  asset={selectedAsset} 
                  entryPrice={selectedAsset.currentPrice}
                  direction="LONG"
                  refreshTrigger={refreshTrigger}
                />
              </div>
            )}

            {selectedAsset && (
              <div className="trading-parameters-section">
                <h2>Trading Parameters & Risk Calculation</h2>
                
                <div className="trading-grid">
                  <div className="trading-left">
                    <LivePriceDisplay asset={selectedAsset} />
                    <TradingParametersForm 
                      asset={selectedAsset}
                      onParametersChange={handleParametersChange}
                    />
                  </div>
                  
                  <div className="trading-right">
                    {tradingParameters && (
                      <>
                        <RiskWarningBanner 
                          calculation={null}
                          parameters={tradingParameters}
                        />
                        <RiskCalculationDisplay parameters={tradingParameters} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="grid">
            <CurrencyConverter />
            <LiveRates rates={liveRates} />
            <PriceAlerts rates={liveRates} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
