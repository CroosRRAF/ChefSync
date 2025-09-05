# 🚀 ChefSync - Quick Start Guide

## ✅ **Everything is Ready!**

Your ChefSync food delivery platform is now set up and running! Here's what you need to know:

## 🌐 **Access Your Application**

### **Frontend (React App)**
- **URL:** http://localhost:5173
- **Features:** User registration, login, dashboard, and all UI components

### **Backend (Django API)**
- **URL:** http://127.0.0.1:8000
- **Admin Panel:** http://127.0.0.1:8000/admin
- **API Endpoints:** http://127.0.0.1:8000/api/

## 🔐 **Authentication Features**

### **User Registration**
1. Go to http://localhost:5173/auth/register
2. Fill in your details and select a role (Customer, Cook, or Delivery Agent)
3. Check the console for email verification link (development mode)
4. Click the verification link to activate your account

### **User Login**
1. Go to http://localhost:5173/auth/login
2. Enter your verified email and password
3. You'll be redirected to your role-based dashboard

### **Password Reset**
1. Go to http://localhost:5173/auth/forgot-password
2. Enter your email address
3. Check console for reset link (development mode)

## 👥 **User Roles & Dashboards**

### **Customer Dashboard**
- View and place food orders
- Track order status
- Manage profile and settings

### **Cook Dashboard**
- Manage kitchen operations
- View incoming orders
- Update order status
- Schedule management

### **Delivery Agent Dashboard**
- View assigned deliveries
- Update delivery status
- Route optimization
- Schedule management

### **Admin Dashboard**
- User management
- Analytics and reports
- System settings
- Order oversight

## 🛠️ **Development Features**

### **Email System**
- **Development Mode:** All emails are printed to console
- **Production Ready:** Configure SMTP settings for real email delivery

### **Database**
- **Current:** SQLite (for easy development)
- **Production Ready:** MySQL/PostgreSQL support included

### **Authentication**
- JWT token-based authentication
- Automatic token refresh
- Secure password validation
- Account locking protection

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

## 🎯 **Quick Test Flow**

1. **Open Frontend:** http://localhost:5173
2. **Register New User:** Click "Register" and create an account
3. **Check Console:** Look for email verification link in terminal/console
4. **Verify Email:** Click the verification link
5. **Login:** Use your credentials to log in
6. **Explore Dashboard:** Navigate through your role-based interface

## 🛡️ **Security Features**

- ✅ JWT Authentication with refresh tokens
- ✅ Email verification required
- ✅ Password strength validation
- ✅ Account locking after failed attempts
- ✅ CORS protection
- ✅ Input validation and sanitization
- ✅ Secure headers implementation

## 📱 **Frontend Features**

- ✅ Responsive design (mobile-first)
- ✅ Modern UI with Tailwind CSS
- ✅ shadcn/ui component library
- ✅ Form validation with Zod
- ✅ State management with React Context
- ✅ Protected routes
- ✅ Error handling and loading states

## 🔄 **Restarting the Application**

If you need to restart the servers:

### **Backend (Django)**
```bash
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

### **Frontend (React)**
```bash
cd frontend
npm run dev
```

## 🐛 **Troubleshooting**

### **Backend Issues**
- Check if virtual environment is activated
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Run migrations: `python manage.py migrate`

### **Frontend Issues**
- Install dependencies: `npm install`
- Clear cache: `npm run build`
- Check for port conflicts (5173)

### **Database Issues**
- SQLite database is automatically created
- For MySQL: Update settings.py and create database manually

## 🚀 **Next Steps**

1. **Test the Application:** Try all authentication flows
2. **Customize UI:** Modify components in `frontend/src/components/`
3. **Add Features:** Extend the API in `backend/apps/authentication/`
4. **Configure Email:** Set up SMTP for production email delivery
5. **Deploy:** Follow production deployment guide

## 📚 **Documentation**

- **Main README:** [README.md](./README.md)
- **Detailed Setup:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Google OAuth:** [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

---

## 🎉 **You're All Set!**

Your ChefSync food delivery platform is now running with:
- ✅ Full authentication system
- ✅ Role-based dashboards
- ✅ Modern React frontend
- ✅ Django REST API backend
- ✅ JWT security
- ✅ Email verification
- ✅ Password reset functionality

**Happy coding with ChefSync! 🍽️**
