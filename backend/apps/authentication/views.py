from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login, logout
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import get_object_or_404
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    CustomerSerializer, CookSerializer, DeliveryAgentSerializer,
    PasswordChangeSerializer, EmailVerificationSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    GoogleOAuthSerializer, JWTTokenSerializer
)
from .models import User, Customer, Cook, DeliveryAgent
import json
import requests
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from google.auth.exceptions import GoogleAuthError


@api_view(['POST'])
@permission_classes([AllowAny])
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
def user_login(request):
    """
    User login with JWT tokens
    """
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Reset failed login attempts on successful login
        user.reset_failed_login_attempts()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        # Add custom claims
        access['user_id'] = user.user_id
        access['email'] = user.email
        access['name'] = user.name
        
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        
        return Response({
            'message': 'Login successful',
            'access': str(access),
            'refresh': str(refresh),
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
        # Blacklist refresh token
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
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
        
        token = RefreshToken(refresh_token)
        access = token.access_token
        
        # Add custom claims
        user = User.objects.get(user_id=access['user_id'])
        access['user_id'] = user.user_id
        access['email'] = user.email
        access['name'] = user.name
        
        return Response({
            'access': str(access),
            'refresh': str(token)
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
def request_password_reset(request):
    """
    Request password reset
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            # Generate reset token
            reset_token = user.generate_email_verification_token()
            
            # Send password reset email
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
            send_mail(
                'Password Reset - ChefSync',
                f'Click the following link to reset your password: {reset_url}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            
            return Response({
                'message': 'Password reset email sent'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    """
    Confirm password reset with token
    """
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            user = User.objects.get(email_verification_token=token)
            if user.email_verification_expires > timezone.now():
                user.set_password(new_password)
                user.email_verification_token = None
                user.email_verification_expires = None
                user.save()
                
                return Response({
                    'message': 'Password reset successful'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Token expired'
                }, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token
            
            # Add custom claims
            access['user_id'] = user.user_id
            access['email'] = user.email
            access['name'] = user.name
            
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            
            return Response({
                'message': 'Google OAuth login successful',
                'access': str(access),
                'refresh': str(refresh),
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
