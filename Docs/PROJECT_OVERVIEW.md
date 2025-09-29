# ChefSync - Complete Project Overview

## 🍽️ Project Summary

**ChefSync** is a comprehensive food delivery platform built with Django (Backend) and React/TypeScript (Frontend). It features JWT authentication, Google OAuth, email verification, role-based dashboards, document upload system, and admin approval workflows.

## 📁 Project Structure

```
ChefSync/
├── backend/                    # Django Backend (Port 8000)
│   ├── apps/                   # Django Applications
│   │   ├── authentication/     # User authentication & JWT
│   │   ├── admin_management/   # Admin dashboard & user management
│   │   ├── analytics/          # Analytics & reporting
│   │   ├── communications/     # Notifications & messaging
│   │   ├── food/               # Food management & menu
│   │   ├── orders/             # Order processing & cart
│   │   ├── payments/           # Payment handling
│   │   └── users/              # User profiles & management
│   ├── config/                 # Django settings & configuration
│   ├── media/                  # Media files (images, documents)
│   ├── templates/emails/       # Email templates
│   ├── utils/                  # Utility functions
│   └── scripts/                # Management scripts
├── frontend/                   # React Frontend (Port 8081)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── layout/        # Navigation & layouts
│   │   │   ├── admin/         # Admin dashboard components
│   │   │   └── ui/           # Shadcn/UI components
│   │   ├── pages/            # Page components
│   │   │   ├── auth/         # Login, Register, etc.
│   │   │   ├── admin/        # Admin dashboard
│   │   │   ├── cook/         # Cook dashboard
│   │   │   ├── customer/     # Customer dashboard
│   │   │   └── delivery/     # Delivery dashboard
│   │   ├── store/            # Zustand state management
│   │   ├── context/          # React Context providers
│   │   ├── services/         # API services
│   │   ├── types/            # TypeScript type definitions
│   │   └── utils/            # Utility functions
│   └── dist/                 # Built frontend files
├── admin-config/              # System configuration files
└── Documentation files        # Various README and guide files
```

## 🏗️ Backend Architecture (Django)

### Core Django Apps

#### 1. **Authentication App** (`apps/authentication/`)
- **Models**: User, Customer, Cook, DeliveryAgent, Admin, JWTToken, EmailOTP, DocumentType, UserDocument
- **Features**: 
  - JWT token management with refresh tokens
  - Email verification with OTP
  - Google OAuth integration
  - Document upload and verification
  - Role-based user management
  - Referral system with rewards
- **Key Files**:
  - `models.py`: User models with approval workflows
  - `views.py`: Authentication endpoints
  - `serializers.py`: API serializers
  - `urls.py`: Authentication routes

#### 2. **Food App** (`apps/food/`)
- **Models**: Cuisine, FoodCategory, Food, FoodPrice, FoodImage, Offer, FoodReview
- **Features**:
  - Food catalog management
  - Multi-size pricing (Small, Medium, Large)
  - Image management with Cloudinary
  - Review and rating system
  - Admin approval for food items
- **Key Files**:
  - `models.py`: Food-related models
  - `views.py`: Food API endpoints
  - `cloudinary_fields.py`: Cloudinary integration

#### 3. **Orders App** (`apps/orders/`)
- **Models**: Order, OrderItem, OrderStatusHistory, CartItem, Delivery, DeliveryReview, BulkOrder
- **Features**:
  - Complete order lifecycle management
  - Shopping cart functionality
  - Order status tracking
  - Delivery management
  - Bulk order processing
- **Key Files**:
  - `models.py`: Order management models
  - `views.py`: Order processing endpoints
  - `bulk_views.py`: Bulk order management

#### 4. **Users App** (`apps/users/`)
- **Models**: UserProfile, ChefProfile, DeliveryProfile
- **Features**:
  - Role-specific profile management
  - Chef kitchen management
  - Delivery agent tracking
- **Key Files**:
  - `models.py`: Profile models
  - `views.py`: Profile management

#### 5. **Analytics App** (`apps/analytics/`)
- **Features**:
  - System analytics and reporting
  - Performance metrics
  - Business intelligence

#### 6. **Communications App** (`apps/communications/`)
- **Features**:
  - Notification system
  - Email communications
  - User messaging

#### 7. **Payments App** (`apps/payments/`)
- **Features**:
  - Payment processing
  - Transaction management
  - Refund handling

#### 8. **Admin Management App** (`apps/admin_management/`)
- **Features**:
  - Admin dashboard
  - User approval workflows
  - System administration

### Backend Configuration

