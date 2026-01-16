# Deployment Guide: Split Deployment (GitHub Pages + Heroku)

This guide walks you through deploying the Multi-Asset Trading Platform with:
- **Frontend**: GitHub Pages (static React app)
- **Backend**: Heroku (Node.js/Express server with WebSocket)

## Prerequisites

1. **GitHub Account** - For hosting the frontend
2. **Heroku Account** - For hosting the backend (free tier available)
3. **Git** - Installed and configured
4. **Node.js & npm** - Installed locally
5. **Heroku CLI** - Install from https://devcenter.heroku.com/articles/heroku-cli

## Part 1: Deploy Backend to Heroku

### Step 1: Install Heroku CLI

```bash
# Windows (using npm)
npm install -g heroku

# Or download installer from:
# https://devcenter.heroku.com/articles/heroku-cli
```

### Step 2: Login to Heroku

```bash
heroku login
```

This will open a browser window for authentication.

### Step 3: Create Heroku App

```bash
# Create a new Heroku app (choose a unique name)
heroku create your-trading-app-backend

# Or let Heroku generate a random name
heroku create
```

**Note the app URL** - it will be something like: `https://your-trading-app-backend.herokuapp.com`

### Step 4: Configure Environment Variables

```bash
# Set Node environment
heroku config:set NODE_ENV=production

# Optional: Add API keys for live data
heroku config:set METALS_API_KEY=your_metals_api_key
heroku config:set FOREX_API_KEY=your_forex_api_key
heroku config:set STOCKS_API_KEY=your_stocks_api_key

# View all config vars
heroku config
```

### Step 5: Deploy Backend to Heroku

```bash
# Add Heroku remote (if not already added)
heroku git:remote -a your-trading-app-backend

# Deploy to Heroku
git push heroku awsmovielens:main

# Or if you're on main branch
git push heroku main

# Check logs
heroku logs --tail
```

### Step 6: Verify Backend Deployment

```bash
# Open the app in browser
heroku open

# Or visit manually
# https://your-trading-app-backend.herokuapp.com/api/v1/health
```

You should see a health check response with status "healthy".

## Part 2: Configure Frontend for GitHub Pages

### Step 1: Update Configuration Files

1. **Update `client/.env.production`**:
   ```env
   REACT_APP_API_URL=https://your-trading-app-backend.herokuapp.com
   ```

2. **Update `client/package.json`**:
   ```json
   "homepage": "https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME"
   ```

3. **Update `server/index.js` CORS settings**:
   ```javascript
   origin: process.env.NODE_ENV === 'production' 
     ? [
         'https://YOUR_GITHUB_USERNAME.github.io',
         /\.github\.io$/
       ]
     : ['http://localhost:3000']
   ```

### Step 2: Install gh-pages Package

```bash
cd client
npm install --save-dev gh-pages
```

### Step 3: Build the Frontend

```bash
# From the client directory
npm run build
```

This creates an optimized production build in the `client/build` folder.

### Step 4: Deploy to GitHub Pages

```bash
# From the client directory
npm run deploy
```

This will:
1. Build the production version
2. Create/update the `gh-pages` branch
3. Push the build to GitHub Pages

### Step 5: Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under "Source", select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Click **Save**

Your site will be published at: `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME`

## Part 3: Update Backend CORS After Frontend Deployment

After you know your GitHub Pages URL, update the backend CORS settings:

```bash
# Update the CORS origin in server/index.js
# Then redeploy to Heroku
git add server/index.js
git commit -m "Update CORS for GitHub Pages"
git push heroku awsmovielens:main
```

## Part 4: Verify Full Deployment

### Test the Application

1. **Visit your GitHub Pages URL**:
   ```
   https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME
   ```

2. **Check browser console** for any errors

3. **Test functionality**:
   - Trending dashboard loads
   - Asset selection works
   - Sentiment analysis displays
   - Risk calculations work
   - WebSocket connection establishes

### Troubleshooting

#### Frontend can't connect to backend

**Check**:
1. CORS settings in `server/index.js` include your GitHub Pages URL
2. `REACT_APP_API_URL` in `client/.env.production` is correct
3. Backend is running: `heroku ps`
4. Backend logs: `heroku logs --tail`

#### WebSocket connection fails

**Check**:
1. Heroku dyno is running
2. WebSocket URL is correct (wss:// not ws://)
3. Browser console for WebSocket errors

#### API calls return 404

**Check**:
1. Backend routes are correctly defined
2. API URL in frontend config is correct
3. Backend is deployed: `heroku open`

## Environment Variables Summary

### Backend (Heroku)
```bash
NODE_ENV=production
METALS_API_KEY=optional
FOREX_API_KEY=optional
STOCKS_API_KEY=optional
```

### Frontend (GitHub Pages)
```env
# client/.env.production
REACT_APP_API_URL=https://your-trading-app-backend.herokuapp.com
```

## Updating the Application

### Update Backend
```bash
# Make changes to server code
git add .
git commit -m "Update backend"
git push heroku awsmovielens:main
```

### Update Frontend
```bash
# Make changes to client code
cd client
npm run deploy
```

## Monitoring

### Heroku Logs
```bash
# View real-time logs
heroku logs --tail

# View last 100 lines
heroku logs -n 100

# View specific dyno
heroku logs --dyno web
```

### Heroku Metrics
```bash
# Open metrics dashboard
heroku open --app your-trading-app-backend
# Then navigate to "Metrics" tab
```

## Cost Considerations

### Heroku Free Tier
- 550-1000 free dyno hours per month
- Sleeps after 30 minutes of inactivity
- Wakes up on first request (may take 10-30 seconds)

### GitHub Pages
- Completely free
- 100GB bandwidth per month
- 1GB storage

## Custom Domain (Optional)

### For GitHub Pages
1. Add CNAME file to `client/public/CNAME` with your domain
2. Configure DNS with your domain provider
3. Enable HTTPS in GitHub Pages settings

### For Heroku
```bash
heroku domains:add www.yourdomain.com
# Follow DNS configuration instructions
```

## Security Notes

1. **Never commit API keys** to the repository
2. **Use environment variables** for all sensitive data
3. **Enable HTTPS** (automatic on both platforms)
4. **Regularly update dependencies**: `npm audit fix`
5. **Monitor logs** for suspicious activity

## Backup and Rollback

### Heroku Rollback
```bash
# View releases
heroku releases

# Rollback to previous version
heroku rollback v123
```

### GitHub Pages Rollback
```bash
# Checkout previous commit
git checkout <commit-hash>

# Redeploy
cd client
npm run deploy
```

## Support

- **Heroku Documentation**: https://devcenter.heroku.com/
- **GitHub Pages Documentation**: https://docs.github.com/en/pages
- **Application Issues**: Check the repository issues page

---

## Quick Reference Commands

```bash
# Backend (Heroku)
heroku login
heroku create your-app-name
heroku config:set NODE_ENV=production
git push heroku main
heroku logs --tail
heroku open

# Frontend (GitHub Pages)
cd client
npm install --save-dev gh-pages
npm run build
npm run deploy

# Update Backend
git push heroku main

# Update Frontend
cd client && npm run deploy
```

## Next Steps

After successful deployment:
1. ✅ Test all features thoroughly
2. ✅ Set up monitoring and alerts
3. ✅ Configure custom domain (optional)
4. ✅ Add API keys for live data
5. ✅ Share the application URL!

Your application is now live! 🎉
