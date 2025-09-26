import os

from django.apps import apps
from django.conf import settings
from django.contrib.auth import login, logout
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django_ratelimit.decorators import ratelimit
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Cook, Customer, DeliveryAgent, User
from .permissions import IsAdminUser
from .serializers import (
    CompleteRegistrationSerializer,
    CookSerializer,
    CustomerSerializer,
    DeliveryAgentSerializer,
    DocumentTypeSerializer,
    EmailVerificationSerializer,
    GoogleOAuthSerializer,
    JWTTokenSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    SendOTPSerializer,
    UserApprovalActionSerializer,
    UserApprovalSerializer,
    UserDocumentSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    VerifyOTPSerializer,
)

# Get models from Django's app registry to avoid import issues
DocumentType = apps.get_model("authentication", "DocumentType")
UserDocument = apps.get_model("authentication", "UserDocument")
import json


# Health Check Endpoint
@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Simple health check endpoint to verify server is running"""
    return Response(
        {
            "status": "healthy",
            "timestamp": timezone.now(),
            "message": "ChefSync API is running",
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def csrf_token(request):
    """Get CSRF token for the current session"""
    try:
        from django.middleware.csrf import get_token

        token = get_token(request)
        return Response({"csrf_token": token}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error in csrf_token view: {e}")
        import traceback

        traceback.print_exc()
        return Response(
            {"error": f"Failed to generate CSRF token: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


import requests

# Google OAuth imports removed - using direct API calls instead


@api_view(["POST"])
@permission_classes([AllowAny])
@csrf_exempt
@ratelimit(key="ip", rate="10/h", method="POST", block=True)
def user_registration(request):
    """
    User registration with email verification and referral token support
    User registration with email verification and referral token support
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        # Get referral token from request data
        referral_token = request.data.get("referral_token")
        referral_result = None

        # Validate referral token if provided
        if referral_token:
            from .services.referral_service import ReferralService

            validation_result = ReferralService.validate_referral_token(referral_token)
            if not validation_result["valid"]:
                return Response(
                    {
                        "error": "Invalid referral token",
                        "details": validation_result["message"],
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Save user
        user = serializer.save()

        # Use referral token if valid
        if referral_token:
            from .services.referral_service import ReferralService

            referral_result = ReferralService.use_referral_token(referral_token, user)
            if not referral_result["success"]:
                # Log error but don't fail registration
                print(f"Referral token usage failed: {referral_result['message']}")

        # Send email verification
        try:
            email_token = getattr(user, "email_verification_token", None)
            user_email = getattr(user, "email", None)

            if email_token and user_email:
                verification_url = (
                    f"{settings.FRONTEND_URL}/verify-email?token={email_token}"
                )
                send_mail(
                    "Verify Your Email - ChefSync",
                    f"Please click the following link to verify your email: {verification_url}",
                    settings.DEFAULT_FROM_EMAIL,
                    [user_email],
                    fail_silently=False,
                )
        except Exception as e:
            # Log error but don't fail registration
            print(f"Email sending failed: {e}")

        response_data = {
            "message": "User registered successfully. Please check your email for verification.",
            "user_id": user.user_id,
        }

        # Add referral information to response if applicable
        if referral_result and referral_result["success"]:
            response_data["referral"] = {
                "success": True,
                "referrer": referral_result["referrer"].name,
                "rewards": referral_result["rewards"],
            }

        return Response(response_data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_referral_token(request):
    """
    Create a referral token for the authenticated user
    """
    try:
        user = request.user
        data = request.data

        # Get parameters
        expires_days = data.get("expires_days", 30)
        max_uses = data.get("max_uses", 1)
        referrer_reward = data.get("referrer_reward", 0)
        referee_reward = data.get("referee_reward", 0)
        campaign_name = data.get("campaign_name")

        # Create referral token
        from .services.referral_service import ReferralService

        result = ReferralService.create_referral_token(
            user=user,
            expires_days=expires_days,
            max_uses=max_uses,
            referrer_reward=referrer_reward,
            referee_reward=referee_reward,
            campaign_name=campaign_name,
        )

        if result["success"]:
            return Response(
                {
                    "message": result["message"],
                    "token": result["token"],
                    "expires_at": result["expires_at"],
                    "max_uses": result["max_uses"],
                    "referral_url": f"{settings.FRONTEND_URL}/auth/register?ref={result['token']}",
                },
                status=status.HTTP_201_CREATED,
            )
        else:
            return Response(
                {"error": result["message"]}, status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        return Response(
            {"error": "Failed to create referral token"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_referral_stats(request):
    """
    Get referral statistics for the authenticated user
    """
    try:
        user = request.user

        from .services.referral_service import ReferralService

        stats = ReferralService.get_user_referral_stats(user)

        # Get referral code and URL
        referral_code = user.get_referral_code()
        referral_url = user.get_referral_url()

        return Response(
            {
                "referral_code": referral_code,
                "referral_url": referral_url,
                "stats": stats,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {"error": "Failed to get referral statistics"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_referral_tokens(request):
    """
    Get referral tokens for the authenticated user
    """
    try:
        user = request.user

        from .services.referral_service import ReferralService

        tokens = ReferralService.get_user_referral_tokens(user)

        token_data = []
        for token in tokens:
            token_data.append(
                {
                    "id": token.id,
                    "jti": token.jti,
                    "created_at": token.issued_at,
                    "expires_at": token.expires_at,
                    "max_uses": token.max_uses,
                    "usage_count": token.usage_count,
                    "status": "active" if token.is_valid() else "expired",
                    "referrer_reward": float(token.referrer_reward),
                    "referee_reward": float(token.referee_reward),
                    "campaign_name": token.campaign_name,
                    "used_by": token.used_by.name if token.used_by else None,
                }
            )

        return Response(
            {"tokens": token_data, "count": len(token_data)}, status=status.HTTP_200_OK
        )

    except Exception as e:
        return Response(
            {"error": "Failed to get referral tokens"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def validate_referral_token(request):
    """
    Validate a referral token (public endpoint)
    """
    try:
        token = request.data.get("token")

        if not token:
            return Response(
                {"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        from .services.referral_service import ReferralService

        result = ReferralService.validate_referral_token(token)

        if result["valid"]:
            return Response(
                {
                    "valid": True,
                    "referrer": {
                        "name": result["referrer"].name,
                        "email": result["referrer"].email,
                    },
                    "rewards": result["rewards"],
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"valid": False, "message": result["message"]},
                status=status.HTTP_400_BAD_REQUEST,
            )

    except Exception as e:
        return Response(
            {"error": "Failed to validate referral token"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
@csrf_exempt
@ratelimit(key="ip", rate="5/m", method="POST", block=True)
def user_login(request):
    """
    User login with JWT tokens
    """
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        validated_data = getattr(serializer, "validated_data", {})
        user = validated_data.get("user")

        if not user:
            return Response(
                {"error": "Authentication failed"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Reset failed login attempts on successful login
        user.reset_failed_login_attempts()

        # Generate JWT tokens using the service
        from .services.jwt_service import JWTTokenService

        token_data = JWTTokenService.create_tokens(user, request)

        login(request, user, backend="django.contrib.auth.backends.ModelBackend")

        return Response(
            {
                "message": "Login successful",
                "access": token_data["access_token"],
                "refresh": token_data["refresh_token"],
                "user": UserProfileSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

    # Handle different types of validation errors
    errors = serializer.errors

    # Check if it's an approval status error
    if "non_field_errors" in errors and isinstance(errors, dict):
        non_field_errors = errors.get("non_field_errors", [])
        if non_field_errors and isinstance(non_field_errors, list):
            error_data = non_field_errors[0]
            if isinstance(error_data, dict) and "approval_status" in error_data:
                # This is an approval status error
                return Response(
                    {
                        "error": "Account approval required",
                        "approval_status": error_data["approval_status"],
                        "message": error_data["message"],
                        "email": error_data.get("email"),
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

    # Increment failed login attempts for invalid credentials
    try:
        user = User.objects.get(email=request.data.get("email"))
        user.increment_failed_login()
    except User.DoesNotExist:
        pass

    return Response(errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def user_logout(request):
    """
    User logout and token blacklisting
    """
    try:
        # Revoke tokens using the service
        from .services.jwt_service import JWTTokenService

        refresh_token = request.data.get("refresh")
        if refresh_token:
            JWTTokenService.revoke_token(refresh_token, "refresh")

        # Revoke all user tokens for security
        JWTTokenService.revoke_all_user_tokens(request.user)

        logout(request)
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def token_refresh(request):
    """
    Refresh JWT access token
    """
    try:
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            print("Token refresh failed: No refresh token provided")
            return Response(
                {"error": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST
            )

        print(f"Token refresh attempt for token: {refresh_token[:20]}...")

        # Use JWT service to refresh token
        from .services.jwt_service import JWTTokenService

        # Rotate the refresh token
        token_data = JWTTokenService.rotate_refresh_token(
            refresh_token, request.user, request
        )

        print("Token refresh successful with rotation")
        return Response(
            {
                "access": token_data["access_token"],
                "refresh": token_data["refresh_token"],
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        print(f"Token refresh error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        return Response(
            {"error": "Invalid refresh token"}, status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Verify user email with token
    """
    serializer = EmailVerificationSerializer(data=request.data)
    if serializer.is_valid():
        validated_data = getattr(serializer, "validated_data", {})
        token = validated_data.get("token")

        if not token:
            return Response(
                {"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email_verification_token=token)
            if user.verify_email(token):
                return Response(
                    {"message": "Email verified successfully"},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "Invalid or expired verification token"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid verification token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="3/h", method="POST", block=True)
def request_password_reset(request):
    """
    Request password reset with OTP
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    if serializer.is_valid():
        validated_data = getattr(serializer, "validated_data", {})
        email = validated_data.get("email")

        if not email:
            return Response(
                {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = User.objects.get(email=email)

            # Send OTP for password reset
            from .services.email_service import EmailService

            result = EmailService.send_otp(
                email, purpose="password_reset", user_name=user.name
            )

            if result["success"]:
                return Response(
                    {"message": "Password reset code sent to your email"},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": result["message"]}, status=status.HTTP_400_BAD_REQUEST
                )

        except User.DoesNotExist:
            return Response(
                {"error": "No account found with this email address"},
                status=status.HTTP_404_NOT_FOUND,
            )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    """
    Confirm password reset with OTP and set new password
    """
    data = request.data
    email = data.get("email")
    otp = data.get("otp")
    new_password = data.get("new_password")
    confirm_password = data.get("confirm_password")

    if not all([email, otp, new_password, confirm_password]):
        return Response(
            {"error": "Email, OTP, new password, and confirm password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if new_password != confirm_password:
        return Response(
            {"error": "Passwords don't match"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Validate password strength
    try:
        from django.contrib.auth.password_validation import validate_password

        validate_password(new_password)
    except Exception as e:
        return Response(
            {"error": f"Password validation failed: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Verify OTP
        from .services.email_service import EmailService

        result = EmailService.verify_otp(email, otp, purpose="password_reset")

        if not result["success"]:
            return Response(
                {"error": result["message"]}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get user and update password
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()

        return Response(
            {"message": "Password reset successful"}, status=status.HTTP_200_OK
        )

    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": f"Password reset failed: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
@csrf_exempt
def google_oauth_login(request):
    """
    Google OAuth login
    """
    print("\n=== GOOGLE OAUTH LOGIN DEBUG START ===")
    print("Request method:", request.method)
    print("Request headers:", dict(request.headers))
    print("Request data:", request.data)
    print("Client ID from settings:", settings.GOOGLE_OAUTH_CLIENT_ID)
    print("Client Secret configured:", bool(settings.GOOGLE_OAUTH_CLIENT_SECRET))

    serializer = GoogleOAuthSerializer(data=request.data)
    print("Serializer data:", serializer.initial_data)

    # Only allow customer role for Google OAuth
    forced_role = "customer"

    if not serializer.is_valid():
        print("Serializer validation failed:", serializer.errors)
        print("=== GOOGLE OAUTH LOGIN DEBUG END ===\n")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    print("Serializer valid, validated data:", serializer.validated_data)

    try:
        print("Attempting to verify Google token...")
        # Get user info from the request
        validated_data = getattr(serializer, "validated_data", {})
        user_info = validated_data.get("user_info")
        access_token = validated_data.get("access_token")

        if not user_info:
            return Response(
                {"error": "User info is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        print("Google user info received successfully!")
        print("User info:", user_info)

        email = user_info.get("email")
        name = user_info.get("name", "")

        if not email:
            return Response(
                {"error": "Email is required in user info"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "name": name,
                "email_verified": True,
                "role": forced_role,  # Only allow customer role for Google OAuth users
            },
        )

        print(f'User {"created" if created else "found"}: {user.email}')

        if created:
            user.set_unusable_password()
            user.save()
            print("Set unusable password for new Google user")
            # Create customer profile for new Google OAuth users
            try:
                user.create_profile()
                print("Created customer profile")
            except Exception as e:
                print(f"Profile creation failed: {e}")
                # Continue without profile creation

        # Generate JWT tokens using the service
        from .services.jwt_service import JWTTokenService

        token_data = JWTTokenService.create_tokens(user, request)

        login(request, user, backend="django.contrib.auth.backends.ModelBackend")

        print("Google OAuth login successful!")
        print("=== GOOGLE OAUTH LOGIN DEBUG END ===\n")

        return Response(
            {
                "message": "Google OAuth login successful",
                "access": token_data["access_token"],
                "refresh": token_data["refresh_token"],
                "user": UserProfileSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        # Handle any other errors
        print(f"Google OAuth Error: {repr(e)}")
        print("=== GOOGLE OAUTH LOGIN DEBUG END ===\n")
        return Response(
            {"error": "Google OAuth authentication failed", "details": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get user profile
    """
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    Update user profile
    """
    serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {"message": "Profile updated successfully", "user": serializer.data},
            status=status.HTTP_200_OK,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password
    """
    serializer = PasswordChangeSerializer(data=request.data)
    if serializer.is_valid():
        validated_data = getattr(serializer, "validated_data", {})
        old_password = validated_data.get("old_password")
        new_password = validated_data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"error": "Old password and new password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        if not user.check_password(old_password):
            return Response(
                {"error": "Current password is incorrect"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"message": "Password changed successfully"}, status=status.HTTP_200_OK
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_customer_profile(request):
    """
    Create customer profile for existing user
    """
    try:
        customer = Customer.objects.create(user=request.user)
        serializer = CustomerSerializer(customer)
        return Response(
            {
                "message": "Customer profile created successfully",
                "customer": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_cook_profile(request):
    """
    Create cook profile for existing user
    """
    serializer = CookSerializer(data=request.data)
    if serializer.is_valid():
        cook = serializer.save(user=request.user)
        return Response(
            {
                "message": "Cook profile created successfully",
                "cook": CookSerializer(cook).data,
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_delivery_agent_profile(request):
    """
    Create delivery agent profile for existing user
    """
    serializer = DeliveryAgentSerializer(data=request.data)
    if serializer.is_valid():
        delivery_agent = serializer.save(user=request.user)
        return Response(
            {
                "message": "Delivery agent profile created successfully",
                "delivery_agent": DeliveryAgentSerializer(delivery_agent).data,
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
@csrf_exempt
def send_otp(request):
    """
    Send OTP to email for verification
    """
    try:
        print(f"OTP request data: {request.data}")
        serializer = SendOTPSerializer(data=request.data)
        if serializer.is_valid():
            print("OTP serializer is valid, sending OTP...")
            # Check if serializer has send_otp method and is not a ListSerializer
            if hasattr(serializer, "send_otp") and not hasattr(serializer, "many"):
                result = serializer.send_otp()  # type: ignore
            else:
                # Fallback: create an EmailService instance directly
                from .services.email_service import EmailService

                data = getattr(serializer, "validated_data", {})
                email = data.get("email", request.data.get("email"))
                name = data.get("name", request.data.get("name", "User"))
                purpose = data.get(
                    "purpose", request.data.get("purpose", "registration")
                )
                result = EmailService.send_otp(email, purpose, name)
            print(f"OTP send result: {result}")
            if result["success"]:
                return Response(
                    {"message": result["message"], "success": True},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"message": result["message"], "success": False},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            print(f"OTP serializer validation errors: {serializer.errors}")
            return Response(
                {
                    "message": "Invalid data provided",
                    "errors": serializer.errors,
                    "success": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
    except Exception as e:
        return Response(
            {"message": f"Internal server error: {str(e)}", "success": False},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    Verify OTP for email verification
    """
    print(f"🔍 OTP Verification Request: {request.data}")  # Debug log
    serializer = VerifyOTPSerializer(data=request.data)
    if serializer.is_valid():
        print(f"✅ Serializer validation passed")  # Debug log
        # Check if serializer has verify_otp method and is not a ListSerializer
        if hasattr(serializer, "verify_otp") and not hasattr(serializer, "many"):
            result = serializer.verify_otp()  # type: ignore
        else:
            # Fallback: use EmailService directly
            from .services.email_service import EmailService

            data = getattr(serializer, "validated_data", {})
            email = data.get("email", request.data.get("email"))
            otp = data.get("otp", request.data.get("otp"))
            purpose = data.get("purpose", request.data.get("purpose", "registration"))
            result = EmailService.verify_otp(email, otp, purpose)
        print(f"🔍 OTP verification result: {result}")  # Debug log
        if result["success"]:
            return Response(
                {"message": result["message"], "success": True},
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"message": result["message"], "success": False},
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        print(f"❌ Serializer validation failed: {serializer.errors}")  # Debug log
        return Response(
            {
                "message": "Invalid data provided",
                "errors": serializer.errors,
                "success": False,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
@csrf_exempt
def complete_registration(request):
    """
    Complete user registration after OTP verification
    """
    print(f"🔍 Complete Registration Request: {request.data}")  # Debug log

    try:
        serializer = CompleteRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            print(f"✅ Serializer validation passed")  # Debug log

            user = serializer.save()

            # Ensure user is a single instance, not a list
            if isinstance(user, list):
                user = user[0] if user else None

            if user is None:
                raise ValueError("Failed to create user")

            user_email = getattr(user, "email", "unknown")
            print(f"✅ User created successfully: {user_email}")  # Debug log

            # Refresh user from database to ensure all relationships are loaded
            if hasattr(user, "refresh_from_db"):
                user.refresh_from_db()
                print(f"✅ User refreshed from database")  # Debug log

            # Create user profile data
            try:
                user_profile_data = UserProfileSerializer(user).data
                print(f"✅ User profile serialized successfully")  # Debug log
            except Exception as e:
                print(f"💥 Error serializing user profile: {str(e)}")  # Debug log
                raise

            # Only generate tokens for customers (who can login immediately)
            # Cooks and delivery agents need admin approval before they can login
            response_data = {
                "message": "Registration completed successfully",
                "user": user_profile_data,
            }

            user_role = getattr(user, "role", None)
            if user_role == "customer":
                # Generate JWT tokens for customers who can login immediately
                try:
                    from .services.jwt_service import JWTTokenService

                    # Ensure user object is valid before creating tokens
                    if hasattr(user, "user_id") and hasattr(user, "email"):
                        token_data = JWTTokenService.create_tokens(user, request)
                        print(
                            f"✅ JWT tokens created successfully for customer"
                        )  # Debug log
                        response_data["tokens"] = {
                            "refresh": token_data.get("refresh_token"),
                            "access": token_data.get("access_token"),
                        }
                    else:
                        print(f"💥 Invalid user object for token creation")  # Debug log
                        raise ValueError("Invalid user object")
                except Exception as e:
                    print(f"💥 Error creating JWT tokens: {str(e)}")  # Debug log
                    raise
            else:
                # For cooks and delivery agents, don't provide tokens
                print(
                    f"✅ No tokens provided for {user_role} - requires admin approval"
                )  # Debug log
            print(f"✅ Response data prepared successfully")  # Debug log

            return Response(response_data, status=status.HTTP_201_CREATED)
        else:
            print(f"❌ Serializer validation failed: {serializer.errors}")  # Debug log
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        print(f"💥 Exception in complete_registration: {str(e)}")  # Debug log
        print(f"💥 Exception type: {type(e).__name__}")  # Debug log
        import traceback

        print(f"💥 Traceback: {traceback.format_exc()}")  # Debug log

        return Response(
            {"error": "Internal server error during registration", "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_tokens(request):
    """
    Get all active tokens for the current user
    """
    try:
        from .services.jwt_service import JWTTokenService

        tokens = JWTTokenService.get_user_active_tokens(request.user)

        token_data = []
        for token in tokens:
            token_data.append(
                {
                    "id": token.id,
                    "token_type": token.token_type,
                    "issued_at": token.issued_at,
                    "expires_at": token.expires_at,
                    "last_used_at": token.last_used_at,
                    "usage_count": token.usage_count,
                    "ip_address": token.ip_address,
                    "device_info": token.device_info,
                    "is_valid": token.is_valid(),
                }
            )

        return Response(
            {"tokens": token_data, "count": len(token_data)}, status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def revoke_token(request):
    """
    Revoke a specific token
    """
    try:
        from .services.jwt_service import JWTTokenService

        token = request.data.get("token")
        token_type = request.data.get("token_type", "refresh")

        if not token:
            return Response(
                {"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        success = JWTTokenService.revoke_token(token, token_type)

        if success:
            return Response(
                {"message": "Token revoked successfully"}, status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": "Token not found or already revoked"},
                status=status.HTTP_404_NOT_FOUND,
            )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def revoke_all_tokens(request):
    """
    Revoke all tokens for the current user
    """
    try:
        from .services.jwt_service import JWTTokenService

        token_type = request.data.get(
            "token_type", "refresh"
        )  # Only refresh tokens supported
        revoked_count = JWTTokenService.revoke_all_user_tokens(request.user, token_type)

        return Response(
            {
                "message": f"Successfully revoked {revoked_count} tokens",
                "revoked_count": revoked_count,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Admin User Management ViewSet
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users (Admin only)
    """

    queryset = User.objects.all().prefetch_related("documents__document_type")
    serializer_class = UserApprovalSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        queryset = User.objects.all()
        # Use GET parameters instead of query_params for better type safety
        user_type = self.request.GET.get("user_type", None)
        is_active = self.request.GET.get("is_active", None)
        search = self.request.GET.get("search", None)

        if user_type:
            queryset = queryset.filter(role=user_type)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")
        if search:
            queryset = (
                queryset.filter(username__icontains=search)
                | queryset.filter(email__icontains=search)
                | queryset.filter(first_name__icontains=search)
                | queryset.filter(last_name__icontains=search)
            )

        return queryset


# Admin Approval Management Views
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def pending_approvals(request):
    """
    Get pending user approvals filtered by role
    """
    try:
        role = request.query_params.get("role")
        if not role:
            return Response(
                {"error": "Role parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate role
        valid_roles = ["cook", "DeliveryAgent"]
        if role not in valid_roles:
            return Response(
                {"error": f"Invalid role. Must be one of: {valid_roles}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if role == "cook":
            # For cooks, check ChefProfile.approval_status
            from apps.users.models import ChefProfile

            pending_profiles = ChefProfile.objects.filter(approval_status="pending")
            pending_users = [profile.user for profile in pending_profiles]
        elif role == "DeliveryAgent":
            # For delivery agents, check DeliveryProfile.approval_status
            from apps.users.models import DeliveryProfile

            pending_profiles = DeliveryProfile.objects.filter(approval_status="pending")
            pending_users = [profile.user for profile in pending_profiles]

        users_data = []
        for user in pending_users:
            users_data.append(
                {
                    "id": user.user_id,
                    "name": user.name or f"{user.first_name} {user.last_name}".strip(),
                    "email": user.email,
                    "role": user.role,
                    "phone_no": user.phone_no,
                    "address": user.address,
                    "created_at": user.date_joined,
                    "approval_status": "pending",
                }
            )

        return Response(
            {"users": users_data, "count": len(users_data)}, status=status.HTTP_200_OK
        )

    except Exception as e:
        return Response(
            {"error": f"Failed to fetch pending approvals: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_cook(request, user_id):
    """
    Approve a cook application
    """
    try:
        user = get_object_or_404(User, user_id=user_id, role="cook")

        # Get or create ChefProfile
        from apps.users.models import ChefProfile

        chef_profile, created = ChefProfile.objects.get_or_create(
            user=user,
            defaults={
                "specialty_cuisines": [],
                "experience_years": 0,
                "bio": "",
                "approval_status": "pending",
                "rating_average": 0.0,
                "total_orders": 0,
                "total_reviews": 0,
                "is_featured": False,
            },
        )

        if chef_profile.approval_status == "approved":
            return Response(
                {"error": "Cook is already approved"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update approval status
        chef_profile.approval_status = "approved"
        chef_profile.save()

        # Also activate the user if not already active
        if not user.is_active:
            user.is_active = True
            user.save()

        return Response(
            {
                "message": "Cook approved successfully",
                "user": {
                    "id": user.user_id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role,
                    "is_active": user.is_active,
                },
            },
            status=status.HTTP_200_OK,
        )

    except User.DoesNotExist:
        return Response({"error": "Cook not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": f"Failed to approve cook: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_delivery_agent(request, user_id):
    """
    Approve a delivery agent application
    """
    try:
        user = get_object_or_404(User, user_id=user_id, role="DeliveryAgent")

        # Get or create DeliveryProfile
        from apps.users.models import DeliveryProfile

        delivery_profile, created = DeliveryProfile.objects.get_or_create(
            user=user,
            defaults={
                "vehicle_type": "bike",
                "vehicle_number": "",
                "license_number": "",
                "is_available": True,
                "rating_average": 0.0,
                "total_deliveries": 0,
                "total_earnings": 0.0,
                "approval_status": "pending",
            },
        )

        if delivery_profile.approval_status == "approved":
            return Response(
                {"error": "Delivery agent is already approved"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update approval status
        delivery_profile.approval_status = "approved"
        delivery_profile.save()

        # Also activate the user if not already active
        if not user.is_active:
            user.is_active = True
            user.save()

        return Response(
            {
                "message": "Delivery agent approved successfully",
                "user": {
                    "id": user.user_id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role,
                    "is_active": user.is_active,
                },
            },
            status=status.HTTP_200_OK,
        )

    except User.DoesNotExist:
        return Response(
            {"error": "Delivery agent not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Failed to approve delivery agent: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# Document Management Endpoints
@api_view(["GET"])
@permission_classes([AllowAny])
def get_document_types(request):
    """
    Get available document types for a specific role
    """
    role = request.query_params.get("role")
    if not role:
        return Response(
            {"error": "Role parameter is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    if role not in ["cook", "DeliveryAgent"]:
        return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)

    document_types = DocumentType.objects.filter(category=role)
    serializer = DocumentTypeSerializer(document_types, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_document(request):
    """
    Upload a document for verification
    """
    serializer = UserDocumentSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        document = serializer.save()
        return Response(
            {
                "message": "Document uploaded successfully",
                "document": UserDocumentSerializer(document).data,
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def upload_document_during_registration(request):
    """
    Upload a document during registration process (before user is authenticated)
    """
    try:
        print(f"Upload registration request data: {request.data}")
        print(f"Upload registration request files: {request.FILES}")

        # Get user email from request data
        user_email = request.data.get("user_email")
        if not user_email:
            print("Upload error: No user email provided")
            return Response(
                {"error": "User email is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Find the user by email
        try:
            user = User.objects.get(email=user_email)
            print(f"Found user: {user.email}")
        except User.DoesNotExist:
            print(f"Upload error: User not found for email: {user_email}")
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Validate required fields
        if "file_upload" not in request.FILES:
            print("Upload error: No file_upload in request.FILES")
            return Response(
                {
                    "error": "No file provided",
                    "message": "Please select a file to upload",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if "document_type_id" not in request.data:
            return Response(
                {
                    "error": "Document type is required",
                    "message": "Please select a document type",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create a modified request data with user context
        serializer = UserDocumentSerializer(data=request.data, context={"user": user})
        if serializer.is_valid():
            try:
                document = serializer.save()
                return Response(
                    {
                        "message": "Document uploaded successfully",
                        "document": UserDocumentSerializer(document).data,
                    },
                    status=status.HTTP_201_CREATED,
                )
            except Exception as save_error:
                import traceback

                error_details = str(save_error)
                print(f"Document save error: {error_details}")
                print(f"Traceback: {traceback.format_exc()}")
                return Response(
                    {
                        "error": "Failed to save document",
                        "message": f"Error saving document: {error_details}",
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        else:
            # Format validation errors for better user experience
            errors = serializer.errors
            if "file_upload" in errors:
                # Handle errors dict safely
                file_upload_error = "Unknown error"
                try:
                    # Try different access methods based on type
                    if isinstance(errors, dict):
                        file_upload_errors = errors.get("file_upload", "Unknown error")
                    elif hasattr(errors, "__getitem__"):
                        file_upload_errors = getattr(
                            errors, "file_upload", "Unknown error"
                        )
                    else:
                        file_upload_errors = "Unknown error"

                    if isinstance(file_upload_errors, list) and file_upload_errors:
                        file_upload_error = file_upload_errors[0]
                    else:
                        file_upload_error = str(file_upload_errors)
                except (KeyError, TypeError, AttributeError):
                    file_upload_error = "File validation failed"

                return Response(
                    {
                        "error": "File validation failed",
                        "message": file_upload_error,
                        "details": errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            else:
                return Response(
                    {
                        "error": "Validation failed",
                        "message": "Please check your input and try again",
                        "details": errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

    except Exception as e:
        # Ensure we always return JSON, even for unexpected errors
        import traceback

        error_details = str(e)
        print(f"Upload error: {error_details}")
        print(f"Traceback: {traceback.format_exc()}")
        return Response(
            {"error": "Internal server error during upload", "details": error_details},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_documents(request):
    """
    Get all documents uploaded by the current user
    """
    documents = UserDocument.objects.filter(user=request.user).order_by("-uploaded_at")
    serializer = UserDocumentSerializer(documents, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_document(request, document_id):
    """
    Delete a user's document
    """
    try:
        document = UserDocument.objects.get(id=document_id, user=request.user)
        document.delete()
        return Response(
            {"message": "Document deleted successfully"}, status=status.HTTP_200_OK
        )
    except UserDocument.DoesNotExist:
        return Response(
            {"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def proxy_document_download(request):
    """
    Proxy document download to handle CORS issues with Cloudinary
    """
    try:
        document_id = request.data.get("document_id")
        file_url = request.data.get("file_url")
        preview_mode = request.data.get("preview", False)

        print(
            f"Proxy request - Document ID: {document_id}, File URL: {file_url}, Preview: {preview_mode}"
        )
        print(f"User: {request.user}, Is Staff: {request.user.is_staff}")

        if not document_id and not file_url:
            return Response(
                {"error": "Document ID or file URL is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If document_id is provided, get the document and verify access
        if document_id:
            try:
                document = UserDocument.objects.get(id=document_id)
                document_name = getattr(document, "file_name", "Unknown")
                document_user = getattr(document, "user", None)
                print(f"Found document: {document_name}, User: {document_user}")

                # Check if user has access to this document
                if not (request.user.is_staff or document_user == request.user):
                    print(
                        f"Access denied for user {request.user} to document {document_id}"
                    )
                    return Response(
                        {"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN
                    )
                file_url = getattr(document, "file", None)
            except UserDocument.DoesNotExist:
                print(f"Document not found: {document_id}")
                return Response(
                    {"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND
                )

        if not file_url:
            return Response(
                {"error": "File URL not available"}, status=status.HTTP_400_BAD_REQUEST
            )

        print(f"Attempting to fetch file from: {file_url}")

        # Check if it's a local file
        if file_url.startswith("/local_media/"):
            return handle_local_file_download(file_url, document_id, preview_mode)
        else:
            # Pass the document object if available
            document_obj = None
            if document_id:
                try:
                    document_obj = UserDocument.objects.get(id=document_id)
                except UserDocument.DoesNotExist:
                    pass
            return handle_cloudinary_download(
                file_url, document_id, preview_mode, document_obj
            )

    except Exception as e:
        print(f"General error: {str(e)}")
        return Response(
            {"error": f"Download failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsAdminUser])
def review_document(request, document_id):
    """Update the verification status of a user document"""

    try:
        document = UserDocument.objects.select_related("user", "document_type").get(
            id=document_id
        )
    except UserDocument.DoesNotExist:
        return Response(
            {"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND
        )

    status_value = request.data.get("status")
    notes = request.data.get("notes", "")

    valid_statuses = {choice[0] for choice in UserDocument.STATUS_CHOICES}
    if status_value not in valid_statuses:
        return Response(
            {
                "error": "Invalid status value",
                "valid_statuses": list(valid_statuses),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    document.status = status_value
    document.admin_notes = notes
    document.reviewed_by = request.user
    document.reviewed_at = timezone.now()
    document.is_visible_to_admin = True
    document.save(
        update_fields=[
            "status",
            "admin_notes",
            "reviewed_by",
            "reviewed_at",
            "is_visible_to_admin",
            "updated_at",
        ]
    )

    serializer = UserDocumentSerializer(document, context={"request": request})

    return Response(
        {
            "message": "Document status updated successfully",
            "document": serializer.data,
        },
        status=status.HTTP_200_OK,
    )


# Admin Approval Endpoints
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_pending_approvals(request):
    """
    Get all users pending approval (cooks and delivery agents)
    """
    try:
        print(f"🔍 Getting pending approvals")
        print(f"👤 Request user: {request.user}, Is staff: {request.user.is_staff}")

        role_filter = request.GET.get("role")
        print(f"🏷️ Role filter: {role_filter}")

        if role_filter:
            # Filter by specific role if provided
            pending_users = User.objects.filter(
                role=role_filter, approval_status="pending"
            ).order_by("created_at")
        else:
            # Get all pending users (cooks and delivery agents)
            pending_users = User.objects.filter(
                role__in=["cook", "DeliveryAgent"], approval_status="pending"
            ).order_by("created_at")

        print(f"📊 Found {pending_users.count()} pending users")
        for user in pending_users:
            print(
                f"  👤 {user.name} ({user.email}, {user.role}) - Documents: {user.documents.count()}"
            )

        serializer = UserApprovalSerializer(pending_users, many=True)
        data = serializer.data

        print(f"🔄 Serialized {len(data)} users")
        return Response({"users": data}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"💥 Error fetching pending approvals: {str(e)}")
        import traceback

        print(f"📍 Traceback: {traceback.format_exc()}")
        return Response(
            {"error": f"Failed to fetch pending approvals: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_user_for_approval(request, user_id):
    """
    Get detailed information about a user for approval review
    """
    try:
        print(f"🔍 Getting user details for user_id: {user_id}")
        print(f"👤 Request user: {request.user}, Is staff: {request.user.is_staff}")

        user = (
            User.objects.select_related("approved_by")
            .prefetch_related("documents__document_type")
            .get(user_id=user_id, role__in=["cook", "DeliveryAgent"])
        )

        print(f"✅ Found user: {user.name} ({user.email})")
        print(f"📋 User approval status: {user.approval_status}")
        print(f"📄 User documents count: {user.documents.count()}")

        # Log document details
        for doc in user.documents.all():
            print(
                f"  📎 Document: {doc.file_name}, URL: {doc.file}, Visible: {doc.is_visible_to_admin}, Type: {doc.document_type.name}"
            )

        serializer = UserApprovalSerializer(user)
        data = serializer.data

        print(f"🔄 Serialized data documents count: {len(data.get('documents', []))}")
        print(f"📊 Response data keys: {list(data.keys())}")

        return Response(data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        print(f"❌ User not found: {user_id}")
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"💥 Error fetching user details: {str(e)}")
        import traceback

        print(f"📍 Traceback: {traceback.format_exc()}")
        return Response(
            {"error": f"Failed to fetch user details: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_user(request, user_id):
    """
    Approve or reject a user
    """
    try:
        print(f"🔍 Approval request for user_id: {user_id}")
        print(f"👤 Admin user: {request.user} (ID: {request.user.user_id})")
        print(f"📋 Request data: {request.data}")
        print(f"🔑 Request headers: {dict(request.headers)}")

        user = User.objects.get(user_id=user_id, role__in=["cook", "DeliveryAgent"])
        print(f"✅ Found user: {user.name} ({user.email}, {user.role})")
        print(f"📊 Current status: {user.approval_status}")
    except User.DoesNotExist:
        print(f"❌ User not found: {user_id}")
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"💥 Error fetching user: {str(e)}")
        return Response(
            {"error": f"Failed to fetch user: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    serializer = UserApprovalActionSerializer(data=request.data)
    if serializer.is_valid():
        action = serializer.validated_data["action"]
        notes = serializer.validated_data.get("notes", "")

        print(f"🔄 Processing {action} action with notes: '{notes}'")

        if action == "approve":
            user.approval_status = "approved"
            user.approval_notes = notes
            user.approved_by = request.user
            user.approved_at = timezone.now()
            user.save()

            print(f"✅ User approved and saved")

            # Make all user documents visible to admin after approval
            docs_updated = user.documents.update(is_visible_to_admin=True)
            print(f"📄 Updated {docs_updated} documents to be visible")

            # Send approval email using the new dedicated email service
            try:
                from .services.user_management_email_service import (
                    UserManagementEmailService,
                )

                UserManagementEmailService.send_user_approval_notification(user, notes)
                print(f"📧 User approval notification sent successfully")
            except Exception as email_error:
                print(f"⚠️ Email sending failed: {str(email_error)}")
                # Don't fail the approval if email fails

            return Response(
                {
                    "message": "User approved successfully",
                    "user": UserApprovalSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )

        elif action == "reject":
            user.approval_status = "rejected"
            user.approval_notes = notes
            user.approved_by = request.user
            user.approved_at = timezone.now()
            user.save()

            print(f"❌ User rejected and saved")

            # Send rejection email using the new dedicated email service
            try:
                from .services.user_management_email_service import (
                    UserManagementEmailService,
                )

                UserManagementEmailService.send_user_rejection_notification(user, notes)
                print(f"📧 User rejection notification sent successfully")
            except Exception as email_error:
                print(f"⚠️ Email sending failed: {str(email_error)}")
                # Don't fail the rejection if email fails

            return Response(
                {
                    "message": "User rejected successfully",
                    "user": UserApprovalSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )
    else:
        print(f"❌ Invalid serializer data: {serializer.errors}")

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([AllowAny])
def check_approval_status(request):
    """
    Check the approval status of the current user or by email/user_id
    Check the approval status of the current user or by email/user_id
    """
    user = None

    # Try to get user from authentication first
    if request.user.is_authenticated:
        user = request.user
    else:
        # If not authenticated, try to get user by email or user_id from query params
        email = request.query_params.get("email")
        user_id = request.query_params.get("user_id")

        if email:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response(
                    {
                        "error": "User not found",
                        "approval_status": "unknown",
                        "can_login": False,
                        "message": "User with this email does not exist.",
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )
        elif user_id:
            try:
                user = User.objects.get(user_id=user_id)
            except User.DoesNotExist:
                return Response(
                    {
                        "error": "User not found",
                        "approval_status": "unknown",
                        "can_login": False,
                        "message": "User with this ID does not exist.",
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            return Response(
                {
                    "error": "Authentication required",
                    "approval_status": "unknown",
                    "can_login": False,
                    "message": "Please log in or provide email/user_id to check approval status.",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

    # Check approval status based on user role
    if user.role in ["cook", "Cook", "DeliveryAgent"]:
        return Response(
            {
                "user_id": user.user_id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "approval_status": user.approval_status,
                "approval_status_display": user.get_approval_status_display(),
                "approval_notes": user.approval_notes,
                "approved_at": user.approved_at,
                "can_login": user.can_login(),
                "message": user.get_approval_message(),
            },
            status=status.HTTP_200_OK,
        )
    else:
        return Response(
            {
                "user_id": user.user_id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "approval_status": "approved",
                "approval_status_display": "Approved",
                "can_login": True,
                "message": "Your account is ready to use.",
            },
            status=status.HTTP_200_OK,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def clear_all_tokens(request):
    """
    Clear all tokens for debugging purposes
    """
    try:
        email = request.data.get("email")
        if not email:
            return Response(
                {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.get(email=email)
        from .services.jwt_service import JWTTokenService

        revoked_count = JWTTokenService.revoke_all_user_tokens(user, "refresh")

        return Response(
            {"message": f"Revoked {revoked_count} tokens for user {email}"},
            status=status.HTTP_200_OK,
        )
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([AllowAny])
def check_user_status(request):
    """
    Check the approval status of a user by email (for login page)
    """
    email = request.data.get("email")
    if not email:
        return Response(
            {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)

        # Only return approval status for cooks and delivery agents
        if user.role in ["cook", "DeliveryAgent"]:
            return Response(
                {
                    "approval_status": user.approval_status,
                    "approval_status_display": getattr(
                        user, "get_approval_status_display", lambda: "Unknown"
                    )(),
                    "can_login": user.can_login(),
                    "message": user.get_approval_message(),
                    "role": user.role,
                },
                status=status.HTTP_200_OK,
            )
        else:
            # For customers and admins, they can always login
            return Response(
                {
                    "approval_status": "approved",
                    "approval_status_display": "Approved",
                    "can_login": True,
                    "message": "Your account is ready to use.",
                    "role": user.role,
                },
                status=status.HTTP_200_OK,
            )

    except User.DoesNotExist:
        # User doesn't exist, don't reveal this information
        return Response(
            {
                "approval_status": "unknown",
                "approval_status_display": "Unknown",
                "can_login": False,
                "message": "Account not found",
                "role": "unknown",
            },
            status=status.HTTP_200_OK,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def check_email_availability(request):
    """
    Check if an email is available for registration
    """
    email = request.data.get("email")
    if not email:
        return Response(
            {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
        if user.is_active:
            # Provide detailed information based on user role and status
            if user.role == "customer":
                return Response(
                    {
                        "available": False,
                        "message": "This email is already registered as a customer. Please try logging in instead.",
                        "suggestion": "login",
                        "user_role": user.role,
                        "approval_status": "approved",
                    },
                    status=status.HTTP_200_OK,
                )
            elif user.role in ["cook", "DeliveryAgent"]:
                if user.approval_status == "pending":
                    return Response(
                        {
                            "available": False,
                            "message": "This email is already registered and your account is pending approval. Please wait for admin approval.",
                            "suggestion": "wait_approval",
                            "user_role": user.role,
                            "approval_status": user.approval_status,
                        },
                        status=status.HTTP_200_OK,
                    )
                elif user.approval_status == "rejected":
                    return Response(
                        {
                            "available": False,
                            "message": "This email was previously registered but the account was rejected. Please contact support for assistance.",
                            "suggestion": "contact_support",
                            "user_role": user.role,
                            "approval_status": user.approval_status,
                        },
                        status=status.HTTP_200_OK,
                    )
                else:
                    return Response(
                        {
                            "available": False,
                            "message": "This email is already registered. Please try logging in instead.",
                            "suggestion": "login",
                            "user_role": user.role,
                            "approval_status": user.approval_status,
                        },
                        status=status.HTTP_200_OK,
                    )
            else:
                return Response(
                    {
                        "available": False,
                        "message": "This email is already registered. Please try logging in instead.",
                        "suggestion": "login",
                        "user_role": user.role,
                        "approval_status": "approved",
                    },
                    status=status.HTTP_200_OK,
                )
        else:
            return Response(
                {
                    "available": True,
                    "message": "Email is available for registration.",
                    "suggestion": "register",
                },
                status=status.HTTP_200_OK,
            )
    except User.DoesNotExist:
        return Response(
            {
                "available": True,
                "message": "Email is available for registration.",
                "suggestion": "register",
            },
            status=status.HTTP_200_OK,
        )


def handle_local_file_download(file_url, document_id, preview_mode):
    """Handle local file downloads"""
    try:
        import os
        from pathlib import Path

        from django.conf import settings
        from django.http import FileResponse

        # Remove the /local_media/ prefix to get the relative path
        relative_path = file_url.replace("/local_media/", "")
        local_media_root = getattr(
            settings,
            "LOCAL_MEDIA_ROOT",
            Path(__file__).resolve().parent.parent.parent / "local_media",
        )
        file_path = local_media_root / relative_path

        if not file_path.exists():
            print(f"Local file not found: {file_path}")
            return Response(
                {"error": "File not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get filename from document if available
        filename = "document"
        if document_id:
            try:
                document = UserDocument.objects.get(id=document_id)
                filename = getattr(document, "file_name", "document")
            except UserDocument.DoesNotExist:
                filename = file_path.name

        # Determine content type
        content_type = "application/octet-stream"
        if filename.endswith(".pdf"):
            content_type = "application/pdf"
        elif filename.endswith((".jpg", ".jpeg")):
            content_type = "image/jpeg"
        elif filename.endswith(".png"):
            content_type = "image/png"

        print(f"Serving local file: {file_path}, content_type: {content_type}")

        # Create response
        response = FileResponse(open(file_path, "rb"), content_type=content_type)

        # Set appropriate headers
        if preview_mode:
            response["Content-Disposition"] = "inline"
        else:
            import urllib.parse

            filename = urllib.parse.quote(filename)
            response["Content-Disposition"] = f'attachment; filename="{filename}"'

        # Add CORS headers
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

        return response

    except Exception as e:
        print(f"Local file error: {str(e)}")
        return Response(
            {"error": f"Failed to access local file: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def handle_cloudinary_download(file_url, document_id, preview_mode, document=None):
    """Handle Cloudinary downloads"""
    try:
        # Import Cloudinary modules conditionally
        try:
            import cloudinary
            import cloudinary.api
        except ImportError:
            print(
                "Cloudinary package not installed. Please install it with: pip install cloudinary"
            )
            return Response(
                {"error": "Cloudinary service not available"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        import requests
        from django.conf import settings
        from django.http import HttpResponse

        # Configure Cloudinary
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_STORAGE["CLOUD_NAME"],
            api_key=settings.CLOUDINARY_STORAGE["API_KEY"],
            api_secret=settings.CLOUDINARY_STORAGE["API_SECRET"],
            secure=True,
        )

        # Extract public_id from the URL
        url_parts = file_url.split("/")
        if "upload" in url_parts:
            upload_index = url_parts.index("upload")
            if upload_index + 2 < len(url_parts):
                # Get the version and public_id parts
                version_and_path = "/".join(url_parts[upload_index + 2 :])

                # For both raw files and images, remove the version but keep the full path
                # URL format: /upload/v1234567890/chefsync/assets/images/2/file.jpg
                # We want: chefsync/assets/images/2/file (without extension for images)
                path_parts = version_and_path.split("/")
                if len(path_parts) > 1:
                    # Remove version (first part) and keep the rest
                    public_id = "/".join(path_parts[1:])

                    # For images, remove the file extension
                    if "/image/upload/" in file_url and "." in public_id:
                        public_id = public_id.rsplit(".", 1)[0]
                else:
                    public_id = version_and_path
            else:
                raise ValueError("Invalid Cloudinary URL format")
        else:
            raise ValueError("Invalid Cloudinary URL format")

        print(f"Extracted public_id: {public_id}")

        # Determine resource type from URL
        if "/image/upload/" in file_url:
            resource_type = "image"
        elif "/raw/upload/" in file_url:
            resource_type = "raw"
        else:
            resource_type = "raw"

        print(f"Resource type: {resource_type}")

        # Generate a signed URL for the file
        # For raw files (PDFs) on free Cloudinary accounts, we need to handle them differently
        if resource_type == "raw":
            print("Handling raw file (PDF) - checking for local file first")

            # First, try to serve from local file if available
            if (
                document
                and document.local_file_path
                and os.path.exists(document.local_file_path)
            ):
                print(f"Serving PDF from local file: {document.local_file_path}")
                try:
                    with open(document.local_file_path, "rb") as local_file:
                        file_content = local_file.read()

                    from django.http import HttpResponse

                    django_response = HttpResponse(
                        file_content, content_type="application/pdf"
                    )
                    django_response["Content-Disposition"] = (
                        f'inline; filename="{document.file_name}"'
                    )
                    django_response["Content-Length"] = str(len(file_content))

                    print(
                        f"Successfully served PDF from local file, size: {len(file_content)} bytes"
                    )
                    return django_response

                except Exception as local_error:
                    print(f"Failed to serve local file: {str(local_error)}")
                    # Continue to try Cloudinary as fallback

            # If no local file or local file failed, try Cloudinary
            print("No local file available, trying Cloudinary...")
            try:
                # Try to download the file directly from the original URL
                response = requests.get(file_url, stream=True, timeout=30)
                print(f"Direct download response status: {response.status_code}")
                response.raise_for_status()

                # If successful, serve the file content directly
                content_type = response.headers.get("content-type", "application/pdf")
                if file_url.endswith(".pdf") or "application/pdf" in content_type:
                    content_type = "application/pdf"

                # Create Django response with the file content
                from django.http import HttpResponse

                file_content = response.content

                django_response = HttpResponse(file_content, content_type=content_type)
                filename = document.file_name if document else "document.pdf"
                django_response["Content-Disposition"] = (
                    f'inline; filename="{filename}"'
                )
                django_response["Content-Length"] = str(len(file_content))

                print(
                    f"Successfully served PDF file directly, size: {len(file_content)} bytes"
                )
                return django_response

            except requests.exceptions.RequestException as e:
                print(f"Failed to download PDF directly: {str(e)}")
                raise ValueError(f"Failed to access PDF file: {str(e)}")
        else:
            # For images, use the normal signed URL approach
            try:
                signed_url = cloudinary.utils.cloudinary_url(
                    public_id, resource_type=resource_type, secure=True, sign_url=True
                )[0]
                print(f"Generated signed URL: {signed_url}")
            except Exception as url_error:
                print(f"Error generating signed URL: {str(url_error)}")
                # Try without signing as fallback
                try:
                    signed_url = cloudinary.utils.cloudinary_url(
                        public_id,
                        resource_type=resource_type,
                        secure=True,
                        sign_url=False,
                    )[0]
                    print(f"Generated unsigned URL as fallback: {signed_url}")
                except Exception as fallback_error:
                    print(f"Fallback URL generation failed: {str(fallback_error)}")
                    # Use original URL as final fallback
                    print("Using original URL as final fallback")
                    signed_url = file_url

        # Download the file using the signed URL (for images only, PDFs are handled above)
        try:
            response = requests.get(signed_url, stream=True, timeout=30)
            print(f"Cloudinary response status: {response.status_code}")
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Cloudinary access error: {str(e)}")
            # If signed URL fails, try the original URL as final fallback
            if signed_url != file_url:
                print(f"Trying original URL as fallback: {file_url}")
                response = requests.get(file_url, stream=True, timeout=30)
                print(f"Original URL response status: {response.status_code}")
                response.raise_for_status()
            else:
                raise

        # Determine proper content type
        content_type = response.headers.get("content-type", "application/octet-stream")
        if file_url.endswith(".pdf") or "application/pdf" in content_type:
            content_type = "application/pdf"
        elif file_url.endswith((".jpg", ".jpeg")) or "image/jpeg" in content_type:
            content_type = "image/jpeg"
        elif file_url.endswith(".png") or "image/png" in content_type:
            content_type = "image/png"

        # Create Django response
        django_response = HttpResponse(response.content, content_type=content_type)

        # Set headers
        if preview_mode:
            django_response["Content-Disposition"] = "inline"
        else:
            if document_id:
                try:
                    doc = UserDocument.objects.get(id=document_id)
                    filename = getattr(doc, "file_name", "document")
                except UserDocument.DoesNotExist:
                    filename = (
                        file_url.split("/")[-1] if "/" in file_url else "document"
                    )
            else:
                filename = file_url.split("/")[-1] if "/" in file_url else "document"

            import urllib.parse

            filename = urllib.parse.quote(filename)
            django_response["Content-Disposition"] = (
                f'attachment; filename="{filename}"'
            )

        django_response["Content-Length"] = str(len(response.content))
        django_response["Access-Control-Allow-Origin"] = "*"
        django_response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        django_response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

        print(
            f"Successfully proxied Cloudinary file, size: {len(response.content)} bytes"
        )
        return django_response

    except Exception as e:
        print(f"Cloudinary access error: {str(e)}")
        return Response(
            {"error": f"Failed to access Cloudinary file: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def get_jwt_token_location(request):
    """
    Determine where the JWT token is stored: in headers or cookies
    """
    # Check for Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header:
        # Authorization: Bearer <token>
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            return "headers", token

    # Check for cookies
    cookies = request.COOKIES
    for key, value in cookies.items():
        if key == "refresh" or key == "access":
            return "cookies", value

    return None, None


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_user_stats(request):
    """
    Get user statistics for admin dashboard
    """
    try:
        total_users = User.objects.count()
        active_users = User.objects.filter(status="active").count()
        pending_approvals = User.objects.filter(
            role__in=["cook", "DeliveryAgent"], approval_status="pending"
        ).count()
        approved_users = User.objects.filter(approval_status="approved").count()
        rejected_users = User.objects.filter(approval_status="rejected").count()

        # Role distribution
        admins = User.objects.filter(role__in=["admin", "Admin"]).count()
        cooks = User.objects.filter(role__in=["cook", "Cook"]).count()
        delivery_agents = User.objects.filter(role="DeliveryAgent").count()
        customers = User.objects.filter(role__in=["customer", "Customer"]).count()

        stats = {
            "total_users": total_users,
            "active_users": active_users,
            "pending_approvals": pending_approvals,
            "approved_users": approved_users,
            "rejected_users": rejected_users,
            "admins": admins,
            "cooks": cooks,
            "delivery_agents": delivery_agents,
            "customers": customers,
        }

        return Response(stats, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {"error": f"Failed to fetch user stats: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
