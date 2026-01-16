const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
require('dotenv').config();

const forexService = require('./services/forexService');
const { getCacheStats, clearAllCaches } = require('./config/integrationConfig');

// Import new API routes
const priceRoutes = require('./routes/priceRoutes');
const sentimentRoutes = require('./routes/sentimentRoutes');
const trendingRoutes = require('./routes/trendingRoutes');
const safetyRoutes = require('./routes/safetyRoutes');
const timingRoutes = require('./routes/timingRoutes');
const calculationRoutes = require('./routes/calculationRoutes');
const configRoutes = require('./routes/configRoutes');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket service for multi-asset price updates
const { WebSocketService } = require('./services/websocketService');
let websocketService;

app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// New multi-asset API v1 endpoints
app.use('/api/v1/assets', priceRoutes);
app.use('/api/v1', sentimentRoutes);
app.use('/api/v1/trending', trendingRoutes);
app.use('/api/v1', safetyRoutes);
app.use('/api/v1', timingRoutes);
app.use('/api/v1/calculate', calculationRoutes);
app.use('/api/v1/assets', configRoutes);

// Legacy REST API endpoints (maintained for backward compatibility)
app.get('/api/rates/:base', async (req, res) => {
  try {
    const { base } = req.params;
    const rates = await forexService.getRates(base);
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/convert', async (req, res) => {
  try {
    const { from, to, amount } = req.query;
    const result = await forexService.convert(from, to, parseFloat(amount));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/currencies', async (req, res) => {
  try {
    const currencies = await forexService.getSupportedCurrencies();
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket stats endpoint
app.get('/api/v1/websocket/stats', (req, res) => {
  if (websocketService) {
    const stats = websocketService.getSubscriptionStats();
    res.json(stats);
  } else {
    res.status(503).json({ error: 'WebSocket service not initialized' });
  }
});

// Cache stats endpoint
app.get('/api/v1/cache/stats', (req, res) => {
  try {
    const stats = getCacheStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear cache endpoint (for development/testing)
app.post('/api/v1/cache/clear', (req, res) => {
  try {
    clearAllCaches();
    res.json({
      success: true,
      message: 'All caches cleared'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    websocket: websocketService ? 'initialized' : 'not initialized',
    cacheStats: getCacheStats()
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize WebSocket service after server starts
  websocketService = new WebSocketService(server);
  console.log('WebSocket service initialized at /ws/prices');
});
