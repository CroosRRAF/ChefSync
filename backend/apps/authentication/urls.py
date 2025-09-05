from django.urls import path
from . import views

app_name = 'authentication'

urlpatterns = [
    # Health Check
    path('health/', views.health_check, name='health_check'),
    
    # Basic Authentication
    path('register/', views.user_registration, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    
    # JWT Token Management
    path('token/refresh/', views.token_refresh, name='token_refresh'),
    
    # Email Verification
    path('verify-email/', views.verify_email, name='verify_email'),
    
    # Password Management
    path('password/change/', views.change_password, name='change_password'),
    path('password/reset/request/', views.request_password_reset, name='request_password_reset'),
    path('password/reset/confirm/', views.confirm_password_reset, name='confirm_password_reset'),
    
    # Google OAuth
    path('google/login/', views.google_oauth_login, name='google_oauth_login'),
    
    # User Profile
    path('profile/', views.user_profile, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    
    # Profile Creation
    path('customer/create/', views.create_customer_profile, name='create_customer'),
    path('cook/create/', views.create_cook_profile, name='create_cook'),
    path('delivery-agent/create/', views.create_delivery_agent_profile, name='create_delivery_agent'),
    
    # OTP Verification for Registration
    path('send-otp/', views.send_otp, name='send_otp'),
    path('verify-otp/', views.verify_otp, name='verify_otp'),
    path('complete-registration/', views.complete_registration, name='complete_registration'),
]
