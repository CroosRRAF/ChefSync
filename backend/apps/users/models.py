from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator
from apps.food.cloudinary_fields import CloudinaryImageField


class UserProfile(models.Model):
    """Extended user profile information"""
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    profile_picture = CloudinaryImageField(blank=True, null=True)
    # Removed address field - now handled by Address model
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True)
    bio = models.TextField(blank=True)
    preferences = models.JSONField(default=dict, blank=True)
    
    # Address relationship helper methods
    def get_default_address(self, address_type='customer'):
        """Get default address for user"""
        return Address.objects.filter(
            user=self.user, 
            address_type=address_type, 
            is_default=True, 
            is_active=True
        ).first()
    
    def get_all_addresses(self, address_type=None):
        """Get all addresses for user"""
        queryset = Address.objects.filter(user=self.user, is_active=True)
        if address_type:
            queryset = queryset.filter(address_type=address_type)
        return queryset.order_by('-is_default', '-created_at')
    
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
    
    # Kitchen location helper methods
    def get_kitchen_location(self):
        """Get chef's kitchen location"""
        kitchen_address = Address.objects.filter(
            user=self.user, 
            address_type='kitchen', 
            is_default=True, 
            is_active=True
        ).first()
        if kitchen_address and hasattr(kitchen_address, 'kitchen_details'):
            return kitchen_address.kitchen_details
        return None
    
    def get_all_kitchens(self):
        """Get all kitchen locations for chef"""
        return Address.objects.filter(
            user=self.user, 
            address_type='kitchen', 
            is_active=True
        ).order_by('-is_default', '-created_at')
    
    def has_verified_kitchen(self):
        """Check if chef has a verified kitchen"""
        kitchen = self.get_kitchen_location()
        return kitchen and kitchen.is_verified
    
    def __str__(self):
        return f"Chef {self.user.username}"
    
    class Meta:
        db_table = 'chef_profiles'
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
    vehicle_type = models.CharField(max_length=50, blank=True)
    license_number = models.CharField(max_length=100, blank=True)
    is_available = models.BooleanField(default=True)
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_deliveries = models.PositiveIntegerField(default=0)
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS_CHOICES,
        default='pending'
    )
    
    # Location helper methods
    def get_current_location(self):
        """Get delivery agent's current location"""
        current_address = Address.objects.filter(
            user=self.user, 
            address_type='delivery_agent', 
            is_active=True
        ).filter(
            delivery_agent_details__location_type='current'
        ).first()
        if current_address and hasattr(current_address, 'delivery_agent_details'):
            return current_address.delivery_agent_details
        return None
    
    def get_base_location(self):
        """Get delivery agent's base location"""
        base_address = Address.objects.filter(
            user=self.user, 
            address_type='delivery_agent', 
            is_active=True
        ).filter(
            delivery_agent_details__location_type='base'
        ).first()
        if base_address and hasattr(base_address, 'delivery_agent_details'):
            return base_address.delivery_agent_details
        return None
    
    def get_service_areas(self):
        """Get all service areas for delivery agent"""
        return Address.objects.filter(
            user=self.user, 
            address_type='delivery_agent', 
            is_active=True
        ).filter(
            delivery_agent_details__location_type='service_area'
        )
    
    def update_current_location(self, latitude, longitude, accuracy=None):
        """Update delivery agent's current location"""
        from django.utils import timezone
        
        current_location = self.get_current_location()
        if current_location:
            # Update existing location
            current_location.address.latitude = latitude
            current_location.address.longitude = longitude
            current_location.address.save()
            
            current_location.last_updated_location = timezone.now()
            if accuracy:
                current_location.location_accuracy_meters = accuracy
            current_location.save()
        
    def __str__(self):
        return f"Delivery Partner {self.user.username}"
    
    class Meta:
        db_table = 'delivery_profiles'


# Address Models
class Address(models.Model):
    """Base address model for all types of addresses"""
    
    ADDRESS_TYPE_CHOICES = [
        ('customer', 'Customer Address'),
        ('kitchen', 'Kitchen Location'),
        ('delivery_agent', 'Delivery Agent Location'),
    ]
    
    # Basic Information
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_addresses')
    address_type = models.CharField(max_length=20, choices=ADDRESS_TYPE_CHOICES)
    label = models.CharField(max_length=100, help_text='Address label (e.g., Home, Work, Kitchen, Current Location)')
    
    # Address Details
    address_line1 = models.CharField(max_length=200, help_text='Street address, building name, etc.')
    address_line2 = models.CharField(max_length=200, blank=True, null=True, help_text='Apartment, floor, etc.')
    landmark = models.CharField(max_length=200, blank=True, null=True, help_text='Nearby landmark')
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')
    pincode = models.CharField(max_length=20, validators=[
        RegexValidator(regex=r'^\d{6}$', message='Pincode must be 6 digits')
    ])
    
    # Coordinates
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Status and Preferences
    is_default = models.BooleanField(default=False, help_text='Default address for this user and type')
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Ensure only one default address per user per type
        if self.is_default:
            Address.objects.filter(
                user=self.user, 
                address_type=self.address_type, 
                is_default=True
            ).update(is_default=False)
        super().save(*args, **kwargs)
    
    @property
    def full_address(self):
        """Return formatted full address"""
        parts = [self.address_line1]
        if self.address_line2:
            parts.append(self.address_line2)
        if self.landmark:
            parts.append(f"Near {self.landmark}")
        parts.extend([self.city, self.state, self.country, self.pincode])
        return ', '.join(parts)
    
    def __str__(self):
        return f"{self.user.username} - {self.label} ({self.get_address_type_display()})"
    
    class Meta:
        db_table = 'addresses'
        unique_together = ['user', 'address_type', 'label']
        indexes = [
            models.Index(fields=['user', 'address_type']),
            models.Index(fields=['user', 'is_default']),
            models.Index(fields=['latitude', 'longitude']),
        ]


