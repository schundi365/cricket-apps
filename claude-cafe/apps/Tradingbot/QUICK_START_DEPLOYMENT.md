# Quick Start: Deploy Your Trading Platform

Follow these steps to deploy your Multi-Asset Trading Platform in under 15 minutes!

## 📋 What You Need

1. GitHub account
2. Heroku account (free tier: https://signup.heroku.com/)
3. Heroku CLI installed: https://devcenter.heroku.com/articles/heroku-cli

## 🚀 Deployment Steps

### Step 1: Get Your Repository Info

Note these values (you'll need them):
- **GitHub Username**: `_______________`
- **Repository Name**: `_______________`

### Step 2: Create Heroku App

```bash
# Login to Heroku
heroku login

# Create app (choose a unique name)
heroku create my-trading-backend

# Note your Heroku app URL: https://my-trading-backend.herokuapp.com
```

### Step 3: Update Configuration Files

**Replace these placeholders in the following files:**

1. **`client/package.json`** (line 5):
   ```json
   "homepage": "https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME"
   ```
   Change to:
   ```json
   "homepage": "https://yourusername.github.io/your-repo-name"
   ```

2. **`client/.env.production`**:
   ```env
   REACT_APP_API_URL=https://YOUR_HEROKU_APP_NAME.herokuapp.com
   ```
   Change to:
   ```env
   REACT_APP_API_URL=https://my-trading-backend.herokuapp.com
   ```

3. **`server/index.js`** (around line 25):
   ```javascript
   origin: process.env.NODE_ENV === 'production' 
     ? [
         'https://YOUR_GITHUB_USERNAME.github.io',
         /\.github\.io$/
       ]
   ```
   Change to:
   ```javascript
   origin: process.env.NODE_ENV === 'production' 
     ? [
         'https://yourusername.github.io',
         /\.github\.io$/
       ]
   ```

### Step 4: Commit Configuration Changes

```bash
git add .
git commit -m "Configure deployment URLs"
```

### Step 5: Deploy Backend to Heroku

```bash
# Add Heroku remote
heroku git:remote -a my-trading-backend

# Set environment
heroku config:set NODE_ENV=production

# Deploy
git push heroku awsmovielens:main

# Check if it's running
heroku open
# Should show your app or visit: https://my-trading-backend.herokuapp.com/api/v1/health
```

### Step 6: Deploy Frontend to GitHub Pages

```bash
# Install gh-pages
cd client
npm install --save-dev gh-pages

# Build and deploy
npm run deploy

# Go back to root
cd ..
```

### Step 7: Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under "Source":
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Click **Save**

Your site will be live at: `https://yourusername.github.io/your-repo-name`

### Step 8: Test Your Application

Visit your GitHub Pages URL and verify:
- ✅ Page loads without errors
- ✅ Trending dashboard displays
- ✅ Can select assets
- ✅ Sentiment analysis works
- ✅ Risk calculations work
- ✅ Check browser console for any errors

## 🎉 You're Done!

Your application is now live at:
- **Frontend**: `https://yourusername.github.io/your-repo-name`
- **Backend**: `https://my-trading-backend.herokuapp.com`

## 🔧 Quick Commands

```bash
# Update backend
git push heroku awsmovielens:main

# Update frontend
cd client && npm run deploy

# View backend logs
heroku logs --tail

# Restart backend
heroku restart
```

## ⚠️ Troubleshooting

### Frontend shows "Failed to fetch"
- Check `client/.env.production` has correct Heroku URL
- Verify CORS settings in `server/index.js`
- Check Heroku logs: `heroku logs --tail`

### Backend not responding
- Check if dyno is running: `heroku ps`
- Restart: `heroku restart`
- View logs: `heroku logs --tail`

### WebSocket not connecting
- Heroku free tier sleeps after 30 min inactivity
- First request wakes it up (takes 10-30 seconds)
- Check browser console for WebSocket errors

## 📚 Need More Help?

- **Full Guide**: See `DEPLOYMENT_GUIDE.md`
- **Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Heroku Docs**: https://devcenter.heroku.com/
- **GitHub Pages Docs**: https://docs.github.com/en/pages

## 🎯 Optional: Add API Keys for Live Data

```bash
# Add API keys to Heroku (optional)
heroku config:set METALS_API_KEY=your_key_here
heroku config:set FOREX_API_KEY=your_key_here
heroku config:set STOCKS_API_KEY=your_key_here
```

Without API keys, the app uses fallback data (still fully functional for demo).

---

**Estimated Time**: 10-15 minutes
**Cost**: $0 (both platforms have free tiers)
**Difficulty**: Easy 🟢
