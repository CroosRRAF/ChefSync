import datetime
import random
import string
from datetime import timedelta

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager for ChefSync User model"""

    def create_user(self, email=None, password=None, **extra_fields):
        """Create and return a regular user with the given email and password."""
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        # Set username to email since USERNAME_FIELD is 'email'
        extra_fields.setdefault("username", email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email=None, password=None, **extra_fields):
        """Create and return a superuser with the given email and password."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model for ChefSync application
    """

    # Role choices for user types - matching SQL schema
    ROLE_CHOICES = [
        ("admin", "Admin"),  # Lowercase for compatibility
        ("Admin", "Admin"),  # Capitalized version
        ("customer", "Customer"),  # Lowercase for consistency
        ("Customer", "Customer"),  # Capitalized version
        ("cook", "Cook"),  # Lowercase for consistency
        ("Cook", "Cook"),  # Capitalized version
        ("delivery_agent", "Delivery Agent"),  # Underscore version for frontend
        ("DeliveryAgent", "DeliveryAgent"),  # CamelCase version for compatibility
    ]

    # Approval status choices
    APPROVAL_STATUS_CHOICES = [
        ("pending", "Pending Approval"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    # Gender choices
    GENDER_CHOICES = [
        ("Male", "Male"),
        ("Female", "Female"),
        ("Other", "Other"),
    ]

    user_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    phone_no = models.CharField(
        max_length=20, blank=True, null=True
    )  # Updated max_length to match SQL schema
    gender = models.CharField(
        max_length=10, choices=GENDER_CHOICES, blank=True, null=True
    )
    address = models.TextField(
        blank=True, null=True, help_text="Full address of the user"
    )
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="Customer",
        help_text="User role in the system",
    )
    profile_image = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Cloudinary URL for user profile image",
    )
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Email verification fields
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    email_verification_expires = models.DateTimeField(blank=True, null=True)

    # Approval fields for cooks and delivery agents
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS_CHOICES,
        default="approved",
        help_text="Approval status for cooks and delivery agents",
    )
    approval_notes = models.TextField(
        blank=True, null=True, help_text="Admin notes for approval/rejection"
    )
    approved_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_users",
        help_text="Admin who approved this user",
    )
    approved_at = models.DateTimeField(
        blank=True, null=True, help_text="When the user was approved"
    )

    # Security fields
    failed_login_attempts = models.IntegerField(default=0)
    last_failed_login = models.DateTimeField(blank=True, null=True)
    account_locked = models.BooleanField(default=False)
    account_locked_until = models.DateTimeField(blank=True, null=True)

    # Referral system fields
    referral_code = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        help_text="User's unique referral code",
    )
    referred_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referred_users",
        help_text="User who referred this user",
    )
    referral_token_used = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Referral token that was used during registration",
    )
    total_referrals = models.PositiveIntegerField(
        default=0, help_text="Total number of successful referrals made by this user"
    )
    referral_rewards_earned = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Total referral rewards earned",
    )
    referral_rewards_used = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Total referral rewards used",
    )

    # Override username field to use email
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name", "role"]

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"

    def create_profile(self):
        """Create the appropriate profile model based on user role"""
        if self.role in ["customer", "Customer"]:
            Customer.objects.get_or_create(user=self)
            # Customers are automatically approved
            self.approval_status = "approved"
            self.save()
        elif self.role in ["cook", "Cook"]:
            Cook.objects.get_or_create(user=self)
            # Cooks need admin approval
            self.approval_status = "pending"
            self.save()
        elif self.role in ["delivery_agent", "DeliveryAgent"]:
            DeliveryAgent.objects.get_or_create(user=self)
            # Delivery agents need admin approval
            self.approval_status = "pending"
            self.save()

    def get_profile(self):
        """Get the user's profile model instance"""
        if self.role in ["customer", "Customer"]:
            try:
                return self.customer
            except Customer.DoesNotExist:
                return None
        elif self.role in ["cook", "Cook"]:
            try:
                return self.cook
            except Cook.DoesNotExist:
                return None
        elif self.role in ["delivery_agent", "DeliveryAgent"]:
            try:
                return self.deliveryagent
            except DeliveryAgent.DoesNotExist:
                return None
        return None

    def generate_email_verification_token(self):
        """Generate email verification token"""
        import datetime
        import secrets

        from django.utils import timezone

        token = secrets.token_urlsafe(32)
        expires = timezone.now() + datetime.timedelta(hours=24)

        self.email_verification_token = token
        self.email_verification_expires = expires
        self.save()

        return token

    def verify_email(self, token):
        """Verify email with token"""
        if (
            self.email_verification_token == token
            and self.email_verification_expires > timezone.now()
        ):
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
        if self.role in ["customer", "Customer"]:
            return True

        # Cooks and delivery agents need approval
        if self.role in ["cook", "Cook", "delivery_agent", "DeliveryAgent"]:
            return self.approval_status == "approved"

        # Admins can always login (handle both cases)
        if self.role in ["Admin", "admin"]:
            return True

        return False

    def get_approval_message(self):
        """Get appropriate message based on approval status"""
        if self.role in ["customer", "Customer"]:
            return "Welcome! Your account is ready to use."

        if self.approval_status == "pending":
            return "Your account is pending admin approval. You'll receive an email once approved."

        if self.approval_status == "rejected":
            return f"Your account was not approved. {self.approval_notes or 'Please contact support for more information.'}"

        if self.approval_status == "approved":
            return "Your account has been approved! Welcome to ChefSync."

        return "Account status unknown. Please contact support."

    def generate_referral_code(self):
        """Generate a unique referral code for the user"""
        import secrets
        import string

        # Generate a unique referral code
        while True:
            # Create a code with user's initials + random string
            initials = (
                "".join([name[0].upper() for name in self.name.split()[:2]])
                if self.name
                else "US"
            )
            random_part = "".join(
                secrets.choices(string.ascii_uppercase + string.digits, k=6)
            )
            code = f"{initials}{random_part}"

            # Check if code is unique
            if not User.objects.filter(referral_code=code).exists():
                self.referral_code = code
                self.save()
                return code

    def get_referral_code(self):
        """Get or generate referral code for the user"""
        if not self.referral_code:
            return self.generate_referral_code()
        return self.referral_code

    def get_referral_url(self):
        """Get the referral URL for this user"""
        from django.conf import settings

        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:8080")
        return f"{frontend_url}/auth/register?ref={self.get_referral_code()}"

    def get_referred_users(self):
        """Get all users referred by this user"""
        return User.objects.filter(referred_by=self)

    def get_referral_stats(self):
        """Get referral statistics for this user"""
        referred_users = self.get_referred_users()
        return {
            "total_referrals": self.total_referrals,
            "successful_referrals": referred_users.filter(
                approval_status="approved"
            ).count(),
            "pending_referrals": referred_users.filter(
                approval_status="pending"
            ).count(),
            "rewards_earned": float(self.referral_rewards_earned),
            "rewards_available": float(
                self.referral_rewards_earned - self.referral_rewards_used
            ),
            "rewards_used": float(self.referral_rewards_used),
        }

    def add_referral_reward(self, amount):
        """Add referral reward to user's account"""
        self.referral_rewards_earned += amount
        self.save()

    def use_referral_reward(self, amount):
        """Use referral reward from user's account"""
        available_rewards = self.referral_rewards_earned - self.referral_rewards_used
        if available_rewards >= amount:
            self.referral_rewards_used += amount
            self.save()
            return True
        return False

    def get_available_referral_rewards(self):
        """Get available referral rewards balance"""
        return self.referral_rewards_earned - self.referral_rewards_used

    def save(self, *args, **kwargs):
        """Override save to set approval status based on role for new users"""
        if self._state.adding:  # Only for new users
            if self.role in ["customer", "Customer"]:
                self.approval_status = "approved"
            elif self.role in ["cook", "Cook", "delivery_agent", "DeliveryAgent"]:
                self.approval_status = "pending"
            # Admin role can login without approval

        super().save(*args, **kwargs)

    @property
    def id(self):
        """Alias for user_id to maintain compatibility with Django's AbstractUser"""
        return self.user_id

    class Meta:
        db_table = "User"


