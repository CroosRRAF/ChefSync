# ChefSync Environment Setup Guide

This guide will help you set up the environment variables for the ChefSync project.

## Quick Start

1. **Backend Setup:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   cp env.example .env
   # Edit .env with your configuration
   ```

## Environment Files Created

- `env.example` - Backend environment variables template
- `frontend/env.example` - Frontend environment variables template

## Required Services Setup

### 1. Database (MySQL)

**Install MySQL:**
- Windows: Download from https://dev.mysql.com/downloads/mysql/
- macOS: `brew install mysql`
- Linux: `sudo apt-get install mysql-server`

**Create Database:**
```sql
CREATE DATABASE chefsync_db;
CREATE USER 'chefsync_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON chefsync_db.* TO 'chefsync_user'@'localhost';
FLUSH PRIVILEGES;
```

**Update .env:**
```env
DB_NAME=chefsync_db
DB_USER=chefsync_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
```

### 2. Google OAuth (User Authentication)

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:8081` (development)
   - `https://yourdomain.com` (production)

**Update .env files:**
```env
# Backend .env
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret

# Frontend .env
VITE_GOOGLE_OAUTH_CLIENT_ID=your-client-id
```

### 3. Google Maps API (Location Services)

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
3. Create API key
4. Restrict API key to your domains

**Update Frontend .env:**
```env
VITE_GOOGLE_MAPS_API_KEY=your-maps-api-key
```

### 4. Google Gemini AI (Admin Features)

**Setup Steps:**
1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Create API key
3. Enable Gemini API

**Update Backend .env:**
```env
GOOGLE_AI_API_KEY=your-gemini-api-key
```

### 5. Email Service (Brevo)

**Setup Steps:**
1. Sign up at [Brevo](https://www.brevo.com/)
2. Go to SMTP & API settings
3. Generate SMTP password

**Update Backend .env:**
```env
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_HOST_PASSWORD=your-smtp-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### 6. Cloudinary (File Storage) - Optional

**Setup Steps:**
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get API credentials from dashboard

**Update Backend .env:**
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Development vs Production

### Development Configuration

**Backend .env:**
```env
DEBUG=True
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
SECURE_SSL_REDIRECT=False
```

**Frontend .env:**
```env
VITE_API_BASE_URL=/api
```

### Production Configuration

**Backend .env:**
```env
DEBUG=False
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
SECURE_SSL_REDIRECT=True
SECRET_KEY=your-strong-secret-key
```

**Frontend .env:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Security Notes

1. **Never commit .env files to version control**
2. **Use strong, unique SECRET_KEY in production**
3. **Restrict API keys to specific domains/IPs**
4. **Use HTTPS in production**
5. **Set proper ALLOWED_HOSTS for production**

## Troubleshooting

### Common Issues

1. **Database Connection Error:**
   - Check MySQL is running
   - Verify credentials in .env
   - Ensure database exists

2. **Google OAuth Not Working:**
   - Check redirect URIs match exactly
   - Verify client ID/secret
   - Check CORS settings

3. **Maps Not Loading:**
   - Verify API key is correct
   - Check API restrictions
   - Ensure required APIs are enabled

4. **Email Not Sending:**
   - Check SMTP credentials
   - Verify email backend setting
   - Check firewall/network settings

### Getting Help

If you encounter issues:
1. Check the console logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure all required services are properly configured
4. Check the project documentation for additional setup steps

## Next Steps

After setting up the environment:
1. Run database migrations: `python manage.py migrate`
2. Create superuser: `python manage.py createsuperuser`
3. Start backend: `python manage.py runserver`
4. Start frontend: `npm run dev`
5. Access the application at `http://localhost:8081`
