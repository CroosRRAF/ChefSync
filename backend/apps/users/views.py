from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile, ChefProfile, DeliveryProfile
from .serializers import UserProfileSerializer, ChefProfileSerializer, DeliveryProfileSerializer


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]


class ChefProfileViewSet(viewsets.ModelViewSet):
    queryset = ChefProfile.objects.all()
    serializer_class = ChefProfileSerializer
    permission_classes = [IsAuthenticated]


class DeliveryProfileViewSet(viewsets.ModelViewSet):
    queryset = DeliveryProfile.objects.all()
    serializer_class = DeliveryProfileSerializer
    permission_classes = [IsAuthenticated]