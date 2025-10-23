# ChefSync Quick Start Guide

## For New Devices (After Pulling Code)

### ⚡ Quick Setup (5 minutes)

#### Step 1: Backend

```bash
cd backend

# Windows PowerShell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Mac/Linux
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Step 2: Frontend (New Terminal)

```bash
cd frontend

# Clean install (recommended for new devices)
npm run reset

# Or manual:
rm -rf node_modules package-lock.json
npm install

# Create environment file
echo "VITE_API_BASE_URL=/api" > .env

# Run setup check
npm run check-setup

# Start dev server
npm run dev
```

### ✅ Verify Setup

1. Backend: http://localhost:8000/admin (should load Django admin)
2. Frontend: http://localhost:8080 (should load homepage)
3. Login and test dashboard navigation

---

## Common Errors & Quick Fixes

### ❌ Error: "Module not found" or Import errors

**Fix:**
```bash
cd frontend
npm run reset  # This cleans and reinstalls everything
```

### ❌ Error: Backend API not responding

**Fix:**
```bash
cd backend
python manage.py runserver  # Ensure it's running on port 8000
```

### ❌ Error: Dashboard pages blank/white screen

**Fix:**
1. Open browser DevTools (F12)
2. Go to Application → Clear Storage → Clear site data
3. Refresh page (Ctrl+F5)

### ❌ Error: "Port 8080 already in use"

**Windows:**
```powershell
netstat -ano | findstr :8080
taskkill /PID <number> /F
```

**Mac/Linux:**
```bash
lsof -ti:8080 | xargs kill -9
```

### ❌ Error: Permission denied (Windows)

**Fix:**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Environment Configuration

### Create `.env` file in `frontend` directory:

```env
VITE_API_BASE_URL=/api
VITE_GOOGLE_OAUTH_CLIENT_ID=
VITE_GOOGLE_MAPS_API_KEY=
VITE_NODE_ENV=development
```

---

## Development Workflow

### Daily Startup:

```bash
# Terminal 1 - Backend
cd backend && .\venv\Scripts\Activate.ps1 && python manage.py runserver

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

### After Git Pull:

```bash
# Update backend
cd backend
pip install -r requirements.txt
python manage.py migrate

# Update frontend
cd frontend
npm install  # or npm run reset if issues persist
```

---

## Available npm Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check-setup  # Verify environment setup
npm run clean        # Remove node_modules and cache
npm run reset        # Clean and reinstall everything
```

---

## Browser Recommendations

- **Best**: Chrome, Edge (Chromium), Firefox
- **Clear cache**: Ctrl+Shift+Delete or use Incognito mode
- **DevTools**: F12 (check Console and Network tabs for errors)

---

## Need More Help?

1. Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions
2. Read [ENV_SETUP.md](./frontend/ENV_SETUP.md) for environment variables
3. Check browser console (F12) for error messages
4. Check terminal output for backend errors

---

## System Requirements

- **Node.js**: v18 or higher
- **Python**: 3.9 or higher  
- **npm**: 9 or higher (comes with Node.js)
- **Git**: Latest version

Check versions:
```bash
node --version
python --version
npm --version
git --version
```

---

## Success Indicators

✅ Backend running on http://localhost:8000
✅ Frontend running on http://localhost:8080  
✅ No errors in browser console
✅ Can login successfully
✅ Dashboards load correctly

---

## Still Having Issues?

Try the "Nuclear Option":

```bash
# Frontend
cd frontend
rm -rf node_modules dist .vite package-lock.json .env
echo "VITE_API_BASE_URL=/api" > .env
npm install
npm run dev

# Backend
cd backend
rm -rf venv db.sqlite3
python -m venv venv
# Activate venv
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

This completely resets both frontend and backend.

