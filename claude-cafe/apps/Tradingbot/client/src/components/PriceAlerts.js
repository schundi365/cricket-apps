import React, { useState, useEffect } from 'react';
import './PriceAlerts.css';

function PriceAlerts({ rates }) {
  const [alerts, setAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({
    pair: 'EUR/USD',
    targetRate: '',
    condition: 'above'
  });

  useEffect(() => {
    checkAlerts();
  }, [rates]);

  const checkAlerts = () => {
    alerts.forEach(alert => {
      const currentRate = rates[alert.pair]?.rate;
      if (!currentRate) return;

      const shouldTrigger = alert.condition === 'above' 
        ? currentRate >= alert.targetRate
        : currentRate <= alert.targetRate;

      if (shouldTrigger && !alert.triggered) {
        triggerAlert(alert);
      }
    });
  };

  const triggerAlert = (alert) => {
    const notification = new Notification('Forex Price Alert!', {
      body: `${alert.pair} is ${alert.condition} ${alert.targetRate}`,
      icon: '💰'
    });

    setAlerts(prev => prev.map(a => 
      a.id === alert.id ? { ...a, triggered: true } : a
    ));

    setTimeout(() => notification.close(), 5000);
  };

  const addAlert = () => {
    if (!newAlert.targetRate) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const alert = {
      id: Date.now(),
      ...newAlert,
      targetRate: parseFloat(newAlert.targetRate),
      triggered: false
    };

    setAlerts([...alerts, alert]);
    setNewAlert({ pair: 'EUR/USD', targetRate: '', condition: 'above' });
  };

  const removeAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="alerts-card">
      <h2>🔔 Price Alerts</h2>
      
      <div className="alert-form">
        <select 
          value={newAlert.pair}
          onChange={(e) => setNewAlert({...newAlert, pair: e.target.value})}
        >
          {Object.keys(rates).map(pair => (
            <option key={pair} value={pair}>{pair}</option>
          ))}
        </select>

        <select
          value={newAlert.condition}
          onChange={(e) => setNewAlert({...newAlert, condition: e.target.value})}
        >
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>

        <input
          type="number"
          step="0.0001"
          placeholder="Target rate"
          value={newAlert.targetRate}
          onChange={(e) => setNewAlert({...newAlert, targetRate: e.target.value})}
        />

        <button onClick={addAlert}>Add Alert</button>
      </div>

      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="no-alerts">No alerts set</div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`alert-item ${alert.triggered ? 'triggered' : ''}`}>
              <div className="alert-info">
                <strong>{alert.pair}</strong> {alert.condition} {alert.targetRate}
                {alert.triggered && <span className="badge">Triggered</span>}
              </div>
              <button onClick={() => removeAlert(alert.id)}>×</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PriceAlerts;
