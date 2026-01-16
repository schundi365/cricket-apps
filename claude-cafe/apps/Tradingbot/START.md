# 🎯 Quick Start Guide

## Step 1: Install Dependencies

```bash
npm run install-all
```

This installs both backend and frontend dependencies.

## Step 2: Configure Environment

Create a `.env` file in the root directory:

```bash
PORT=5000
NODE_ENV=development
```

**Optional:** Get a free API key from [ExchangeRate-API](https://www.exchangerate-api.com/) and add:
```
FOREX_API_KEY=your_api_key_here
```

> Note: The app works without an API key using the free public endpoint!

## Step 3: Run the App

### Development Mode (Recommended)

Run both frontend and backend together:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- WebSocket: ws://localhost:5000

### Production Mode

Build and run:

```bash
npm run build
npm start
```

Then open: http://localhost:5000

## Step 4: Test Features

### Currency Converter
1. Enter an amount (e.g., 100)
2. Select currencies (e.g., USD to EUR)
3. Click "Convert"

### Live Rates
- Watch real-time updates every 5 seconds
- See percentage changes (green = up, red = down)

### Price Alerts
1. Select a currency pair
2. Choose "above" or "below"
3. Enter target rate
4. Click "Add Alert"
5. Allow browser notifications when prompted

## Troubleshooting

### Port Already in Use

If port 5000 is busy, change it in `.env`:
```
PORT=3001
```

### WebSocket Not Connecting

1. Check if backend is running
2. Look for errors in browser console (F12)
3. Ensure no firewall blocking port 5000

### API Errors

If you see "Failed to fetch exchange rates":
1. Check your internet connection
2. Verify API key if using one
3. Check API rate limits (1500 requests/month on free tier)

### Build Errors

Clear and reinstall:
```bash
rm -rf node_modules client/node_modules
npm run install-all
```

## Next Steps

- **Deploy:** See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment options
- **Customize:** Modify currency pairs in `client/src/App.js`
- **Enhance:** Add more features like charts, historical data, etc.

## Need Help?

- Check the [README.md](README.md) for full documentation
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment guides
- Open an issue on GitHub

Happy trading! 📈
