# ChefSync Setup Guide - Cross-Device Compatibility

This guide helps you set up ChefSync on a new device after pulling from the repository.

## Prerequisites

- **Node.js**: v18.x or higher
- **Python**: 3.9 or higher
- **Git**: Latest version

## Step-by-Step Setup

### 1. Clone or Pull the Repository

```bash
# If cloning fresh
git clone <repository-url>
cd ChefSync

# If pulling updates
git pull origin Dev
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (if not exists)
python -m venv venv

# Activate virtual environment
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Windows (CMD)
.\venv\Scripts\activate.bat

# Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start backend server
python manage.py runserver
```

### 3. Frontend Setup

```bash
# Open a new terminal
cd frontend

# Remove old dependencies (important for cross-device compatibility)
rm -rf node_modules
rm package-lock.json  # or rm bun.lockb if using bun

# Install dependencies fresh
npm install
# or if using bun:
# bun install

# Create environment file
# Copy the content from ENV_SETUP.md or create .env file
echo "VITE_API_BASE_URL=/api" > .env

# Start frontend development server
npm run dev
# or: bun run dev
```

### 4. Clear Browser Cache

After setup, clear your browser cache or use incognito mode to avoid cached data issues.

## Common Issues & Solutions

### Issue 1: "Module not found" errors

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: Backend database errors

**Solution:**
```bash
cd backend
python manage.py migrate --run-syncdb
```

### Issue 3: Port already in use

**Solution:**
```bash
# Frontend (port 8080)
# Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:8080 | xargs kill -9

# Backend (port 8000)
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:8000 | xargs kill -9
```

### Issue 4: Permission errors on Windows

**Solution:**
Run PowerShell or CMD as Administrator, then:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 5: API connection errors

**Solution:**
1. Ensure backend is running on `http://localhost:8000`
2. Check `.env` file has `VITE_API_BASE_URL=/api`
3. Clear browser cache
4. Restart both frontend and backend servers

### Issue 6: Dashboard pages not loading

**Solution:**
```bash
# Clear application cache
cd frontend
rm -rf dist
rm -rf node_modules/.vite

# Rebuild
npm run build
npm run dev
```

## Device-Specific Notes

### Windows
- Use PowerShell (not CMD) for better compatibility
- May need to run as Administrator for some operations
- Path separators are `\` instead of `/`

### Mac/Linux
- Use bash or zsh terminal
- May need `sudo` for global npm packages
- Path separators are `/`

### Network Configuration

If working on different networks:
1. Backend API URL may need to be updated
2. Check firewall settings
3. Ensure ports 8000 and 8080 are not blocked

## Verification Steps

After setup, verify everything works:

1. **Backend**: Visit `http://localhost:8000/admin` - should see Django admin
2. **Frontend**: Visit `http://localhost:8080` - should see homepage
3. **API Connection**: Check browser console - no 404 or CORS errors
4. **Login**: Try logging in - should redirect to appropriate dashboard

## Development Workflow

### Starting Fresh Each Day

```bash
# Terminal 1 - Backend
cd backend
.\venv\Scripts\Activate.ps1  # Windows
# or: source venv/bin/activate  # Mac/Linux
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Syncing with Team

```bash
# Pull latest changes
git pull origin Dev

# Update backend dependencies
cd backend
pip install -r requirements.txt
python manage.py migrate

# Update frontend dependencies
cd frontend
npm install

# Restart both servers
```

## Troubleshooting Commands

```bash
# Check Node version
node --version

# Check Python version
python --version

# Check npm version
npm --version

# Check if ports are in use
netstat -ano | findstr :8000
netstat -ano | findstr :8080

# Check git branch
git branch

# Check git status
git status
```

## Need Help?

If you're still experiencing issues:
1. Check the error message in the terminal
2. Check the browser console (F12)
3. Check the Network tab for failed API calls
4. Compare your setup with ENV_SETUP.md
5. Try the "nuclear option" below

### Nuclear Option (Complete Reset)

```bash
# Backend
cd backend
rm -rf venv
rm db.sqlite3
python -m venv venv
# Activate venv
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser

# Frontend
cd frontend
rm -rf node_modules dist package-lock.json
npm install
npm run dev
```

