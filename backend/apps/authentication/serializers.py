from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Customer, Cook, DeliveryAgent, EmailOTP
from .services.email_service import EmailService
import re


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration with email verification and role-based profile creation
    """
    password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=True)
    address = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['name', 'email', 'password', 'confirm_password', 'phone_no', 'role', 'address']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        
        # Email validation
        email = attrs.get('email')
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Email already registered")
        
        # Phone number validation
        phone_no = attrs.get('phone_no')
        if phone_no:
            phone_pattern = re.compile(r'^\+?1?\d{9,15}$')
            if not phone_pattern.match(phone_no):
                raise serializers.ValidationError("Invalid phone number format")
        
        # Role validation
        role = attrs.get('role')
        if role not in dict(User.ROLE_CHOICES):
            raise serializers.ValidationError("Invalid role selected")
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        # Ensure username is set to email for custom user model
        if 'username' not in validated_data or not validated_data.get('username'):
            validated_data['username'] = validated_data['email']
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        # Automatically create the appropriate profile model
        user.create_profile()
        # Generate email verification token
        user.generate_email_verification_token()
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login with JWT tokens
    """
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            if user.account_locked:
                raise serializers.ValidationError('Account is temporarily locked')
            # TEMPORARY: Allow login without email verification for testing
            # if not user.email_verified:
            #     raise serializers.ValidationError('Please verify your email before logging in')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password')


class JWTTokenSerializer(serializers.Serializer):
    """
    Serializer for JWT token response
    """
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = serializers.SerializerMethodField()

    def get_user(self, obj):
        user = self.context['user']
        return UserProfileSerializer(user).data


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile with role and address information
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    profile_data = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['user_id', 'name', 'email', 'phone_no', 'address', 'role', 'role_display', 
                 'profile_image', 'email_verified', 'created_at', 'updated_at', 'profile_data']
        read_only_fields = ['user_id', 'email', 'email_verified', 'created_at', 'updated_at']

    def get_profile_data(self, obj):
        """Get additional profile data based on user role"""
        profile = obj.get_profile()
        if profile:
            if obj.role == 'customer':
                return {
                    'type': 'customer',
                    'profile_id': profile.pk
                }
            elif obj.role == 'cook':
                return {
                    'type': 'cook',
                    'profile_id': profile.pk,
                    'specialty': profile.specialty,
                    'kitchen_location': profile.kitchen_location,
                    'experience_years': profile.experience_years,
                    'rating_avg': profile.rating_avg,
                    'availability_hours': profile.availability_hours
                }
            elif obj.role == 'delivery_agent':
                return {
                    'type': 'delivery_agent',
                    'profile_id': profile.pk,
                    'vehicle_type': profile.vehicle_type,
                    'vehicle_number': profile.vehicle_number,
                    'current_location': profile.current_location,
                    'is_available': profile.is_available
                }
        return None


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change
    """
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_new_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs


class EmailVerificationSerializer(serializers.Serializer):
    """
    Serializer for email verification
    """
    token = serializers.CharField(required=True)


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for password reset request
    """
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation
    """
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_new_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs


class GoogleOAuthSerializer(serializers.Serializer):
    """
    Serializer for Google OAuth
    """
    id_token = serializers.CharField(required=True)


class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer for Customer model
    """
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = Customer
        fields = ['user_id', 'user']


class CookSerializer(serializers.ModelSerializer):
    """
    Serializer for Cook model
    """
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = Cook
        fields = ['user_id', 'user', 'specialty', 'kitchen_location', 'experience_years', 
                 'rating_avg', 'availability_hours']


class DeliveryAgentSerializer(serializers.ModelSerializer):
    """
    Serializer for DeliveryAgent model
    """
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = DeliveryAgent
        fields = ['user_id', 'user', 'vehicle_type', 'vehicle_number', 'current_location', 'is_available']


class SendOTPSerializer(serializers.Serializer):
    """
    Serializer for sending OTP to email
    """
    email = serializers.EmailField(required=True)
    name = serializers.CharField(max_length=100, required=False)
    purpose = serializers.ChoiceField(
        choices=[('registration', 'Registration'), ('password_reset', 'Password Reset')],
        default='registration'
    )

    def validate_email(self, value):
        purpose = self.initial_data.get('purpose', 'registration')
        
        if purpose == 'registration':
            # Check if email already exists for registration
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError("Email already registered")
        
        return value

    def send_otp(self):
        email = self.validated_data['email']
        name = self.validated_data.get('name', 'User')
        purpose = self.validated_data.get('purpose', 'registration')
        
        return EmailService.send_otp(email, purpose, name)


class VerifyOTPSerializer(serializers.Serializer):
    """
    Serializer for verifying OTP
    """
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, min_length=6, required=True)
    purpose = serializers.ChoiceField(
        choices=[('registration', 'Registration'), ('password_reset', 'Password Reset')],
        default='registration'
    )

    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("OTP must contain only digits")
        return value

    def verify_otp(self):
        email = self.validated_data['email']
        otp = self.validated_data['otp']
        purpose = self.validated_data.get('purpose', 'registration')
        
        return EmailService.verify_otp(email, otp, purpose)


class CompleteRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for completing registration after OTP verification
    """
    password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=True)
    phone_no = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['name', 'email', 'password', 'confirm_password', 'phone_no', 'role', 'address']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        
        # Check if email is verified (OTP verification completed)
        email = attrs.get('email')
        
        # Check for existing users with this email
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            # If user exists and has a password set, they already registered normally
            if existing_user.has_usable_password():
                raise serializers.ValidationError("Email already registered. Please sign in instead.")
            else:
                # This is likely a Google OAuth user without a password
                # We should allow them to complete registration by setting a password
                # But for now, let's inform them to use Google sign-in
                raise serializers.ValidationError("This email is already registered with Google. Please sign in with Google instead.")
        
        # Verify that OTP was verified for this email
        recent_verified_otp = EmailOTP.objects.filter(
            email=email,
            purpose='registration',
            is_used=True
        ).order_by('-created_at').first()
        
        if not recent_verified_otp:
            raise serializers.ValidationError("Email verification required. Please verify your OTP first.")
        
        # Phone number validation - only validate if provided and not empty
        phone_no = attrs.get('phone_no', '').strip()
        if phone_no:
            phone_pattern = re.compile(r'^\+?1?\d{9,15}$')
            if not phone_pattern.match(phone_no):
                raise serializers.ValidationError("Invalid phone number format")
        else:
            # Set to None if empty to avoid database issues
            attrs['phone_no'] = None
            
        # Handle empty address
        address = attrs.get('address', '').strip()
        if not address:
            attrs['address'] = None
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        
        # Store role before creating user since it will be used later
        role = validated_data.get('role')
        
        # Generate a unique username based on email
        base_username = validated_data['email']
        username = base_username
        counter = 1
        
        # If username conflicts, try adding numbers until we find a unique one
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1
        
        validated_data['username'] = username
        validated_data['email_verified'] = True  # Mark email as verified
        
        # Create user
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create role-specific profile
        if role == 'customer':
            Customer.objects.create(
                user=user
            )
        elif role == 'cook':
            Cook.objects.create(
                user=user,
                specialty='',
                availability_hours=''
            )
        elif role == 'delivery_agent':
            DeliveryAgent.objects.create(
                user=user,
                vehicle_type='bike',
                is_available=True
            )
        
        return user
