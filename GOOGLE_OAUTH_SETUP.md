# Google OAuth Setup Guide for ChefSync

## The Problem
You're getting a "400 Bad Request" error from Google because the OAuth client ID is not properly configured.

## Solution Steps

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:5173`
     - `http://localhost:8080`
     - `http://127.0.0.1:3000`
     - `http://127.0.0.1:5173`
     - `http://127.0.0.1:8080`
   - Add authorized redirect URIs:
     - `http://localhost:3000`
     - `http://localhost:5173`
     - `http://localhost:8080`
     - `http://127.0.0.1:3000`
     - `http://127.0.0.1:5173`
     - `http://127.0.0.1:8080`

### 2. Update Environment Files

#### Backend (.env)
```env
GOOGLE_OAUTH_CLIENT_ID=your-actual-client-id-here.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-actual-client-secret-here
```

#### Frontend (.env.local)
```env
VITE_GOOGLE_OAUTH_CLIENT_ID=your-actual-client-id-here.apps.googleusercontent.com
```

### 3. Test the Configuration

After updating the environment files:
1. Restart the Django server
2. Restart the frontend development server
3. Try Google authentication again

## Alternative: Disable Google OAuth Temporarily

If you want to test without Google OAuth, you can temporarily disable it by commenting out the GoogleOAuthProvider in App.tsx.
