@echo off
echo ========================================
echo   ChefSync Backend Startup Script
echo ========================================
echo.

cd backend

echo Activating virtual environment...
call venv\Scripts\activate.bat

if errorlevel 1 (
    echo ERROR: Could not activate virtual environment
    echo Creating new virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo Installing dependencies...
    pip install -r requirements.txt
    echo Running migrations...
    python manage.py migrate
)

echo.
echo Starting Django development server...
echo Backend will be available at: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
python manage.py runserver

pause

