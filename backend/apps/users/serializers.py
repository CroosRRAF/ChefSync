from rest_framework import serializers
from .models import (
    UserProfile, ChefProfile, DeliveryProfile,
    Address, CustomerAddress, KitchenLocation, DeliveryAgentLocation
)
from utils.cloudinary_utils import get_optimized_url


class UserProfileSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()
    profile_picture_thumbnail = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'profile_picture', 'profile_picture_url', 'profile_picture_thumbnail',
            'date_of_birth', 'gender', 'bio', 'preferences'
        ]
    
    def get_profile_picture_url(self, obj):
        """Return optimized Cloudinary URL"""
        if obj.profile_picture:
            return get_optimized_url(str(obj.profile_picture))
        return None
    
    def get_profile_picture_thumbnail(self, obj):
        """Get thumbnail version of profile picture"""
        if obj.profile_picture:
            return get_optimized_url(str(obj.profile_picture), width=150, height=150)
        return None


class ChefProfileSerializer(serializers.ModelSerializer):
    # User information - with error handling
    user_id = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    phone_no = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    rating_average = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    
    # Kitchen location and availability
    kitchen_location = serializers.SerializerMethodField()
    operating_hours = serializers.SerializerMethodField()
    operating_hours_readable = serializers.SerializerMethodField()
    is_currently_open = serializers.SerializerMethodField()
    availability_message = serializers.SerializerMethodField()
    
    class Meta:
        model = ChefProfile
        fields = [
            'id', 'user', 'user_id', 'name', 'username', 'email', 'phone_no',
            'specialty_cuisines', 'experience_years', 'certifications', 'bio',
            'approval_status', 'rating_average', 'rating', 'total_orders', 'total_reviews',
            'is_featured', 'kitchen_location', 'operating_hours', 'operating_hours_readable',
            'is_currently_open', 'availability_message'
        ]
    
    def get_user_id(self, obj):
        """Safely get user ID"""
        try:
            return obj.user.user_id if hasattr(obj.user, 'user_id') else obj.user.id
        except Exception:
            return None
    
    def get_name(self, obj):
        """Safely get user name"""
        try:
            return obj.user.name if hasattr(obj.user, 'name') else obj.user.username
        except Exception:
            return None
    
    def get_username(self, obj):
        """Safely get username"""
        try:
            return obj.user.username
        except Exception:
            return None
    
    def get_email(self, obj):
        """Safely get email"""
        try:
            return obj.user.email
        except Exception:
            return None
    
    def get_phone_no(self, obj):
        """Safely get phone number"""
        try:
            return obj.user.phone_no if hasattr(obj.user, 'phone_no') else None
        except Exception:
            return None
    
    def get_rating(self, obj):
        """Safely get rating"""
        try:
            return float(obj.rating_average) if obj.rating_average else 0.0
        except Exception:
            return 0.0
    
    def get_kitchen_location(self, obj):
        """Get chef's kitchen location details"""
        try:
            kitchen_address = Address.objects.filter(
                user=obj.user,
                address_type='kitchen',
                is_default=True,
                is_active=True
            ).first()
            
            if kitchen_address:
                return {
                    'address': kitchen_address.full_address,
                    'city': kitchen_address.city,
                    'state': kitchen_address.state,
                    'latitude': float(kitchen_address.latitude) if kitchen_address.latitude else None,
                    'longitude': float(kitchen_address.longitude) if kitchen_address.longitude else None,
                }
        except Exception as e:
            print(f"Error getting kitchen location: {str(e)}")
        return None
    
    def get_operating_hours(self, obj):
        """Get chef's operating hours"""
        try:
            kitchen_address = Address.objects.filter(
                user=obj.user,
                address_type='kitchen',
                is_default=True,
                is_active=True
            ).first()
            
            if kitchen_address and hasattr(kitchen_address, 'kitchen_details'):
                return kitchen_address.kitchen_details.operating_hours
        except Exception as e:
            print(f"Error getting operating hours: {str(e)}")
        return None
    
    def get_operating_hours_readable(self, obj):
        """Get human-readable operating hours"""
        try:
            from .availability_utils import format_operating_hours_readable
            
            operating_hours = self.get_operating_hours(obj)
            return format_operating_hours_readable(operating_hours)
        except Exception as e:
            print(f"Error formatting operating hours: {str(e)}")
            return "Hours not available"
    
    def get_is_currently_open(self, obj):
        """Check if chef is currently accepting orders"""
        try:
            from .availability_utils import is_within_operating_hours
            
            operating_hours = self.get_operating_hours(obj)
            is_open, _, _ = is_within_operating_hours(operating_hours)
            return is_open
        except Exception as e:
            print(f"Error checking if currently open: {str(e)}")
            return True  # Default to open if error
    
    def get_availability_message(self, obj):
        """Get current availability status message"""
        try:
            from .availability_utils import is_within_operating_hours
            
            operating_hours = self.get_operating_hours(obj)
            _, message, _ = is_within_operating_hours(operating_hours)
            return message
        except Exception as e:
            print(f"Error getting availability message: {str(e)}")
            return "Available"


class DeliveryProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryProfile
        fields = '__all__'


# Address System Serializers
class AddressSerializer(serializers.ModelSerializer):
    """Base address serializer"""
    
    full_address = serializers.ReadOnlyField()
    
    class Meta:
        model = Address
        fields = [
            'id', 'address_type', 'label', 'address_line1', 'address_line2',
            'landmark', 'city', 'state', 'country', 'pincode',
            'latitude', 'longitude', 'is_default', 'is_active',
            'full_address', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'full_address']
    
    def validate(self, data):
        """Custom validation for address"""
        # Ensure pincode is valid
        pincode = data.get('pincode')
        if pincode and len(pincode) != 6:
            raise serializers.ValidationError("Pincode must be exactly 6 digits")
        
        return data


