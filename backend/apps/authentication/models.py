

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import datetime
import random
import string
from datetime import timedelta


class User(AbstractUser):
    """
    Custom User model for ChefSync application
    """
    # Role choices for user types
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('cook', 'Cook'),
        ('delivery_agent', 'Delivery Agent'),
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
        elif self.role == 'cook':
            Cook.objects.get_or_create(user=self)
        elif self.role == 'delivery_agent':
            DeliveryAgent.objects.get_or_create(user=self)

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

