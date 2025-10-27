# 🍽️ ChefSync - Food Delivery Platform

<div align="center">

**Connecting Local Home Chefs with Food Lovers**

A full-stack food delivery platform built with Django and React, designed to bring authentic home-cooked meals from local chefs directly to your doorstep.

[![Django](https://img.shields.io/badge/Django-5.2.5-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#-key-features) • [Setup](#-getting-started) • [Documentation](#-documentation) • [Demo](#-demo) • [Contributing](#-contributing)

</div>

---

## 📖 About ChefSync

ChefSync is a comprehensive food delivery ecosystem that enables home chefs to monetize their culinary skills by connecting them with customers who crave authentic, homemade meals. The platform facilitates the entire journey from menu discovery to order tracking, ensuring a seamless experience for all stakeholders.

### 🌟 What Makes ChefSync Unique

- **Multi-role Platform**: Serves customers, chefs, delivery partners, and administrators
- **Location-Based Services**: GPS tracking, route optimization, and real-time delivery updates
- **AI-Powered Features**: Intelligent food recommendations and interactive chat assistant
- **Comprehensive Order Management**: From cart to delivery with real-time status tracking
- **Document Verification System**: Secure document upload and admin approval workflow
- **Analytics & Reporting**: Detailed insights for chefs and administrators

---

## ✨ Key Features

### 👥 For Customers
- 🛒 **Smart Shopping Cart** - Easy-to-use cart with item management
- 📍 **Multi-Address Support** - Save and manage multiple delivery locations
- 📱 **Real-Time Order Tracking** - Track your order from kitchen to doorstep
- ⭐ **Rating & Reviews** - Share your dining experience
- 🔔 **Order Notifications** - Stay updated on your order status
- 💰 **Flexible Payment** - Cash on delivery support

### 👨‍🍳 For Chefs
- 📋 **Menu Management** - Create and manage your food offerings
- 📊 **Kitchen Dashboard** - Monitor incoming orders and preparation schedule
- 💵 **Earnings Tracking** - Track revenue and order statistics
- 📸 **Bulk Menu Upload** - Efficiently add multiple items with images
- 📍 **Kitchen Location Management** - Set up and manage multiple kitchen locations
- ⏰ **Preparation Time Management** - Set realistic time estimates

### 🚚 For Delivery Partners
- 🗺️ **Dual Navigation System** - Integrated map + Google Maps for optimal routing
- 📦 **Order Management** - Accept, pick up, and deliver orders efficiently
- 💰 **Earnings Dashboard** - Track deliveries and earnings
- 📍 **Pickup & Delivery Tracking** - Navigate to chefs and customers
- 📞 **Direct Communication** - Contact chefs and customers with one tap

### 🔧 For Administrators
- ✅ **User Approval System** - Review and approve chef/delivery partner applications
- 📄 **Document Management** - Secure document review and verification
- 📊 **Analytics Dashboard** - Platform-wide metrics and insights
- 🎯 **AI-Powered Insights** - Automated report generation and recommendations
- 🛡️ **User Management** - Comprehensive user administration tools
- 💳 **Order Oversight** - Monitor and manage all platform orders

---

## 🏗️ Technology Stack

### Backend
- **Framework**: Django 5.2.5 (Python 3.11+)
- **Database**: MySQL 8.0
- **API**: Django REST Framework
- **Authentication**: JWT (JSON Web Tokens) + OAuth 2.0
- **Storage**: Cloudinary (Image/Media Management)
- **Background Tasks**: Django APScheduler
- **PDF Processing**: pdf2image, PyPDF2
- **Email Service**: Brevo SMTP

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **UI Components**: Shadcn/UI (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **Maps**: Google Maps API
- **AI Chat**: Google Gemini API

### Additional Tools
- **Version Control**: Git
- **Package Managers**: pip, npm
- **PDF Utilities**: Poppler (Windows installation required)

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Description |
|------------|---------|-------------|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend runtime |
| MySQL | 8.0+ | Database server |
| Git | Latest | Version control |
| Poppler | Latest | PDF processing (Windows) |

> **Note**: For Windows users, install Poppler from the [official repository](https://github.com/oschwartz10612/poppler-windows/releases/). Extract to `C:\poppler\` and add `C:\poppler\bin` to your PATH.

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/chefsync.git
cd chefsync
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp env.example .env

# Edit .env file with your configuration
# See Environment Variables section below

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

The backend server will run on **http://127.0.0.1:8000**

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your API keys
# See Environment Variables section below

# Start development server
npm run dev
```

The frontend application will run on **http://localhost:8081**

---

## ⚙️ Environment Variables

### Backend (.env)

Create a `.env` file in the `backend` directory:

```env
# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_NAME=chefsync_db
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_HOST=localhost
DB_PORT=3306

# Email Configuration (Brevo SMTP)
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=your-smtp-password
DEFAULT_FROM_EMAIL=noreply@chefsync.com

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret

# Cloudinary (Media Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google AI (Gemini)
GOOGLE_AI_API_KEY=your-google-ai-api-key

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
```

### Frontend (.env.local)

Create a `.env.local` file in the `frontend` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://127.0.0.1:8000/api

# Google OAuth
VITE_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Google AI API
VITE_GOOGLE_AI_API_KEY=your-google-ai-api-key

# App Information
VITE_APP_NAME=ChefSync
VITE_APP_VERSION=1.0.0
```

---

## 🗺️ Google API Setup

ChefSync integrates with several Google services to enhance functionality:

### Required APIs

1. **Google Maps API** - Location services, address autocomplete, route planning
   - Get your key from [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps JavaScript API and Places API

2. **Google OAuth 2.0** - Social authentication
   - Enable Google Identity API
   - Configure authorized origins and redirect URIs

### Optional APIs

3. **Google AI (Gemini)** - AI chat assistant
   - Get your key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Quick Setup

1. Visit `/setup` in the application for interactive API configuration
2. Or manually add keys to `frontend/.env.local`
3. Restart the development server

> **Note**: The app works without API keys but with limited functionality. Location-based features require Google Maps API.

---

## 📁 Project Structure

```
ChefSync/
├── backend/                           # Django Backend
│   ├── apps/
│   │   ├── authentication/            # User authentication & JWT
│   │   │   ├── models.py             # User, JWTToken, EmailOTP
│   │   │   ├── views.py              # Auth endpoints
│   │   │   ├── services/             # JWT, Email services
│   │   │   └── management/           # Django commands
│   │   ├── users/                    # User profiles
│   │   │   ├── models.py             # Customer, Chef, Delivery profiles
│   │   │   └── views.py              # Profile management
│   │   ├── food/                     # Food management
│   │   │   ├── models.py             # Food, Cuisine, Category
│   │   │   ├── views.py              # Menu endpoints
│   │   │   └── cloudinary_utils.py   # Image handling
│   │   ├── orders/                   # Order processing
│   │   │   ├── models.py             # Order, OrderItem
│   │   │   ├── views.py              # Order management
│   │   │   └── services/             # Order logic
│   │   ├── payments/                 # Payment handling
│   │   ├── admin_management/         # Admin features
│   │   ├── analytics/                # Analytics & reporting
│   │   └── communications/           # Notifications
│   ├── config/                       # Django settings
│   │   ├── settings.py               # Main configuration
│   │   ├── urls.py                   # URL routing
│   │   └── middleware.py             # Custom middleware
│   ├── templates/emails/             # Email templates
│   ├── utils/                        # Shared utilities
│   ├── scripts/                      # Utility scripts
│   ├── requirements.txt              # Python dependencies
│   └── manage.py
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   │   ├── auth/               # Auth components
│   │   │   ├── layout/             # Nav, Footer, Sidebar
│   │   │   ├── admin/              # Admin components
│   │   │   ├── cook/               # Chef components
│   │   │   ├── delivery/           # Delivery components
│   │   │   └── ui/                 # Shadcn/UI components
│   │   ├── pages/                  # Page components
│   │   │   ├── auth/               # Login, Register
│   │   │   ├── admin/              # Admin dashboard
│   │   │   ├── cook/               # Chef dashboard
│   │   │   ├── customer/           # Customer pages
│   │   │   └── delivery/           # Delivery dashboard
│   │   ├── services/               # API services
│   │   ├── store/                  # State management
│   │   ├── context/                # React Context
│   │   ├── hooks/                  # Custom hooks
│   │   ├── types/                  # TypeScript types
│   │   └── utils/                  # Utilities
│   ├── public/                     # Static assets
│   ├── package.json                # Dependencies
│   └── vite.config.ts              # Vite config
│
├── docs/                            # Additional documentation
├── README.md                        # This file
└── LICENSE                          # MIT License
```

---

## 🔐 Authentication & Security

### Authentication Flow

1. **Registration**: Multi-step process with email verification
2. **Email Verification**: OTP-based system (6-digit code)
3. **Role Selection**: Choose Customer, Chef, or Delivery Partner
4. **Document Upload**: Required for Chefs and Delivery Partners
5. **Admin Approval**: Manual review for privileged roles
6. **JWT Token Issuance**: Secure access and refresh tokens
7. **Automatic Token Refresh**: Seamless session management

### Security Features

- 🔒 **JWT Authentication** - Secure token-based auth
- 🔑 **Token Blacklisting** - Immediate revocation of compromised tokens
- 🛡️ **Rate Limiting** - Protection against brute force
- 🔐 **Account Locking** - Temporary suspension after failed attempts
- 🔄 **Password Hashing** - Bcrypt with Django's password validators
- 📧 **Email Verification** - OTP-based email confirmation
- 🚫 **CSRF Protection** - Cross-site request forgery prevention
- 🔍 **Input Validation** - Comprehensive form validation
- 📄 **Document Security** - Secure cloud storage with access control

---

## 🎨 Key Features Deep Dive

### Order Management System

- **Comprehensive Workflow**: Cart → Placed → Confirmed → Preparing → Ready → Out for Delivery → Delivered
- **Real-Time Updates**: Status changes broadcasted instantly
- **Payment Tracking**: Independent payment status management
- **Auto-Cancellation**: Unconfirmed orders automatically cancelled after 15 minutes
- **Delivery Fee Calculation**: Distance-based pricing with time surcharges

### Document Management

- **Drag & Drop Upload**: Intuitive file upload interface
- **Multi-Format Support**: PDF, JPG, PNG, JPEG
- **PDF Processing**: Automatic conversion to images with validation
- **Cloud Storage**: Secure Cloudinary integration
- **Admin Review**: Document visibility control
- **Proxy Download**: Secure document access

### AI-Powered Features

- **Smart Recommendations**: Personalized food suggestions
- **Chat Assistant**: Interactive help powered by Google Gemini
- **Automated Reports**: AI-generated insights for administrators
- **Natural Language Processing**: Enhanced search capabilities

### Delivery Partner Navigation

**Dual Navigation System**:
1. **Navigate (Google)**: Full-featured Google Maps with turn-by-turn directions
2. **Quick Navigate**: Integrated map modal with instant access

Features:
- 🗺️ Real-time traffic updates
- 🛣️ Route optimization
- 📍 Multi-point routing
- 📞 Direct contact integration
- 📍 Pickup location detection

---

## 📊 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | User registration |
| POST | `/api/auth/login/` | User login |
| POST | `/api/auth/logout/` | Logout & token revocation |
| POST | `/api/auth/token/refresh/` | Refresh JWT tokens |
| POST | `/api/auth/send-otp/` | Send verification OTP |
| POST | `/api/auth/verify-otp/` | Verify OTP |
| POST | `/api/auth/google/login/` | Google OAuth login |

### Document Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/documents/types/` | Get document types |
| POST | `/api/auth/documents/upload/` | Upload document |
| GET | `/api/auth/documents/` | Get user documents |
| DELETE | `/api/auth/documents/<id>/delete/` | Delete document |

### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/` | List orders |
| POST | `/api/orders/create/` | Create order |
| GET | `/api/orders/<id>/` | Get order details |
| PUT | `/api/orders/<id>/update/` | Update order status |
| DELETE | `/api/orders/<id>/cancel/` | Cancel order |

### Food Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/food/menus/` | List menus |
| GET | `/api/food/menus/<id>/` | Get menu details |
| POST | `/api/food/menus/create/` | Create menu (Chef) |
| GET | `/api/food/cuisines/` | List cuisines |

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
python manage.py test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Manual Testing Checklist

- [ ] User registration and email verification
- [ ] Document upload (PDF and images)
- [ ] Admin approval workflow
- [ ] Login (email/password and Google OAuth)
- [ ] Order creation and tracking
- [ ] Real-time status updates
- [ ] Payment processing
- [ ] Role-based dashboard access
- [ ] Navigation features (delivery partners)
- [ ] AI chat assistant

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `DEBUG=False` in environment variables
- [ ] Configure production database
- [ ] Set up SSL/HTTPS certificates
- [ ] Configure production email service
- [ ] Set up Google OAuth for production domain
- [ ] Configure Cloudinary for production
- [ ] Update CORS allowed origins
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Enable security headers
- [ ] Set up CDN for static files

### Docker Deployment (Optional)

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

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push """

Branch Strategy:
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical fixes

### Code Standards

- **Python**: Follow PEP 8 style guide
- **TypeScript**: Use strict mode and proper typing
- **React**: Use functional components with hooks
- **CSS**: Use Tailwind CSS utility classes
- **Commits**: Use conventional commit messages

---

## 📚 Documentation

### Additional Resources

- [API Documentation](docs/API.md) - Complete API reference
- [Google API Setup Guide](docs/GOOGLE_API_SETUP.md) - API configuration guide
- [Poppler Installation](backend/POPPLER_INSTALLATION.md) - PDF processing setup
- [Component Library](frontend/src/components/README.md) - UI components
- [Database Schema](docs/SCHEMA.md) - Database structure

### Troubleshooting

#### Common Issues

1. **Database Connection Error**
   - Check database credentials in `.env`
   - Ensure MySQL server is running
   - Verify database exists

2. **CORS Error**
   - Verify `CORS_ALLOWED_ORIGINS` in settings
   - Check frontend URL matches allowed origins

3. **Google OAuth Error**
   - Verify client ID and secret
   - Check authorized origins in Google Console
   - Ensure redirect URIs are configured

4. **Token Refresh Error**
   - Check JWT settings in settings.py
   - Verify token expiration times

5. **PDF Processing Error**
   - Install Poppler utilities
   - Verify Poppler is in PATH
   - See [Poppler Installation Guide](backend/POPPLER_INSTALLATION.md)

6. **Email Not Sending**
   - Check SMTP configuration
   - Verify Brevo credentials
   - Test with console backend first

#### Getting Help

- Check existing [Issues](https://github.com/yourusername/chefsync/issues)
- Create a new issue with detailed description
- Include error logs and environment details
- Provide steps to reproduce the issue

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Django** - Web framework for Python
- **React** - JavaScript library for UIs
- **Shadcn/UI** - Beautiful component library
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **Google Cloud** - Maps, OAuth, and AI services
- **Cloudinary** - Media management
- **Brevo** - Email service

---

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/chefsync/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/chefsync/discussions)
- **Email**: support@chefsync.com

---

<div align="center">

**Made with ❤️ by the ChefSync Team**

⭐ Star this repo if you find it helpful!

</div>
