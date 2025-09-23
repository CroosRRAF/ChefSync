from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Customer, Cook, DeliveryAgent, EmailOTP
from django.apps import apps

# Get models from Django's app registry to avoid import issues
DocumentType = apps.get_model('authentication', 'DocumentType')
UserDocument = apps.get_model('authentication', 'UserDocument')
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
        valid_roles = [choice[0] for choice in User.ROLE_CHOICES]
        if role not in valid_roles:
            raise serializers.ValidationError(f"Invalid role selected. Valid roles are: {valid_roles}")
        
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
        
        if not email or not password:
            raise serializers.ValidationError('Email and password are required')
        
        # First check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid email or password')
        
        # Check if password is correct
        if not user.check_password(password):
            raise serializers.ValidationError('Invalid email or password')
        
        # Check if user is active
        if not user.is_active:
            raise serializers.ValidationError('Your account has been deactivated. Please contact support.')
        
        # Check if account is locked
        if user.account_locked:
            if user.account_locked_until and user.account_locked_until > timezone.now():
                raise serializers.ValidationError('Account is temporarily locked due to multiple failed login attempts. Please try again later.')
            else:
                # Unlock account if lock period has expired
                user.account_locked = False
                user.account_locked_until = None
                user.failed_login_attempts = 0
                user.save()
        
        # Check approval status for cooks and delivery agents
        if user.role in ['cook', 'delivery_agent']:
            if user.approval_status == 'pending':
                raise serializers.ValidationError({
                    'approval_status': 'pending',
                    'message': 'Your account is pending admin approval. You will receive an email notification once approved.',
                    'email': user.email
                })
            elif user.approval_status == 'rejected':
                raise serializers.ValidationError({
                    'approval_status': 'rejected',
                    'message': f'Your account was not approved. {user.approval_notes or "Please contact support for more information."}',
                    'email': user.email
                })
        
        # TEMPORARY: Allow login without email verification for testing
        # if not user.email_verified:
        #     raise serializers.ValidationError('Please verify your email before logging in')
        
        attrs['user'] = user
        return attrs


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
    
    def validate_email(self, value):
        # Check if user exists with this email
        try:
            user = User.objects.get(email=value)
            if not user.is_active:
                raise serializers.ValidationError(
                    "This email is associated with an inactive account. Please contact support for assistance."
                )
            if not user.has_usable_password():
                raise serializers.ValidationError(
                    "This email is associated with an account that uses social login (Google). Please use the 'Sign in with Google' option instead."
                )
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "No account found with this email address. Please check your email address or create a new account."
            )


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
            # Check if email already exists and is fully registered (active)
            existing_user = User.objects.filter(email=value).first()
            if existing_user and existing_user.is_active:
                # Provide specific guidance based on user role
                if existing_user.role == 'customer':
                    raise serializers.ValidationError(
                        "This email is already registered as a customer. Please try logging in instead, or use a different email address to create a new account."
                    )
                elif existing_user.role in ['cook', 'delivery_agent']:
                    if existing_user.approval_status == 'pending':
                        raise serializers.ValidationError(
                            "This email is already registered and your account is pending approval. Please wait for admin approval or contact support if you need assistance."
                        )
                    elif existing_user.approval_status == 'rejected':
                        raise serializers.ValidationError(
                            "This email was previously registered but the account was rejected. Please contact support for assistance or use a different email address."
                        )
                    else:
                        raise serializers.ValidationError(
                            "This email is already registered. Please try logging in instead, or use a different email address to create a new account."
                        )
                else:
                    raise serializers.ValidationError(
                        "This email is already registered. Please try logging in instead, or use a different email address to create a new account."
                    )
        
        return value

    def send_otp(self):
        email = self.validated_data['email']
        name = self.validated_data.get('name', 'User')
        purpose = self.validated_data.get('purpose', 'registration')
        
        # For registration, create a temporary user record if it doesn't exist
        if purpose == 'registration':
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'name': name,
                    'role': 'customer',  # Default role, will be updated later
                    'is_active': False,  # Not active until full registration
                    'email_verified': False,
                    'approval_status': 'pending'
                }
            )
            if created:
                # Set a temporary password that will be changed during registration
                user.set_unusable_password()
                user.save()
        
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
            # If user exists and is active with a password set, they already registered normally
            if existing_user.is_active and existing_user.has_usable_password():
                if existing_user.role == 'customer':
                    raise serializers.ValidationError("This email is already registered as a customer. Please sign in instead.")
                elif existing_user.role in ['cook', 'delivery_agent']:
                    if existing_user.approval_status == 'pending':
                        raise serializers.ValidationError("This email is already registered and your account is pending approval. Please wait for admin approval.")
                    elif existing_user.approval_status == 'rejected':
                        raise serializers.ValidationError("This email was previously registered but the account was rejected. Please contact support for assistance.")
                    else:
                        raise serializers.ValidationError("This email is already registered. Please sign in instead.")
                else:
                    raise serializers.ValidationError("Email already registered. Please sign in instead.")
            # Allow completion of registration for inactive users (created during OTP sending)
        
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
        email = validated_data.get('email')
        
        # Check if user already exists (created during OTP sending)
        existing_user = User.objects.filter(email=email).first()
        
        if existing_user:
            # Update existing user
            user = existing_user
            user.name = validated_data.get('name', user.name)
            user.role = role
            user.phone_no = validated_data.get('phone_no')
            user.address = validated_data.get('address')
            user.email_verified = True
            user.is_active = True
            
            # Generate a unique username based on email if not set
            if not user.username:
                base_username = email
                username = base_username
                counter = 1
                
                # If username conflicts, try adding numbers until we find a unique one
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}_{counter}"
                    counter += 1
                
                user.username = username
        else:
            # Create new user (fallback)
            # Generate a unique username based on email
            base_username = email
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
        
        # Create role-specific profile and set approval status
        if role == 'customer':
            Customer.objects.create(user=user)
            # Customers are automatically approved
            user.approval_status = 'approved'
            user.save()
        elif role == 'cook':
            Cook.objects.create(
                user=user,
                specialty='',
                availability_hours=''
            )
            # Cooks need admin approval
            user.approval_status = 'pending'
            user.save()
        elif role == 'delivery_agent':
            DeliveryAgent.objects.create(
                user=user,
                vehicle_type='bike',
                is_available=True
            )
            # Delivery agents need admin approval
            user.approval_status = 'pending'
            user.save()
        
        return user


class DocumentTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for DocumentType model
    """
    class Meta:
        model = DocumentType
        fields = ['id', 'name', 'category', 'description', 'is_required', 'allowed_file_types', 'max_file_size_mb', 'is_single_page_only', 'max_pages']


class UserDocumentSerializer(serializers.ModelSerializer):
    """
    Serializer for UserDocument model
    """
    document_type = DocumentTypeSerializer(read_only=True)
    document_type_id = serializers.IntegerField(write_only=True)
    file = serializers.URLField(read_only=True)  # URL field for Cloudinary URLs
    file_upload = serializers.FileField(write_only=True)  # Custom file field for uploads
    file_name = serializers.CharField(read_only=True)
    file_size = serializers.IntegerField(read_only=True)
    file_type = serializers.CharField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.name', read_only=True)
    
    class Meta:
        model = UserDocument
        fields = [
            'id', 'document_type', 'document_type_id', 'file', 'file_upload', 'file_name', 'file_size', 
            'file_type', 'status', 'status_display', 'admin_notes', 'reviewed_by_name', 
            'reviewed_at', 'uploaded_at', 'updated_at', 'cloudinary_public_id', 'converted_images', 'is_pdf_converted'
        ]
        read_only_fields = [
            'id', 'file_name', 'file_size', 'file_type', 'status', 'admin_notes', 
            'reviewed_by', 'reviewed_at', 'uploaded_at', 'updated_at', 'cloudinary_public_id', 'converted_images', 'is_pdf_converted'
        ]

    def validate_document_type_id(self, value):
        try:
            DocumentType.objects.get(id=value)
        except DocumentType.DoesNotExist:
            raise serializers.ValidationError("Invalid document type")
        return value

    def validate_file_upload(self, value):
        # Get document type from context or from document_type_id
        document_type_id = self.initial_data.get('document_type_id')
        if not document_type_id:
            raise serializers.ValidationError("Document type is required")
        
        try:
            document_type = DocumentType.objects.get(id=document_type_id)
        except DocumentType.DoesNotExist:
            raise serializers.ValidationError("Invalid document type")
        
        # Check if file is empty
        if not value or value.size == 0:
            raise serializers.ValidationError("File cannot be empty")
        
        # Validate file size
        max_size_bytes = document_type.max_file_size_mb * 1024 * 1024
        if value.size > max_size_bytes:
            file_size_mb = round(value.size / (1024 * 1024), 2)
            raise serializers.ValidationError(
                f"File size ({file_size_mb}MB) exceeds maximum allowed size ({document_type.max_file_size_mb}MB). Please choose a smaller file."
            )
        
        # Validate file name
        if not value.name or len(value.name.strip()) == 0:
            raise serializers.ValidationError("File name cannot be empty")
        
        # Validate file extension
        file_name_parts = value.name.split('.')
        if len(file_name_parts) < 2:
            raise serializers.ValidationError("File must have a valid extension")
        
        file_extension = file_name_parts[-1].lower()
        
        # Handle both JSON list and comma-separated string formats
        if isinstance(document_type.allowed_file_types, str):
            allowed_types = document_type.allowed_file_types.split(',')
        else:
            allowed_types = document_type.allowed_file_types or []
        
        allowed_types = [t.strip().lower() for t in allowed_types]
        
        if file_extension not in allowed_types:
            allowed_types_display = ', '.join([f'.{t}' for t in allowed_types])
            raise serializers.ValidationError(
                f"File type '.{file_extension}' is not allowed. Please upload a file with one of these formats: {allowed_types_display}"
            )
        
        # Additional validation for specific file types
        if file_extension == 'pdf':
            # Check if it's a valid PDF by reading the first few bytes
            value.seek(0)
            header = value.read(4)
            value.seek(0)  # Reset file pointer
            if not header.startswith(b'%PDF'):
                raise serializers.ValidationError("Invalid PDF file. Please ensure the file is a valid PDF document.")
        
        elif file_extension in ['jpg', 'jpeg']:
            # Check if it's a valid JPEG by reading the first few bytes
            value.seek(0)
            header = value.read(2)
            value.seek(0)  # Reset file pointer
            if not header.startswith(b'\xff\xd8'):
                raise serializers.ValidationError("Invalid JPEG file. Please ensure the file is a valid JPEG image.")
        
        elif file_extension == 'png':
            # Check if it's a valid PNG by reading the first few bytes
            value.seek(0)
            header = value.read(8)
            value.seek(0)  # Reset file pointer
            if not header.startswith(b'\x89PNG\r\n\x1a\n'):
                raise serializers.ValidationError("Invalid PNG file. Please ensure the file is a valid PNG image.")
        
        return value

    def create(self, validated_data):
        from django.conf import settings
        from .services.pdf_service import PDFService, PDFValidationError, PDFConversionError
        
        document_type_id = validated_data.pop('document_type_id')
        document_type = DocumentType.objects.get(id=document_type_id)
        
        # Extract file information
        file = validated_data.pop('file_upload')  # Remove file_upload from validated_data to avoid duplicate
        
        file_name = file.name
        file_size = file.size
        file_type = file.content_type
        
        # Get user from context - handle both authenticated and registration scenarios
        user = None
        if 'request' in self.context and hasattr(self.context['request'], 'user'):
            user = self.context['request'].user
        elif 'user' in self.context:
            user = self.context['user']
        
        if not user:
            raise serializers.ValidationError("User context is required for document upload")
        
        # Check if this is a PDF file that needs conversion
        is_pdf = file_name.lower().endswith('.pdf') or file_type == 'application/pdf'
        converted_images = []
        primary_file_url = None
        cloudinary_public_id = None
        local_file_path_str = None
        
        if is_pdf:
            # Handle PDF conversion to images
            try:
                pdf_service = PDFService()
                conversion_result = pdf_service.validate_and_convert_pdf(
                    file, 
                    user.email, 
                    document_type.name
                )
                
                if not conversion_result['success']:
                    raise serializers.ValidationError(conversion_result['message'])
                
                converted_images = conversion_result['converted_images']
                
                # Use the first image as the primary file URL for the document
                if converted_images:
                    primary_file_url = converted_images[0]['image_url']
                    cloudinary_public_id = converted_images[0]['public_id']
                
                # Store the original PDF locally for backup
                try:
                    import os
                    from pathlib import Path
                    import uuid
                    
                    local_media_root = getattr(settings, 'LOCAL_MEDIA_ROOT', Path(__file__).resolve().parent.parent.parent / 'local_media')
                    local_folder = local_media_root / 'assets' / 'documents' / 'pdfs' / str(user.user_id)
                    local_folder.mkdir(parents=True, exist_ok=True)
                    
                    unique_filename = f"{uuid.uuid4()}_{file_name}"
                    local_file_path = local_folder / unique_filename
                    
                    # Save original PDF locally
                    with open(local_file_path, 'wb') as local_file:
                        for chunk in file.chunks():
                            local_file.write(chunk)
                    
                    local_file_path_str = str(local_file_path)
                    print(f"Stored original PDF locally at: {local_file_path}")
                    
                except Exception as local_save_error:
                    print(f"Failed to save original PDF locally: {str(local_save_error)}")
                
            except (PDFValidationError, PDFConversionError) as e:
                raise serializers.ValidationError(str(e))
            except Exception as e:
                raise serializers.ValidationError(f"PDF processing failed: {str(e)}")
        else:
            # Handle non-PDF files normally
            # Check if we should use local storage
            use_local = getattr(settings, 'USE_LOCAL_STORAGE', False)
            
            if use_local:
                # Local storage implementation
                import os
                from pathlib import Path
                
                local_media_root = getattr(settings, 'LOCAL_MEDIA_ROOT', Path(__file__).resolve().parent.parent.parent / 'local_media')
                
                # Determine folder based on file type (matching Cloudinary structure)
                if file_type and file_type.startswith('image/'):
                    folder_name = 'assets/images'
                elif file_type == 'application/pdf':
                    folder_name = 'assets/documents/pdfs'
                elif file_type in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                    folder_name = 'assets/documents/word'
                elif file_type in ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']:
                    folder_name = 'assets/documents/excel'
                elif file_type in ['text/plain', 'text/csv']:
                    folder_name = 'assets/documents/text'
                else:
                    folder_name = 'assets/documents/other'  # Default to other documents folder
                
                user_folder = local_media_root / folder_name / str(user.user_id)
                user_folder.mkdir(parents=True, exist_ok=True)
                
                # Generate unique filename to avoid conflicts
                import uuid
                file_extension = file_name.split('.')[-1] if '.' in file_name else ''
                unique_filename = f"{uuid.uuid4()}_{file_name}"
                
                # Save file locally
                file_path = user_folder / unique_filename
                with open(file_path, 'wb') as destination:
                    for chunk in file.chunks():
                        destination.write(chunk)
                
                # Create local URL
                primary_file_url = f"/local_media/{folder_name}/{user.user_id}/{unique_filename}"
                cloudinary_public_id = None
            else:
                # Cloudinary implementation
                try:
                    import cloudinary
                    import cloudinary.uploader
                except ImportError:
                    raise serializers.ValidationError("Cloudinary package not installed. Please install it with: pip install cloudinary")
                
                # Configure Cloudinary
                cloudinary.config(
                    cloud_name=settings.CLOUDINARY_STORAGE['CLOUD_NAME'],
                    api_key=settings.CLOUDINARY_STORAGE['API_KEY'],
                    api_secret=settings.CLOUDINARY_STORAGE['API_SECRET'],
                    secure=True
                )
                
                try:
                    # Determine resource type and folder based on file type
                    if file_type and file_type.startswith('image/'):
                        resource_type = "image"
                        folder = f"chefsync/assets/images/{user.user_id}"  # Images in assets/images folder
                    elif file_type == 'application/pdf':
                        resource_type = "raw"
                        folder = f"chefsync/assets/documents/pdfs/{user.user_id}"  # PDFs in assets/documents/pdfs folder
                    elif file_type in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                        resource_type = "raw"
                        folder = f"chefsync/assets/documents/word/{user.user_id}"  # Word docs in assets/documents/word folder
                    elif file_type in ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']:
                        resource_type = "raw"
                        folder = f"chefsync/assets/documents/excel/{user.user_id}"  # Excel files in assets/documents/excel folder
                    elif file_type in ['text/plain', 'text/csv']:
                        resource_type = "raw"
                        folder = f"chefsync/assets/documents/text/{user.user_id}"  # Text files in assets/documents/text folder
                    else:
                        resource_type = "raw"  # Default to raw for other file types
                        folder = f"chefsync/assets/documents/other/{user.user_id}"  # Other files in assets/documents/other folder
                    
                    # Prepare upload options based on file type
                    upload_options = {
                        'folder': folder,
                        'resource_type': resource_type,
                        'use_filename': True,
                        'unique_filename': True,
                        'overwrite': False,  # Don't overwrite existing files
                        'invalidate': True,  # Invalidate CDN cache
                    }
                    
                    # Add specific options for images
                    if resource_type == "image":
                        upload_options.update({
                            'quality': 'auto',  # Auto quality optimization
                            'fetch_format': 'auto',  # Auto format selection
                            'flags': 'progressive',  # Progressive loading for images
                        })
                    
                    # Add specific options for raw files (documents)
                    elif resource_type == "raw":
                        upload_options.update({
                            'tags': ['chefsync', 'document', file_type.split('/')[-1] if '/' in file_type else 'unknown'],
                        })
                    
                    upload_result = cloudinary.uploader.upload(file, **upload_options)
                    cloudinary_public_id = upload_result['public_id']
                    primary_file_url = upload_result['secure_url']
                    
                    # For raw files (PDFs), also store locally to avoid Cloudinary access issues
                    if resource_type == 'raw':
                        try:
                            import os
                            from pathlib import Path
                            
                            # Create local storage directory
                            local_media_root = getattr(settings, 'LOCAL_MEDIA_ROOT', Path(__file__).resolve().parent.parent.parent / 'local_media')
                            local_folder = local_media_root / 'assets' / 'documents' / 'pdfs' / str(user.user_id)
                            local_folder.mkdir(parents=True, exist_ok=True)
                            
                            # Generate unique filename
                            import uuid
                            file_extension = file_name.split('.')[-1] if '.' in file_name else 'pdf'
                            unique_filename = f"{uuid.uuid4()}_{file_name}"
                            local_file_path = local_folder / unique_filename
                            
                            # Save file locally
                            with open(local_file_path, 'wb') as local_file:
                                for chunk in file.chunks():
                                    local_file.write(chunk)
                            
                            # Store local file path in the document
                            local_file_url = f"/local_media/assets/documents/pdfs/{user.user_id}/{unique_filename}"
                            print(f"Stored PDF locally at: {local_file_path}")
                            print(f"Local file URL: {local_file_url}")
                            
                            # Store the local file path for later use
                            local_file_path_str = str(local_file_path)
                            
                        except Exception as local_save_error:
                            print(f"Failed to save PDF locally: {str(local_save_error)}")
                            # Continue with Cloudinary URL even if local save fails
                except Exception as e:
                    raise serializers.ValidationError(f"Failed to upload file to Cloudinary: {str(e)}")
        
        # Create the document
        document = UserDocument.objects.create(
            user=user,
            document_type=document_type,
            file=primary_file_url,  # Store primary file URL (converted image for PDFs, original for others)
            file_name=file_name,
            file_size=file_size,
            file_type=file_type,
            cloudinary_public_id=cloudinary_public_id,
            local_file_path=local_file_path_str if 'local_file_path_str' in locals() else None,
            is_visible_to_admin=True,  # Make documents visible to admin for review from the start
            **validated_data
        )
        
        # Store converted images metadata if this was a PDF
        if is_pdf and converted_images:
            # Update the document with converted images metadata
            document.converted_images = converted_images
            document.is_pdf_converted = True
            document.save()
        
        return document


class UserApprovalSerializer(serializers.ModelSerializer):
    """
    Serializer for user approval status
    """
    approval_status_display = serializers.CharField(source='get_approval_status_display', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True)
    documents = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'user_id', 'name', 'email', 'role', 'approval_status', 'approval_status_display',
            'approval_notes', 'approved_by_name', 'approved_at', 'created_at', 'documents'
        ]
        read_only_fields = ['user_id', 'name', 'email', 'role', 'created_at', 'documents']
    
    def get_documents(self, obj):
        """Return documents for admin review"""
        # For pending users, show all documents so admin can review them for approval
        # For approved/rejected users, show all documents since admin should be able to see them
        # The visibility control is handled at the endpoint level based on admin permissions
        documents = obj.documents.all()
        
        return UserDocumentSerializer(documents, many=True, context=self.context).data


class UserApprovalActionSerializer(serializers.Serializer):
    """
    Serializer for admin approval actions
    """
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_notes(self, value):
        if not value and self.initial_data.get('action') == 'reject':
            raise serializers.ValidationError("Notes are required when rejecting a user")
        return value
