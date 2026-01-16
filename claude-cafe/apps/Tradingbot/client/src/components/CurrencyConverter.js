import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CurrencyConverter.css';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

function CurrencyConverter() {
  const [amount, setAmount] = useState(100);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [result, setResult] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(`${API_URL}/currencies`);
      setCurrencies(response.data);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const handleConvert = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/convert`, {
        params: { from: fromCurrency, to: toCurrency, amount }
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error converting:', error);
    }
    setLoading(false);
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="converter-card">
      <h2>💱 Currency Converter</h2>
      
      <div className="converter-form">
        <div className="input-group">
          <label>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <div className="currency-row">
          <div className="input-group">
            <label>From</label>
            <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          <button className="swap-btn" onClick={swapCurrencies}>⇄</button>

          <div className="input-group">
            <label>To</label>
            <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          className="convert-btn" 
          onClick={handleConvert}
          disabled={loading}
        >
          {loading ? 'Converting...' : 'Convert'}
        </button>

        {result && (
          <div className="result">
            <div className="result-amount">
              {result.amount} {result.from} = {result.result.toFixed(4)} {result.to}
            </div>
            <div className="result-rate">
              Rate: 1 {result.from} = {result.rate.toFixed(6)} {result.to}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CurrencyConverter;
