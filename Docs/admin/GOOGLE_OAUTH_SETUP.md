# Google OAuth Setup Guide

## Issue: Google Sign-In 403 Error

**Error:** `Google Sign-In iframe failed to load with 403 error. The origin is not authorized for the given client ID.`

## Solution: Configure Google Cloud Console

### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**

### Step 2: Configure OAuth 2.0 Client ID
1. Find your OAuth 2.0 Client ID or create a new one
2. Click on the client ID to edit it
3. In the **Authorized JavaScript origins** section, add:
   ```
   http://localhost:8081
   http://127.0.0.1:8081
   ```

### Step 3: Add Production Origins (when deploying)
When deploying to production, also add:
```
https://yourdomain.com
https://www.yourdomain.com
```

### Step 4: Environment Configuration
Create a `.env` file in the `frontend/` directory:

```env
# Google OAuth Configuration
VITE_GOOGLE_OAUTH_CLIENT_ID=your-actual-client-id-here

# API Configuration
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_API_URL=http://127.0.0.1:8000/api
```

### Step 5: Verify Configuration
1. Restart your development server
2. Test Google Sign-In functionality
3. Check browser console for any remaining errors

## Common Issues

### Issue 1: Client ID Not Set
**Error:** `VITE_GOOGLE_OAUTH_CLIENT_ID is not defined`
**Solution:** Ensure the environment variable is properly set in your `.env` file

### Issue 2: Wrong Origin
**Error:** `403 Forbidden - Origin not authorized`
**Solution:** Double-check that `http://localhost:8081` is added to authorized origins

### Issue 3: HTTPS Required
**Error:** `Mixed content` or security warnings
**Solution:** For production, ensure you're using HTTPS and add the HTTPS origin

## Testing Checklist

- [ ] Google OAuth Client ID is configured
- [ ] `http://localhost:8081` is in authorized origins
- [ ] Environment variables are set correctly
- [ ] Development server is restarted
- [ ] Google Sign-In button loads without errors
- [ ] OAuth flow completes successfully

## Security Notes

- Never commit your actual client ID to version control
- Use `.env.example` for template files
- Rotate client IDs periodically
- Monitor OAuth usage in Google Cloud Console
