# 🌍 Forex Real-Time Trading App

A professional real-time forex trading application with live exchange rates, currency conversion, and price alerts.

## ✨ Features

- **Real-Time Exchange Rates**: Live updates via WebSocket every 5 seconds
- **Currency Converter**: Convert between 160+ currencies instantly
- **Price Alerts**: Set custom alerts for currency pairs
- **Live Dashboard**: Track multiple currency pairs simultaneously
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Browser Notifications**: Get notified when price targets are hit

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Free API key from [ExchangeRate-API](https://www.exchangerate-api.com/) (optional, uses free tier by default)

### Installation

1. Clone and install dependencies:
```bash
npm run install-all
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. (Optional) Add your API key to `.env`:
```
FOREX_API_KEY=your_api_key_here
```

### Development

Run both frontend and backend:
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Production Build

```bash
npm run build
npm start
```

## 📦 Deployment Options

### Option 1: Heroku

1. Install Heroku CLI and login:
```bash
heroku login
```

2. Create and deploy:
```bash
heroku create your-forex-app
git push heroku main
```

3. Set environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set FOREX_API_KEY=your_key
```

### Option 2: Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

### Option 3: Railway

1. Connect your GitHub repo to [Railway](https://railway.app)
2. Add environment variables in dashboard
3. Deploy automatically on push

### Option 4: DigitalOcean App Platform

1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set run command: `npm start`
4. Add environment variables

### Option 5: Docker

```bash
docker build -t forex-app .
docker run -p 5000:5000 -e FOREX_API_KEY=your_key forex-app
```

## 🔧 Configuration

### Environment Variables

- `PORT`: Server port (default: 5000)
- `FOREX_API_KEY`: API key for exchange rates (optional)
- `NODE_ENV`: Environment (development/production)

### Supported Currency Pairs

The app supports 160+ currencies including:
- Major pairs: EUR/USD, GBP/USD, USD/JPY
- Cross pairs: EUR/GBP, AUD/CAD
- Exotic pairs: USD/TRY, EUR/PLN

## 📱 Usage

### Currency Converter
1. Enter amount
2. Select currencies
3. Click "Convert"

### Live Rates
- Automatically updates every 5 seconds
- Shows percentage change
- Color-coded (green=up, red=down)

### Price Alerts
1. Select currency pair
2. Choose condition (above/below)
3. Set target rate
4. Click "Add Alert"
5. Enable browser notifications when prompted

## 🛠️ Tech Stack

**Frontend:**
- React 18
- WebSocket client
- Axios
- CSS3

**Backend:**
- Node.js
- Express
- WebSocket (ws)
- Axios
- Node-cache

## 📊 API Endpoints

- `GET /api/rates/:base` - Get all rates for base currency
- `GET /api/convert?from=USD&to=EUR&amount=100` - Convert currency
- `GET /api/currencies` - Get supported currencies
- `WebSocket /` - Real-time rate updates

## 🔒 Security

- CORS enabled
- Environment variables for sensitive data
- Rate limiting via caching
- Input validation

## 🐛 Troubleshooting

**WebSocket not connecting:**
- Check firewall settings
- Ensure port 5000 is available
- Verify NODE_ENV is set correctly

**API rate limits:**
- Free tier: 1500 requests/month
- Implement caching (already included)
- Upgrade API plan if needed

**Build errors:**
- Clear node_modules: `rm -rf node_modules && npm run install-all`
- Check Node version: `node -v` (should be 16+)

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 🤝 Contributing

Pull requests welcome! Please test thoroughly before submitting.

## 📞 Support

For issues or questions, open a GitHub issue.
