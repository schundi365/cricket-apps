/**
 * API Configuration
 * Handles API URL based on environment
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// WebSocket URL derived from API URL
const WS_URL = API_URL.replace(/^http/, 'ws');

export const config = {
  apiUrl: API_URL,
  wsUrl: `${WS_URL}/ws/prices`,
  endpoints: {
    health: `${API_URL}/api/v1/health`,
    assets: `${API_URL}/api/v1/assets`,
    sentiment: `${API_URL}/api/v1/sentiment`,
    trending: `${API_URL}/api/v1/trending`,
    safety: `${API_URL}/api/v1/safety`,
    timing: `${API_URL}/api/v1/timing`,
    calculate: `${API_URL}/api/v1/calculate`,
    cache: `${API_URL}/api/v1/cache`,
  }
};

export default config;
