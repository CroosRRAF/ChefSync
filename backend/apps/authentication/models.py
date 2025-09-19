

from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
import datetime
import random
import string
from datetime import timedelta


class UserManager(BaseUserManager):
    """Custom user manager for ChefSync User model"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user with the given email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        # Use email as username if not provided
        if not extra_fields.get('username'):
            extra_fields['username'] = email
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model for ChefSync application
    """
    # Role choices for user types
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('customer', 'Customer'),
        ('cook', 'Cook'),
        ('delivery_agent', 'Delivery Agent'),
    ]
    
    # Approval status choices
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    user_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    phone_no = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(unique=True)
    address = models.TextField(blank=True, null=True, help_text="Full address of the user")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer', help_text="User role in the system")
    profile_image = models.BinaryField(blank=True, null=True)  # LONGBLOB equivalent
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Email verification fields
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    email_verification_expires = models.DateTimeField(blank=True, null=True)
    
    # Approval fields for cooks and delivery agents
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='approved', help_text="Approval status for cooks and delivery agents")
    approval_notes = models.TextField(blank=True, null=True, help_text="Admin notes for approval/rejection")
    approved_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_users', help_text="Admin who approved this user")
    approved_at = models.DateTimeField(blank=True, null=True, help_text="When the user was approved")
    
    # Security fields
    failed_login_attempts = models.IntegerField(default=0)
    last_failed_login = models.DateTimeField(blank=True, null=True)
    account_locked = models.BooleanField(default=False)
    account_locked_until = models.DateTimeField(blank=True, null=True)
    
    # Override username field to use email
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'role']

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"

    def create_profile(self):
        """Create the appropriate profile model based on user role"""
        if self.role == 'customer':
            Customer.objects.get_or_create(user=self)
            # Customers are automatically approved
            self.approval_status = 'approved'
            self.save()
        elif self.role == 'cook':
            Cook.objects.get_or_create(user=self)
            # Cooks need admin approval
            self.approval_status = 'pending'
            self.save()
        elif self.role == 'delivery_agent':
            DeliveryAgent.objects.get_or_create(user=self)
            # Delivery agents need admin approval
            self.approval_status = 'pending'
            self.save()

    def get_profile(self):
        """Get the user's profile model instance"""
        if self.role == 'customer':
            try:
                return self.customer
            except Customer.DoesNotExist:
                return None
        elif self.role == 'cook':
            try:
                return self.cook
            except Cook.DoesNotExist:
                return None
        elif self.role == 'delivery_agent':
            try:
                return self.deliveryagent
            except DeliveryAgent.DoesNotExist:
                return None
        return None

    def generate_email_verification_token(self):
        """Generate email verification token"""
        import secrets
        import datetime
        from django.utils import timezone
        
        token = secrets.token_urlsafe(32)
        expires = timezone.now() + datetime.timedelta(hours=24)
        
        self.email_verification_token = token
        self.email_verification_expires = expires
        self.save()
        
        return token

    def verify_email(self, token):
        """Verify email with token"""
        if (self.email_verification_token == token and 
            self.email_verification_expires > timezone.now()):
            self.email_verified = True
            self.email_verification_token = None
            self.email_verification_expires = None
            self.save()
            return True
        return False

    def increment_failed_login(self):
        """Increment failed login attempts"""
        from django.utils import timezone
        
        self.failed_login_attempts += 1
        self.last_failed_login = timezone.now()
        
        # Lock account after 5 failed attempts
        if self.failed_login_attempts >= 5:
            self.account_locked = True
            self.account_locked_until = timezone.now() + datetime.timedelta(minutes=30)
        
        self.save()

    def reset_failed_login_attempts(self):
        """Reset failed login attempts"""
        self.failed_login_attempts = 0
        self.account_locked = False
        self.account_locked_until = None
        self.save()
    
    def can_login(self):
        """Check if user can login based on approval status"""
        # Customers can always login
        if self.role == 'customer':
            return True
        
        # Cooks and delivery agents need approval
        if self.role in ['cook', 'delivery_agent']:
            return self.approval_status == 'approved'
        
        # Admins can always login
        if self.role == 'admin':
            return True
        
        return False
    
    def get_approval_message(self):
        """Get appropriate message based on approval status"""
        if self.role == 'customer':
            return "Welcome! Your account is ready to use."
        
        if self.approval_status == 'pending':
            return "Your account is pending admin approval. You'll receive an email once approved."
        
        if self.approval_status == 'rejected':
            return f"Your account was not approved. {self.approval_notes or 'Please contact support for more information.'}"
        
        if self.approval_status == 'approved':
            return "Your account has been approved! Welcome to ChefSync."
        
        return "Account status unknown. Please contact support."

    objects = UserManager()

    class Meta:
        db_table = 'User'



