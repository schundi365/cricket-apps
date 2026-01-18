# Alliance Soft Tech - Deployment Script (PowerShell)
# This script automates the deployment process to Firebase and GitHub

Write-Host "🚀 Alliance Soft Tech - Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
try {
    $firebaseVersion = firebase --version
    Write-Host "✓ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI is not installed" -ForegroundColor Red
    Write-Host "Install it with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Step 1: Checking Firebase login status..." -ForegroundColor Blue
firebase login:list

Write-Host ""
Write-Host "📦 Step 2: Preparing files..." -ForegroundColor Blue
# Ensure index.html is in public directory
if (Test-Path "index.html") {
    if (-not (Test-Path "public")) {
        New-Item -ItemType Directory -Path "public" | Out-Null
    }
    Copy-Item "index.html" "public/index.html" -Force
    Write-Host "✓ Files prepared" -ForegroundColor Green
} else {
    Write-Host "✓ Using existing public directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔥 Step 3: Deploying to Firebase Hosting..." -ForegroundColor Blue
firebase deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Successfully deployed to Firebase!" -ForegroundColor Green
    Write-Host "🌐 Your site is live at: https://astfinances.web.app" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Step 4: Git operations..." -ForegroundColor Blue

# Get commit message from parameter or use default
$commitMsg = if ($args.Count -gt 0) { $args[0] } else { "Update: Alliance Soft Tech website deployment $(Get-Date -Format 'yyyy-MM-dd')" }

Write-Host "Adding files to git..." -ForegroundColor Gray
git add .

Write-Host "Committing changes..." -ForegroundColor Gray
git commit -m $commitMsg

Write-Host "Pushing to GitHub..." -ForegroundColor Gray
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Git push encountered an issue. You may need to pull first or resolve conflicts." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "🌐 Live site: https://astfinances.web.app" -ForegroundColor Cyan
Write-Host "📦 GitHub: https://github.com/schundi365/Ecommerce" -ForegroundColor Cyan
Write-Host ""
