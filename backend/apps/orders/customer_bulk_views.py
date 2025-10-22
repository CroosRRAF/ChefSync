"""
Customer Bulk Order Views - For customers to place orders from bulk menus
"""
import logging
from decimal import Decimal
from datetime import datetime, timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction

from .models import Order, OrderItem, BulkOrder
from .serializers import CustomerBulkOrderSerializer, BulkOrderDetailSerializer
from apps.food.models import BulkMenu, BulkMenuItem

logger = logging.getLogger(__name__)


class CustomerBulkOrderViewSet(viewsets.ViewSet):
    """
    ViewSet for customers to place bulk orders from available bulk menus
    """
    permission_classes = [IsAuthenticated]

    def create(self, request):
        """
        Place a bulk order from a bulk menu
        
        Expected request data:
        {
            "bulk_menu_id": 1,
            "num_persons": 50,
            "event_date": "2024-12-25",
            "event_time": "18:00",
            "delivery_address": "123 Main St, City, State",
            "special_instructions": "Please arrange tables",
            "selected_optional_items": [1, 2, 3],
            "total_amount": 5000.00
        }
        """
        serializer = CustomerBulkOrderSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        
        try:
            with transaction.atomic():
                # Get the bulk menu and chef
                bulk_menu = BulkMenu.objects.select_related('chef').get(
                    id=validated_data['bulk_menu_id']
                )
                
                # Verify customer is not the chef (sanity check)
                if request.user == bulk_menu.chef:
                    return Response(
                        {'error': 'You cannot order from your own bulk menu'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Calculate estimated delivery time (event time - 2 hours for setup)
                event_datetime = datetime.combine(
                    validated_data['event_date'],
                    validated_data['event_time']
                )
                event_datetime = timezone.make_aware(event_datetime)
                estimated_delivery = event_datetime - timedelta(hours=2)
                
                # Create the main order
                order = Order.objects.create(
                    customer=request.user,
                    chef=bulk_menu.chef,
                    status='pending',
                    payment_status='pending',
                    payment_method='cash',  # Can be updated later
                    delivery_address=validated_data['delivery_address'],
                    customer_notes=validated_data.get('special_instructions', ''),
                    estimated_delivery_time=estimated_delivery,
                    subtotal=validated_data['total_amount'],
                    total_amount=validated_data['total_amount'],
                    # Store event info in admin_notes
                    admin_notes=f"Bulk Order - Event Date: {validated_data['event_date']} {validated_data['event_time']}, Persons: {validated_data['num_persons']}"
                )
                
                # Create BulkOrder record
                bulk_order = BulkOrder.objects.create(
                    order=order,
                    created_by=request.user,
                    status='pending',
                    total_amount=validated_data['total_amount'],
                    notes=f"Bulk order for {validated_data['num_persons']} persons. Menu: {bulk_menu.menu_name}. {validated_data.get('special_instructions', '')}"
                )
                
                # Get all menu items (mandatory + selected optional)
                mandatory_items = BulkMenuItem.objects.filter(
                    bulk_menu=bulk_menu,
                    is_optional=False
                )
                
                optional_items = BulkMenuItem.objects.filter(
                    bulk_menu=bulk_menu,
                    is_optional=True,
                    id__in=validated_data.get('selected_optional_items', [])
                )
                
                # Note: Since BulkMenuItem doesn't link to FoodPrice directly,
                # we'll create a simple representation. In a real system, you might want to
                # create a proper FoodPrice entry or use a different approach.
                
                # For now, we'll create order items with a description-based approach
                # This is a simplified version - you may want to enhance this based on your needs
                
                num_persons = validated_data['num_persons']
                
                # Add base price as an order item (summary item)
                Order.objects.filter(id=order.id).update(
                    chef_notes=f"Bulk Menu: {bulk_menu.menu_name}\n"
                               f"Meal Type: {bulk_menu.get_meal_type_display()}\n"
                               f"Persons: {num_persons}\n"
                               f"\nIncluded Items:\n" + 
                               "\n".join([f"- {item.item_name}" for item in mandatory_items]) +
                               (f"\n\nOptional Items:\n" + 
                                "\n".join([f"- {item.item_name} (+Rs.{item.extra_cost}/person)" 
                                          for item in optional_items]) if optional_items else "")
                )
                
                # Return success response
                return Response({
                    'message': 'Bulk order placed successfully',
                    'order_id': order.id,
                    'order_number': order.order_number,
                    'bulk_order_id': bulk_order.bulk_order_id,
                    'total_amount': str(order.total_amount),
                    'event_datetime': event_datetime.isoformat(),
                    'estimated_delivery_time': estimated_delivery.isoformat(),
                }, status=status.HTTP_201_CREATED)
                
        except BulkMenu.DoesNotExist:
            return Response(
                {'error': 'Bulk menu not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error creating bulk order: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to create bulk order: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def list(self, request):
        """
        Get customer's bulk orders
        """
        bulk_orders = BulkOrder.objects.filter(
            created_by=request.user
        ).select_related('order', 'created_by').order_by('-created_at')
        
        serializer = BulkOrderDetailSerializer(bulk_orders, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """
        Get details of a specific bulk order
        """
        try:
            bulk_order = BulkOrder.objects.select_related(
                'order', 'created_by'
            ).prefetch_related('assignments').get(
                bulk_order_id=pk,
                created_by=request.user
            )
            
            serializer = BulkOrderDetailSerializer(bulk_order)
            return Response(serializer.data)
            
        except BulkOrder.DoesNotExist:
            return Response(
                {'error': 'Bulk order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

