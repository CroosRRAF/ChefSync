# 🍽️ ChefSync - Complete Setup Guide

This guide will help you set up the ChefSync food delivery platform with full authentication, Google OAuth, and email verification.

## 🚀 **Prerequisites**

- Python 3.8+ installed
- Node.js 16+ and npm installed
- MySQL 8.0+ installed and running
- Google OAuth credentials (optional but recommended)

## 📋 **Backend Setup (Django)**

### 1. **Navigate to Backend Directory**
```bash
cd backend
```

### 2. **Create Virtual Environment**
```bash
python -m venv venv
```

### 3. **Activate Virtual Environment**
**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 4. **Install Dependencies**
```bash
pip install -r requirements.txt
```

### 5. **Environment Configuration**
Copy the example environment file:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_NAME=chefsync_db
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_HOST=localhost
DB_PORT=3306

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google OAuth Configuration (optional)
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Email Configuration (for development)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USE_TLS=False
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=noreply@chefsync.com
```

### 6. **Database Setup**
Create MySQL database:
```sql
CREATE DATABASE chefsync_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 7. **Run Migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

### 8. **Create Superuser**
```bash
python manage.py createsuperuser
```

### 9. **Start Backend Server**
```bash
python manage.py runserver
```

**Backend will run on:** http://127.0.0.1:8000

## 🌐 **Frontend Setup (React)**

### 1. **Navigate to Frontend Directory**
```bash
cd frontend
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Start Development Server**
```bash
npm run dev
```

**Frontend will run on:** http://localhost:5173

## 🔐 **Authentication Features**

### **User Registration**
- **Endpoint:** `POST /api/auth/register/`
- **Features:**
  - Email verification required
  - Role-based registration (Customer, Cook, Delivery Agent)
  - Password validation
  - Profile creation

### **User Login**
- **Endpoint:** `POST /api/auth/login/`
- **Features:**
  - JWT token authentication
  - Email verification check
  - Account locking protection
  - Failed login attempt tracking

### **Email Verification**
- **Endpoint:** `POST /api/auth/verify-email/`
- **Features:**
  - Token-based verification
  - 24-hour expiration
  - Automatic profile creation

### **Password Reset**
- **Endpoint:** `POST /api/auth/password/reset/`
- **Features:**
  - Email-based reset
  - Token generation
  - Secure password update

### **Google OAuth**
- **Endpoint:** `POST /api/auth/google/login/`
- **Features:**
  - Google ID token verification
  - Automatic user creation
  - Profile setup

## 🗄️ **Database Models**

### **User Model**
- Custom user with email as username
- Role-based system (customer, cook, delivery_agent)
- Email verification fields
- Security and locking mechanisms

### **Profile Models**
- **Customer:** Basic customer profile
- **Cook:** Chef profile with specialties and kitchen location
- **DeliveryAgent:** Delivery personnel profile with vehicle info

## 🔧 **API Endpoints**

### **Authentication**
```
POST /api/auth/register/          - User registration
POST /api/auth/login/             - User login
POST /api/auth/logout/            - User logout
POST /api/auth/token/refresh/     - Refresh JWT token
POST /api/auth/verify-email/      - Verify email address
```

### **Password Management**
```
POST /api/auth/password/reset/           - Request password reset
POST /api/auth/password/reset/confirm/   - Confirm password reset
POST /api/auth/password/change/          - Change password
```

### **User Profile**
```
GET  /api/auth/profile/                  - Get user profile
PUT  /api/auth/profile/update/           - Update user profile
POST /api/auth/customer/create/          - Create customer profile
POST /api/auth/cook/create/              - Create cook profile
POST /api/auth/delivery-agent/create/    - Create delivery agent profile
```

### **Google OAuth**
```
POST /api/auth/google/login/             - Google OAuth login
```

## 🧪 **Testing the System**

### 1. **Start Both Servers**
- Backend: http://127.0.0.1:8000
- Frontend: http://localhost:5173

### 2. **Test Registration**
- Go to http://localhost:5173/auth/register
- Create a new account
- Check console for verification email (development mode)

### 3. **Test Email Verification**
- Click verification link in console
- Should redirect to verification success page

### 4. **Test Login**
- Go to http://localhost:5173/auth/login
- Login with verified credentials
- Should receive JWT tokens

### 5. **Test Password Reset**
- Go to http://localhost:5173/auth/forgot-password
- Request password reset
- Check console for reset email

## 🔒 **Security Features**

- **JWT Authentication:** Secure token-based auth
- **Email Verification:** Mandatory before login
- **Password Validation:** Strong password requirements
- **Account Locking:** Protection against brute force
- **CORS Protection:** Cross-origin request security
- **Input Validation:** Comprehensive form validation
- **Rate Limiting:** Protection against abuse

## 🚀 **Production Deployment**

### **Backend**
1. Set `DEBUG=False` in production
2. Use strong `SECRET_KEY`
3. Configure production database
4. Set up email service (SMTP)
5. Configure Google OAuth credentials
6. Use HTTPS

### **Frontend**
1. Build production bundle: `npm run build`
2. Deploy to web server (nginx, Apache)
3. Configure environment variables
4. Set up HTTPS

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Database Connection Error**
   - Check MySQL service is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **Migration Errors**
   - Delete migrations folder and recreate
   - Check database schema compatibility

3. **CORS Issues**
   - Verify `CORS_ALLOWED_ORIGINS` in `.env`
   - Check frontend URL matches backend config

4. **Email Not Sending**
   - Check email configuration in `.env`
   - Verify `FRONTEND_URL` is correct
   - Check console for email output (development mode)

### **Development Tips**

- Use Django console backend for email testing
- Check browser console for API errors
- Verify JWT tokens in localStorage
- Use Django admin for user management

## 📚 **Additional Resources**

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [JWT Authentication](https://django-rest-framework-simplejwt.readthedocs.io/)

## 🤝 **Support**

If you encounter issues:
1. Check the troubleshooting section
2. Verify all configuration steps
3. Check console logs for errors
4. Ensure all dependencies are installed

---

**🎉 Happy Coding with ChefSync! 🎉**
