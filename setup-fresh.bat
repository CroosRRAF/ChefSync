@echo off
echo ========================================
echo   ChefSync Fresh Setup Script
echo   Use this on a new device or after
echo   pulling latest code
echo ========================================
echo.

echo This script will:
echo   1. Set up Python virtual environment
echo   2. Install backend dependencies
echo   3. Run database migrations
echo   4. Install frontend dependencies
echo   5. Create environment files
echo.
echo This may take several minutes...
echo.
pause

echo.
echo [1/5] Setting up Python virtual environment...
cd backend
if exist venv (
    echo Virtual environment already exists. Skipping...
) else (
    python -m venv venv
    echo Virtual environment created.
)

echo.
echo [2/5] Installing backend dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt

echo.
echo [3/5] Running database migrations...
python manage.py migrate

echo.
echo [4/5] Setting up frontend...
cd ..\frontend

echo Cleaning old installations...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f package-lock.json
if exist dist rmdir /s /q dist

echo Installing fresh dependencies...
npm install

echo.
echo [5/5] Creating environment files...
if not exist .env (
    echo VITE_API_BASE_URL=/api > .env
    echo VITE_GOOGLE_OAUTH_CLIENT_ID= >> .env
    echo VITE_GOOGLE_MAPS_API_KEY= >> .env
    echo VITE_NODE_ENV=development >> .env
    echo .env file created!
) else (
    echo .env file already exists. Skipping...
)

echo.
echo Running setup verification...
npm run check-setup

cd ..

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Open TWO terminal windows
echo   2. In Terminal 1, run: start-backend.bat
echo   3. In Terminal 2, run: start-frontend.bat
echo   4. Open browser: http://localhost:8080
echo.
echo Troubleshooting:
echo   - Read QUICK_START.md for common issues
echo   - Read SETUP_GUIDE.md for detailed help
echo.
pause

