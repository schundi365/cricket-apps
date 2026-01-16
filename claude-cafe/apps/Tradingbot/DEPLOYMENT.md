# 🚀 Deployment Guide

## Pre-Deployment Checklist

- [ ] Test app locally with `npm run dev`
- [ ] Build production version with `npm run build`
- [ ] Test production build with `npm start`
- [ ] Get API key from [ExchangeRate-API](https://www.exchangerate-api.com/)
- [ ] Set up environment variables
- [ ] Test WebSocket connections

## Deployment Platforms

### 🟣 Heroku (Recommended for Beginners)

**Pros:** Easy setup, free tier, automatic SSL, good for WebSockets

**Steps:**

1. Install Heroku CLI:
```bash
# Windows
winget install Heroku.HerokuCLI

# Mac
brew tap heroku/brew && brew install heroku
```

2. Login and create app:
```bash
heroku login
heroku create your-forex-app-name
```

3. Set environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set FOREX_API_KEY=your_api_key_here
```

4. Deploy:
```bash
git add .
git commit -m "Initial deployment"
git push heroku main
```

5. Open app:
```bash
heroku open
```

**Cost:** Free tier available (sleeps after 30 min inactivity)

---

### ⚡ Vercel (Best for Static + Serverless)

**Pros:** Fast deployment, free tier, automatic HTTPS, great DX

**Note:** WebSocket support limited on free tier

**Steps:**

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow prompts and set environment variables in dashboard

4. For production:
```bash
vercel --prod
```

**Cost:** Free tier available

---

### 🚂 Railway (Modern Alternative)

**Pros:** Great WebSocket support, easy setup, generous free tier

**Steps:**

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables:
   - `NODE_ENV=production`
   - `FOREX_API_KEY=your_key`
5. Railway auto-detects and deploys

**Cost:** $5 free credit/month

---

### 🌊 DigitalOcean App Platform

**Pros:** Full control, scalable, good performance

**Steps:**

1. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Create new app from GitHub
3. Configure:
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - Port: 5000
4. Add environment variables
5. Deploy

**Cost:** Starting at $5/month

---

### 🐳 Docker Deployment

**For VPS or Cloud Servers**

1. Build image:
```bash
docker build -t forex-app .
```

2. Run container:
```bash
docker run -d -p 5000:5000 \
  -e NODE_ENV=production \
  -e FOREX_API_KEY=your_key \
  --name forex-app \
  forex-app
```

3. With Docker Compose:
```yaml
version: '3.8'
services:
  forex-app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - FOREX_API_KEY=${FOREX_API_KEY}
    restart: unless-stopped
```

Run: `docker-compose up -d`

---

### ☁️ AWS (Advanced)

**Using Elastic Beanstalk:**

1. Install EB CLI:
```bash
pip install awsebcli
```

2. Initialize:
```bash
eb init -p node.js forex-app
```

3. Create environment:
```bash
eb create forex-production
```

4. Set environment variables:
```bash
eb setenv NODE_ENV=production FOREX_API_KEY=your_key
```

5. Deploy:
```bash
eb deploy
```

**Cost:** Pay as you go (typically $10-50/month)

---

## Post-Deployment

### 1. Test Your Deployment

```bash
# Test API
curl https://your-app.com/api/currencies

# Test WebSocket (use browser console)
const ws = new WebSocket('wss://your-app.com');
ws.onopen = () => console.log('Connected!');
```

### 2. Monitor Performance

- Check response times
- Monitor WebSocket connections
- Watch API rate limits
- Set up error logging (Sentry, LogRocket)

### 3. Set Up Custom Domain (Optional)

Most platforms support custom domains:
- Add domain in platform dashboard
- Update DNS records (CNAME or A record)
- SSL certificates are usually automatic

### 4. Enable Analytics (Optional)

Add Google Analytics or similar:
```javascript
// In client/public/index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

---

## Troubleshooting

### WebSocket Connection Failed

**Problem:** WebSocket not connecting in production

**Solutions:**
- Ensure platform supports WebSockets
- Check if using correct protocol (wss:// not ws://)
- Verify firewall/security group settings
- Some platforms require WebSocket-specific configuration

### API Rate Limits

**Problem:** Too many API requests

**Solutions:**
- Increase cache TTL in `forexService.js`
- Upgrade API plan
- Implement request queuing
- Use multiple API keys with rotation

### Build Failures

**Problem:** Deployment build fails

**Solutions:**
```bash
# Clear cache and rebuild
rm -rf node_modules client/node_modules
npm run install-all
npm run build
```

### Memory Issues

**Problem:** App crashes due to memory

**Solutions:**
- Increase memory allocation in platform settings
- Optimize WebSocket connections
- Implement connection pooling
- Add memory monitoring

---

## Scaling Tips

### For High Traffic:

1. **Use Redis for caching:**
```javascript
// Replace node-cache with Redis
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);
```

2. **Add load balancing:**
- Use platform's built-in load balancer
- Or set up Nginx reverse proxy

3. **Implement rate limiting:**
```javascript
const rateLimit = require('express-rate-limit');
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

4. **Use CDN for static assets:**
- Cloudflare
- AWS CloudFront
- Vercel Edge Network

---

## Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled (automatic on most platforms)
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] API keys not exposed in client code
- [ ] Regular dependency updates

---

## Maintenance

### Regular Tasks:

1. **Weekly:**
   - Check error logs
   - Monitor API usage
   - Review performance metrics

2. **Monthly:**
   - Update dependencies: `npm update`
   - Review and optimize costs
   - Check for security vulnerabilities: `npm audit`

3. **Quarterly:**
   - Review and update API integrations
   - Optimize database/cache if added
   - Performance testing and optimization

---

## Need Help?

- Check platform-specific documentation
- Review application logs
- Test locally first: `npm run dev`
- Open GitHub issue for app-specific problems

Good luck with your deployment! 🚀
