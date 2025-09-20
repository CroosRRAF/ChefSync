from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='users')

app_name = 'authentication'

urlpatterns = [
    # API Router
    path('', include(router.urls)),
    
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
    
    # Token Management endpoints
    path('tokens/', views.user_tokens, name='user_tokens'),
    path('tokens/revoke/', views.revoke_token, name='revoke_token'),
    path('tokens/revoke-all/', views.revoke_all_tokens, name='revoke_all_tokens'),
    
    # Admin Approval Management
    path('admin/pending-approvals/', views.pending_approvals, name='pending_approvals'),
    path('admin/approve-cook/<int:user_id>/', views.approve_cook, name='approve_cook'),
    path('admin/approve-delivery-agent/<int:user_id>/', views.approve_delivery_agent, name='approve_delivery_agent'),
    
    # Document Management
    path('documents/types/', views.get_document_types, name='get_document_types'),
    path('documents/upload/', views.upload_document, name='upload_document'),
    path('documents/upload-registration/', views.upload_document_during_registration, name='upload_document_during_registration'),
    path('documents/', views.get_user_documents, name='get_user_documents'),
    path('documents/<int:document_id>/delete/', views.delete_document, name='delete_document'),
    path('documents/proxy-download/', views.proxy_document_download, name='proxy_document_download'),
    
    # Admin Approval Management
    path('admin/pending-approvals/', views.get_pending_approvals, name='get_pending_approvals'),
    path('admin/user/<int:user_id>/', views.get_user_for_approval, name='get_user_for_approval'),
    path('admin/user/<int:user_id>/approve/', views.approve_user, name='approve_user'),
    path('approval-status/', views.check_approval_status, name='check_approval_status'),
    path('check-user-status/', views.check_user_status, name='check_user_status'),
    path('check-email-availability/', views.check_email_availability, name='check_email_availability'),
]
