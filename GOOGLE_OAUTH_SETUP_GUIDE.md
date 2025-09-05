# Google OAuth Setup Guide for ChefSync

## Step 1: Create Google OAuth Client

### A. Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable the Google+ API or Google Identity Services

### B. Create OAuth 2.0 Client ID
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Choose **Web application**
4. Name it: `ChefSync Web Client`

### C. Configure Authorized URLs

#### Authorized JavaScript Origins
Add these URLs (one per line):
```
http://localhost:8081
http://127.0.0.1:8081
http://localhost:5173
http://127.0.0.1:5173
http://localhost:3000
http://127.0.0.1:3000
```

#### Authorized Redirect URIs
Add these URLs (one per line):
```
http://localhost:8081
http://localhost:8081/auth/callback
http://127.0.0.1:8081
http://127.0.0.1:8081/auth/callback
http://localhost:5173
http://localhost:5173/auth/callback
http://127.0.0.1:5173
http://127.0.0.1:5173/auth/callback
```

## Step 2: Get Your Credentials

After creating the OAuth client, you'll get:
- **Client ID**: Something like `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`
- **Client Secret**: Something like `GOCSPX-abcdefghijklmnopqrstuvwxyz123456`

## Step 3: Update Configuration Files

### Frontend Configuration (`frontend/.env.local`)
```bash
# Frontend Environment Variables
VITE_API_BASE_URL=http://127.0.0.1:8000

# Google OAuth Configuration
VITE_GOOGLE_OAUTH_CLIENT_ID=YOUR_CLIENT_ID_HERE
```

### Backend Configuration (`backend/.env`)
```bash
# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_OAUTH_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
```

**Important**: Replace `YOUR_CLIENT_ID_HERE` and `YOUR_CLIENT_SECRET_HERE` with your actual credentials from Step 2.

## Step 4: Restart Servers

After updating the configuration files:

```bash
# Stop current servers (Ctrl+C)

# Restart backend
cd backend
python manage.py runserver

# Restart frontend (in new terminal)
cd frontend
npm run dev
```

## Step 5: Test Configuration

1. Go to: http://localhost:8081/auth/login
2. The Google OAuth button should appear (not "Google OAuth not configured")
3. Click the Google button to test authentication

## Troubleshooting

### If Google OAuth button still shows "not configured":
1. Check that Client ID is correctly copied (no extra spaces/line breaks)
2. Restart both frontend and backend servers
3. Clear browser cache (Ctrl+Shift+R)
4. Check browser console for errors

### If you get "redirect_uri_mismatch" error:
1. Verify the Authorized Redirect URIs in Google Cloud Console
2. Make sure the current URL matches one of the authorized URIs
3. Add the exact URL that shows in the error message

### If authentication fails:
1. Check that both frontend and backend have the same Client ID
2. Verify Client Secret is correct in backend/.env
3. Check that Google+ API or Google Identity Services is enabled

## Security Notes

- Never commit real credentials to version control
- Use different credentials for production vs development
- Keep Client Secret secure (backend only)
- Client ID can be public (frontend), but still keep it in env files

## Current Configuration Status

✅ **Environment files prepared** with placeholder values  
⏳ **Waiting for your new Google OAuth credentials**  
⏳ **Need to update configuration files with real values**  
⏳ **Need to restart servers after configuration**
