from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login, logout
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import get_object_or_404
from django_ratelimit.decorators import ratelimit
import os
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    CustomerSerializer, CookSerializer, DeliveryAgentSerializer,
    PasswordChangeSerializer, EmailVerificationSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    GoogleOAuthSerializer, JWTTokenSerializer,
    SendOTPSerializer, VerifyOTPSerializer, CompleteRegistrationSerializer,
    DocumentTypeSerializer, UserDocumentSerializer, UserApprovalSerializer, UserApprovalActionSerializer
)
from .models import User, Customer, Cook, DeliveryAgent
from django.apps import apps

# Get models from Django's app registry to avoid import issues
DocumentType = apps.get_model('authentication', 'DocumentType')
UserDocument = apps.get_model('authentication', 'UserDocument')
import json

# Health Check Endpoint
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Simple health check endpoint to verify server is running"""
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now(),
        'message': 'ChefSync API is running'
    }, status=status.HTTP_200_OK)
import requests
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from google.auth.exceptions import GoogleAuthError


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='10/h', method='POST', block=True)
def user_registration(request):
    """
    User registration with email verification
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Send email verification
        try:
            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={user.email_verification_token}"
            send_mail(
                'Verify Your Email - ChefSync',
                f'Please click the following link to verify your email: {verification_url}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            # Log error but don't fail registration
            print(f"Email sending failed: {e}")
        
        return Response({
            'message': 'User registered successfully. Please check your email for verification.',
            'user_id': user.user_id
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='5/m', method='POST', block=True)
def user_login(request):
    """
    User login with JWT tokens
    """
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Reset failed login attempts on successful login
        user.reset_failed_login_attempts()
        
        # Generate JWT tokens using the service
        from .services.jwt_service import JWTTokenService
        token_data = JWTTokenService.create_tokens(user, request)
        
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        
        return Response({
            'message': 'Login successful',
            'access': token_data['access_token'],
            'refresh': token_data['refresh_token'],
            'user': UserProfileSerializer(user).data
        }, status=status.HTTP_200_OK)
    
    # Handle different types of validation errors
    errors = serializer.errors
    
    # Check if it's an approval status error
    if 'non_field_errors' in errors:
        error_data = errors['non_field_errors'][0]
        if isinstance(error_data, dict) and 'approval_status' in error_data:
            # This is an approval status error
            return Response({
                'error': 'Account approval required',
                'approval_status': error_data['approval_status'],
                'message': error_data['message'],
                'email': error_data.get('email')
            }, status=status.HTTP_403_FORBIDDEN)
    
    # Increment failed login attempts for invalid credentials
    try:
        user = User.objects.get(email=request.data.get('email'))
        user.increment_failed_login()
    except User.DoesNotExist:
        pass
    
    return Response(errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    """
    User logout and token blacklisting
    """
    try:
        # Revoke tokens using the service
        from .services.jwt_service import JWTTokenService
        
        refresh_token = request.data.get('refresh')
        if refresh_token:
            JWTTokenService.revoke_token(refresh_token, 'refresh')
        
        # Revoke all user tokens for security
        JWTTokenService.revoke_all_user_tokens(request.user)
        
        logout(request)
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh(request):
    """
    Refresh JWT access token
    """
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            print("Token refresh failed: No refresh token provided")
            return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Token refresh attempt for token: {refresh_token[:20]}...")
        
        # Use JWT service to refresh token
        from .services.jwt_service import JWTTokenService
        token_data = JWTTokenService.refresh_access_token(refresh_token, request)
        
        print("Token refresh successful")
        return Response({
            'access': token_data['access_token'],
            'refresh': refresh_token  # Keep the same refresh token
        }, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Token refresh error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        return Response({'error': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Verify user email with token
    """
    serializer = EmailVerificationSerializer(data=request.data)
    if serializer.is_valid():
        token = serializer.validated_data['token']
        
        try:
            user = User.objects.get(email_verification_token=token)
            if user.verify_email(token):
                return Response({
                    'message': 'Email verified successfully'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid or expired verification token'
                }, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid verification token'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='3/h', method='POST', block=True)
def request_password_reset(request):
    """
    Request password reset with OTP
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            
            # Send OTP for password reset
            from .services.email_service import EmailService
            result = EmailService.send_otp(email, purpose='password_reset', user_name=user.name)
            
            if result['success']:
                return Response({
                    'message': 'Password reset code sent to your email'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': result['message']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except User.DoesNotExist:
            return Response({
                'error': 'No account found with this email address'
            }, status=status.HTTP_404_NOT_FOUND)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    """
    Confirm password reset with OTP and set new password
    """
    data = request.data
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')
    
    if not all([email, otp, new_password, confirm_password]):
        return Response({
            'error': 'Email, OTP, new password, and confirm password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if new_password != confirm_password:
        return Response({
            'error': "Passwords don't match"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate password strength
    try:
        from django.contrib.auth.password_validation import validate_password
        validate_password(new_password)
    except Exception as e:
        return Response({
            'error': f'Password validation failed: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Verify OTP
        from .services.email_service import EmailService
        result = EmailService.verify_otp(email, otp, purpose='password_reset')
        
        if not result['success']:
            return Response({
                'error': result['message']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user and update password
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Password reset successful'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Password reset failed: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_login(request):
    """
    Google OAuth login
    """
    print('\n=== GOOGLE OAUTH LOGIN DEBUG START ===')
    print('Request method:', request.method)
    print('Request headers:', dict(request.headers))
    print('Request data:', request.data)
    print('Client ID from settings:', settings.GOOGLE_OAUTH_CLIENT_ID)
    print('Client Secret configured:', bool(settings.GOOGLE_OAUTH_CLIENT_SECRET))
    
    serializer = GoogleOAuthSerializer(data=request.data)
    print('Serializer data:', serializer.initial_data)
    
    # Only allow customer role for Google OAuth
    forced_role = 'customer'
    
    if not serializer.is_valid():
        print('Serializer validation failed:', serializer.errors)
        print('=== GOOGLE OAUTH LOGIN DEBUG END ===\n')
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    print('Serializer valid, validated data:', serializer.validated_data)
    
    try:
        print('Attempting to verify Google token...')
        # Verify Google ID token
        idinfo = id_token.verify_oauth2_token(
            serializer.validated_data['id_token'],
            google_requests.Request(),
            settings.GOOGLE_OAUTH_CLIENT_ID
        )
        
        print('Google token verified successfully!')
        print('Token info:', idinfo)
        
        email = idinfo['email']
        name = idinfo.get('name', '')
        
        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'name': name,
                'email_verified': True,
                'role': forced_role  # Only allow customer role for Google OAuth users
            }
        )
        
        print(f'User {"created" if created else "found"}: {user.email}')
        
        if created:
            user.set_unusable_password()
            user.save()
            print('Set unusable password for new Google user')
            # Create customer profile for new Google OAuth users
            try:
                user.create_profile()
                print('Created customer profile')
            except Exception as e:
                print(f"Profile creation failed: {e}")
                # Continue without profile creation
        
        # Generate JWT tokens using the service
        from .services.jwt_service import JWTTokenService
        token_data = JWTTokenService.create_tokens(user, request)
        
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        
        print('Google OAuth login successful!')
        print('=== GOOGLE OAUTH LOGIN DEBUG END ===\n')
        
        return Response({
            'message': 'Google OAuth login successful',
            'access': token_data['access_token'],
            'refresh': token_data['refresh_token'],
            'user': UserProfileSerializer(user).data
        }, status=status.HTTP_200_OK)
        
    except GoogleAuthError as e:
        # GoogleAuthError contains useful messages; include them in logs and response for debugging
        print(f"Google Auth Error: {repr(e)}")
        print('=== GOOGLE OAUTH LOGIN DEBUG END ===\n')
        return Response({
            'error': 'Invalid Google token',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except ValueError as e:
        # id_token.verify_oauth2_token may raise ValueError for invalid tokens
        print(f"Google token verification failed: {repr(e)}")
        print('=== GOOGLE OAUTH LOGIN DEBUG END ===\n')
        return Response({'error': 'Invalid Google token', 'details': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        # Catch-all: log full exception for debugging
        import traceback
        tb = traceback.format_exc()
        print(f"Google OAuth unexpected error: {repr(e)}\n{tb}")
        print('=== GOOGLE OAUTH LOGIN DEBUG END ===\n')
        return Response({
            'error': 'Authentication failed. Please try again.',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get user profile
    """
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    Update user profile
    """
    serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Profile updated successfully',
            'user': serializer.data
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password
    """
    serializer = PasswordChangeSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({
                'error': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_customer_profile(request):
    """
    Create customer profile for existing user
    """
    try:
        customer = Customer.objects.create(user=request.user)
        serializer = CustomerSerializer(customer)
        return Response({
            'message': 'Customer profile created successfully',
            'customer': serializer.data
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_cook_profile(request):
    """
    Create cook profile for existing user
    """
    serializer = CookSerializer(data=request.data)
    if serializer.is_valid():
        cook = serializer.save(user=request.user)
        return Response({
            'message': 'Cook profile created successfully',
            'cook': CookSerializer(cook).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_delivery_agent_profile(request):
    """
    Create delivery agent profile for existing user
    """
    serializer = DeliveryAgentSerializer(data=request.data)
    if serializer.is_valid():
        delivery_agent = serializer.save(user=request.user)
        return Response({
            'message': 'Delivery agent profile created successfully',
            'delivery_agent': DeliveryAgentSerializer(delivery_agent).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    """
    Send OTP to email for verification
    """
    try:
        print(f"OTP request data: {request.data}")
        serializer = SendOTPSerializer(data=request.data)
        if serializer.is_valid():
            print("OTP serializer is valid, sending OTP...")
            result = serializer.send_otp()
            print(f"OTP send result: {result}")
            if result['success']:
                return Response({
                    'message': result['message'],
                    'success': True
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'message': result['message'],
                    'success': False
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            print(f"OTP serializer validation errors: {serializer.errors}")
            return Response({
                'message': 'Invalid data provided',
                'errors': serializer.errors,
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'message': f'Internal server error: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    Verify OTP for email verification
    """
    print(f"🔍 OTP Verification Request: {request.data}")  # Debug log
    serializer = VerifyOTPSerializer(data=request.data)
    if serializer.is_valid():
        print(f"✅ Serializer validation passed")  # Debug log
        result = serializer.verify_otp()
        print(f"🔍 OTP verification result: {result}")  # Debug log
        if result['success']:
            return Response({
                'message': result['message'],
                'success': True
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'message': result['message'],
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)
    else:
        print(f"❌ Serializer validation failed: {serializer.errors}")  # Debug log
        return Response({
            'message': 'Invalid data provided',
            'errors': serializer.errors,
            'success': False
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
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
            print(f"✅ User created successfully: {user.email}")  # Debug log
            
            # Refresh user from database to ensure all relationships are loaded
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
                'message': 'Registration completed successfully',
                'user': user_profile_data
            }
            
            if user.role == 'customer':
                # Generate JWT tokens for customers who can login immediately
                try:
                    from .services.jwt_service import JWTTokenService
                    token_data = JWTTokenService.create_tokens(user, request)
                    print(f"✅ JWT tokens created successfully for customer")  # Debug log
                    response_data['tokens'] = {
                        'refresh': token_data['refresh_token'],
                        'access': token_data['access_token']
                    }
                except Exception as e:
                    print(f"💥 Error creating JWT tokens: {str(e)}")  # Debug log
                    raise
            else:
                # For cooks and delivery agents, don't provide tokens
                print(f"✅ No tokens provided for {user.role} - requires admin approval")  # Debug log
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
        
        return Response({
            'error': 'Internal server error during registration',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
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
            token_data.append({
                'id': token.id,
                'token_type': token.token_type,
                'issued_at': token.issued_at,
                'expires_at': token.expires_at,
                'last_used_at': token.last_used_at,
                'usage_count': token.usage_count,
                'ip_address': token.ip_address,
                'device_info': token.device_info,
                'is_valid': token.is_valid(),
            })
        
        return Response({
            'tokens': token_data,
            'count': len(token_data)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def revoke_token(request):
    """
    Revoke a specific token
    """
    try:
        from .services.jwt_service import JWTTokenService
        
        token = request.data.get('token')
        token_type = request.data.get('token_type', 'refresh')
        
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        success = JWTTokenService.revoke_token(token, token_type)
        
        if success:
            return Response({'message': 'Token revoked successfully'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Token not found or already revoked'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def revoke_all_tokens(request):
    """
    Revoke all tokens for the current user
    """
    try:
        from .services.jwt_service import JWTTokenService
        
        token_type = request.data.get('token_type', 'refresh')  # Only refresh tokens supported
        revoked_count = JWTTokenService.revoke_all_user_tokens(request.user, token_type)
        
        return Response({
            'message': f'Successfully revoked {revoked_count} tokens',
            'revoked_count': revoked_count
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Admin User Management ViewSet
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users (Admin only)
    """
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = User.objects.all()
        user_type = self.request.query_params.get('user_type', None)
        is_active = self.request.query_params.get('is_active', None)
        search = self.request.query_params.get('search', None)
        
        if user_type:
            queryset = queryset.filter(role=user_type)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        if search:
            queryset = queryset.filter(
                username__icontains=search
            ) | queryset.filter(
                email__icontains=search
            ) | queryset.filter(
                first_name__icontains=search
            ) | queryset.filter(
                last_name__icontains=search
            )
        
        return queryset


# Document Management Endpoints
@api_view(['GET'])
@permission_classes([AllowAny])
def get_document_types(request):
    """
    Get available document types for a specific role
    """
    role = request.query_params.get('role')
    if not role:
        return Response({'error': 'Role parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if role not in ['cook', 'delivery_agent']:
        return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
    
    document_types = DocumentType.objects.filter(category=role)
    serializer = DocumentTypeSerializer(document_types, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_document(request):
    """
    Upload a document for verification
    """
    serializer = UserDocumentSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        document = serializer.save()
        return Response({
            'message': 'Document uploaded successfully',
            'document': UserDocumentSerializer(document).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def upload_document_during_registration(request):
    """
    Upload a document during registration process (before user is authenticated)
    """
    try:
        print(f"Upload registration request data: {request.data}")
        print(f"Upload registration request files: {request.FILES}")
        
        # Get user email from request data
        user_email = request.data.get('user_email')
        if not user_email:
            print("Upload error: No user email provided")
            return Response({'error': 'User email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the user by email
        try:
            user = User.objects.get(email=user_email)
            print(f"Found user: {user.email}")
        except User.DoesNotExist:
            print(f"Upload error: User not found for email: {user_email}")
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Validate required fields
        if 'file_upload' not in request.FILES:
            print("Upload error: No file_upload in request.FILES")
            return Response({
                'error': 'No file provided',
                'message': 'Please select a file to upload'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if 'document_type_id' not in request.data:
            return Response({
                'error': 'Document type is required',
                'message': 'Please select a document type'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create a modified request data with user context
        serializer = UserDocumentSerializer(data=request.data, context={'user': user})
        if serializer.is_valid():
            try:
                document = serializer.save()
                return Response({
                    'message': 'Document uploaded successfully',
                    'document': UserDocumentSerializer(document).data
                }, status=status.HTTP_201_CREATED)
            except Exception as save_error:
                import traceback
                error_details = str(save_error)
                print(f"Document save error: {error_details}")
                print(f"Traceback: {traceback.format_exc()}")
                return Response({
                    'error': 'Failed to save document',
                    'message': f'Error saving document: {error_details}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Format validation errors for better user experience
            errors = serializer.errors
            if 'file_upload' in errors:
                return Response({
                    'error': 'File validation failed',
                    'message': errors['file_upload'][0] if isinstance(errors['file_upload'], list) else str(errors['file_upload']),
                    'details': errors
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'error': 'Validation failed',
                    'message': 'Please check your input and try again',
                    'details': errors
                }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        # Ensure we always return JSON, even for unexpected errors
        import traceback
        error_details = str(e)
        print(f"Upload error: {error_details}")
        print(f"Traceback: {traceback.format_exc()}")
        return Response({
            'error': 'Internal server error during upload',
            'details': error_details
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_documents(request):
    """
    Get all documents uploaded by the current user
    """
    documents = UserDocument.objects.filter(user=request.user).order_by('-uploaded_at')
    serializer = UserDocumentSerializer(documents, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_document(request, document_id):
    """
    Delete a user's document
    """
    try:
        document = UserDocument.objects.get(id=document_id, user=request.user)
        document.delete()
        return Response({'message': 'Document deleted successfully'}, status=status.HTTP_200_OK)
    except UserDocument.DoesNotExist:
        return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def proxy_document_download(request):
    """
    Proxy document download to handle CORS issues with Cloudinary
    """
    try:
        document_id = request.data.get('document_id')
        file_url = request.data.get('file_url')
        preview_mode = request.data.get('preview', False)
        
        print(f"Proxy request - Document ID: {document_id}, File URL: {file_url}, Preview: {preview_mode}")
        print(f"User: {request.user}, Is Staff: {request.user.is_staff}")
        
        if not document_id and not file_url:
            return Response({'error': 'Document ID or file URL is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # If document_id is provided, get the document and verify access
        if document_id:
            try:
                document = UserDocument.objects.get(id=document_id)
                print(f"Found document: {document.file_name}, User: {document.user}")
                
                # Check if user has access to this document
                if not (request.user.is_staff or document.user == request.user):
                    print(f"Access denied for user {request.user} to document {document_id}")
                    return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
                file_url = document.file
            except UserDocument.DoesNotExist:
                print(f"Document not found: {document_id}")
                return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if not file_url:
            return Response({'error': 'File URL not available'}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Attempting to fetch file from: {file_url}")
        
        # Check if it's a local file
        if file_url.startswith('/local_media/'):
            return handle_local_file_download(file_url, document_id, preview_mode)
        else:
            # Pass the document object if available
            document_obj = None
            if document_id:
                try:
                    document_obj = UserDocument.objects.get(id=document_id)
                except UserDocument.DoesNotExist:
                    pass
            return handle_cloudinary_download(file_url, document_id, preview_mode, document_obj)
            
    except Exception as e:
        print(f"General error: {str(e)}")
        return Response({'error': f'Download failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Admin Approval Endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_pending_approvals(request):
    """
    Get all users pending approval (cooks and delivery agents)
    """
    try:
        role_filter = request.GET.get('role')
        
        if role_filter:
            # Filter by specific role if provided
            pending_users = User.objects.filter(
                role=role_filter,
                approval_status='pending'
            ).order_by('created_at')
        else:
            # Get all pending users (cooks and delivery agents)
            pending_users = User.objects.filter(
                role__in=['cook', 'delivery_agent'],
                approval_status='pending'
            ).order_by('created_at')
        
        serializer = UserApprovalSerializer(pending_users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': f'Failed to fetch pending approvals: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_user_for_approval(request, user_id):
    """
    Get detailed information about a user for approval review
    """
    try:
        print(f"Getting user details for user_id: {user_id}")
        print(f"Request user: {request.user}, Is staff: {request.user.is_staff}")
        
        user = User.objects.select_related('approved_by').prefetch_related('documents__document_type').get(
            user_id=user_id, 
            role__in=['cook', 'delivery_agent']
        )
        
        print(f"Found user: {user.name} ({user.email})")
        print(f"User approval status: {user.approval_status}")
        print(f"User documents count: {user.documents.count()}")
        
        # Log document details
        for doc in user.documents.all():
            print(f"Document: {doc.file_name}, URL: {doc.file}, Visible: {doc.is_visible_to_admin}")
        
        serializer = UserApprovalSerializer(user)
        data = serializer.data
        
        print(f"Serialized data documents count: {len(data.get('documents', []))}")
        
        return Response(data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        print(f"User not found: {user_id}")
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error fetching user details: {str(e)}")
        return Response({'error': f'Failed to fetch user details: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_user(request, user_id):
    """
    Approve or reject a user
    """
    try:
        user = User.objects.get(user_id=user_id, role__in=['cook', 'delivery_agent'])
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Failed to fetch user: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    serializer = UserApprovalActionSerializer(data=request.data)
    if serializer.is_valid():
        action = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '')
        
        if action == 'approve':
            user.approval_status = 'approved'
            user.approval_notes = notes
            user.approved_by = request.user
            user.approved_at = timezone.now()
            user.save()
            
            # Make all user documents visible to admin after approval
            user.documents.update(is_visible_to_admin=True)
            
            # Send approval email using the new email service
            from .services.email_service import EmailService
            EmailService.send_approval_email(user, 'approved', notes)
            
            return Response({
                'message': 'User approved successfully',
                'user': UserApprovalSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        elif action == 'reject':
            user.approval_status = 'rejected'
            user.approval_notes = notes
            user.approved_by = request.user
            user.approved_at = timezone.now()
            user.save()
            
            # Send rejection email using the new email service
            from .services.email_service import EmailService
            EmailService.send_approval_email(user, 'rejected', notes)
            
            return Response({
                'message': 'User rejected successfully',
                'user': UserApprovalSerializer(user).data
            }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_approval_status(request):
    """
    Check the approval status of the current user
    """
    user = request.user
    if user.role in ['cook', 'delivery_agent']:
        return Response({
            'approval_status': user.approval_status,
            'approval_status_display': user.get_approval_status_display(),
            'approval_notes': user.approval_notes,
            'approved_at': user.approved_at,
            'can_login': user.can_login(),
            'message': user.get_approval_message()
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'approval_status': 'approved',
            'approval_status_display': 'Approved',
            'can_login': True,
            'message': 'Your account is ready to use.'
        }, status=status.HTTP_200_OK)




@api_view(['POST'])
@permission_classes([AllowAny])
def clear_all_tokens(request):
    """
    Clear all tokens for debugging purposes
    """
    try:
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.get(email=email)
        from .services.jwt_service import JWTTokenService
        revoked_count = JWTTokenService.revoke_all_user_tokens(user, 'refresh')
        
        return Response({
            'message': f'Revoked {revoked_count} tokens for user {email}'
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def check_user_status(request):
    """
    Check the approval status of a user by email (for login page)
    """
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        
        # Only return approval status for cooks and delivery agents
        if user.role in ['cook', 'delivery_agent']:
            return Response({
                'approval_status': user.approval_status,
                'approval_status_display': user.get_approval_status_display(),
                'can_login': user.can_login(),
                'message': user.get_approval_message(),
                'role': user.role
            }, status=status.HTTP_200_OK)
        else:
            # For customers and admins, they can always login
            return Response({
                'approval_status': 'approved',
                'approval_status_display': 'Approved',
                'can_login': True,
                'message': 'Your account is ready to use.',
                'role': user.role
            }, status=status.HTTP_200_OK)
            
    except User.DoesNotExist:
        # User doesn't exist, don't reveal this information
        return Response({
            'approval_status': 'unknown',
            'approval_status_display': 'Unknown',
            'can_login': False,
            'message': 'Account not found',
            'role': 'unknown'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def check_email_availability(request):
    """
    Check if an email is available for registration
    """
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        if user.is_active:
            # Provide detailed information based on user role and status
            if user.role == 'customer':
                return Response({
                    'available': False,
                    'message': 'This email is already registered as a customer. Please try logging in instead.',
                    'suggestion': 'login',
                    'user_role': user.role,
                    'approval_status': 'approved'
                }, status=status.HTTP_200_OK)
            elif user.role in ['cook', 'delivery_agent']:
                if user.approval_status == 'pending':
                    return Response({
                        'available': False,
                        'message': 'This email is already registered and your account is pending approval. Please wait for admin approval.',
                        'suggestion': 'wait_approval',
                        'user_role': user.role,
                        'approval_status': user.approval_status
                    }, status=status.HTTP_200_OK)
                elif user.approval_status == 'rejected':
                    return Response({
                        'available': False,
                        'message': 'This email was previously registered but the account was rejected. Please contact support for assistance.',
                        'suggestion': 'contact_support',
                        'user_role': user.role,
                        'approval_status': user.approval_status
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'available': False,
                        'message': 'This email is already registered. Please try logging in instead.',
                        'suggestion': 'login',
                        'user_role': user.role,
                        'approval_status': user.approval_status
                    }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'available': False,
                    'message': 'This email is already registered. Please try logging in instead.',
                    'suggestion': 'login',
                    'user_role': user.role,
                    'approval_status': 'approved'
                }, status=status.HTTP_200_OK)
        else:
            return Response({
                'available': True,
                'message': 'Email is available for registration.',
                'suggestion': 'register'
            }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({
            'available': True,
            'message': 'Email is available for registration.',
            'suggestion': 'register'
        }, status=status.HTTP_200_OK)


def handle_local_file_download(file_url, document_id, preview_mode):
    """Handle local file downloads"""
    try:
        from django.http import FileResponse
        from django.conf import settings
        from pathlib import Path
        import os
        
        # Remove the /local_media/ prefix to get the relative path
        relative_path = file_url.replace('/local_media/', '')
        local_media_root = getattr(settings, 'LOCAL_MEDIA_ROOT', Path(__file__).resolve().parent.parent.parent / 'local_media')
        file_path = local_media_root / relative_path
        
        if not file_path.exists():
            print(f"Local file not found: {file_path}")
            return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get filename from document if available
        filename = 'document'
        if document_id:
            try:
                document = UserDocument.objects.get(id=document_id)
                filename = document.file_name
            except UserDocument.DoesNotExist:
                filename = file_path.name
        
        # Determine content type
        content_type = 'application/octet-stream'
        if filename.endswith('.pdf'):
            content_type = 'application/pdf'
        elif filename.endswith(('.jpg', '.jpeg')):
            content_type = 'image/jpeg'
        elif filename.endswith('.png'):
            content_type = 'image/png'
        
        print(f"Serving local file: {file_path}, content_type: {content_type}")
        
        # Create response
        response = FileResponse(
            open(file_path, 'rb'),
            content_type=content_type
        )
        
        # Set appropriate headers
        if preview_mode:
            response['Content-Disposition'] = 'inline'
        else:
            import urllib.parse
            filename = urllib.parse.quote(filename)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        # Add CORS headers
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        
        return response
        
    except Exception as e:
        print(f"Local file error: {str(e)}")
        return Response({'error': f'Failed to access local file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def handle_cloudinary_download(file_url, document_id, preview_mode, document=None):
    """Handle Cloudinary downloads"""
    try:
        # Import Cloudinary modules conditionally
        try:
            import cloudinary
            import cloudinary.api
        except ImportError:
            print("Cloudinary package not installed. Please install it with: pip install cloudinary")
            return Response({'error': 'Cloudinary service not available'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        from django.http import HttpResponse
        from django.conf import settings
        import requests
        
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_STORAGE['CLOUD_NAME'],
            api_key=settings.CLOUDINARY_STORAGE['API_KEY'],
            api_secret=settings.CLOUDINARY_STORAGE['API_SECRET'],
            secure=True
        )
        
        # Extract public_id from the URL
        url_parts = file_url.split('/')
        if 'upload' in url_parts:
            upload_index = url_parts.index('upload')
            if upload_index + 2 < len(url_parts):
                # Get the version and public_id parts
                version_and_path = '/'.join(url_parts[upload_index + 2:])
                
                # For both raw files and images, remove the version but keep the full path
                # URL format: /upload/v1234567890/chefsync/assets/images/2/file.jpg
                # We want: chefsync/assets/images/2/file (without extension for images)
                path_parts = version_and_path.split('/')
                if len(path_parts) > 1:
                    # Remove version (first part) and keep the rest
                    public_id = '/'.join(path_parts[1:])
                    
                    # For images, remove the file extension
                    if '/image/upload/' in file_url and '.' in public_id:
                        public_id = public_id.rsplit('.', 1)[0]
                else:
                    public_id = version_and_path
            else:
                raise ValueError("Invalid Cloudinary URL format")
        else:
            raise ValueError("Invalid Cloudinary URL format")
        
        print(f"Extracted public_id: {public_id}")
        
        # Determine resource type from URL
        if '/image/upload/' in file_url:
            resource_type = 'image'
        elif '/raw/upload/' in file_url:
            resource_type = 'raw'
        else:
            resource_type = 'raw'
        
        print(f"Resource type: {resource_type}")
        
        # Generate a signed URL for the file
        # For raw files (PDFs) on free Cloudinary accounts, we need to handle them differently
        if resource_type == 'raw':
            print("Handling raw file (PDF) - checking for local file first")
            
            # First, try to serve from local file if available
            if document and document.local_file_path and os.path.exists(document.local_file_path):
                print(f"Serving PDF from local file: {document.local_file_path}")
                try:
                    with open(document.local_file_path, 'rb') as local_file:
                        file_content = local_file.read()
                    
                    from django.http import HttpResponse
                    django_response = HttpResponse(file_content, content_type='application/pdf')
                    django_response['Content-Disposition'] = f'inline; filename="{document.file_name}"'
                    django_response['Content-Length'] = str(len(file_content))
                    
                    print(f"Successfully served PDF from local file, size: {len(file_content)} bytes")
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
                content_type = response.headers.get('content-type', 'application/pdf')
                if file_url.endswith('.pdf') or 'application/pdf' in content_type:
                    content_type = 'application/pdf'
                
                # Create Django response with the file content
                from django.http import HttpResponse
                file_content = response.content
                
                django_response = HttpResponse(file_content, content_type=content_type)
                filename = document.file_name if document else 'document.pdf'
                django_response['Content-Disposition'] = f'inline; filename="{filename}"'
                django_response['Content-Length'] = str(len(file_content))
                
                print(f"Successfully served PDF file directly, size: {len(file_content)} bytes")
                return django_response
                
            except requests.exceptions.RequestException as e:
                print(f"Failed to download PDF directly: {str(e)}")
                raise ValueError(f"Failed to access PDF file: {str(e)}")
        else:
            # For images, use the normal signed URL approach
            try:
                signed_url = cloudinary.utils.cloudinary_url(
                    public_id,
                    resource_type=resource_type,
                    secure=True,
                    sign_url=True
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
                        sign_url=False
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
        content_type = response.headers.get('content-type', 'application/octet-stream')
        if file_url.endswith('.pdf') or 'application/pdf' in content_type:
            content_type = 'application/pdf'
        elif file_url.endswith(('.jpg', '.jpeg')) or 'image/jpeg' in content_type:
            content_type = 'image/jpeg'
        elif file_url.endswith('.png') or 'image/png' in content_type:
            content_type = 'image/png'
        
        # Create Django response
        django_response = HttpResponse(
            response.content,
            content_type=content_type
        )
        
        # Set headers
        if preview_mode:
            django_response['Content-Disposition'] = 'inline'
        else:
            if document_id:
                try:
                    document = UserDocument.objects.get(id=document_id)
                    filename = document.file_name
                except UserDocument.DoesNotExist:
                    filename = file_url.split('/')[-1] if '/' in file_url else 'document'
            else:
                filename = file_url.split('/')[-1] if '/' in file_url else 'document'
            
            import urllib.parse
            filename = urllib.parse.quote(filename)
            django_response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        django_response['Content-Length'] = str(len(response.content))
        django_response['Access-Control-Allow-Origin'] = '*'
        django_response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        django_response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        
        print(f"Successfully proxied Cloudinary file, size: {len(response.content)} bytes")
        return django_response
        
    except Exception as e:
        print(f"Cloudinary access error: {str(e)}")
        return Response({'error': f'Failed to access Cloudinary file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
