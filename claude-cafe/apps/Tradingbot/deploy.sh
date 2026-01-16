#!/bin/bash

# Deployment script for Multi-Asset Trading Platform
# Usage: ./deploy.sh [backend|frontend|both]

set -e  # Exit on error

DEPLOY_TYPE=${1:-both}

echo "🚀 Multi-Asset Trading Platform Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to deploy backend to Heroku
deploy_backend() {
    echo -e "${YELLOW}📦 Deploying Backend to Heroku...${NC}"
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        echo -e "${RED}❌ Heroku CLI not found. Please install it first.${NC}"
        echo "Visit: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # Check if Heroku remote exists
    if ! git remote | grep -q heroku; then
        echo -e "${RED}❌ Heroku remote not configured.${NC}"
        echo "Run: heroku git:remote -a your-app-name"
        exit 1
    fi
    
    echo "Pushing to Heroku..."
    git push heroku awsmovielens:main || git push heroku main
    
    echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
    echo "View logs: heroku logs --tail"
    echo "Open app: heroku open"
}

# Function to deploy frontend to GitHub Pages
deploy_frontend() {
    echo -e "${YELLOW}🌐 Deploying Frontend to GitHub Pages...${NC}"
    
    # Check if gh-pages is installed
    cd client
    if ! npm list gh-pages &> /dev/null; then
        echo "Installing gh-pages..."
        npm install --save-dev gh-pages
    fi
    
    echo "Building production version..."
    npm run build
    
    echo "Deploying to GitHub Pages..."
    npm run deploy
    
    cd ..
    
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
    echo "Your site will be available at:"
    echo "https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME"
}

# Main deployment logic
case $DEPLOY_TYPE in
    backend)
        deploy_backend
        ;;
    frontend)
        deploy_frontend
        ;;
    both)
        deploy_backend
        echo ""
        deploy_frontend
        ;;
    *)
        echo -e "${RED}❌ Invalid deployment type: $DEPLOY_TYPE${NC}"
        echo "Usage: ./deploy.sh [backend|frontend|both]"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Visit your GitHub Pages URL to test the frontend"
echo "2. Check Heroku logs: heroku logs --tail"
echo "3. Verify API connectivity in browser console"