class Customer(models.Model):
    """
    Customer model extending User
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    
    def __str__(self):
        return f"Customer: {self.user.name}"
    
    class Meta:
        db_table = 'Customer'


class Cook(models.Model):
    """
    Cook model extending User
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    specialty = models.CharField(max_length=100, blank=True, null=True)
    kitchen_location = models.CharField(max_length=255, blank=True, null=True)
    experience_years = models.IntegerField(blank=True, null=True)
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    availability_hours = models.CharField(max_length=50, blank=True, null=True)
    
    def __str__(self):
        return f"Cook: {self.user.name} - {self.specialty}"
    
    class Meta:
        db_table = 'Cook'


class DeliveryAgent(models.Model):
    """
    Delivery Agent model extending User
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    vehicle_type = models.CharField(max_length=50, blank=True, null=True)
    vehicle_number = models.CharField(max_length=20, blank=True, null=True)
    current_location = models.CharField(max_length=255, blank=True, null=True)
    is_available = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Delivery Agent: {self.user.name}"
    
    class Meta:
        db_table = 'DeliveryAgent'


class DocumentType(models.Model):
    """
    Document types for different roles
    """
    DOCUMENT_CATEGORIES = [
        ('cook', 'Cook Documents'),
        ('delivery_agent', 'Delivery Agent Documents'),
    ]
    
    name = models.CharField(max_length=100, help_text="Document type name (e.g., 'Driving License', 'Food Safety Certificate')")
    category = models.CharField(max_length=20, choices=DOCUMENT_CATEGORIES, help_text="Category this document belongs to")
    description = models.TextField(blank=True, null=True, help_text="Description of what this document is for")
    is_required = models.BooleanField(default=True, help_text="Whether this document is required for approval")
    allowed_file_types = models.JSONField(default=list, help_text="List of allowed file extensions (e.g., ['pdf', 'jpg', 'png'])")
    max_file_size_mb = models.IntegerField(default=5, help_text="Maximum file size in MB")
    is_single_page_only = models.BooleanField(default=True, help_text="Whether this document should be single page only")
    max_pages = models.IntegerField(default=2, help_text="Maximum number of pages allowed (for PDFs)")
    
    def __str__(self):
        return f"{self.get_category_display()} - {self.name}"
    
    class Meta:
        db_table = 'document_types'
        unique_together = ['name', 'category']


class UserDocument(models.Model):
    """
    User uploaded documents for verification
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('needs_resubmission', 'Needs Resubmission'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    document_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE)
    file = models.URLField(max_length=500, help_text="Document file URL (Cloudinary or local)")
    file_name = models.CharField(max_length=255, help_text="Original file name")
    file_size = models.BigIntegerField(help_text="File size in bytes")
    file_type = models.CharField(max_length=50, help_text="File MIME type")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True, null=True, help_text="Admin review notes")
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_documents')
    reviewed_at = models.DateTimeField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # New field to control document visibility to admin
    is_visible_to_admin = models.BooleanField(default=False, help_text="Whether admin can see this document")
    cloudinary_public_id = models.CharField(max_length=255, blank=True, null=True, help_text="Cloudinary public ID for the file")
    local_file_path = models.CharField(max_length=500, blank=True, null=True, help_text="Local file path for PDFs to avoid Cloudinary access issues")
    converted_images = models.JSONField(blank=True, null=True, help_text="Metadata for converted images (for PDFs converted to images)")
    is_pdf_converted = models.BooleanField(default=False, help_text="Whether this document was converted from PDF to images")
    
    def __str__(self):
        return f"{self.user.name} - {self.document_type.name}"
    
    class Meta:
        db_table = 'user_documents'
        ordering = ['-uploaded_at']


