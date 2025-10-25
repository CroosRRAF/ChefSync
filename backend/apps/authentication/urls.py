from django.urls import include, path
from rest_framework.routers import DefaultRouter

# Import views using try-except to handle different environments
try:
    from . import views
except ImportError:
    from apps.authentication import views

router = DefaultRouter()
router.register(r"users", views.UserViewSet, basename="users")

app_name = "authentication"

urlpatterns = [
    # API Router
    path("", include(router.urls)),
    # Health Check
    path("health/", views.health_check, name="health_check"),
    # CSRF Token
    path("csrf-token/", views.csrf_token, name="csrf_token"),
    # Basic Authentication
    path("register/", views.user_registration, name="register"),
    path("login/", views.user_login, name="login"),
    path("logout/", views.user_logout, name="logout"),
    # JWT Token Management
    path("token/refresh/", views.token_refresh, name="token_refresh"),
    # Email Verification
    path("verify-email/", views.verify_email, name="verify_email"),
    # Password Management
    path("password/change/", views.change_password, name="change_password"),
    path(
        "password/reset/request/",
        views.request_password_reset,
        name="request_password_reset",
    ),
    path(
        "password/reset/confirm/",
        views.confirm_password_reset,
        name="confirm_password_reset",
    ),
    # Google OAuth
    path("google/login/", views.google_oauth_login, name="google_oauth_login"),
    # User Profile
    path("profile/", views.user_profile, name="profile"),
    path("profile/update/", views.update_profile, name="update_profile"),
    path(
        "profile/upload-image/", views.upload_profile_image, name="upload_profile_image"
    ),
    # Cook Profile Management (comprehensive)
    path("cook-profile/", views.cook_profile_detail, name="cook_profile_detail"),
    path("cook-profile/update/", views.cook_profile_update, name="cook_profile_update"),
    path("cook-profile/delete/", views.cook_profile_delete, name="cook_profile_delete"),
    # Profile Creation
    path("customer/create/", views.create_customer_profile, name="create_customer"),
    path("cook/create/", views.create_cook_profile, name="create_cook"),
    path(
        "delivery-agent/create/",
        views.create_delivery_agent_profile,
        name="create_delivery_agent",
    ),
    # OTP Verification for Registration
    path("send-otp/", views.send_otp, name="send_otp"),
    path("verify-otp/", views.verify_otp, name="verify_otp"),
    path(
        "complete-registration/",
        views.complete_registration,
        name="complete_registration",
    ),
    # Token Management endpoints
    path("tokens/", views.user_tokens, name="user_tokens"),
    path("tokens/revoke/", views.revoke_token, name="revoke_token"),
    path("tokens/revoke-all/", views.revoke_all_tokens, name="revoke_all_tokens"),
    # Document Management
    path("documents/types/", views.get_document_types, name="get_document_types"),
    path("documents/upload/", views.upload_document, name="upload_document"),
    path(
        "documents/upload-registration/",
        views.upload_document_during_registration,
        name="upload_document_during_registration",
    ),
    path("documents/", views.get_user_documents, name="get_user_documents"),
    path(
        "documents/<int:document_id>/delete/",
        views.delete_document,
        name="delete_document",
    ),
    path(
        "documents/proxy-download/",
        views.proxy_document_download,
        name="proxy_document_download",
    ),
    # Admin Approval Management
    path(
        "admin/pending-approvals/",
        views.get_pending_approvals,
        name="get_pending_approvals",
    ),
    path(
        "admin/user/<int:user_id>/",
        views.get_user_for_approval,
        name="get_user_for_approval",
    ),
    path("admin/user/<int:user_id>/approve/", views.approve_user, name="approve_user"),
    path("approval-status/", views.check_approval_status, name="check_approval_status"),
    path("check-user-status/", views.check_user_status, name="check_user_status"),
    path(
        "check-email-availability/",
        views.check_email_availability,
        name="check_email_availability",
    ),
    # Referral System
    path(
        "referral/create-token/",
        views.create_referral_token,
        name="create_referral_token",
    ),
    path("referral/stats/", views.get_referral_stats, name="get_referral_stats"),
    path("referral/tokens/", views.get_referral_tokens, name="get_referral_tokens"),
    path(
        "referral/validate/",
        views.validate_referral_token,
        name="validate_referral_token",
    ),
    # Chef Location Management
    path("chef/location/", views.update_chef_location, name="update_chef_location"),
    path("chef/location/get/", views.get_chef_location, name="get_chef_location"),
    path(
        "chef/<int:chef_id>/location/",
        views.get_chef_location,
        name="get_chef_location_by_id",
    ),
    path(
        "chef/location/toggle/",
        views.toggle_location_tracking,
        name="toggle_location_tracking",
    ),
]