class CustomerAddress(models.Model):
    """Extended customer address with contact and delivery preferences"""
    
    address = models.OneToOneField(Address, on_delete=models.CASCADE, related_name='customer_details')
    
    # Contact Information
    contact_name = models.CharField(max_length=100, blank=True, help_text='Contact person name')
    mobile_number = models.CharField(
        max_length=15, 
        blank=True,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message='Enter valid mobile number')]
    )
    alternate_mobile = models.CharField(
        max_length=15, 
        blank=True,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message='Enter valid mobile number')]
    )
    
    # Delivery Preferences
    delivery_instructions = models.TextField(blank=True, help_text='Special delivery instructions')
    gate_code = models.CharField(max_length=50, blank=True, help_text='Gate or building access code')
    best_time_to_deliver = models.CharField(max_length=100, blank=True, help_text='Preferred delivery time')
    
    # Building/Location Details
    building_type = models.CharField(max_length=50, blank=True, help_text='House, Apartment, Office, etc.')
    floor_number = models.CharField(max_length=10, blank=True)
    
    def __str__(self):
        return f"{self.address.user.username} - {self.address.label}"
    
    class Meta:
        db_table = 'customer_addresses'


class KitchenLocation(models.Model):
    """Kitchen location details for chefs"""
    
    address = models.OneToOneField(Address, on_delete=models.CASCADE, related_name='kitchen_details')
    
    # Kitchen Details
    kitchen_name = models.CharField(max_length=200, help_text='Name of the kitchen/restaurant')
    kitchen_type = models.CharField(max_length=50, choices=[
        ('home', 'Home Kitchen'),
        ('commercial', 'Commercial Kitchen'),
        ('restaurant', 'Restaurant'),
        ('cloud_kitchen', 'Cloud Kitchen'),
    ], default='home')
    
    # Contact Information
    contact_number = models.CharField(
        max_length=15,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message='Enter valid mobile number')]
    )
    alternate_contact = models.CharField(
        max_length=15, 
        blank=True,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message='Enter valid mobile number')]
    )
    
    # Operational Details
    operating_hours = models.JSONField(default=dict, blank=True, help_text='Operating hours for each day')
    max_orders_per_day = models.PositiveIntegerField(default=50, help_text='Maximum orders this kitchen can handle per day')
    delivery_radius_km = models.PositiveIntegerField(default=10, help_text='Maximum delivery radius in kilometers')
    
    # Kitchen Features
    has_parking = models.BooleanField(default=False)
    pickup_instructions = models.TextField(blank=True, help_text='Instructions for pickup from kitchen')
    
    # Verification
    is_verified = models.BooleanField(default=False)
    verification_notes = models.TextField(blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.kitchen_name} - {self.address.user.username}"
    
    class Meta:
        db_table = 'kitchen_locations'


class DeliveryAgentLocation(models.Model):
    """Current and service locations for delivery agents"""
    
    address = models.OneToOneField(Address, on_delete=models.CASCADE, related_name='delivery_agent_details')
    
    # Location Details
    location_type = models.CharField(max_length=20, choices=[
        ('current', 'Current Location'),
        ('base', 'Base Location'),
        ('service_area', 'Service Area'),
    ])
    
    # Contact Information
    contact_number = models.CharField(
        max_length=15,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message='Enter valid mobile number')]
    )
    emergency_contact = models.CharField(
        max_length=15, 
        blank=True,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message='Enter valid mobile number')]
    )
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    
    # Service Details
    service_radius_km = models.PositiveIntegerField(default=15, help_text='Service radius in kilometers')
    is_available_for_service = models.BooleanField(default=True)
    
    # Location Tracking (for current location type)
    last_updated_location = models.DateTimeField(null=True, blank=True)
    location_accuracy_meters = models.PositiveIntegerField(null=True, blank=True, help_text='GPS accuracy in meters')
    
    def __str__(self):
        return f"{self.address.user.username} - {self.get_location_type_display()}"
    
    class Meta:
        db_table = 'delivery_agent_locations'