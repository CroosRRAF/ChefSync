from rest_framework import serializers
from .models import UserProfile, ChefProfile, DeliveryProfile
from utils.cloudinary_utils import get_optimized_url


class UserProfileSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()
    profile_picture_thumbnail = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'profile_picture', 'profile_picture_url', 'profile_picture_thumbnail',
            'address', 'date_of_birth', 'gender', 'bio', 'preferences'
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
