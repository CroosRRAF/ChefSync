# 🍽️ ChefSync - Food Delivery Platform

A comprehensive food delivery platform with **JWT authentication**, **Google OAuth**, **email verification**, and **advanced security features**.

## 🚀 **Quick Start**

### **Backend (Django)**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
**Server runs on:** http://127.0.0.1:8000

### **Frontend (React)**
```bash
cd frontend
npm install
npm run dev
```
**App runs on:** http://localhost:5173

## 🔐 **Authentication Features**

- **JWT Tokens:** Secure access and refresh tokens with automatic refresh
- **Email Verification:** Mandatory email verification before login
- **Google OAuth:** Social login integration with automatic profile creation
- **Password Reset:** Secure password reset via email with token verification
- **Account Security:** Brute force protection and account locking
- **Role-Based System:** Customer, Cook, and Delivery Agent profiles

## 📱 **Frontend Components**

- **Login Form:** Email/password authentication with validation
- **Registration Form:** User account creation with role selection
- **Email Verification:** Token-based email verification flow
- **Forgot Password:** Email-based password reset
- **Password Reset:** Secure password update with token validation
- **Protected Routes:** Secure navigation system with JWT

## 🛡️ **Security Features**

- **JWT Authentication:** Stateless token-based auth with refresh
- **CORS Protection:** Cross-origin request security
- **Input Validation:** Comprehensive form validation with Zod
- **Rate Limiting:** Protection against abuse
- **Secure Headers:** Security headers implementation
- **Account Locking:** Protection against brute force attacks

## 🔧 **API Endpoints**

### **Authentication**
- `POST /api/auth/register/` - User registration with email verification
- `POST /api/auth/login/` - User login with JWT tokens
- `POST /api/auth/logout/` - User logout and token blacklisting
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `POST /api/auth/verify-email/` - Verify email address

### **Password Management**
- `POST /api/auth/password/reset/` - Request password reset
- `POST /api/auth/password/reset/confirm/` - Confirm password reset with token
- `POST /api/auth/password/change/` - Change password (authenticated)

### **User Profile**
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/update/` - Update user profile
- `POST /api/auth/customer/create/` - Create customer profile
- `POST /api/auth/cook/create/` - Create cook profile
- `POST /api/auth/delivery-agent/create/` - Create delivery agent profile

### **Google OAuth**
- `POST /api/auth/google/login/` - Google OAuth login with ID token

## 🗄️ **Database Models**

### **User Model**
- Custom user model with email as username
- Email verification fields with 24-hour expiration
- Security and locking mechanisms
- Role-based profile information

### **Profile Models**
- **Customer:** Basic customer profile for food ordering
- **Cook:** Chef profile with specialties, kitchen location, and experience
- **DeliveryAgent:** Delivery personnel profile with vehicle and location info

## 🎨 **Frontend Features**

- **Responsive Design:** Mobile-first approach with Tailwind CSS
- **Modern UI:** Clean and intuitive interface with shadcn/ui components
- **State Management:** React Context for auth state management
- **Route Protection:** Secure navigation system with JWT validation
- **Error Handling:** User-friendly error messages and validation
- **Form Validation:** Zod schema validation for all forms

## 🔧 **Technology Stack**

### **Backend**
- Django 5.2.5
- Django REST Framework
- JWT Authentication (Simple JWT)
- MySQL Database
- Google OAuth Integration
- Email verification system

### **Frontend**
- React 18 with TypeScript
- React Router DOM for routing
- Axios for API calls with interceptors
- React Hook Form with Zod validation
- Tailwind CSS with custom components
- shadcn/ui component library

## 📋 **Setup Instructions**

### **1. Backend Setup**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp env.example .env  # Configure environment variables
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### **2. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

### **3. Environment Variables**
Create `.env` file in backend directory (see `env.example`):
```env
DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=chefsync_db
DB_USER=root
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=3306
FRONTEND_URL=http://localhost:5173
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
```

## 🧪 **Testing the System**

1. **Start both servers** (backend + frontend)
2. **Register a new user** at http://localhost:5173/auth/register
3. **Check email verification** (console output in development)
4. **Verify email** by clicking the verification link
5. **Login with credentials** at http://localhost:5173/auth/login
6. **Test password reset** at http://localhost:5173/auth/forgot-password
7. **Test protected routes** and authentication flow

## 🔒 **Security Best Practices**

- Use HTTPS in production
- Set strong secret keys
- Implement rate limiting
- Regular security updates
- Monitor authentication logs
- Validate all user inputs
- Use environment variables for sensitive data

## 📚 **Documentation**

- **Setup Guide:** See `SETUP_GUIDE.md` for detailed setup instructions
- **API Documentation:** Available at backend endpoints
- **Security Guide:** Implemented security measures
- **Deployment Guide:** Production deployment steps

## 🚀 **Production Deployment**

1. **Update security settings** in `settings.py`
2. **Configure production database** (MySQL/PostgreSQL)
3. **Set up email service** (SMTP with real credentials)
4. **Configure Google OAuth** credentials
5. **Set up HTTPS** and SSL certificates
6. **Deploy to production server** (Docker recommended)

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 **License**

This project is licensed under the MIT License.

---

**🎉 Happy Coding with ChefSync! 🎉**

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