class CustomerAddressSerializer(serializers.ModelSerializer):
    """Customer address with extended details"""
    
    address = AddressSerializer()
    
    class Meta:
        model = CustomerAddress
        fields = [
            'id', 'address', 'contact_name', 'mobile_number', 'alternate_mobile',
            'delivery_instructions', 'gate_code', 'best_time_to_deliver',
            'building_type', 'floor_number'
        ]
    
    def create(self, validated_data):
        address_data = validated_data.pop('address')
        address_data['user'] = self.context['request'].user
        address_data['address_type'] = 'customer'
        
        # Create address first
        address = Address.objects.create(**address_data)
        
        # Create customer address details
        customer_address = CustomerAddress.objects.create(
            address=address,
            **validated_data
        )
        
        return customer_address
    
    def update(self, instance, validated_data):
        address_data = validated_data.pop('address', None)
        
        # Update customer address fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update address if provided
        if address_data:
            address_serializer = AddressSerializer(
                instance.address, 
                data=address_data, 
                partial=True
            )
            if address_serializer.is_valid():
                address_serializer.save()
        
        return instance


class KitchenLocationSerializer(serializers.ModelSerializer):
    """Kitchen location with chef details"""
    
    address = AddressSerializer()
    
    class Meta:
        model = KitchenLocation
        fields = [
            'id', 'address', 'kitchen_name', 'kitchen_type', 'contact_number',
            'alternate_contact', 'operating_hours', 'max_orders_per_day',
            'delivery_radius_km', 'has_parking', 'pickup_instructions',
            'is_verified', 'verification_notes', 'verified_at'
        ]
        read_only_fields = ['is_verified', 'verification_notes', 'verified_at']
    
    def create(self, validated_data):
        address_data = validated_data.pop('address')
        address_data['user'] = self.context['request'].user
        address_data['address_type'] = 'kitchen'
        
        # Create address first
        address = Address.objects.create(**address_data)
        
        # Create kitchen location
        kitchen_location = KitchenLocation.objects.create(
            address=address,
            **validated_data
        )
        
        return kitchen_location
    
    def update(self, instance, validated_data):
        address_data = validated_data.pop('address', None)
        
        # Update kitchen location fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update address if provided
        if address_data:
            address_serializer = AddressSerializer(
                instance.address, 
                data=address_data, 
                partial=True
            )
            if address_serializer.is_valid():
                address_serializer.save()
        
        return instance


class DeliveryAgentLocationSerializer(serializers.ModelSerializer):
    """Delivery agent location serializer"""
    
    address = AddressSerializer()
    
    class Meta:
        model = DeliveryAgentLocation
        fields = [
            'id', 'address', 'location_type', 'contact_number', 'emergency_contact',
            'emergency_contact_name', 'service_radius_km', 'is_available_for_service',
            'last_updated_location', 'location_accuracy_meters'
        ]
        read_only_fields = ['last_updated_location']
    
    def create(self, validated_data):
        address_data = validated_data.pop('address')
        address_data['user'] = self.context['request'].user
        address_data['address_type'] = 'delivery_agent'
        
        # Create address first
        address = Address.objects.create(**address_data)
        
        # Create delivery agent location
        delivery_location = DeliveryAgentLocation.objects.create(
            address=address,
            **validated_data
        )
        
        return delivery_location
    
    def update(self, instance, validated_data):
        address_data = validated_data.pop('address', None)
        
        # Update delivery agent location fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update address if provided
        if address_data:
            # Update location timestamp if coordinates changed
            if 'latitude' in address_data or 'longitude' in address_data:
                from django.utils import timezone
                instance.last_updated_location = timezone.now()
                instance.save()
            
            address_serializer = AddressSerializer(
                instance.address, 
                data=address_data, 
                partial=True
            )
            if address_serializer.is_valid():
                address_serializer.save()
        
        return instance


class AddressListSerializer(serializers.ModelSerializer):
    """Simplified address serializer for listing"""
    
    address_type_display = serializers.CharField(source='get_address_type_display', read_only=True)
    
    class Meta:
        model = Address
        fields = [
            'id', 'address_type', 'address_type_display', 'label',
            'address_line1', 'city', 'pincode', 'is_default',
            'latitude', 'longitude', 'created_at'
        ]


# Quick create serializers for mobile apps
class QuickCustomerAddressSerializer(serializers.ModelSerializer):
    """Simplified customer address creation"""
    
    class Meta:
        model = Address
        fields = [
            'label', 'address_line1', 'address_line2', 'city', 
            'pincode', 'latitude', 'longitude', 'is_default'
        ]
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['address_type'] = 'customer'
        validated_data['country'] = 'India'  # Default country
        return Address.objects.create(**validated_data)


class QuickKitchenLocationSerializer(serializers.ModelSerializer):
    """Simplified kitchen location creation"""
    
    kitchen_name = serializers.CharField()
    contact_number = serializers.CharField()
    
    class Meta:
        model = Address
        fields = [
            'label', 'address_line1', 'address_line2', 'city', 
            'pincode', 'latitude', 'longitude', 'kitchen_name', 'contact_number'
        ]
    
    def create(self, validated_data):
        kitchen_name = validated_data.pop('kitchen_name')
        contact_number = validated_data.pop('contact_number')
        
        validated_data['user'] = self.context['request'].user
        validated_data['address_type'] = 'kitchen'
        validated_data['country'] = 'India'
        validated_data['is_default'] = True  # First kitchen is default
        
        # Create address
        address = Address.objects.create(**validated_data)
        
        # Create kitchen location
        KitchenLocation.objects.create(
            address=address,
            kitchen_name=kitchen_name,
            contact_number=contact_number
        )
        
        return address
