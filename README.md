# 🍽️ ChefSync - Food Delivery Platform

A comprehensive food delivery platform with **JWT authentication**, **Google OAuth**, **email verification**, **role-based dashboards**, **document upload system**, and **admin approval workflows**.

## 📋 Table of Contents

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
- [📄 Document Management](#-document-management)
- [👥 Admin Approval System](#-admin-approval-system)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8.0+
- Git

### Backend (Django)
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

### Frontend (React)
```bash
cd frontend
npm install
cp .env.example .env.local  # Configure environment variables
npm run dev
```
**App runs on:** http://localhost:8081

## 🏗️ Project Structure

```
ChefSync/
├── backend/                    # Django Backend
│   ├── apps/
│   │   ├── authentication/    # Authentication app
│   │   │   ├── models.py      # User, JWTToken, EmailOTP models
│   │   │   ├── views.py       # API endpoints
│   │   │   ├── services/      # JWT, Email services
│   │   │   └── management/    # Django commands
│   │   ├── food/              # Food management
│   │   ├── orders/            # Order processing
│   │   ├── payments/          # Payment handling
│   │   ├── users/             # User profiles
│   │   └── analytics/         # Analytics and reporting
│   ├── config/                # Django settings
│   ├── templates/emails/      # Email templates
│   ├── env.example           # Environment template
│   ├── requirements.txt      # Python dependencies
│   └── manage.py
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── layout/      # Navigation, layouts
│   │   │   ├── admin/       # Admin dashboard components
│   │   │   └── ui/          # Shadcn/UI components
│   │   ├── pages/           # Page components
│   │   │   ├── auth/        # Login, Register, etc.
│   │   │   ├── admin/       # Admin dashboard
│   │   │   ├── cook/        # Cook dashboard
│   │   │   ├── customer/    # Customer dashboard
│   │   │   └── delivery/    # Delivery dashboard
│   │   ├── store/           # State management
│   │   ├── context/         # React Context
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── .env.example         # Environment template
│   ├── package.json         # Node.js dependencies
│   └── vite.config.ts       # Vite configuration
└── README.md               # This file
```

## 🔧 Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd ChefSync
```

### 2. Backend Setup

#### Create Virtual Environment
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Configure Environment Variables
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

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
```

#### Database Setup
```bash
python manage.py migrate
python manage.py createsuperuser
```

#### Run Backend Server
```bash
python manage.py runserver
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Configure Environment Variables
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

#### Run Frontend Server
```bash
npm run dev
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google Identity API
4. Create OAuth 2.0 credentials
5. Add authorized origins:
   - `http://localhost:8081`
   - `http://127.0.0.1:8081`
6. Add authorized redirect URIs:
   - `http://localhost:8081/auth/google/callback`
   - `http://127.0.0.1:8081/auth/google/callback`
7. Copy Client ID and Secret to your `.env` files

## 🔐 Authentication System

### JWT Token Architecture
- **Access Tokens**: Stateless, short-lived (15 minutes)
- **Refresh Tokens**: Database-stored, long-lived (7 days)
- **Automatic Refresh**: Seamless token renewal
- **Token Revocation**: Secure logout and session management

### Authentication Flow
1. **Registration**: Multi-step process with email verification
2. **Email Verification**: OTP-based verification system
3. **Role Selection**: Customer, Cook, or Delivery Agent
4. **Document Upload**: Required for Cooks and Delivery Agents
5. **Admin Approval**: Manual approval for Cooks and Delivery Agents
6. **Login**: JWT tokens issued
7. **Token Refresh**: Automatic renewal
8. **Logout**: Token revocation

### Role-Based Access Control
- **Customer**: Food ordering and profile management (immediate access)
- **Cook**: Kitchen management and order preparation (requires approval)
- **Delivery Agent**: Order delivery and tracking (requires approval)
- **Admin**: System administration and user approval

## 📱 Frontend Features

### Authentication Components
- **Multi-Step Registration**: Name, email, OTP verification, role selection, document upload, password
- **Email Verification**: OTP-based verification with beautiful HTML emails
- **Login Form**: Email/password with validation
- **Password Reset**: Secure reset with email confirmation
- **Google OAuth**: Social login integration

### Dashboard System
- **Customer Dashboard**: Order history, favorites, profile
- **Cook Dashboard**: Kitchen orders, schedule, inventory
- **Delivery Dashboard**: Delivery routes, order tracking
- **Admin Dashboard**: Analytics, user management, approval workflows

### UI/UX Features
- **Responsive Design**: Mobile-first approach
- **Dark/Light Theme**: Theme switching capability
- **Loading States**: Skeleton loaders and spinners
- **Error Handling**: User-friendly error messages
- **Form Validation**: Real-time validation with Zod

## 🗄️ Database Models

### User Model
```python
class User(AbstractUser):
    email = models.EmailField(unique=True)
    is_verified = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    account_locked = models.BooleanField(default=False)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES)
    approved_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
```

### JWT Token Model
```python
class JWTToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token_hash = models.CharField(max_length=64, unique=True)
    token_type = models.CharField(max_length=10, choices=TOKEN_TYPES)
    expires_at = models.DateTimeField()
    is_revoked = models.BooleanField(default=False)
    is_blacklisted = models.BooleanField(default=False)
```

### Email OTP Model
```python
class EmailOTP(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
```

### Document Models
```python
class DocumentType(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    required_for_roles = models.JSONField()
    is_required = models.BooleanField(default=True)

class UserDocument(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    document_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE)
    file = models.FileField(upload_to='documents/')
    is_visible_to_admin = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
```

## 🛡️ Security Features

### Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Token Blacklisting**: Revocation of compromised tokens
- **Rate Limiting**: Protection against brute force attacks
- **Account Locking**: Temporary account suspension
- **Password Hashing**: Secure password storage
- **OTP Security**: Time-limited, single-use verification codes

### API Security
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Comprehensive form validation
- **SQL Injection Protection**: Django ORM protection
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: Cross-site request forgery protection

### Document Security
- **Secure Storage**: Cloudinary integration with proxy access
- **Access Control**: Role-based document visibility
- **File Validation**: Type and size restrictions
- **Admin Review**: Manual document verification

## 📊 State Management

### Zustand Stores

#### User Store (`frontend/src/store/userStore.ts`)
```typescript
interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  approvalStatus: string;
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}
```

#### Order Store (`frontend/src/store/orderStore.ts`)
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

### React Context

#### Auth Context (`frontend/src/context/AuthContext.tsx`)
- Global authentication state
- Token management
- User session handling
- Automatic token refresh
- Approval status tracking

#### Theme Context (`frontend/src/context/ThemeContext.tsx`)
- Dark/light theme switching
- Theme persistence
- System theme detection

## 🔧 API Endpoints

### Authentication Endpoints
```
POST /api/auth/register/           # User registration
POST /api/auth/login/              # User login
POST /api/auth/logout/             # User logout
POST /api/auth/token/refresh/      # Token refresh
POST /api/auth/send-otp/           # Send OTP for verification
POST /api/auth/verify-otp/         # Verify OTP
POST /api/auth/google/login/       # Google OAuth login
```

### Password Management
```
POST /api/auth/password/reset/     # Request password reset
POST /api/auth/password/reset/confirm/  # Confirm password reset
POST /api/auth/password/change/    # Change password
```

### Document Management
```
GET  /api/auth/documents/types/           # Get document types by role
POST /api/auth/documents/upload/          # Upload documents
GET  /api/auth/documents/                 # Get user documents
DELETE /api/auth/documents/<id>/delete/   # Delete document
POST /api/auth/documents/proxy-download/  # Proxy document download
```

### Admin Management
```
GET  /api/auth/admin/pending-approvals/   # Get pending approvals
GET  /api/auth/admin/user/<id>/           # Get user details for approval
POST /api/auth/admin/user/<id>/approve/   # Approve/reject user
GET  /api/auth/approval-status/           # Check user approval status
```

### Profile Management
```
GET /api/auth/profile/             # Get user profile
PUT /api/auth/profile/update/      # Update user profile
POST /api/auth/customer/create/    # Create customer profile
POST /api/auth/cook/create/        # Create cook profile
POST /api/auth/delivery-agent/create/  # Create delivery profile
```

## 🎨 UI Components

### Shadcn/UI Components
- **Forms**: Input, Button, Select, Checkbox, Radio
- **Layout**: Card, Sheet, Dialog, Drawer, Tabs
- **Navigation**: Breadcrumb, Navigation Menu, Pagination
- **Feedback**: Alert, Toast, Progress, Skeleton
- **Data Display**: Table, Badge, Avatar, Separator

### Custom Components
- **Auth Components**: Login, Register, ForgotPassword, DocumentUpload
- **Layout Components**: Navbar, RoleBasedNavigation
- **Dashboard Components**: Role-specific dashboards
- **Admin Components**: Approval workflows, user management
- **Profile Components**: EditProfile, ProfileUpdateForm

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Themes**: Dark/light mode support
- **Responsive Design**: Mobile-first approach
- **Component Variants**: Consistent design system

## 📄 Document Management

### Document Types by Role

#### Cook Documents
- **Culinary Certificate**: Professional cooking certification
- **Food Safety Certificate**: Health and safety compliance
- **Kitchen Experience**: Work history documentation
- **Health Certificate**: Medical clearance
- **Identity Verification**: Government-issued ID

#### Delivery Agent Documents
- **Driving License**: Valid driver's license
- **Vehicle Registration**: Vehicle ownership/insurance
- **Background Check**: Criminal background verification
- **Insurance Certificate**: Vehicle insurance coverage
- **Identity Verification**: Government-issued ID

### Document Upload Features
- **Drag & Drop Interface**: User-friendly file upload experience
- **File Validation**: Type and size restrictions (PDF, JPG, PNG, JPEG)
- **Progress Indicators**: Real-time upload feedback
- **Document Management**: Preview, delete, and retry functionality
- **Cloud Storage**: Secure Cloudinary integration

## 👥 Admin Approval System

### Approval Workflow
1. **User Registration**: Multi-step registration with document upload
2. **Pending Status**: Cooks and Delivery Agents await approval
3. **Admin Review**: Admins review documents and applications
4. **Approval Decision**: Approve or reject with notes
5. **Email Notification**: Automatic status updates to users
6. **Access Grant**: Approved users gain platform access

### Admin Dashboard Features
- **Pending Approvals**: Lists users awaiting approval
- **Document Review**: View and download uploaded documents
- **Approval Actions**: Approve/reject with notes
- **User Management**: Complete user administration
- **Analytics**: Registration and approval metrics

### Email Notifications
- **Beautiful HTML Templates**: Professional, responsive email design
- **Status Updates**: Approval/rejection notifications
- **Security Features**: Clear expiry information and warnings
- **Branding**: Consistent ChefSync styling

## 🚀 Deployment

### Production Environment Variables

#### Backend (.env)
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
CLOUDINARY_CLOUD_NAME=your_production_cloud_name
CLOUDINARY_API_KEY=your_production_api_key
CLOUDINARY_API_SECRET=your_production_api_secret
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SECURE_SSL_REDIRECT=True
```

#### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_GOOGLE_OAUTH_CLIENT_ID=your-production-client-id
VITE_APP_NAME=ChefSync
VITE_APP_VERSION=1.0.0
```

### Docker Deployment
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

### Production Checklist
- [ ] Set `DEBUG=False`
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure email service
- [ ] Set up Google OAuth for production
- [ ] Configure Cloudinary for production
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## 🧪 Testing

### Backend Testing
```bash
cd backend
python manage.py test
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Manual Testing Checklist
- [ ] User registration and email verification
- [ ] OTP sending and verification
- [ ] Document upload functionality
- [ ] Admin approval workflow
- [ ] Login with email/password
- [ ] Google OAuth login
- [ ] Password reset flow
- [ ] Token refresh functionality
- [ ] Role-based dashboard access
- [ ] Profile management
- [ ] Logout and token revocation

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards
- **Python**: Follow PEP 8 style guide
- **TypeScript**: Use strict mode and proper typing
- **React**: Use functional components with hooks
- **CSS**: Use Tailwind CSS utility classes
- **Commits**: Use conventional commit messages

### Pull Request Guidelines
- Provide clear description of changes
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation if needed
- Request review from maintainers

## 📚 Documentation

### Additional Resources
- **API Documentation**: Available at `/api/docs/` when running backend
- **Component Library**: Shadcn/UI documentation
- **Django Documentation**: Official Django docs
- **React Documentation**: Official React docs
- **Tailwind CSS**: Utility-first CSS framework docs

### Troubleshooting

#### Common Issues
1. **Database Connection Error**: Check database credentials in `.env`
2. **CORS Error**: Verify `CORS_ALLOWED_ORIGINS` in backend settings
3. **Google OAuth Error**: Check client ID and authorized origins
4. **Token Refresh Error**: Verify JWT settings and token expiration
5. **Build Error**: Check Node.js version and dependencies
6. **Email Not Sending**: Check SMTP configuration and credentials
7. **Document Upload Fails**: Verify Cloudinary configuration

#### Getting Help
- Check existing issues in the repository
- Create a new issue with detailed description
- Include error logs and environment details
- Provide steps to reproduce the issue

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Django**: Web framework for Python
- **React**: JavaScript library for building user interfaces
- **Shadcn/UI**: Beautifully designed components
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: State management library
- **Google OAuth**: Authentication service
- **Cloudinary**: Cloud-based image and video management
- **Brevo**: Email service provider

---

**🎉 Happy Coding with ChefSync! 🎉**

For questions or support, please open an issue in the repository.

**Made with ❤️ by the ChefSync Team**