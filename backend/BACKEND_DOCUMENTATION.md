# ChefSync Backend Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [Authentication System](#authentication-system)
- [App Modules](#app-modules)
- [Configuration](#configuration)
- [Utilities](#utilities)
- [Development Guidelines](#development-guidelines)

## Overview

ChefSync backend is a Django REST Framework application that powers a comprehensive food delivery platform. It provides APIs for user authentication, food management, order processing, payments, and analytics.

**Version**: Django 5.2.5  
**Database**: MySQL 8.0+  
**Python**: 3.11+

## Technology Stack

### Core Framework
- **Django**: 5.2.5
- **Django REST Framework**: API development
- **SimpleJWT**: JWT authentication

### Database
- **MySQL**: 8.0+ (primary database)
- **Database Driver**: mysqlclient

### Third-Party Services
- **Cloudinary**: Image and document storage
- **Brevo SMTP**: Email service
- **Google OAuth**: Social authentication

### Additional Libraries
- **django-cors-headers**: CORS support
- **django-ratelimit**: API rate limiting
- **python-decouple**: Environment configuration
- **Pillow**: Image processing

## Project Structure

```
backend/
├── apps/                           # Django applications
│   ├── authentication/            # User auth & management
│   │   ├── models.py             # User, JWT, OTP, Documents
│   │   ├── views.py              # Auth endpoints
│   │   ├── serializers.py        # Data serialization
│   │   ├── permissions.py        # Custom permissions
│   │   └── services/             # Business logic
│   ├── food/                      # Food catalog
│   │   ├── models.py             # Food, Cuisine, Category, Price
│   │   ├── views.py              # Food endpoints
│   │   └── cloudinary_fields.py  # Custom field types
│   ├── orders/                    # Order management
│   │   ├── models.py             # Order, OrderItem, Cart
│   │   └── views.py              # Order processing
│   ├── payments/                  # Payment processing
│   │   ├── models.py             # Payment, Refund, Transaction
│   │   └── views.py              # Payment endpoints
│   ├── users/                     # User profiles
│   │   ├── models.py             # Profile, Address models
│   │   └── views.py              # Profile management
│   ├── analytics/                 # Analytics & reporting
│   │   ├── models.py             # System settings, logs
│   │   └── views.py              # Analytics endpoints
│   ├── communications/            # Notifications & messaging
│   │   ├── models.py             # Contact, Notification
│   │   └── views.py              # Communication endpoints
│   └── admin_management/          # Admin features
├── config/                        # Project configuration
│   ├── settings.py               # Django settings
│   ├── urls.py                   # URL routing
│   ├── wsgi.py                   # WSGI config
│   ├── asgi.py                   # ASGI config
│   └── middleware.py             # Custom middleware
├── templates/                     # Email templates
│   └── emails/
│       ├── otp_email_beautiful.html
│       └── approval_email_beautiful.html
├── utils/                         # Utility functions
│   └── cloudinary_utils.py       # Cloudinary helpers
├── scripts/                       # Management scripts
├── manage.py                      # Django management
└── requirements.txt               # Python dependencies
```

## Database Models

### Authentication App

#### User Model (`apps.authentication.models.User`)
```python
# Core user model extending Django's AbstractUser
Fields:
  - user_id (AutoField): Primary key
  - name (CharField): User's full name
  - email (EmailField, unique): Login email
  - phone_no (CharField): Contact number
  - gender (CharField): Male/Female/Other
  - address (TextField): Full address
  - role (CharField): customer/cook/delivery_agent/admin
  - profile_image (BinaryField): User avatar
  - email_verified (Boolean): Email verification status
  - approval_status (CharField): pending/approved/rejected
  - approved_by (ForeignKey): Admin who approved
  - approved_at (DateTime): Approval timestamp
  - failed_login_attempts (Integer): Security tracking
  - account_locked (Boolean): Account lock status
  - referral_code (CharField, unique): User's referral code
  - referred_by (ForeignKey): Referrer user
  - total_referrals (Integer): Referral count
  - referral_rewards_earned (Decimal): Rewards earned
  
Methods:
  - create_profile(): Create role-specific profile
  - can_login(): Check if user can login
  - generate_referral_code(): Generate unique referral code
  - increment_failed_login(): Track login attempts
```

#### JWTToken Model (`apps.authentication.models.JWTToken`)
```python
# JWT token storage for enhanced security
Fields:
  - user (ForeignKey): Token owner
  - token_hash (CharField, unique): SHA-256 hash
  - token_type (CharField): access/refresh/referral
  - jti (CharField, unique): JWT ID
  - expires_at (DateTime): Expiration time
  - is_revoked (Boolean): Revocation status
  - is_blacklisted (Boolean): Blacklist status
  - ip_address (GenericIPAddress): Client IP
  - user_agent (TextField): Browser info
  - usage_count (Integer): Usage tracking
  
Methods:
  - is_valid(): Check token validity
  - revoke(): Revoke token
  - cleanup_expired_tokens(): Remove expired tokens
```

#### EmailOTP Model (`apps.authentication.models.EmailOTP`)
```python
# OTP verification system
Fields:
  - email (EmailField): Target email
  - otp (CharField): 6-digit code
  - purpose (CharField): registration/password_reset
  - expires_at (DateTime): Expiration time
  - is_used (Boolean): Usage status
  - attempts (Integer): Verification attempts
  
Methods:
  - generate_otp(): Generate 6-digit OTP
  - is_valid(): Check OTP validity
  - mark_as_used(): Mark OTP as used
```

#### DocumentType Model (`apps.authentication.models.DocumentType`)
```python
# Document type definitions
Fields:
  - name (CharField): Document name
  - category (CharField): cook/delivery_agent
  - description (TextField): Document description
  - is_required (Boolean): Required status
  - allowed_file_types (JSONField): Allowed extensions
  - max_file_size_mb (Integer): Size limit
  - is_single_page_only (Boolean): Page restriction
```

#### UserDocument Model (`apps.authentication.models.UserDocument`)
```python
# User uploaded documents
Fields:
  - user (ForeignKey): Document owner
  - document_type (ForeignKey): Type reference
  - file (URLField): Cloudinary URL
  - file_name (CharField): Original filename
  - file_size (BigInteger): File size in bytes
  - status (CharField): pending/approved/rejected
  - admin_notes (TextField): Review notes
  - reviewed_by (ForeignKey): Reviewer admin
  - cloudinary_public_id (CharField): Cloudinary ID
  - is_pdf_converted (Boolean): PDF conversion flag
```

### Food App

#### Cuisine Model (`apps.food.models.Cuisine`)
```python
# Cuisine categories
Fields:
  - name (CharField, unique): Cuisine name
  - description (TextField): Description
  - image (CloudinaryImageField): Cuisine image
  - is_active (Boolean): Active status
  - sort_order (Integer): Display order
```

#### FoodCategory Model (`apps.food.models.FoodCategory`)
```python
# Food categories within cuisines
Fields:
  - name (CharField): Category name
  - cuisine (ForeignKey): Parent cuisine
  - description (TextField): Description
  - image (CloudinaryImageField): Category image
  - is_active (Boolean): Active status
  - sort_order (Integer): Display order
```

#### Food Model (`apps.food.models.Food`)
```python
# Food items
Fields:
  - food_id (AutoField): Primary key
  - name (CharField): Food name
  - category (CharField): Category name
  - description (TextField): Description
  - image (CloudinaryImageField): Primary image
  - status (CharField): Pending/Approved/Rejected
  - admin (ForeignKey): Approving admin
  - chef (ForeignKey): Food creator
  - food_category (ForeignKey): Category reference
  - is_available (Boolean): Availability
  - is_featured (Boolean): Featured status
  - preparation_time (Integer): Minutes
  - calories_per_serving (Integer): Calorie count
  - ingredients (JSONField): Ingredient list
  - allergens (JSONField): Allergen list
  - is_vegetarian (Boolean): Vegetarian flag
  - is_vegan (Boolean): Vegan flag
  - spice_level (CharField): Spice intensity
  - rating_average (Decimal): Average rating
  - total_reviews (Integer): Review count
  - total_orders (Integer): Order count
  
Properties:
  - image_url: Get primary image URL
  - optimized_image_url: Get optimized URL
  - thumbnail_url: Get thumbnail URL
```

#### FoodPrice Model (`apps.food.models.FoodPrice`)
```python
# Food pricing with size variations
Fields:
  - price_id (AutoField): Primary key
  - size (CharField): Small/Medium/Large
  - price (Decimal): Price amount
  - preparation_time (Integer): Prep time for size
  - food (ForeignKey): Food reference
  - cook (ForeignKey): Cook reference
  
Unique Together: (food, size, cook)
```

#### FoodReview Model (`apps.food.models.FoodReview`)
```python
# Customer reviews
Fields:
  - review_id (AutoField): Primary key
  - rating (Integer): 1-5 stars
  - comment (TextField): Review text
  - price (ForeignKey): FoodPrice reference
  - customer (ForeignKey): Reviewer
  - order (ForeignKey): Related order
  - taste_rating (Integer): Taste score
  - presentation_rating (Integer): Presentation score
  - value_rating (Integer): Value score
  - is_verified_purchase (Boolean): Verification
  - helpful_votes (Integer): Helpfulness count
```

### Orders App

#### Order Model (`apps.orders.models.Order`)
```python
# Complete order management
Fields:
  - order_number (CharField, unique): Order ID
  - customer (ForeignKey): Customer reference
  - chef (ForeignKey): Chef reference
  - delivery_partner (ForeignKey): Delivery agent
  - status (CharField): Order status
    * cart, pending, confirmed, preparing, ready
    * out_for_delivery, delivered, cancelled, refunded
  - payment_status (CharField): Payment state
  - payment_method (CharField): Payment type
  - subtotal (Decimal): Items subtotal
  - tax_amount (Decimal): Tax amount
  - delivery_fee (Decimal): Delivery charge
  - discount_amount (Decimal): Discount applied
  - total_amount (Decimal): Final total
  - delivery_address (TextField): Address text
  - delivery_address_new (ForeignKey): Address reference
  - delivery_latitude (Decimal): Location lat
  - delivery_longitude (Decimal): Location lng
  - distance_km (Decimal): Delivery distance
  - kitchen_location (ForeignKey): Kitchen address
  - estimated_delivery_time (DateTime): ETA
  - customer_notes (TextField): Special instructions
  
Methods:
  - generate_order_number(): Create unique ID
  - calculate_delivery_fee(distance): Fee calculation
  - calculate_tax(subtotal): Tax calculation
  - get_delivery_address(): Get address object
  - calculate_distance(): Haversine distance
```

#### OrderItem Model (`apps.orders.models.OrderItem`)
```python
# Items in an order
Fields:
  - order_item_id (AutoField): Primary key
  - order (ForeignKey): Order reference
  - price (ForeignKey): FoodPrice reference
  - quantity (Integer): Item quantity
  - unit_price (Decimal): Price per item
  - total_price (Decimal): Item total
  - special_instructions (TextField): Item notes
  - food_name (CharField): Food name snapshot
  
Unique Together: (order, price)
```

#### CartItem Model (`apps.orders.models.CartItem`)
```python
# Shopping cart
Fields:
  - customer (ForeignKey): Cart owner
  - price (ForeignKey): FoodPrice reference
  - quantity (Integer): Item quantity
  - special_instructions (TextField): Item notes
  
Properties:
  - total_price: Calculate item total
  
Unique Together: (customer, price)
```

#### Delivery Model (`apps.orders.models.Delivery`)
```python
# Delivery tracking
Fields:
  - delivery_id (AutoField): Primary key
  - status (CharField): Pending/On the way/Delivered
  - delivery_time (DateTime): Delivery timestamp
  - address (TextField): Delivery address
  - order (OneToOneField): Order reference
  - agent (ForeignKey): Delivery agent
```

### Payments App

#### Payment Model (`apps.payments.models.Payment`)
```python
# Payment records
Fields:
  - payment_id (CharField, unique): Payment ID
  - order (ForeignKey): Order reference
  - amount (Decimal): Payment amount
  - currency (CharField): Currency code
  - payment_method (CharField): Payment type
  - payment_provider (CharField): Provider name
  - status (CharField): Payment status
  - provider_payment_id (CharField): Provider ID
  - provider_response (JSONField): API response
  - metadata (JSONField): Additional data
```

#### Refund Model (`apps.payments.models.Refund`)
```python
# Refund records
Fields:
  - refund_id (CharField, unique): Refund ID
  - payment (ForeignKey): Payment reference
  - amount (Decimal): Refund amount
  - reason (CharField): Refund reason
  - status (CharField): Refund status
  - processed_by (ForeignKey): Admin reference
```

### Users App

#### Address Model (`apps.users.models.Address`)
```python
# Base address model
Fields:
  - user (ForeignKey): Address owner
  - address_type (CharField): customer/kitchen/delivery_agent
  - label (CharField): Address label
  - address_line1 (CharField): Street address
  - address_line2 (CharField): Apt/Floor
  - landmark (CharField): Nearby landmark
  - city (CharField): City name
  - state (CharField): State name
  - country (CharField): Country name
  - pincode (CharField): 6-digit code
  - latitude (Decimal): GPS latitude
  - longitude (Decimal): GPS longitude
  - is_default (Boolean): Default flag
  - is_active (Boolean): Active status
  
Properties:
  - full_address: Formatted address string
  
Unique Together: (user, address_type, label)
```

#### CustomerAddress Model (`apps.users.models.CustomerAddress`)
```python
# Extended customer address
Fields:
  - address (OneToOneField): Base address
  - contact_name (CharField): Contact person
  - mobile_number (CharField): Phone number
  - alternate_mobile (CharField): Alt phone
  - delivery_instructions (TextField): Special notes
  - gate_code (CharField): Access code
  - building_type (CharField): House/Apartment
  - floor_number (CharField): Floor info
```

#### KitchenLocation Model (`apps.users.models.KitchenLocation`)
```python
# Kitchen location details
Fields:
  - address (OneToOneField): Base address
  - kitchen_name (CharField): Kitchen name
  - kitchen_type (CharField): home/commercial/restaurant
  - contact_number (CharField): Contact phone
  - operating_hours (JSONField): Hours by day
  - max_orders_per_day (Integer): Capacity
  - delivery_radius_km (Integer): Service radius
  - has_parking (Boolean): Parking availability
  - is_verified (Boolean): Verification status
```

### Analytics App

#### SystemSettings Model (`apps.analytics.models.SystemSettings`)
```python
# System configuration
Fields:
  - key (CharField, unique): Setting identifier
  - value (TextField): Setting value (JSON)
  - setting_type (CharField): Category
  - description (TextField): Setting description
  - is_active (Boolean): Active status
```

#### Notification Model (`apps.analytics.models.Notification`)
```python
# User notifications
Fields:
  - user (ForeignKey): Notification recipient
  - title (CharField): Notification title
  - message (TextField): Notification content
  - type (CharField): Notification type
  - is_read (Boolean): Read status
```

### Communications App

#### Communication Model (`apps.communications.models.Communication`)
```python
# Communication management
Fields:
  - user (ForeignKey): Communication sender
  - communication_type (CharField): Type of communication
  - subject (CharField): Subject line
  - message (TextField): Message content
  - reference_number (CharField, unique): Reference ID
  - status (CharField): Status
  - priority (CharField): Priority level
  - assigned_to (ForeignKey): Assigned admin
  
Methods:
  - mark_as_read(): Mark as read
  - assign_to(user): Assign to user
  - resolve(notes): Resolve communication
```

## API Endpoints

### Authentication (`/api/auth/`)

#### User Registration
```
POST /api/auth/register/
Body: {
  name: string
  email: string
  password: string
  confirm_password: string
  phone_no: string
  role: "customer" | "cook" | "delivery_agent"
  address?: string
  referral_token?: string
}
Response: {
  message: string
  user_id: string
}
```

#### User Login
```
POST /api/auth/login/
Body: {
  email: string
  password: string
}
Response: {
  message: string
  access: string (JWT)
  refresh: string (JWT)
  user: UserObject
}
```

#### Token Refresh
```
POST /api/auth/token/refresh/
Body: {
  refresh: string
}
Response: {
  access: string
  refresh: string
}
```

#### Send OTP
```
POST /api/auth/send-otp/
Body: {
  email: string
  purpose: "registration" | "password_reset"
}
Response: {
  message: string
}
```

#### Verify OTP
```
POST /api/auth/verify-otp/
Body: {
  email: string
  otp: string
}
Response: {
  message: string
  verified: boolean
}
```

#### Google OAuth Login
```
POST /api/auth/google/login/
Body: {
  access_token: string
  id_token: string
}
Response: {
  access: string
  refresh: string
  user: UserObject
}
```

#### Get User Profile
```
GET /api/auth/profile/
Headers: {
  Authorization: Bearer <token>
}
Response: UserObject
```

#### Update Profile
```
PUT /api/auth/profile/update/
Headers: {
  Authorization: Bearer <token>
}
Body: Partial<UserObject>
Response: {
  message: string
  user: UserObject
}
```

#### Document Management
```
GET /api/auth/documents/types/?role=cook
Response: DocumentType[]

POST /api/auth/documents/upload/
Body: FormData {
  document_type_id: number
  file: File
}
Response: {
  message: string
  document: DocumentObject
}

GET /api/auth/documents/
Response: DocumentObject[]

DELETE /api/auth/documents/<id>/delete/
Response: {
  message: string
}
```

#### Admin Approval
```
GET /api/auth/admin/pending-approvals/
Response: {
  pending_cooks: UserObject[]
  pending_delivery_agents: UserObject[]
}

POST /api/auth/admin/user/<id>/approve/
Body: {
  action: "approve" | "reject"
  notes?: string
}
Response: {
  message: string
}

GET /api/auth/approval-status/
Response: {
  approval_status: string
  message: string
}
```

### Food Management (`/api/food/`)

#### List Cuisines
```
GET /api/food/cuisines/
Response: Cuisine[]
```

#### List Categories
```
GET /api/food/categories/?cuisine_id=1
Response: FoodCategory[]
```

#### List Food Items
```
GET /api/food/
Query Params:
  - cuisine_id?: number
  - category_id?: number
  - is_featured?: boolean
  - search?: string
  - page?: number
Response: {
  count: number
  next: string | null
  previous: string | null
  results: Food[]
}
```

#### Get Food Details
```
GET /api/food/<id>/
Response: FoodObject with prices
```

#### Create Food (Cook/Admin)
```
POST /api/food/
Headers: {
  Authorization: Bearer <token>
}
Body: FormData {
  name: string
  description: string
  category_id: number
  image: File
  ingredients: string (JSON array)
  ...
}
Response: FoodObject
```

#### Get Food Prices
```
GET /api/food/<food_id>/prices/
Response: FoodPrice[]
```

#### Add/Update Price
```
POST /api/food/<food_id>/prices/
Body: {
  size: "Small" | "Medium" | "Large"
  price: number
  preparation_time: number
}
Response: FoodPrice
```

### Order Management (`/api/orders/`)

#### Create Order
```
POST /api/orders/create/
Body: {
  chef_id: number
  items: Array<{
    price_id: number
    quantity: number
    special_instructions?: string
  }>
  delivery_address_id: number
  payment_method: string
  customer_notes?: string
}
Response: OrderObject
```

#### Get Orders
```
GET /api/orders/
Query Params:
  - status?: string
  - role?: string (customer/chef/delivery_agent)
Response: Order[]
```

#### Update Order Status
```
PATCH /api/orders/<id>/status/
Body: {
  status: string
  notes?: string
}
Response: OrderObject
```

#### Cart Management
```
GET /api/orders/cart/
POST /api/orders/cart/add/
Body: {
  price_id: number
  quantity: number
}
PATCH /api/orders/cart/<item_id>/
Body: {
  quantity: number
}
DELETE /api/orders/cart/<item_id>/
POST /api/orders/cart/clear/
```

### Payment Processing (`/api/payments/`)

#### Create Payment
```
POST /api/payments/create/
Body: {
  order_id: number
  payment_method: string
  amount: number
}
Response: PaymentObject
```

#### Process Payment
```
POST /api/payments/<id>/process/
Body: {
  provider_data: object
}
Response: PaymentObject
```

### Analytics (`/api/analytics/`)

#### Dashboard Stats
```
GET /api/analytics/dashboard/
Response: {
  total_orders: number
  total_revenue: number
  active_users: number
  pending_approvals: number
}
```

#### Sales Report
```
GET /api/analytics/sales/
Query Params:
  - start_date: string
  - end_date: string
  - group_by: "day" | "week" | "month"
Response: SalesData[]
```

### Communications (`/api/communications/`)

#### Send Message
```
POST /api/communications/send/
Body: {
  communication_type: string
  subject: string
  message: string
}
Response: CommunicationObject
```

#### Get Notifications
```
GET /api/communications/notifications/
Response: Notification[]
```

## Authentication System

### JWT Token Flow

1. **User Login**
   - User submits credentials
   - Backend validates and creates JWT tokens
   - Access token (15 min) and refresh token (7 days) returned
   - Tokens stored in database with hash

2. **Token Refresh**
   - Frontend sends refresh token before access token expires
   - Backend validates refresh token
   - New access token issued
   - Optional refresh token rotation

3. **Token Revocation**
   - On logout, tokens marked as revoked
   - Blacklist mechanism for compromised tokens
   - Automatic cleanup of expired tokens

### Email Verification

1. **OTP Generation**
   - 6-digit OTP created
   - Stored with expiration (30 minutes)
   - Beautiful HTML email sent

2. **OTP Validation**
   - User submits OTP
   - Backend validates code and expiration
   - Max 3 attempts allowed

### Document Upload & Approval

1. **Document Upload**
   - Files uploaded to Cloudinary
   - PDF converted to images if needed
   - Document metadata stored in database

2. **Admin Review**
   - Admin views pending documents
   - Approves or rejects with notes
   - Notification sent to user

3. **User Status**
   - Customers: Auto-approved
   - Cooks/Delivery Agents: Pending approval required
   - Access restricted until approved

### Role-Based Access

```python
# Permission classes
class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'admin'

class IsChef(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['cook', 'Cook']

class IsDeliveryAgent(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['delivery_agent', 'DeliveryAgent']
```

## Configuration

### Environment Variables (`.env`)

```env
# Django Settings
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=chefsync_db
DB_USER=root
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=3306

# Email (Brevo SMTP)
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=your-smtp-password
DEFAULT_FROM_EMAIL=noreply@chefsync.com
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT
JWT_SECRET_KEY=your-jwt-secret

# OTP
OTP_EXPIRY_MINUTES=30
OTP_LENGTH=6

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081

# Frontend URL
FRONTEND_URL=http://localhost:8081
```

### Django Settings Highlights

```python
# settings.py

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'SIGNING_KEY': JWT_SIGNING_KEY,
    'ALGORITHM': 'HS256',
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    'http://localhost:8081',
    'http://127.0.0.1:8081',
]
CORS_ALLOW_CREDENTIALS = True

# Cloudinary Configuration
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': config('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': config('CLOUDINARY_API_KEY'),
    'API_SECRET': config('CLOUDINARY_API_SECRET'),
    'SECURE': True,
}
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# Custom User Model
AUTH_USER_MODEL = 'authentication.User'
```

## Utilities

### Cloudinary Utilities (`utils/cloudinary_utils.py`)

```python
def get_optimized_url(image_url, width=None, height=None):
    """Get optimized Cloudinary URL with transformations"""
    
def upload_to_cloudinary(file, folder='general'):
    """Upload file to Cloudinary"""
    
def delete_from_cloudinary(public_id):
    """Delete file from Cloudinary"""
```

### Email Service

```python
# Beautiful HTML email templates
templates/emails/otp_email_beautiful.html
templates/emails/approval_email_beautiful.html

# Email sending function
from django.core.mail import send_mail
from django.template.loader import render_to_string

def send_otp_email(email, otp, username):
    html_message = render_to_string('emails/otp_email_beautiful.html', {
        'username': username,
        'otp': otp,
    })
    send_mail(
        subject='Your OTP Code - ChefSync',
        message='',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        html_message=html_message,
    )
```

## Development Guidelines

### Running the Server

```bash
# Activate virtual environment
cd backend
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

### Database Migrations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migrations
python manage.py showmigrations
```

### Creating Custom Management Commands

```bash
# Structure
apps/<app_name>/management/commands/<command_name>.py

# Example
python manage.py create_sample_data
```

### API Testing

```bash
# Using curl
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Using httpie
http POST http://localhost:8000/api/auth/login/ \
  email=user@example.com password=password123
```

### Code Style

```python
# Follow PEP 8
# Use type hints
def get_user_by_email(email: str) -> Optional[User]:
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None

# Use docstrings
def create_order(customer: User, items: List[Dict]) -> Order:
    """
    Create a new order for a customer.
    
    Args:
        customer: The customer placing the order
        items: List of order items with price_id and quantity
        
    Returns:
        The created Order instance
        
    Raises:
        ValidationError: If items are invalid
    """
    pass
```

### Error Handling

```python
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.response import Response
from rest_framework import status

# Standard error response format
{
    "error": "Error message",
    "details": {
        "field": ["Error details"]
    },
    "code": "error_code"
}

# Example
def custom_view(request):
    try:
        # Logic here
        pass
    except ValidationError as e:
        return Response({
            'error': str(e),
            'code': 'validation_error'
        }, status=status.HTTP_400_BAD_REQUEST)
```

### Security Best Practices

1. **Never commit sensitive data**
   - Use `.env` for secrets
   - Add `.env` to `.gitignore`

2. **Validate all inputs**
   - Use serializers for validation
   - Sanitize user input

3. **Implement rate limiting**
   ```python
   from django_ratelimit.decorators import ratelimit
   
   @ratelimit(key='ip', rate='10/m')
   def api_endpoint(request):
       pass
   ```

4. **Use HTTPS in production**
   ```python
   # settings.py
   SECURE_SSL_REDIRECT = True
   SESSION_COOKIE_SECURE = True
   CSRF_COOKIE_SECURE = True
   ```

## Additional Resources

- **Django Documentation**: https://docs.djangoproject.com/
- **DRF Documentation**: https://www.django-rest-framework.org/
- **Cloudinary Python**: https://cloudinary.com/documentation/django_integration
- **SimpleJWT**: https://django-rest-framework-simplejwt.readthedocs.io/

---

**Last Updated**: October 7, 2025  
**Version**: 1.0.0