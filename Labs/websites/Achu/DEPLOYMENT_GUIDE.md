# 🚀 Complete Deployment Guide - Alliance Soft Tech

This guide will walk you through deploying the Alliance Soft Tech website to Firebase Hosting and pushing the code to GitHub.

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Node.js and npm installed ([Download here](https://nodejs.org/))
- [ ] Git installed ([Download here](https://git-scm.com/))
- [ ] A Firebase account ([Sign up here](https://firebase.google.com/))
- [ ] GitHub account with access to the repository
- [ ] Firebase CLI installed globally

## 🔧 Installation Steps

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

### Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window. Sign in with your Google account.

### Step 3: Set Up Firebase Project

You have two options:

#### Option A: Create New Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "alliancesoft" (or your preferred name)
4. Follow the setup wizard

#### Option B: Use Existing Project
1. Note your Firebase project ID from the Firebase Console

### Step 4: Link Your Local Project to Firebase

In the project directory:

```bash
firebase init hosting
```

Answer the prompts:
- **Select a Firebase project**: Choose "alliancesoft" or your project
- **What do you want to use as your public directory?**: `public`
- **Configure as a single-page app?**: `Yes`
- **Set up automatic builds?**: `No`
- **Overwrite index.html?**: `No` (IMPORTANT!)

## 🌐 Deploy to Firebase

### Quick Deploy

```bash
firebase deploy
```

Or deploy only hosting:

```bash
firebase deploy --only hosting
```

### Using the Automated Script

Make the script executable (if not already):
```bash
chmod +x deploy.sh
```

Run the deployment script:
```bash
./deploy.sh "Your custom commit message"
```

## 📦 Push to GitHub

### First Time Setup

```bash
# Navigate to project directory
cd alliance-soft-tech-deploy

# Initialize git (if not already done)
git init

# Add the remote repository
git remote add origin https://github.com/schundi365/Ecommerce.git

# Add all files
git add .

# Commit
git commit -m "Initial commit: Alliance Soft Tech website"

# Push to GitHub
git push -u origin main
```

If you encounter an error about the main branch, try:
```bash
git branch -M main
git push -u origin main
```

### Subsequent Updates

```bash
# Make your changes to the files

# Stage changes
git add .

# Commit with a descriptive message
git commit -m "Update: [describe your changes]"

# Push to GitHub
git push
```

## 🔄 Complete Workflow

For ongoing updates, follow this workflow:

```bash
# 1. Make changes to your website files
vim public/index.html  # or use your preferred editor

# 2. Test locally (optional but recommended)
firebase serve
# Visit http://localhost:5000

# 3. Deploy to Firebase
firebase deploy --only hosting

# 4. Commit and push to GitHub
git add .
git commit -m "Update: [description of changes]"
git push
```

## 🛠️ Troubleshooting

### Issue: "Firebase project not found"

**Solution:**
```bash
# Check your current project
firebase use

# List available projects
firebase projects:list

# Select the correct project
firebase use alliancesoft
```

### Issue: "Permission denied" when pushing to GitHub

**Solution:**
```bash
# Set up SSH keys or use personal access token
# For HTTPS with token:
git remote set-url origin https://YOUR_TOKEN@github.com/schundi365/Ecommerce.git
```

### Issue: "index.html not found"

**Solution:**
Ensure your file is in the `public` directory:
```bash
ls public/index.html
```

### Issue: Git push rejected

**Solution:**
```bash
# Pull the latest changes first
git pull origin main --rebase

# Then push
git push origin main
```

## 🎯 Verify Deployment

After deployment, verify your site:

1. **Firebase Hosting**: Visit `https://alliancesoft.web.app`
2. **Firebase Console**: Check [Firebase Console](https://console.firebase.google.com/) → Hosting
3. **GitHub**: Verify code at `https://github.com/schundi365/Ecommerce`

## 📊 Monitoring

### Check Deployment Status

```bash
firebase hosting:channel:list
```

### View Hosting Logs

In Firebase Console:
1. Go to your project
2. Navigate to Hosting
3. Click on "Release history"

## 🔐 Environment Variables (If Needed)

If you add environment variables in the future:

1. Create `.env` file (already in .gitignore)
2. Add variables:
```
API_KEY=your_api_key
PROJECT_ID=alliancesoft
```

3. Load in your application as needed

## 🌍 Custom Domain Setup (Optional)

To use a custom domain:

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter your domain (e.g., `www.alliancesoft.tech`)
4. Follow DNS configuration instructions
5. Add required DNS records to your domain registrar
6. Wait for SSL certificate provisioning (can take up to 24 hours)

## 📱 Test on Multiple Devices

After deployment, test on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile devices (iOS Safari, Android Chrome)
- Tablets

Use browser dev tools to test responsive design:
- Press F12
- Click device toolbar icon
- Test different screen sizes

## 🚀 Quick Reference Commands

```bash
# Login to Firebase
firebase login

# Deploy to Firebase
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Test locally
firebase serve

# Git add and commit
git add . && git commit -m "Update: changes"

# Git push
git push

# View Firebase projects
firebase projects:list

# Check current project
firebase use

# View deployment history
firebase hosting:channel:list
```

## 📞 Getting Help

If you encounter issues:

1. Check Firebase documentation: https://firebase.google.com/docs/hosting
2. Check GitHub documentation: https://docs.github.com/
3. Review error messages carefully
4. Search for the error on Stack Overflow

## ✅ Deployment Checklist

Before each deployment:

- [ ] Test website locally with `firebase serve`
- [ ] Check all links work correctly
- [ ] Verify responsive design on multiple screen sizes
- [ ] Ensure all images load properly
- [ ] Review console for JavaScript errors
- [ ] Test form submissions
- [ ] Verify all animations work smoothly
- [ ] Check browser compatibility
- [ ] Update version number (if tracking versions)
- [ ] Write clear commit message
- [ ] Deploy to Firebase
- [ ] Push to GitHub
- [ ] Verify live site works correctly

## 🎉 Success!

Once deployed, your website will be live at:
- **Firebase URL**: https://alliancesoft.web.app
- **GitHub Repository**: https://github.com/schundi365/Ecommerce

Share this URL with your team and clients!

---

**Last Updated**: January 2026
**Maintained by**: Alliance Soft Tech Team
