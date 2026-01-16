@echo off
REM Deployment script for Multi-Asset Trading Platform (Windows)
REM Usage: deploy.bat [backend|frontend|both]

setlocal enabledelayedexpansion

set DEPLOY_TYPE=%1
if "%DEPLOY_TYPE%"=="" set DEPLOY_TYPE=both

echo.
echo ========================================
echo Multi-Asset Trading Platform Deployment
echo ========================================
echo.

if "%DEPLOY_TYPE%"=="backend" goto deploy_backend
if "%DEPLOY_TYPE%"=="frontend" goto deploy_frontend
if "%DEPLOY_TYPE%"=="both" goto deploy_both

echo Invalid deployment type: %DEPLOY_TYPE%
echo Usage: deploy.bat [backend^|frontend^|both]
exit /b 1

:deploy_backend
echo [BACKEND] Deploying to Heroku...
echo.

REM Check if Heroku CLI is installed
where heroku >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Heroku CLI not found. Please install it first.
    echo Visit: https://devcenter.heroku.com/articles/heroku-cli
    exit /b 1
)

REM Check if Heroku remote exists
git remote | findstr /C:"heroku" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Heroku remote not configured.
    echo Run: heroku git:remote -a your-app-name
    exit /b 1
)

echo Pushing to Heroku...
git push heroku awsmovielens:main
if %ERRORLEVEL% NEQ 0 (
    git push heroku main
)

echo.
echo [SUCCESS] Backend deployed successfully!
echo View logs: heroku logs --tail
echo Open app: heroku open
echo.

if "%DEPLOY_TYPE%"=="backend" goto end
goto deploy_frontend

:deploy_frontend
echo [FRONTEND] Deploying to GitHub Pages...
echo.

cd client

REM Check if gh-pages is installed
npm list gh-pages >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing gh-pages...
    call npm install --save-dev gh-pages
)

echo Building production version...
call npm run build

echo Deploying to GitHub Pages...
call npm run deploy

cd ..

echo.
echo [SUCCESS] Frontend deployed successfully!
echo Your site will be available at:
echo https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME
echo.

goto end

:deploy_both
call :deploy_backend
call :deploy_frontend
goto end

:end
echo.
echo ========================================
echo Deployment complete!
echo ========================================
echo.
echo Next steps:
echo 1. Visit your GitHub Pages URL to test the frontend
echo 2. Check Heroku logs: heroku logs --tail
echo 3. Verify API connectivity in browser console
echo.

endlocal
