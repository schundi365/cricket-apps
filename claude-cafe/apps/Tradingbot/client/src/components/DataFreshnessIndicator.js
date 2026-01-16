import React, { useState, useEffect } from 'react';
import './DataFreshnessIndicator.css';

function DataFreshnessIndicator({ timestamp, maxAge = 60000 }) {
  const [freshness, setFreshness] = useState('live');
  const [age, setAge] = useState(0);

  useEffect(() => {
    const updateFreshness = () => {
      if (!timestamp) {
        setFreshness('unknown');
        return;
      }

      const now = new Date();
      const dataTime = new Date(timestamp);
      const ageMs = now - dataTime;
      setAge(ageMs);

      if (ageMs < 30000) {
        setFreshness('live');
      } else if (ageMs < maxAge) {
        setFreshness('cached');
      } else {
        setFreshness('stale');
      }
    };

    updateFreshness();
    const interval = setInterval(updateFreshness, 5000);

    return () => clearInterval(interval);
  }, [timestamp, maxAge]);

  const getFreshnessIcon = () => {
    switch (freshness) {
      case 'live':
        return '🟢';
      case 'cached':
        return '🟡';
      case 'stale':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getFreshnessText = () => {
    switch (freshness) {
      case 'live':
        return 'Live';
      case 'cached':
        return `Cached (${Math.floor(age / 1000)}s ago)`;
      case 'stale':
        return `Stale (${Math.floor(age / 1000)}s ago)`;
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`data-freshness-indicator ${freshness}`}>
      <span className="freshness-icon">{getFreshnessIcon()}</span>
      <span className="freshness-text">{getFreshnessText()}</span>
    </div>
  );
}

export default DataFreshnessIndicator;
