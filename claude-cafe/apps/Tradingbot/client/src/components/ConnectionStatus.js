import React, { useState, useEffect } from 'react';
import './ConnectionStatus.css';

function ConnectionStatus() {
  const [status, setStatus] = useState({
    websocket: 'unknown',
    api: 'unknown',
    lastCheck: null
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/v1/health');
        const data = await response.json();
        
        setStatus({
          websocket: data.websocket === 'initialized' ? 'connected' : 'disconnected',
          api: response.ok ? 'connected' : 'disconnected',
          lastCheck: new Date()
        });
      } catch (error) {
        setStatus({
          websocket: 'disconnected',
          api: 'disconnected',
          lastCheck: new Date()
        });
      }
    };

    // Check immediately
    checkStatus();

    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (state) => {
    switch (state) {
      case 'connected':
        return '🟢';
      case 'disconnected':
        return '🔴';
      default:
        return '🟡';
    }
  };

  const getStatusText = (state) => {
    switch (state) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Checking...';
    }
  };

  return (
    <div className="connection-status">
      <div className="status-item">
        <span className="status-icon">{getStatusIcon(status.api)}</span>
        <span className="status-label">API: {getStatusText(status.api)}</span>
      </div>
      <div className="status-item">
        <span className="status-icon">{getStatusIcon(status.websocket)}</span>
        <span className="status-label">WebSocket: {getStatusText(status.websocket)}</span>
      </div>
      {status.lastCheck && (
        <div className="status-timestamp">
          Last check: {status.lastCheck.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

export default ConnectionStatus;
