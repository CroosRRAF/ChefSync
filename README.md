# 🍽️ ChefSync - Food Delivery Platform

A comprehensive food delivery platform with **JWT authentication**, **Google OAuth**, **email verification**, **role-based dashboards**, and **advanced security features**.

## 📋 **Table of Contents**

- [🚀 Quick Start](#-quick-start)
- [🏗️ Project Structure](#️-project-structure)
- [🔧 Setup Instructions](#-setup-instructions)
- [🔐 Authentication System](#-authentication-system)
- [📱 Frontend Features](#-frontend-features)
- [🗄️ Database Models](#️-database-models)
- [🛡️ Security Features](#️-security-features)
- [📊 State Management](#-state-management)
- [🔧 API Endpoints](#-api-endpoints)
- [🎨 UI Components](#-ui-components)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)

## 🚀 **Quick Start**

### **Prerequisites**
- Python 3.11+
- Node.js 18+
- MySQL 8.0+
- Git

### **Backend (Django)**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cp env.example .env  # Configure environment variables
python manage.py migrate
python manage.py runserver
```
**Server runs on:** http://127.0.0.1:8000

### **Frontend (React)**
```bash
cd frontend
npm install
cp .env.example .env.local  # Configure environment variables
npm run dev
```
**App runs on:** http://localhost:8081

## 🏗️ **Project Structure**

```
ChefSync/
├── backend/                    # Django Backend
│   ├── apps/
│   │   └── authentication/    # Authentication app
│   │       ├── models.py      # User, JWTToken models
│   │       ├── views.py       # API endpoints
│   │       ├── services/      # JWT, Email services
│   │       └── management/    # Django commands
│   ├── config/                # Django settings
│   ├── env.example           # Environment template
│   ├── requirements.txt      # Python dependencies
│   └── manage.py
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── layout/      # Navigation, layouts
│   │   │   └── ui/          # Shadcn/UI components
│   │   ├── pages/           # Page components
│   │   │   ├── auth/        # Login, Register, etc.
│   │   │   ├── admin/       # Admin dashboard
│   │   │   ├── cook/        # Cook dashboard
│   │   │   ├── customer/    # Customer dashboard
│   │   │   └── delivery/    # Delivery dashboard
│   │   ├── store/           # State management
│   │   │   ├── userStore.ts # User state (Zustand)
│   │   │   └── orderStore.ts # Order state (Zustand)
│   │   ├── context/         # React Context
│   │   │   ├── AuthContext.tsx # Authentication context
│   │   │   └── ThemeContext.tsx # Theme context
│   │   ├── services/        # API services
│   │   │   └── authService.ts # Authentication API
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   └── routes/          # Routing configuration
│   ├── .env.example         # Environment template
│   ├── package.json         # Node.js dependencies
│   └── vite.config.ts       # Vite configuration
├── .gitignore               # Git ignore rules
└── README.md               # This file
```

## 🔧 **Setup Instructions**

### **1. Clone the Repository**
```bash
git clone <your-repository-url>
cd ChefSync
```

### **2. Backend Setup**

#### **Create Virtual Environment**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
```

#### **Install Dependencies**
```bash
pip install -r requirements.txt
```

#### **Configure Environment Variables**
```bash
cp env.example .env
```

Edit `.env` file with your configuration:
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

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
```

#### **Database Setup**
```bash
python manage.py migrate
python manage.py createsuperuser
```

#### **Run Backend Server**
```bash
python manage.py runserver
```

### **3. Frontend Setup**

#### **Install Dependencies**
```bash
cd frontend
npm install
```

#### **Configure Environment Variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` file:
```env
# API Configuration
VITE_API_BASE_URL=http://127.0.0.1:8000/api

# Google OAuth Configuration
VITE_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Development Settings
VITE_APP_NAME=ChefSync
VITE_APP_VERSION=1.0.0
```

#### **Run Frontend Server**
```bash
npm run dev
```

### **4. Google OAuth Setup**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins:
   - `http://localhost:8081`
   - `http://127.0.0.1:8081`
6. Copy Client ID and Secret to your `.env` files

## 🔐 **Authentication System**

### **JWT Token Architecture**
- **Access Tokens**: Stateless, short-lived (15 minutes)
- **Refresh Tokens**: Database-stored, long-lived (7 days)
- **Automatic Refresh**: Seamless token renewal
- **Token Revocation**: Secure logout and session management

### **Authentication Flow**
1. **Registration**: Email verification required
2. **Login**: JWT tokens issued
3. **Token Refresh**: Automatic renewal
4. **Logout**: Token revocation
5. **Password Reset**: Secure email-based reset

### **Role-Based Access Control**
- **Customer**: Food ordering and profile management
- **Cook**: Kitchen management and order preparation
- **Delivery Agent**: Order delivery and tracking
- **Admin**: System administration and analytics

## 📱 **Frontend Features**

### **Authentication Components**
- **Login Form**: Email/password with validation
- **Registration Form**: Multi-step registration with role selection
- **Email Verification**: Token-based verification flow
- **Password Reset**: Secure reset with email confirmation
- **Google OAuth**: Social login integration

### **Dashboard System**
- **Customer Dashboard**: Order history, favorites, profile
- **Cook Dashboard**: Kitchen orders, schedule, inventory
- **Delivery Dashboard**: Delivery routes, order tracking
- **Admin Dashboard**: Analytics, user management, reports

### **UI/UX Features**
- **Responsive Design**: Mobile-first approach
- **Dark/Light Theme**: Theme switching capability
- **Loading States**: Skeleton loaders and spinners
- **Error Handling**: User-friendly error messages
- **Form Validation**: Real-time validation with Zod

## 🗄️ **Database Models**

### **User Model**
```python
class User(AbstractUser):
    email = models.EmailField(unique=True)
    is_verified = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    account_locked = models.BooleanField(default=False)
    account_locked_until = models.DateTimeField(null=True, blank=True)
```

### **JWT Token Model**
```python
class JWTToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token_hash = models.CharField(max_length=64, unique=True)
    token_type = models.CharField(max_length=10, choices=TOKEN_TYPES)
    expires_at = models.DateTimeField()
    is_revoked = models.BooleanField(default=False)
    is_blacklisted = models.BooleanField(default=False)
```

### **Profile Models**
- **Customer**: Basic profile for food ordering
- **Cook**: Chef profile with specialties and kitchen info
- **DeliveryAgent**: Delivery personnel with vehicle and location

## 🛡️ **Security Features**

### **Authentication Security**
- **JWT Tokens**: Secure token-based authentication
- **Token Blacklisting**: Revocation of compromised tokens
- **Rate Limiting**: Protection against brute force attacks
- **Account Locking**: Temporary account suspension
- **Password Hashing**: Secure password storage

### **API Security**
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Comprehensive form validation
- **SQL Injection Protection**: Django ORM protection
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: Cross-site request forgery protection

### **Frontend Security**
- **Secure Token Storage**: HTTP-only cookies (recommended)
- **Input Sanitization**: XSS prevention
- **Route Protection**: Authentication-based routing
- **Environment Variables**: Secure configuration management

## 📊 **State Management**

### **Zustand Stores**

#### **User Store** (`frontend/src/store/userStore.ts`)
```typescript
interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}
```

**Features:**
- User profile management
- Authentication state
- Loading states
- Logout functionality

#### **Order Store** (`frontend/src/store/orderStore.ts`)
```typescript
interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  removeOrder: (id: string) => void;
  setCurrentOrder: (order: Order | null) => void;
}
```

**Features:**
- Order management
- Real-time updates
- Order history
- Cart functionality

### **React Context**

#### **Auth Context** (`frontend/src/context/AuthContext.tsx`)
- Global authentication state
- Token management
- User session handling
- Automatic token refresh

#### **Theme Context** (`frontend/src/context/ThemeContext.tsx`)
- Dark/light theme switching
- Theme persistence
- System theme detection

## 🔧 **API Endpoints**

### **Authentication Endpoints**
```
POST /api/auth/register/           # User registration
POST /api/auth/login/              # User login
POST /api/auth/logout/             # User logout
POST /api/auth/token/refresh/      # Token refresh
POST /api/auth/verify-email/       # Email verification
POST /api/auth/google/login/       # Google OAuth login
```

### **Password Management**
```
POST /api/auth/password/reset/     # Request password reset
POST /api/auth/password/reset/confirm/  # Confirm password reset
POST /api/auth/password/change/    # Change password
```

### **Token Management**
```
GET /api/auth/tokens/              # Get user tokens
POST /api/auth/tokens/revoke/      # Revoke specific token
POST /api/auth/tokens/revoke-all/  # Revoke all user tokens
```

### **Profile Management**
```
GET /api/auth/profile/             # Get user profile
PUT /api/auth/profile/update/      # Update user profile
POST /api/auth/customer/create/    # Create customer profile
POST /api/auth/cook/create/        # Create cook profile
POST /api/auth/delivery-agent/create/  # Create delivery profile
```

## 🎨 **UI Components**

### **Shadcn/UI Components**
- **Forms**: Input, Button, Select, Checkbox, Radio
- **Layout**: Card, Sheet, Dialog, Drawer, Tabs
- **Navigation**: Breadcrumb, Navigation Menu, Pagination
- **Feedback**: Alert, Toast, Progress, Skeleton
- **Data Display**: Table, Badge, Avatar, Separator

### **Custom Components**
- **Auth Components**: Login, Register, ForgotPassword
- **Layout Components**: Navbar, RoleBasedNavigation
- **Dashboard Components**: Role-specific dashboards
- **Profile Components**: EditProfile, ProfileUpdateForm

### **Styling**
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Themes**: Dark/light mode support
- **Responsive Design**: Mobile-first approach
- **Component Variants**: Consistent design system

## 🚀 **Deployment**

### **Production Environment Variables**

#### **Backend (.env)**
```env
DEBUG=False
SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DB_NAME=chefsync_prod
DB_USER=chefsync_user
DB_PASSWORD=secure-production-password
DB_HOST=your-db-host
DB_PORT=3306
EMAIL_HOST_USER=your-production-email
EMAIL_HOST_PASSWORD=your-production-smtp-password
GOOGLE_OAUTH_CLIENT_ID=your-production-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-production-client-secret
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SECURE_SSL_REDIRECT=True
```

#### **Frontend (.env.production)**
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_GOOGLE_OAUTH_CLIENT_ID=your-production-client-id
VITE_APP_NAME=ChefSync
VITE_APP_VERSION=1.0.0
```

### **Docker Deployment**
```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

### **Production Checklist**
- [ ] Set `DEBUG=False`
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure email service
- [ ] Set up Google OAuth for production
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## 🧪 **Testing**

### **Backend Testing**
```bash
cd backend
python manage.py test
```

### **Frontend Testing**
```bash
cd frontend
npm test
```

### **Manual Testing Checklist**
- [ ] User registration and email verification
- [ ] Login with email/password
- [ ] Google OAuth login
- [ ] Password reset flow
- [ ] Token refresh functionality
- [ ] Role-based dashboard access
- [ ] Profile management
- [ ] Logout and token revocation

## 🤝 **Contributing**

### **Development Workflow**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### **Code Standards**
- **Python**: Follow PEP 8 style guide
- **TypeScript**: Use strict mode and proper typing
- **React**: Use functional components with hooks
- **CSS**: Use Tailwind CSS utility classes
- **Commits**: Use conventional commit messages

### **Pull Request Guidelines**
- Provide clear description of changes
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation if needed
- Request review from maintainers

## 📚 **Documentation**

### **Additional Resources**
- **API Documentation**: Available at `/api/docs/` when running backend
- **Component Library**: Shadcn/UI documentation
- **Django Documentation**: Official Django docs
- **React Documentation**: Official React docs
- **Tailwind CSS**: Utility-first CSS framework docs

### **Troubleshooting**

#### **Common Issues**
1. **Database Connection Error**: Check database credentials in `.env`
2. **CORS Error**: Verify `CORS_ALLOWED_ORIGINS` in backend settings
3. **Google OAuth Error**: Check client ID and authorized origins
4. **Token Refresh Error**: Verify JWT settings and token expiration
5. **Build Error**: Check Node.js version and dependencies

#### **Getting Help**
- Check existing issues in the repository
- Create a new issue with detailed description
- Include error logs and environment details
- Provide steps to reproduce the issue

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Django**: Web framework for Python
- **React**: JavaScript library for building user interfaces
- **Shadcn/UI**: Beautifully designed components
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: State management library
- **Google OAuth**: Authentication service

---

**🎉 Happy Coding with ChefSync! 🎉**

For questions or support, please open an issue in the repository.

**Made with ❤️ by the ChefSync Team**