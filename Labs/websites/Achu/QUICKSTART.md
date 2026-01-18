# ⚡ Quick Start - Deploy in 5 Minutes

## Prerequisites Checklist
- [ ] Node.js installed
- [ ] Firebase account created
- [ ] GitHub account access

## 🚀 Deploy to Firebase (2 minutes)

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login
```bash
firebase login
```

### 3. Navigate to project folder
```bash
cd alliance-soft-tech-deploy
```

### 4. Deploy
```bash
firebase deploy
```

**Done!** Your site is live at: `https://alliancesoft.web.app`

---

## 📦 Push to GitHub (3 minutes)

### 1. Initialize git
```bash
git init
```

### 2. Add remote repository
```bash
git remote add origin https://github.com/schundi365/Ecommerce.git
```

### 3. Add, commit, and push
```bash
git add .
git commit -m "Initial commit: Alliance Soft Tech website"
git push -u origin main
```

**Done!** Code is now on GitHub.

---

## 🎯 One-Command Deploy (Use the script!)

Make it executable:
```bash
chmod +x deploy.sh
```

Run:
```bash
./deploy.sh
```

This single command will:
✅ Deploy to Firebase
✅ Commit changes to Git
✅ Push to GitHub

---

## 🆘 Quick Troubleshooting

**Problem**: Firebase command not found  
**Solution**: `npm install -g firebase-tools`

**Problem**: Git push rejected  
**Solution**: `git pull origin main --rebase` then `git push`

**Problem**: index.html not found  
**Solution**: Ensure you're in the `alliance-soft-tech-deploy` directory

---

## 📞 Need Help?

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

---

**Expected Result**:
- ✅ Live website at: https://alliancesoft.web.app
- ✅ Code repository at: https://github.com/schundi365/Ecommerce
- ✅ Professional Alliance Soft Tech website deployed!
