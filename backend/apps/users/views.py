from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import (
    UserProfile, ChefProfile, DeliveryProfile,
    Address, CustomerAddress, KitchenLocation, DeliveryAgentLocation
)
from .serializers import (
    UserProfileSerializer, ChefProfileSerializer, DeliveryProfileSerializer,
    AddressSerializer, CustomerAddressSerializer, KitchenLocationSerializer,
    DeliveryAgentLocationSerializer, AddressListSerializer,
    QuickCustomerAddressSerializer, QuickKitchenLocationSerializer
)


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]


class ChefProfileViewSet(viewsets.ModelViewSet):
    queryset = ChefProfile.objects.filter(approval_status='approved')
    serializer_class = ChefProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Allow read-only access for retrieve and list, require auth for modifications"""
        if self.action in ['retrieve', 'list']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class DeliveryProfileViewSet(viewsets.ModelViewSet):
    queryset = DeliveryProfile.objects.all()
    serializer_class = DeliveryProfileSerializer
    permission_classes = [IsAuthenticated]


# Address Management ViewSets
class AddressViewSet(viewsets.ModelViewSet):
    """Base address management viewset"""
    
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get addresses filtered by type"""
        address_type = request.query_params.get('type')
        if not address_type:
            return Response(
                {'error': 'Address type parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        addresses = self.get_queryset().filter(address_type=address_type)
        serializer = AddressListSerializer(addresses, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def default(self, request):
        """Get default addresses for user"""
        address_type = request.query_params.get('type')
        queryset = self.get_queryset().filter(is_default=True)
        
        if address_type:
            queryset = queryset.filter(address_type=address_type)
        
        serializer = AddressListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set address as default"""
        address = self.get_object()
        
        with transaction.atomic():
            # Remove default from other addresses of same type
            Address.objects.filter(
                user=request.user,
                address_type=address.address_type,
                is_default=True
            ).update(is_default=False)
            
            # Set this address as default
            address.is_default = True
            address.save()
        
        return Response({'message': 'Address set as default'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate address instead of deleting"""
        address = self.get_object()
        address.is_active = False
        address.save()
        return Response({'message': 'Address deactivated'})


class CustomerAddressViewSet(viewsets.ModelViewSet):
    """Customer address management"""
    
    serializer_class = CustomerAddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CustomerAddress.objects.filter(
            address__user=self.request.user,
            address__is_active=True
        ).select_related('address')
    
    @action(detail=False, methods=['post'])
    def quick_create(self, request):
        """Quick address creation for mobile apps"""
        serializer = QuickCustomerAddressSerializer(
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            address = serializer.save()
            return Response(
                AddressListSerializer(address).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class KitchenLocationViewSet(viewsets.ModelViewSet):
    """Kitchen location management for chefs"""
    
    serializer_class = KitchenLocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return KitchenLocation.objects.filter(
            address__user=self.request.user,
            address__is_active=True
        ).select_related('address')
    
    @action(detail=False, methods=['post'])
    def quick_create(self, request):
        """Quick kitchen creation for chefs"""
        serializer = QuickKitchenLocationSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            address = serializer.save()
            # Get the created kitchen location
            kitchen = KitchenLocation.objects.get(address=address)
            return Response(
                KitchenLocationSerializer(kitchen).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Admin action to verify kitchen location"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        kitchen = self.get_object()
        notes = request.data.get('notes', '')
        
        from django.utils import timezone
        kitchen.is_verified = True
        kitchen.verification_notes = notes
        kitchen.verified_at = timezone.now()
        kitchen.save()
        
        return Response({'message': 'Kitchen location verified'})


class DeliveryAgentLocationViewSet(viewsets.ModelViewSet):
    """Delivery agent location management"""
    
    serializer_class = DeliveryAgentLocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return DeliveryAgentLocation.objects.filter(
            address__user=self.request.user,
            address__is_active=True
        ).select_related('address')
    
    @action(detail=False, methods=['post'])
    def update_current_location(self, request):
        """Update delivery agent's current location"""
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        accuracy = request.data.get('accuracy')
        
        if not latitude or not longitude:
            return Response(
                {'error': 'Latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create current location
        current_location = self.get_queryset().filter(
            location_type='current'
        ).first()
        
        if current_location:
            # Update existing location
            current_location.address.latitude = latitude
            current_location.address.longitude = longitude
            current_location.address.save()
            
            from django.utils import timezone
            current_location.last_updated_location = timezone.now()
            if accuracy:
                current_location.location_accuracy_meters = accuracy
            current_location.save()
            
            serializer = self.get_serializer(current_location)
            return Response(serializer.data)
        else:
            # Create new current location
            address_data = {
                'address_type': 'delivery_agent',
                'label': 'Current Location',
                'latitude': latitude,
                'longitude': longitude,
                'city': 'Unknown',  # Can be geocoded later
                'pincode': '000000',
                'country': 'India'
            }
            
            location_data = {
                'location_type': 'current',
                'contact_number': request.user.phone or '0000000000',
                'is_available_for_service': True,
                'location_accuracy_meters': accuracy
            }
            
            data = {
                'address': address_data,
                **location_data
            }
            
            serializer = self.get_serializer(
                data=data,
                context={'request': request}
            )
            if serializer.is_valid():
                location = serializer.save()
                return Response(
                    self.get_serializer(location).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def current_location(self, request):
        """Get delivery agent's current location"""
        current_location = self.get_queryset().filter(
            location_type='current'
        ).first()
        
        if current_location:
            serializer = self.get_serializer(current_location)
            return Response(serializer.data)
        else:
            return Response(
                {'message': 'No current location found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def service_areas(self, request):
        """Get all service areas for delivery agent"""
        service_areas = self.get_queryset().filter(
            location_type='service_area'
        )
        serializer = self.get_serializer(service_areas, many=True)
        return Response(serializer.data)