class EmailOTP(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=[
        ('registration', 'Registration'),
        ('password_reset', 'Password Reset'),
        ('email_verification', 'Email Verification')
    ], default='registration')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'email_otp'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.otp:
            self.otp = self.generate_otp()
        if not self.expires_at:
            from django.conf import settings
            expiry_minutes = getattr(settings, 'OTP_EXPIRY_MINUTES', 10)
            self.expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        super().save(*args, **kwargs)

    def generate_otp(self):
        from django.conf import settings
        otp_length = getattr(settings, 'OTP_LENGTH', 6)
        return ''.join(random.choices(string.digits, k=otp_length))

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at

    def mark_as_used(self):
        self.is_used = True
        self.save()

    def __str__(self):
        return f"OTP for {self.email} - {self.purpose}"


class JWTToken(models.Model):
    """
    Model to store JWT tokens in database for enhanced security
    """
    TOKEN_TYPES = [
        ('access', 'Access Token'),
        ('refresh', 'Refresh Token'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='jwt_tokens')
    token_hash = models.CharField(max_length=64, unique=True, help_text="SHA-256 hash of the token")
    token_type = models.CharField(max_length=10, choices=TOKEN_TYPES)
    jti = models.CharField(max_length=255, unique=True, help_text="JWT ID from token payload")
    
    # Token metadata
    issued_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    # Security tracking
    is_revoked = models.BooleanField(default=False)
    is_blacklisted = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(null=True, blank=True)
    blacklisted_at = models.DateTimeField(null=True, blank=True)
    
    # Client information for security monitoring
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    device_info = models.CharField(max_length=255, null=True, blank=True)
    
    # Additional security fields
    last_used_at = models.DateTimeField(null=True, blank=True)
    usage_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'jwt_tokens'
        ordering = ['-issued_at']
        indexes = [
            models.Index(fields=['user', 'token_type']),
            models.Index(fields=['token_hash']),
            models.Index(fields=['jti']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['is_revoked', 'is_blacklisted']),
        ]

    def __str__(self):
        return f"{self.token_type.title()} token for {self.user.email}"

    def is_valid(self):
        """Check if token is valid (not expired, revoked, or blacklisted)"""
        now = timezone.now()
        return (
            not self.is_revoked and 
            not self.is_blacklisted and 
            now < self.expires_at
        )

    def is_expired(self):
        """Check if token has expired"""
        return timezone.now() >= self.expires_at

    def revoke(self):
        """Revoke the token"""
        self.is_revoked = True
        self.revoked_at = timezone.now()
        self.save()

    def blacklist(self):
        """Blacklist the token"""
        self.is_blacklisted = True
        self.blacklisted_at = timezone.now()
        self.save()

    def mark_as_used(self):
        """Mark token as used (update last_used_at and increment usage_count)"""
        self.last_used_at = timezone.now()
        self.usage_count += 1
        self.save(update_fields=['last_used_at', 'usage_count'])

    @classmethod
    def cleanup_expired_tokens(cls):
        """Clean up expired tokens from database"""
        expired_tokens = cls.objects.filter(expires_at__lt=timezone.now())
        count = expired_tokens.count()
        expired_tokens.delete()
        return count

    @classmethod
    def revoke_all_user_tokens(cls, user, token_type=None):
        """Revoke all tokens for a user"""
        queryset = cls.objects.filter(user=user, is_revoked=False)
        if token_type:
            queryset = queryset.filter(token_type=token_type)
        
        count = queryset.count()
        queryset.update(
            is_revoked=True,
            revoked_at=timezone.now()
        )
        return count


# DocumentType and UserDocument models are defined in migrations
# and will be loaded automatically by Django
