@echo off
echo ========================================
echo   ChefSync Frontend Startup Script
echo ========================================
echo.

cd frontend

echo Checking for node_modules...
if not exist node_modules (
    echo node_modules not found. Installing dependencies...
    npm install
)

echo Checking for .env file...
if not exist .env (
    echo Creating .env file...
    echo VITE_API_BASE_URL=/api > .env
    echo VITE_GOOGLE_OAUTH_CLIENT_ID= >> .env
    echo VITE_GOOGLE_MAPS_API_KEY= >> .env
    echo VITE_NODE_ENV=development >> .env
    echo .env file created!
)

echo.
echo Running setup check...
npm run check-setup

echo.
echo Starting Vite development server...
echo Frontend will be available at: http://localhost:8080
echo Press Ctrl+C to stop the server
echo.
npm run dev

pause

