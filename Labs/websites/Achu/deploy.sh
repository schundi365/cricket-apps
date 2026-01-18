#!/bin/bash

# Alliance Soft Tech - Deployment Script
# This script automates the deployment process to Firebase and GitHub

echo "🚀 Alliance Soft Tech - Deployment Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null
then
    echo -e "${RED}❌ Firebase CLI is not installed${NC}"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo -e "${BLUE}📋 Step 1: Checking Firebase login status...${NC}"
firebase login:list

echo ""
echo -e "${BLUE}📦 Step 2: Building project...${NC}"
# Add any build steps here if needed
echo -e "${GREEN}✓ Build complete${NC}"

echo ""
echo -e "${BLUE}🔥 Step 3: Deploying to Firebase Hosting...${NC}"
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully deployed to Firebase!${NC}"
    echo -e "${GREEN}🌐 Your site is live at: https://alliancesoft.web.app${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📝 Step 4: Git operations...${NC}"

# Check if git is initialized
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    git remote add origin https://github.com/schundi365/Ecommerce.git
fi

# Add commit message argument or use default
COMMIT_MSG="${1:-Update: Alliance Soft Tech website deployment $(date +%Y-%m-%d)}"

echo "Adding files to git..."
git add .

echo "Committing changes..."
git commit -m "$COMMIT_MSG"

echo "Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully pushed to GitHub!${NC}"
else
    echo -e "${RED}⚠️  Git push encountered an issue. You may need to pull first or resolve conflicts.${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo -e "🌐 Live site: https://alliancesoft.web.app"
echo -e "📦 GitHub: https://github.com/schundi365/Ecommerce"
echo -e "${NC}"