class Admin(models.Model):
    """Admin model as per SQL schema"""

    admin_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, unique=True)

    def __str__(self):
        return f"Admin: {self.user.name}"

    class Meta:
        db_table = "Admin"


class Customer(models.Model):
    """
    Customer model extending User
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)

    def __str__(self):
        return f"Customer: {self.user.name}"

    class Meta:
        db_table = "Customer"


class Cook(models.Model):
    """
    Cook model extending User
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    specialty = models.CharField(max_length=100, blank=True, null=True)
    kitchen_location = models.CharField(max_length=255, blank=True, null=True)
    experience_years = models.IntegerField(blank=True, null=True)
    rating_avg = models.DecimalField(
        max_digits=3, decimal_places=2, blank=True, null=True
    )
    availability_hours = models.CharField(max_length=50, blank=True, null=True)

    # Kitchen coordinates for location picker
    kitchen_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True
    )
    kitchen_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True
    )

    # Real-time location tracking fields
    current_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True
    )
    current_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True
    )
    location_accuracy = models.FloatField(
        blank=True, null=True, help_text="Location accuracy in meters"
    )
    last_location_update = models.DateTimeField(blank=True, null=True)
    is_location_tracking_enabled = models.BooleanField(default=False)

    def update_current_location(self, latitude, longitude, accuracy=None):
        """Update cook's current location"""
        from django.utils import timezone

        self.current_latitude = latitude
        self.current_longitude = longitude
        if accuracy:
            self.location_accuracy = accuracy
        self.last_location_update = timezone.now()
        self.save(
            update_fields=[
                "current_latitude",
                "current_longitude",
                "location_accuracy",
                "last_location_update",
            ]
        )

    def get_current_location(self):
        """Get cook's current location as dict"""
        if self.current_latitude and self.current_longitude:
            return {
                "latitude": float(self.current_latitude),
                "longitude": float(self.current_longitude),
                "accuracy": self.location_accuracy,
                "last_update": (
                    self.last_location_update.isoformat()
                    if self.last_location_update
                    else None
                ),
            }
        return None

    def get_kitchen_location(self):
        """Get cook's kitchen location as dict"""
        if self.kitchen_latitude and self.kitchen_longitude:
            return {
                "latitude": float(self.kitchen_latitude),
                "longitude": float(self.kitchen_longitude),
                "address": self.kitchen_location,
            }
        return None

    def __str__(self):
        return f"Cook: {self.user.name} - {self.specialty}"

    class Meta:
        db_table = "Cook"


