# ChefSync Backend

Django REST Framework backend for ChefSync application.

## Setup Instructions

### 1. Prerequisites
- Python 3.8+
- MySQL Server
- Virtual environment (recommended)

### 2. Installation

1. **Clone the repository and navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Update the following variables in `.env`:
     ```
     DEBUG=True
     SECRET_KEY=your-secret-key-here
     DB_NAME=chefsync_db
     DB_USER=your_mysql_username
     DB_PASSWORD=your_mysql_password
     DB_HOST=localhost
     DB_PORT=3306
     ```

5. **Create MySQL database:**
   ```sql
   CREATE DATABASE chefsync_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

6. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

7. **Create superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

8. **Run the development server:**
   ```bash
   python manage.py runserver
   ```

## API Endpoints

- **Admin Panel:** `/admin/`
- **Authentication:**
  - `POST /api/auth/register/` - User registration
  - `POST /api/auth/login/` - User login
  - `POST /api/auth/logout/` - User logout
  - `GET /api/auth/profile/` - Get user profile
  - `PUT /api/auth/profile/update/` - Update user profile

## Project Structure

```
backend/
├── config/           # Django project settings
├── apps/            # Application modules
│   └── authentication/  # Authentication app
├── requirements.txt  # Python dependencies
├── .env             # Environment variables
└── README.md        # This file
```

## Technologies Used

- Django 5.2.5
- Django REST Framework 3.16.1
- MySQL Database
- CORS Headers
- Python Decouple
