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
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    CustomerSerializer, CookSerializer, DeliveryAgentSerializer,
    PasswordChangeSerializer, EmailVerificationSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    GoogleOAuthSerializer, JWTTokenSerializer,
    SendOTPSerializer, VerifyOTPSerializer, CompleteRegistrationSerializer
)
from .models import User, Customer, Cook, DeliveryAgent
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
    
    # Increment failed login attempts
    try:
        user = User.objects.get(email=request.data.get('email'))
        user.increment_failed_login()
    except User.DoesNotExist:
        pass
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
            return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)

        # Use JWT service to refresh token
        from .services.jwt_service import JWTTokenService
        token_data = JWTTokenService.refresh_access_token(refresh_token, request)

        return Response({
            'access': token_data['access_token'],
            'refresh': refresh_token  # Keep the same refresh token
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Invalid refresh token'}, status=status.HTTP_400_BAD_REQUEST)


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
    serializer = GoogleOAuthSerializer(data=request.data)
    print('GOOGLE OAUTH DEBUG: Received data:', request.data)
    print('GOOGLE OAUTH DEBUG: Using client_id:', settings.GOOGLE_OAUTH_CLIENT_ID)
    # Only allow customer role for Google OAuth
    forced_role = 'customer'
    if serializer.is_valid():
        try:
            # Verify Google ID token
            idinfo = id_token.verify_oauth2_token(
                serializer.validated_data['id_token'],
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID
            )
            
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
            
            if created:
                user.set_unusable_password()
                user.save()
                # Create customer profile for new Google OAuth users
                try:
                    user.create_profile()
                except Exception as e:
                    print(f"Profile creation failed: {e}")
                    # Continue without profile creation
            
            # Generate JWT tokens using the service
            from .services.jwt_service import JWTTokenService
            token_data = JWTTokenService.create_tokens(user, request)
            
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            
            return Response({
                'message': 'Google OAuth login successful',
                'access': token_data['access_token'],
                'refresh': token_data['refresh_token'],
                'user': UserProfileSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        except GoogleAuthError as e:
            print(f"Google Auth Error: {e}")
            return Response({
                'error': 'Invalid Google token'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Google OAuth Error: {e}")
            return Response({
                'error': 'Authentication failed. Please try again.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
    serializer = SendOTPSerializer(data=request.data)
    if serializer.is_valid():
        result = serializer.send_otp()
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
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
            
            # Generate JWT tokens using the service
            try:
                from .services.jwt_service import JWTTokenService
                token_data = JWTTokenService.create_tokens(user, request)
                print(f"✅ JWT tokens created successfully")  # Debug log
            except Exception as e:
                print(f"💥 Error creating JWT tokens: {str(e)}")  # Debug log
                raise
            
            # Create user profile data
            try:
                user_profile_data = UserProfileSerializer(user).data
                print(f"✅ User profile serialized successfully")  # Debug log
            except Exception as e:
                print(f"💥 Error serializing user profile: {str(e)}")  # Debug log
                raise
            
            response_data = {
                'message': 'Registration completed successfully',
                'user': user_profile_data,
                'tokens': {
                    'refresh': token_data['refresh_token'],
                    'access': token_data['access_token']
                }
            }
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


# Admin Approval Management Views
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def pending_approvals(request):
    """
    Get pending user approvals filtered by role
    """
    try:
        role = request.query_params.get('role')
        if not role:
            return Response(
                {'error': 'Role parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate role
        valid_roles = ['cook', 'delivery_agent']
        if role not in valid_roles:
            return Response(
                {'error': f'Invalid role. Must be one of: {valid_roles}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get pending users for the specified role
        pending_users = User.objects.filter(
            role=role,
            is_active=False  # Assuming inactive users are pending approval
        ).order_by('-date_joined')

        users_data = []
        for user in pending_users:
            users_data.append({
                'id': user.user_id,
                'name': user.name or f"{user.first_name} {user.last_name}".strip(),
                'email': user.email,
                'role': user.role,
                'phone_no': user.phone_no,
                'address': user.address,
                'created_at': user.date_joined,
                'approval_status': 'pending'
            })

        return Response({
            'users': users_data,
            'count': len(users_data)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': f'Failed to fetch pending approvals: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_cook(request, user_id):
    """
    Approve a cook application
    """
    try:
        user = get_object_or_404(User, user_id=user_id, role='cook')

        if user.is_active:
            return Response(
                {'error': 'User is already approved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Activate the user
        user.is_active = True
        user.save()

        # Create cook profile if it doesn't exist
        cook_profile, created = Cook.objects.get_or_create(
            user=user,
            defaults={
                'specialties': '',
                'experience_years': 0,
                'certifications': '',
                'availability_status': 'available'
            }
        )

        return Response({
            'message': 'Cook approved successfully',
            'user': {
                'id': user.user_id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active
            }
        }, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response(
            {'error': 'Cook not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to approve cook: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_delivery_agent(request, user_id):
    """
    Approve a delivery agent application
    """
    try:
        user = get_object_or_404(User, user_id=user_id, role='delivery_agent')

        if user.is_active:
            return Response(
                {'error': 'User is already approved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Activate the user
        user.is_active = True
        user.save()

        # Create delivery agent profile if it doesn't exist
        delivery_profile, created = DeliveryAgent.objects.get_or_create(
            user=user,
            defaults={
                'vehicle_type': 'bike',  # Default vehicle type
                'license_number': '',
                'availability_status': 'available',
                'current_location': None
            }
        )

        return Response({
            'message': 'Delivery agent approved successfully',
            'user': {
                'id': user.user_id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active
            }
        }, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response(
            {'error': 'Delivery agent not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to approve delivery agent: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