class DeliveryAgent(models.Model):
    """
    Delivery Agent model extending User
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    vehicle_type = models.CharField(max_length=50, blank=True, null=True)
    license_no = models.CharField(
        max_length=100, blank=True, null=True
    )  # Added to match SQL schema
    vehicle_number = models.CharField(max_length=20, blank=True, null=True)
    current_location = models.CharField(max_length=255, blank=True, null=True)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"Delivery Agent: {self.user.name}"

    class Meta:
        db_table = "DeliveryAgent"


class DocumentType(models.Model):
    """
    Document types for different roles
    """

    DOCUMENT_CATEGORIES = [
        ("cook", "Cook Documents"),
        ("delivery_agent", "Delivery Agent Documents"),
    ]

    name = models.CharField(
        max_length=100,
        help_text="Document type name (e.g., 'Driving License', 'Food Safety Certificate')",
    )
    category = models.CharField(
        max_length=20,
        choices=DOCUMENT_CATEGORIES,
        help_text="Category this document belongs to",
    )
    description = models.TextField(
        blank=True, null=True, help_text="Description of what this document is for"
    )
    is_required = models.BooleanField(
        default=True, help_text="Whether this document is required for approval"
    )
    allowed_file_types = models.JSONField(
        default=list,
        help_text="List of allowed file extensions (e.g., ['pdf', 'jpg', 'png'])",
    )
    max_file_size_mb = models.IntegerField(
        default=5, help_text="Maximum file size in MB"
    )
    is_single_page_only = models.BooleanField(
        default=True, help_text="Whether this document should be single page only"
    )
    max_pages = models.IntegerField(
        default=2, help_text="Maximum number of pages allowed (for PDFs)"
    )

    def __str__(self):
        return f"{self.get_category_display()} - {self.name}"

    class Meta:
        db_table = "document_types"
        unique_together = ["name", "category"]


class UserDocument(models.Model):
    """
    User uploaded documents for verification
    """

    STATUS_CHOICES = [
        ("pending", "Pending Review"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("needs_resubmission", "Needs Resubmission"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="documents")
    document_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE)
    file = models.URLField(
        max_length=500, help_text="Document file URL (Cloudinary or local)"
    )
    file_name = models.CharField(max_length=255, help_text="Original file name")
    file_size = models.BigIntegerField(help_text="File size in bytes")
    file_type = models.CharField(max_length=50, help_text="File MIME type")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_notes = models.TextField(
        blank=True, null=True, help_text="Admin review notes"
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_documents",
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # New field to control document visibility to admin
    is_visible_to_admin = models.BooleanField(
        default=False, help_text="Whether admin can see this document"
    )
    cloudinary_public_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Cloudinary public ID for the file",
    )
    local_file_path = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Local file path for PDFs to avoid Cloudinary access issues",
    )
    converted_images = models.JSONField(
        blank=True,
        null=True,
        help_text="Metadata for converted images (for PDFs converted to images)",
    )
    is_pdf_converted = models.BooleanField(
        default=False,
        help_text="Whether this document was converted from PDF to images",
    )

    def __str__(self):
        return f"{self.user.name} - {self.document_type.name}"

    class Meta:
        db_table = "user_documents"
        ordering = ["-uploaded_at"]


class EmailOTP(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    purpose = models.CharField(
        max_length=20,
        choices=[
            ("registration", "Registration"),
            ("password_reset", "Password Reset"),
            ("email_verification", "Email Verification"),
        ],
        default="registration",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "email_otp"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.otp:
            self.otp = self.generate_otp()
        if not self.expires_at:
            from django.conf import settings

            expiry_minutes = getattr(settings, "OTP_EXPIRY_MINUTES", 10)
            self.expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        super().save(*args, **kwargs)

    def generate_otp(self):
        from django.conf import settings

        otp_length = getattr(settings, "OTP_LENGTH", 6)
        return "".join(random.choices(string.digits, k=otp_length))

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
        ("access", "Access Token"),
        ("refresh", "Refresh Token"),
        ("referral", "Referral Token"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="jwt_tokens")
    token_hash = models.CharField(
        max_length=64, unique=True, help_text="SHA-256 hash of the token"
    )
    token_type = models.CharField(max_length=10, choices=TOKEN_TYPES)
    jti = models.CharField(
        max_length=255, unique=True, help_text="JWT ID from token payload"
    )

    # Token metadata
    issued_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        null=True, blank=True, help_text="Expiration time of the token"
    )

    # Security tracking
    is_revoked = models.BooleanField(
        default=False, help_text="Indicates if the token has been revoked"
    )
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

    # Referral-specific fields (only used when token_type = 'referral')
    max_uses = models.PositiveIntegerField(
        default=1, help_text="Maximum number of times this referral token can be used"
    )
    used_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="used_referral_tokens",
        help_text="User who used this referral token",
    )
    referrer_reward = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Reward amount for referrer",
    )
    referee_reward = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Reward amount for referee",
    )
    campaign_name = models.CharField(
        max_length=100, blank=True, null=True, help_text="Name of the referral campaign"
    )

    class Meta:
        db_table = "jwt_tokens"
        ordering = ["-issued_at"]
        indexes = [
            models.Index(fields=["user", "token_type"]),
            models.Index(fields=["token_hash"]),
            models.Index(fields=["jti"]),
            models.Index(fields=["expires_at"]),
            models.Index(fields=["is_revoked", "is_blacklisted"]),
        ]

    def __str__(self):
        return f"{self.token_type.title()} token for {self.user.email}"

    def is_valid(self):
        """Check if token is valid (not expired, revoked, or blacklisted)"""
        now = timezone.now()
        is_valid = (
            not self.is_revoked and not self.is_blacklisted and now < self.expires_at
        )

        # For referral tokens, also check usage count
        if self.token_type == "referral":
            is_valid = is_valid and self.usage_count < self.max_uses

        return is_valid

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
        self.save(update_fields=["last_used_at", "usage_count"])

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
        queryset.update(is_revoked=True, revoked_at=timezone.now())
        return count

    def can_be_used_for_referral(self):
        """Check if this referral token can be used"""
        if self.token_type != "referral":
            return False
        return self.is_valid() and self.usage_count < self.max_uses

    def use_for_referral(self, referee_user):
        """Use this referral token for a user"""
        if not self.can_be_used_for_referral():
            return False

        # Update token usage
        self.usage_count += 1
        self.used_by = referee_user
        self.last_used_at = timezone.now()

        # Revoke token if max uses reached
        if self.usage_count >= self.max_uses:
            self.revoke()

        self.save()

        # Update user's referral information
        referee_user.referred_by = self.user
        referee_user.referral_token_used = self.jti  # Store JTI as the token identifier
        referee_user.save()

        # Update referrer's total referrals count
        self.user.total_referrals += 1
        self.user.save()

        # Add rewards if configured
        if self.referrer_reward > 0:
            self.user.add_referral_reward(self.referrer_reward)

        if self.referee_reward > 0:
            referee_user.add_referral_reward(self.referee_reward)

        return True

    @classmethod
    def create_referral_token(
        cls,
        referrer,
        expires_days=30,
        max_uses=1,
        referrer_reward=0,
        referee_reward=0,
        campaign_name=None,
    ):
        """Create a new referral JWT token"""
        import hashlib
        import secrets
        import string
        from datetime import timedelta

        # Generate unique token string
        while True:
            token_string = "".join(
                secrets.choices(string.ascii_uppercase + string.digits, k=12)
            )
            token_hash = hashlib.sha256(token_string.encode()).hexdigest()
            if not cls.objects.filter(token_hash=token_hash).exists():
                break

        # Generate unique JTI
        while True:
            jti = "".join(secrets.choices(string.ascii_letters + string.digits, k=32))
            if not cls.objects.filter(jti=jti).exists():
                break

        # Calculate expiry date
        expires_at = timezone.now() + timedelta(days=expires_days)

        # Create referral token
        referral_token = cls.objects.create(
            user=referrer,
            token_hash=token_hash,
            token_type="referral",
            jti=jti,
            expires_at=expires_at,
            max_uses=max_uses,
            referrer_reward=referrer_reward,
            referee_reward=referee_reward,
            campaign_name=campaign_name,
        )

        return referral_token, token_string

    @classmethod
    def get_user_referral_tokens(cls, user):
        """Get all referral tokens for a user"""
        return cls.objects.filter(user=user, token_type="referral")

    @classmethod
    def validate_referral_token(cls, token_string):
        """Validate a referral token string"""
        import hashlib

        token_hash = hashlib.sha256(token_string.encode()).hexdigest()

        try:
            token = cls.objects.get(token_hash=token_hash, token_type="referral")
            return {
                "valid": token.is_valid(),
                "token": token,
                "referrer": token.user,
                "rewards": {
                    "referrer_reward": float(token.referrer_reward),
                    "referee_reward": float(token.referee_reward),
                },
            }
        except cls.DoesNotExist:
            return {"valid": False, "token": None, "referrer": None, "rewards": None}


# DocumentType and UserDocument models are defined in migrations
# and will be loaded automatically by Django
# DocumentType and UserDocument models are defined in migrations
# and will be loaded automatically by Django
