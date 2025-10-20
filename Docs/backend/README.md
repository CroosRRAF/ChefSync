# 🏗️ ChefSync Backend

Django REST API backend for the ChefSync food delivery platform.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- MySQL 8.0+
- Git

### Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   # Django Settings
   SECRET_KEY=your-super-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1

   # Database Configuration
   DB_NAME=chefsync_db
   DB_USER=root
   DB_PASSWORD=your-password
   DB_HOST=localhost
   DB_PORT=3306

   # Email Configuration (Brevo SMTP)
   EMAIL_HOST_USER=your-email@domain.com
   EMAIL_HOST_PASSWORD=your-smtp-password
   DEFAULT_FROM_EMAIL=noreply@chefsync.com

   # Google OAuth Configuration
   GOOGLE_OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # CORS Configuration
   CORS_ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
   ```

5. **Setup database**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Run development server**
   ```bash
   python manage.py runserver
   ```

   Server will run on: http://127.0.0.1:8000

## 📁 Project Structure

```
backend/
├── apps/                    # Django Apps
│   ├── authentication/     # User auth, JWT, email verification
│   ├── users/              # User profiles and management
│   ├── food/               # Food items and menus
│   ├── orders/             # Order processing
│   ├── payments/           # Payment handling
│   ├── analytics/          # Analytics and reporting
│   ├── communications/     # Notifications and messaging
│   └── admin_management/   # Admin panel extensions
├── config/                 # Django settings and configuration
├── scripts/                # Utility scripts
├── templates/emails/       # Email templates
├── manage.py              # Django management script
├── requirements.txt       # Python dependencies
└── env.example           # Environment template
```

## 🔧 Key Features

### Authentication & Security
- JWT token-based authentication
- Google OAuth integration
- Email verification with OTP
- Role-based access control
- Secure password hashing
- Token blacklisting and refresh

### Document Management
- PDF processing with Poppler
- Cloudinary file storage
- Document type validation
- Secure file access

### Admin System
- User approval workflows
- Document review system
- Analytics dashboard
- System configuration

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/token/refresh/` - Token refresh
- `POST /api/auth/send-otp/` - Send OTP
- `POST /api/auth/verify-otp/` - Verify OTP

### Document Management
- `GET /api/auth/documents/types/` - Get document types
- `POST /api/auth/documents/upload/` - Upload documents
- `GET /api/auth/documents/` - Get user documents
- `DELETE /api/auth/documents/{id}/delete/` - Delete document

### Admin Management
- `GET /api/auth/admin/pending-approvals/` - Get pending approvals
- `POST /api/auth/admin/user/{id}/approve/` - Approve/reject user

## 🗄️ Database Models

### Core Models
- **User**: Extended Django user with roles and approval status
- **JWTToken**: Token management and blacklisting
- **EmailOTP**: OTP verification system
- **UserDocument**: Document upload and management
- **DocumentType**: Document type definitions

## 🛠️ Development

### Running Tests
```bash
python manage.py test
```

### Creating Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Management Commands
```bash
# Clear admin mock data
python manage.py clear_admin_mock_data

# Populate dummy data
python manage.py populate_dummy_data

# Check admin users
python manage.py check_admin_users
```

## 📚 Dependencies

### Core Dependencies
- Django 4.2+
- Django REST Framework
- MySQL Connector
- JWT
- Cloudinary
- Poppler (for PDF processing)

### Development Dependencies
- Django Debug Toolbar
- Pytest
- Black (code formatting)

## 🔧 Configuration

### Poppler Setup (for PDF processing)
1. Download Poppler for Windows from: https://github.com/oschwartz10612/poppler-windows/releases/
2. Extract to `C:\poppler\`
3. Add `C:\poppler\bin` to system PATH

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Configure authorized origins and redirect URIs
4. Add credentials to `.env` file

### Email Configuration
Uses Brevo (Sendinblue) SMTP service. Configure credentials in `.env`:
```env
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=your-smtp-password
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `DEBUG=False`
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure production email service
- [ ] Set up Google OAuth for production
- [ ] Configure Cloudinary for production
- [ ] Set up monitoring and logging

### Docker Deployment
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

## 🐛 Troubleshooting

### Common Issues
1. **Database Connection Error**: Check database credentials in `.env`
2. **CORS Error**: Verify `CORS_ALLOWED_ORIGINS` in settings
3. **Google OAuth Error**: Check client ID and authorized origins
4. **Email Not Sending**: Check SMTP configuration
5. **PDF Processing Error**: Ensure Poppler is installed and in PATH

## 📞 Support

For backend-related issues:
- Check Django logs in console
- Verify environment variables
- Test API endpoints with Postman
- Check database connectivity

---

**Backend API Server for ChefSync**