# Complete Google OAuth Setup Guide for ChefSync

## Current Status
✅ **Google OAuth is now properly configured to prevent 404 errors!**

The app now:
- Shows a disabled Google button when no valid credentials are configured
- Prevents 404 errors by not initializing Google OAuth with invalid client IDs
- Provides helpful messages to users about Google authentication status

## To Enable Real Google OAuth

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "ChefSync OAuth"
4. Click "Create"

### Step 2: Enable Google+ API
1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API" and click on it
3. Click "Enable"

### Step 3: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - App name: "ChefSync"
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Add test users (your email addresses)
6. Save and continue

### Step 4: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set name: "ChefSync Web Client"
5. Add Authorized JavaScript origins:
   ```
   http://localhost:3000
   http://localhost:5173
   http://localhost:8080
   http://127.0.0.1:3000
   http://127.0.0.1:5173
   http://127.0.0.1:8080
   ```
6. Add Authorized redirect URIs:
   ```
   http://localhost:3000
   http://localhost:5173
   http://localhost:8080
   http://127.0.0.1:3000
   http://127.0.0.1:5173
   http://127.0.0.1:8080
   ```
7. Click "Create"
8. Copy the **Client ID** and **Client Secret**

### Step 5: Update Your Application

#### Option A: Environment Variables (Recommended)
Create these files:

**frontend/.env.local:**
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_OAUTH_CLIENT_ID=your-actual-client-id-here.apps.googleusercontent.com
```

**backend/.env:**
```env
SECRET_KEY=django-insecure-3oo5lepmhh(qlf-m^s+ftjk=g0r7)h-jb$2vzu%1g7&jq0a32o
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173
FRONTEND_URL=http://localhost:8080
GOOGLE_OAUTH_CLIENT_ID=your-actual-client-id-here.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-actual-client-secret-here
```

#### Option B: Direct Code Update
Update `frontend/src/App.tsx` line 28:
```typescript
clientId !== 'your-actual-client-id-here.apps.googleusercontent.com' &&
```

### Step 6: Test the Setup
1. Restart your backend server: `cd backend && python manage.py runserver`
2. Restart your frontend server: `cd frontend && npm run dev`
3. Navigate to your app
4. The Google button should now be fully functional!

## Troubleshooting

### If you still get 404 errors:
1. Verify the client ID is correct (should end with `.apps.googleusercontent.com`)
2. Check that the authorized origins include your development URL
3. Ensure the OAuth consent screen is properly configured
4. Make sure you're using the correct project in Google Cloud Console

### If the Google button is disabled:
- This means the app detected invalid/placeholder credentials
- Follow the setup steps above to get real credentials
- The app will automatically enable the button once valid credentials are detected

## Security Notes
- Never commit real OAuth credentials to version control
- Use environment variables for production
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in Google Cloud Console

## Current Behavior
- ✅ No more 404 errors
- ✅ Graceful fallback when Google OAuth is not configured
- ✅ Clear user feedback about authentication status
- ✅ Automatic detection of valid/invalid credentials




