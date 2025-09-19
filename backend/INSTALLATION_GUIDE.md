# ChefSync Backend Installation Guide

## Prerequisites

### System Requirements
- Python 3.11+
- Windows 10/11 (for Poppler installation)
- Git

### Required System Dependencies

#### 1. Poppler for Windows (Required for PDF processing)
**Installation Required:** See [POPPLER_INSTALLATION.md](POPPLER_INSTALLATION.md) for detailed setup instructions.

**Verify Installation:**
```bash
pdftoppm -h
```

## Python Dependencies Installation

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Verify PDF Processing Dependencies
```bash
python -c "import PyPDF2; print('✅ PyPDF2 installed')"
python -c "from pdf2image import convert_from_bytes; print('✅ pdf2image installed')"
python -c "import cloudinary; print('✅ cloudinary installed')"
```

## Environment Configuration

### 1. Create Environment File
Copy `env.example` to `.env` and configure:
```bash
cp env.example .env
```

### 2. Required Environment Variables
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=your-database-url
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

## Database Setup

### 1. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 2. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

## Testing Installation

### 1. Test PDF Processing
```bash
python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from apps.authentication.services.pdf_service import PDFService
service = PDFService()
print('✅ PDF Service working with Poppler path:', service.poppler_path)
"
```

### 2. Start Development Server
```bash
python manage.py runserver
```

## Troubleshooting

### Common Issues

#### 1. "No module named 'PyPDF2'"
```bash
pip install PyPDF2==3.0.1
```

#### 2. "pdf2image" import error
```bash
pip install pdf2image==1.17.0
```

#### 3. "Poppler not found" error
- See [POPPLER_INSTALLATION.md](POPPLER_INSTALLATION.md) for complete setup guide
- Restart your terminal/IDE after installation

#### 4. Cloudinary connection issues
- Verify environment variables in `.env`
- Check Cloudinary credentials
- Ensure internet connection

### Verification Commands

```bash
# Check Python packages
pip list | grep -E "(PyPDF2|pdf2image|cloudinary)"

# Check Django setup
python manage.py check
```

## Production Deployment

### 1. Environment Variables
Set production environment variables:
```env
DEBUG=False
SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=your-domain.com
```

### 2. Static Files
```bash
python manage.py collectstatic
```

### 3. Database
Ensure production database is configured and migrations are applied.

## Support

If you encounter issues:
1. Check this installation guide
2. Verify all dependencies are installed
3. Check the troubleshooting section
4. Review error logs in the Django console

## Dependencies Summary

### Core Django
- Django==5.2.5
- djangorestframework==3.16.1
- djangorestframework-simplejwt==5.5.1

### Authentication
- django-allauth==65.11.1
- google-auth==2.40.3
- PyJWT==2.10.1

### File Processing
- Pillow==10.4.0
- pdf2image==1.17.0
- PyPDF2==3.0.1

### Cloud Storage
- cloudinary==1.41.0
- django-cloudinary-storage==0.3.0

### System Dependencies
- Poppler utilities (Windows binary)
- Python 3.11+
