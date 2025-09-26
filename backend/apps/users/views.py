from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
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
    
    @action(detail=True, methods=['patch'], url_path='toggle-availability')
    def toggle_availability(self, request, pk=None):
        """Toggle chef availability status"""
        try:
            chef_profile = self.get_object()
            
            # Only allow chef to update their own availability
            if chef_profile.user != request.user:
                return Response(
                    {'error': 'You can only update your own availability status'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Toggle the availability
            chef_profile.is_available = not chef_profile.is_available
            chef_profile.save()
            
            return Response({
                'success': True,
                'is_available': chef_profile.is_available,
                'message': f'Status changed to {"Available" if chef_profile.is_available else "Busy"}'
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class DeliveryProfileViewSet(viewsets.ModelViewSet):
    queryset = DeliveryProfile.objects.all()
    serializer_class = DeliveryProfileSerializer
    permission_classes = [IsAuthenticated]