#### Django Settings (`backend/config/settings.py`)
- **Database**: MySQL with utf8mb4 charset
- **Authentication**: JWT with SimpleJWT
- **CORS**: Configured for frontend communication
- **Email**: Brevo SMTP integration
- **Storage**: Cloudinary for media files
- **Security**: Rate limiting, account locking, OTP verification

#### Key Features:
- **JWT Authentication**: Access tokens (60 min) + Refresh tokens (7 days)
- **Google OAuth**: Social login integration
- **Email Verification**: OTP-based verification system
- **Document Management**: PDF processing with Poppler
- **File Storage**: Cloudinary integration with local fallback
- **Security**: Rate limiting, account locking, CORS protection

## 🎨 Frontend Architecture (React/TypeScript)

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with Shadcn/UI components
- **State Management**: Zustand + React Context
- **Routing**: React Router v6
- **HTTP Client**: Axios with React Query
- **Authentication**: Google OAuth + JWT

### Component Structure

#### 1. **Layout Components** (`src/components/layout/`)
- `Navbar.tsx`: Main navigation
- `CustomerNavbar.tsx`: Customer-specific navigation
- `AdminLayout.tsx`: Admin dashboard layout
- `RoleBasedNavigation.tsx`: Role-specific navigation

#### 2. **Authentication Components** (`src/components/auth/`)
- Login, Register, ForgotPassword components
- Document upload components
- Email verification components

#### 3. **UI Components** (`src/components/ui/`)
- Shadcn/UI component library
- Form components, buttons, modals, etc.

#### 4. **Page Components** (`src/pages/`)
- **Public Pages**: Home, Menu, About, Contact
- **Auth Pages**: Login, Register, VerifyEmail, etc.
- **Role-based Dashboards**:
  - Customer: Dashboard, Orders, Profile, Cart
  - Cook: Dashboard, Kitchen, Orders, Schedule
  - Delivery: Dashboard, Map, Orders, Schedule
  - Admin: Dashboard, Analytics, User Management

### State Management

#### 1. **Zustand Stores** (`src/store/`)
- `userStore.ts`: User authentication state
- `orderStore.ts`: Order management state

#### 2. **React Context** (`src/context/`)
- `AuthContext.tsx`: Global authentication
- `ThemeContext.tsx`: Dark/light theme
- `CartContext.tsx`: Shopping cart state

### Frontend Configuration

#### Vite Configuration (`frontend/vite.config.ts`)
- **Port**: 8081
- **Proxy**: API requests to backend (port 8000)
- **Path Aliases**: `@` for `src/` directory
- **Development**: Hot reload with SWC

#### Tailwind Configuration (`frontend/tailwind.config.ts`)
- **Custom Colors**: Primary, secondary, success, warning, info
- **Animations**: Fade, scale, slide effects
- **Shadows**: Glow, card, food-specific shadows
- **Responsive**: Mobile-first approach

## 🔧 Current Configuration

### Backend Configuration
- **Database**: MySQL (chefsync_db)
- **Authentication**: JWT + Google OAuth
- **File Storage**: Cloudinary (with local fallback)
- **Email**: Brevo SMTP
- **Security**: Rate limiting, CORS, account locking
- **PDF Processing**: Poppler for Windows

### Frontend Configuration
- **Development Server**: Port 8081
- **API Base URL**: http://127.0.0.1:8000/api
- **Google OAuth**: Configured for development
- **Theme**: Dark/light mode support
- **Build**: Vite with TypeScript

### Environment Variables

#### Backend (.env)
```env
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=chefsync_db
DB_USER=root
DB_PASSWORD=your-password
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=your-smtp-password
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Frontend (.env.local)
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
VITE_APP_NAME=ChefSync
VITE_APP_VERSION=1.0.0
```

## 🚀 Key Features

### Authentication System
- **Multi-step Registration**: Name → Email → OTP → Role → Documents → Password
- **Email Verification**: OTP-based verification with beautiful HTML emails
- **Google OAuth**: Social login integration
- **Role-based Access**: Customer, Cook, Delivery Agent, Admin
- **Document Upload**: Required for Cooks and Delivery Agents
- **Admin Approval**: Manual approval workflow

### Order Management
- **Shopping Cart**: Persistent cart with FoodPrice integration
- **Order Lifecycle**: Cart → Pending → Confirmed → Preparing → Ready → Delivered
- **Multi-size Pricing**: Small, Medium, Large options
- **Delivery Tracking**: Real-time order tracking
- **Bulk Orders**: Special bulk order processing

### Food Management
- **Admin-controlled**: All food items require admin approval
- **Multi-cuisine Support**: Italian, Chinese, Indian, Mexican, etc.
- **Image Management**: Cloudinary integration with optimization
- **Review System**: Customer reviews and ratings
- **Nutritional Info**: Allergens, dietary restrictions

