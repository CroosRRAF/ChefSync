@echo off
REM ChefSync Backend Setup Script (No venv required)
cd backend

REM Upgrade pip and install dependencies globally
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt

REM Run migrations
python manage.py makemigrations
python manage.py migrate


REM Start backend server
start "ChefSync Backend" cmd /k "python manage.py runserver"
cd ../frontend
start "ChefSync Frontend" cmd /k "npm run dev"
