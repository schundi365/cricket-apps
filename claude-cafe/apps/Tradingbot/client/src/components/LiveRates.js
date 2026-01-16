import React from 'react';
import './LiveRates.css';

function LiveRates({ rates }) {
  const formatChange = (change) => {
    const num = parseFloat(change);
    if (num > 0) return `+${num.toFixed(2)}%`;
    return `${num.toFixed(2)}%`;
  };

  const getChangeClass = (change) => {
    const num = parseFloat(change);
    if (num > 0) return 'positive';
    if (num < 0) return 'negative';
    return 'neutral';
  };

  return (
    <div className="rates-card">
      <h2>📊 Live Exchange Rates</h2>
      
      <div className="rates-list">
        {Object.keys(rates).length === 0 ? (
          <div className="loading">Connecting to live feed...</div>
        ) : (
          Object.entries(rates).map(([pair, data]) => (
            <div key={pair} className="rate-item">
              <div className="pair-name">{pair}</div>
              <div className="rate-info">
                <div className="rate-value">{data.rate?.toFixed(4) || 'N/A'}</div>
                <div className={`rate-change ${getChangeClass(data.change)}`}>
                  {formatChange(data.change)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LiveRates;
