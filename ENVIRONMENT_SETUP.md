# Environment Variables Setup

## Frontend Environment Variables

Create a `.env` file in the `frontend/` directory with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api

# Google Maps API Configuration (REQUIRED for address features)
# Get your API key from: https://console.cloud.google.com/google/maps-apis
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Optional: Analytics
VITE_ANALYTICS_ID=

# Optional: Cloudinary (for image uploads)
VITE_CLOUDINARY_CLOUD_NAME=
```

## How to Get Google Maps API Key

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Maps JavaScript API
   - Places API  
   - Geocoding API
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key and paste it into `.env`

## Security Best Practices

**Restrict your API key:**
1. Application restrictions: HTTP referrers
2. Add your domains:
   - `localhost:5173/*` (development)
   - `yourdomain.com/*` (production)
3. API restrictions: Select only the 3 required APIs

## Backend Environment Variables

The backend uses Django settings. Ensure your `backend/config/settings.py` has:

```python
# Already configured - no changes needed
INSTALLED_APPS = [
    ...
    'apps.users',
    'apps.orders',
    ...
]
```

## Verification

To verify your setup:

1. Start the backend:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open browser to `http://localhost:5173`
4. Go to Checkout page
5. Click "Add Delivery Address"
6. Map should load within 2-3 seconds

If map doesn't load:
- Check browser console for errors
- Verify `.env` file exists in `frontend/` directory
- Ensure API key is copied correctly (no extra spaces)
- Restart the development server

## Common Issues

| Issue | Solution |
|-------|----------|
| Map shows "Loading..." forever | Check Google Maps API key in `.env` |
| "API key not found" error | Restart dev server after creating `.env` |
| "This page can't load Google Maps correctly" | Enable required APIs in Google Cloud Console |
| Location permission denied | Allow location access in browser settings |

## Next Steps

Once setup is complete, refer to `ADDRESS_SETUP_GUIDE.md` for:
- How to use the address system
- API documentation
- Troubleshooting guide
- Best practices