### Delivery System
- **Enhanced Navigation**: Dual navigation options (Google Maps + Quick Navigate)
- **Pickup Locations**: Multiple data sources for location accuracy
- **Contact Integration**: Direct calling for chefs and customers
- **Route Optimization**: Real-time traffic updates

### Admin Dashboard
- **User Management**: Approval workflows, user administration
- **Analytics**: System metrics, performance monitoring
- **Document Review**: Manual document verification
- **System Health**: Monitoring and maintenance tools

## 📊 Database Schema

### Core Tables
- **User**: Main user table with roles and approval status
- **Customer/Cook/DeliveryAgent**: Role-specific profiles
- **Food/FoodPrice**: Food catalog with multi-size pricing
- **Order/OrderItem**: Order management
- **CartItem**: Shopping cart
- **Delivery**: Delivery tracking
- **UserDocument**: Document uploads for verification
- **JWTToken**: Token management for security

### Key Relationships
- User → Customer/Cook/DeliveryAgent (One-to-One)
- User → Orders (One-to-Many)
- Food → FoodPrice (One-to-Many)
- Order → OrderItem (One-to-Many)
- Order → Delivery (One-to-One)

## 🔒 Security Features

### Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Token Blacklisting**: Revocation of compromised tokens
- **Rate Limiting**: Protection against brute force attacks
- **Account Locking**: Temporary account suspension
- **OTP Security**: Time-limited verification codes

### API Security
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Comprehensive form validation
- **SQL Injection Protection**: Django ORM protection
- **XSS Protection**: Content Security Policy headers

### Document Security
- **Secure Storage**: Cloudinary integration with proxy access
- **Access Control**: Role-based document visibility
- **File Validation**: Type and size restrictions
- **Admin Review**: Manual document verification

## 🎯 Current Status

### Working Features
- ✅ User registration and authentication
- ✅ Email verification with OTP
- ✅ Google OAuth integration
- ✅ Role-based dashboards
- ✅ Document upload system
- ✅ Admin approval workflows
- ✅ Food catalog management
- ✅ Order processing
- ✅ Shopping cart functionality
- ✅ Delivery navigation system

### Development Environment
- **Backend**: Django 5.2.5 with MySQL
- **Frontend**: React 18 with TypeScript
- **Database**: MySQL 8.0+
- **File Storage**: Cloudinary
- **Email**: Brevo SMTP
- **Authentication**: JWT + Google OAuth

### Git Status
- **Branch**: Dev
- **Modified Files**: `backend/config/settings.py`
- **Untracked Files**: New migration file for orders

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8.0+
- Git
- Poppler for Windows (for PDF processing)

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env  # Configure environment variables
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local  # Configure environment variables
npm run dev
```

### Access Points
- **Backend API**: http://127.0.0.1:8000
- **Frontend App**: http://localhost:8081
- **Admin Panel**: http://127.0.0.1:8000/admin

## 📝 Documentation Files

The project includes comprehensive documentation:
- `README.md`: Main project documentation
- `ADMIN_SYSTEM_ANALYSIS_AND_IMPROVEMENT_PLAN.md`: Admin system analysis
- `CLOUDINARY_INTEGRATION_GUIDE.md`: Cloudinary setup guide
- `DELIVERY_INTEGRATION_SUMMARY.md`: Delivery system overview
- `ENHANCED_PICKUP_NAVIGATION.md`: Navigation system details
- `IMPLEMENTATION_PLAN.md`: Development roadmap
- `LIVE_DATA_TRANSITION.md`: Data migration guide
- `MENU_IMPLEMENTATION_README.md`: Menu system details
- `PICKUP_LOCATION_IMPLEMENTATION.md`: Pickup system guide
- `TEAM_SETUP_GUIDE.md`: Team development guide

## 🎉 Project Highlights

1. **Comprehensive Authentication**: Multi-step registration with document verification
2. **Role-based Architecture**: Separate dashboards for each user type
3. **Advanced Order Management**: Complete order lifecycle with delivery tracking
4. **Modern UI/UX**: React with TypeScript and Tailwind CSS
5. **Security First**: JWT tokens, rate limiting, document verification
6. **Scalable Architecture**: Django REST API with React frontend
7. **Cloud Integration**: Cloudinary for file storage, Brevo for email
8. **Mobile Responsive**: Mobile-first design approach
9. **Admin Dashboard**: Comprehensive system administration
10. **Document Management**: PDF processing and verification system

This project represents a complete, production-ready food delivery platform with modern architecture, comprehensive security, and excellent user experience.
