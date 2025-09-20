from django.db import models
from django.conf import settings
from .fields import LongBlobImageField


class UserProfile(models.Model):
    """Extended user profile information"""
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    profile_picture = LongBlobImageField(blank=True, null=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True)
    bio = models.TextField(blank=True)
    preferences = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    class Meta:
        db_table = 'user_profiles'


class ChefProfile(models.Model):
    """Chef-specific profile information"""
    
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chef_profile')
    specialty_cuisines = models.JSONField(default=list, blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    certifications = models.JSONField(default=list, blank=True)
    bio = models.TextField(blank=True)
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS_CHOICES,
        default='pending'
    )
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_orders = models.PositiveIntegerField(default=0)
    total_reviews = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Chef {self.user.username}"
    
    class Meta:
        db_table = 'chef_profiles'


class DeliveryProfile(models.Model):
    """Delivery partner profile information"""
    
    VEHICLE_TYPE_CHOICES = [
        ('bike', 'Bike'),
        ('car', 'Car'),
        ('scooter', 'Scooter'),
        ('foot', 'On Foot'),
    ]
    
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='delivery_profile')
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES)
    vehicle_number = models.CharField(max_length=20, blank=True)
    license_number = models.CharField(max_length=50, blank=True)
    insurance_info = models.JSONField(default=dict, blank=True)
    is_available = models.BooleanField(default=True)
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_deliveries = models.PositiveIntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS_CHOICES,
        default='pending'
    )
    
    def __str__(self):
        return f"Delivery Partner {self.user.username}"
    
    class Meta:
        db_table = 'delivery_profiles'