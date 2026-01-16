# Deployment Checklist

Use this checklist to ensure proper deployment of the Multi-Asset Trading Platform.

## Pre-Deployment Setup

### 1. GitHub Repository Setup
- [ ] Repository is created on GitHub
- [ ] Code is pushed to GitHub
- [ ] Repository name is noted: `_______________`
- [ ] GitHub username is noted: `_______________`

### 2. Heroku Account Setup
- [ ] Heroku account created (https://signup.heroku.com/)
- [ ] Heroku CLI installed
- [ ] Logged in to Heroku CLI: `heroku login`

### 3. Configuration Files Updated

#### Backend Configuration
- [ ] `server/index.js` - CORS origin updated with GitHub Pages URL
  ```javascript
  origin: [
    'https://YOUR_GITHUB_USERNAME.github.io',
    /\.github\.io$/
  ]
  ```

#### Frontend Configuration
- [ ] `client/package.json` - homepage updated
  ```json
  "homepage": "https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME"
  ```

- [ ] `client/.env.production` - API URL updated
  ```env
  REACT_APP_API_URL=https://YOUR_HEROKU_APP_NAME.herokuapp.com
  ```

## Backend Deployment (Heroku)

### 4. Create Heroku App
- [ ] Run: `heroku create your-app-name`
- [ ] Heroku app name noted: `_______________`
- [ ] Heroku app URL noted: `_______________`

### 5. Configure Environment Variables
- [ ] Set NODE_ENV: `heroku config:set NODE_ENV=production`
- [ ] (Optional) Set METALS_API_KEY: `heroku config:set METALS_API_KEY=xxx`
- [ ] (Optional) Set FOREX_API_KEY: `heroku config:set FOREX_API_KEY=xxx`
- [ ] (Optional) Set STOCKS_API_KEY: `heroku config:set STOCKS_API_KEY=xxx`
- [ ] Verify config: `heroku config`

### 6. Deploy Backend
- [ ] Add Heroku remote: `heroku git:remote -a your-app-name`
- [ ] Push to Heroku: `git push heroku awsmovielens:main` (or `main`)
- [ ] Check deployment: `heroku logs --tail`
- [ ] Verify health endpoint: Visit `https://your-app.herokuapp.com/api/v1/health`

### 7. Test Backend Endpoints
- [ ] Health check works: `/api/v1/health`
- [ ] Trending endpoint works: `/api/v1/trending`
- [ ] Assets endpoint works: `/api/v1/assets/supported`

## Frontend Deployment (GitHub Pages)

### 8. Update Frontend Configuration
- [ ] Update `client/.env.production` with Heroku URL
- [ ] Update `client/package.json` homepage
- [ ] Commit changes: `git add . && git commit -m "Configure for deployment"`

### 9. Install Dependencies
- [ ] Navigate to client: `cd client`
- [ ] Install gh-pages: `npm install --save-dev gh-pages`
- [ ] Return to root: `cd ..`

### 10. Build and Deploy Frontend
- [ ] Navigate to client: `cd client`
- [ ] Build: `npm run build`
- [ ] Deploy: `npm run deploy`
- [ ] Return to root: `cd ..`

### 11. Enable GitHub Pages
- [ ] Go to GitHub repository → Settings → Pages
- [ ] Source: Select `gh-pages` branch
- [ ] Folder: Select `/ (root)`
- [ ] Click Save
- [ ] Note the published URL: `_______________`

## Post-Deployment Configuration

### 12. Update Backend CORS
- [ ] Update `server/index.js` with actual GitHub Pages URL
- [ ] Commit: `git add server/index.js && git commit -m "Update CORS"`
- [ ] Redeploy backend: `git push heroku awsmovielens:main`

### 13. Verify Full Integration
- [ ] Visit GitHub Pages URL
- [ ] Check browser console for errors
- [ ] Test trending dashboard loads
- [ ] Test asset selection
- [ ] Test sentiment analysis
- [ ] Test risk calculations
- [ ] Verify WebSocket connection (check console)
- [ ] Test all 18 assets (5 metals, 7 forex, 6 stocks)

## Troubleshooting

### If Frontend Can't Connect to Backend
- [ ] Check CORS settings in `server/index.js`
- [ ] Verify `REACT_APP_API_URL` in `.env.production`
- [ ] Check Heroku logs: `heroku logs --tail`
- [ ] Verify backend is running: `heroku ps`

### If WebSocket Fails
- [ ] Check WebSocket URL in browser console
- [ ] Verify Heroku dyno is running
- [ ] Check for WebSocket errors in console
- [ ] Ensure using `wss://` not `ws://` for production

### If Build Fails
- [ ] Check Node version compatibility
- [ ] Clear npm cache: `npm cache clean --force`
- [ ] Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- [ ] Check for TypeScript errors: `npm run build`

## Optional Enhancements

### 14. Custom Domain (Optional)
- [ ] Add CNAME file to `client/public/CNAME`
- [ ] Configure DNS with domain provider
- [ ] Enable HTTPS in GitHub Pages settings
- [ ] Add custom domain to Heroku: `heroku domains:add www.yourdomain.com`

### 15. Monitoring Setup (Optional)
- [ ] Set up Heroku metrics monitoring
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Set up uptime monitoring (e.g., UptimeRobot)

### 16. Performance Optimization (Optional)
- [ ] Enable Heroku auto-scaling
- [ ] Configure CDN for static assets
- [ ] Implement service worker for offline support

## Deployment Complete! 🎉

### URLs to Save
- **Frontend (GitHub Pages)**: `_______________`
- **Backend (Heroku)**: `_______________`
- **GitHub Repository**: `_______________`

### Quick Commands Reference
```bash
# Deploy backend
git push heroku awsmovielens:main

# Deploy frontend
cd client && npm run deploy

# View backend logs
heroku logs --tail

# Restart backend
heroku restart

# Check backend status
heroku ps
```

### Share Your Application
- [ ] Test on different devices
- [ ] Test on different browsers
- [ ] Share URL with users
- [ ] Document any known issues

---

**Date Deployed**: _______________
**Deployed By**: _______________
**Notes**: _______________
