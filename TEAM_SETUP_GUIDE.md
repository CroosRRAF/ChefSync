# 🚀 ChefSync Team Setup Guide

This guide will help team members set up the ChefSync project after cloning from GitHub.

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- MySQL/PostgreSQL database
- Git

## 🔧 Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
python -m venv venv
```

### 3. Activate Virtual Environment
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Environment Configuration
Create a `.env` file in the backend directory with the following variables:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=your-database-url
FRONTEND_URL=http://localhost:8080
DEFAULT_FROM_EMAIL=your-email@example.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-app-password
```

### 6. Database Setup
```bash
# Create database migrations
python manage.py makemigrations

# Apply all migrations (including referral system)
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 7. Load Sample Data (Optional)
```bash
python manage.py loaddata sample_data.json
```

### 8. Start Backend Server
```bash
python manage.py runserver
```

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the frontend directory:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
```

### 4. Start Frontend Server
```bash
npm run dev
```

## 🔄 Migration Status

The project includes the following migrations that will be applied automatically:

### Authentication App Migrations:
- ✅ `0001_initial` - Initial user and authentication models
- ✅ `0002_alter_user_role` - User role field updates
- ✅ `0003_jwttoken_campaign_name_jwttoken_max_uses_and_more` - Referral system fields
- ✅ `0004_update_role_choices` - Updated role choices including `delivery_agent`

### Key Features Included:
- ✅ **Referral System** - Complete referral tracking with JWT tokens
- ✅ **Role Support** - All user roles including `delivery_agent`
- ✅ **Approval System** - Admin approval for cooks and delivery agents
- ✅ **Email Notifications** - Approval and referral emails
- ✅ **JWT Authentication** - Secure token-based authentication

## 🐛 Common Issues & Solutions

### Issue 1: "delivery_agent is not a valid choice"
**Solution**: Run migrations to update role choices
```bash
python manage.py migrate authentication
```

### Issue 2: "orders is not defined" in DeliveryDashboard
**Solution**: This has been fixed in the latest code. Make sure you have the latest version.

### Issue 3: 401 Unauthorized on approval status
**Solution**: This has been fixed. The endpoint now supports both authenticated and unauthenticated requests.

### Issue 4: Token key mismatches
**Solution**: All token keys have been standardized to `access_token`. Clear localStorage if needed.

## 🧪 Testing the Setup

### 1. Test User Registration
- Go to `http://localhost:8080/auth/register`
- Try registering with different roles: `customer`, `cook`, `delivery_agent`
- Verify that `delivery_agent` role is accepted

### 2. Test Admin Approval
- Login as admin
- Go to `/admin/approvals`
- Verify you can see pending cook and delivery agent applications
- Test approval/rejection functionality

### 3. Test Referral System
- Create a referral token via API
- Test referral registration flow
- Verify referral tracking works

## 📁 Project Structure

```
ChefSync/
├── backend/
│   ├── apps/
│   │   ├── authentication/     # User auth, referrals, approvals
│   │   ├── admin_management/   # Admin functionality
│   │   ├── orders/            # Order management
│   │   └── ...
│   ├── config/                # Django settings
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API services
│   │   └── ...
│   └── package.json
└── README.md
```

## 🔐 Default Admin Credentials

After running migrations and creating a superuser, you can:
1. Login as admin
2. Access admin panel at `/admin/`
3. Manage user approvals at `/admin/approvals`

## 📞 Support

If you encounter any issues:
1. Check this guide first
2. Verify all migrations are applied
3. Check the console for error messages
4. Contact the development team

## 🎉 Success!

Once everything is set up, you should be able to:
- ✅ Register users with all roles
- ✅ Admin can approve/reject applications
- ✅ Referral system works
- ✅ All dashboards load without errors
- ✅ Email notifications work

Happy coding! 🚀
