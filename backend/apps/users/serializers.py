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
    class Meta:
        model = ChefProfile
        fields = '__all__'


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
