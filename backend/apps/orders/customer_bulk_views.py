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
from apps.food.ai_service import ai_service

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
        logger.info(f"📥 Bulk order request from user: {request.user.email if request.user.is_authenticated else 'Anonymous'}")
        logger.info(f"📝 Request data: {request.data}")
        
        serializer = CustomerBulkOrderSerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.warning(f"❌ Validation failed: {serializer.errors}")
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
                
                # Create a BulkOrder only (do not create a regular Order for bulk orders).
                # Bulk orders live primarily in the BulkOrder table. Keep the 'order' FK null
                # unless downstream systems explicitly need an Order instance.
                # IMPORTANT: chef field is NOT assigned - it will be assigned later when a chef accepts the order
                bulk_order = BulkOrder.objects.create(
                    # Relationships
                    order=None,  # No regular order for bulk orders
                    created_by=request.user,
                    chef=None,  # IMPORTANT: No chef assigned yet - will be assigned when accepted
                    delivery_partner=None,
                    
                    # Status
                    status='pending',
                    payment_status='pending',
                    
                    # Financial
                    total_amount=validated_data['total_amount'],
                    subtotal=validated_data['total_amount'] - validated_data.get('delivery_fee', 0),
                    delivery_fee=validated_data.get('delivery_fee', 0),
                    
                    # Event Details
                    event_date=validated_data['event_date'],
                    event_time=validated_data['event_time'],
                    num_persons=validated_data['num_persons'],
                    menu_name=bulk_menu.menu_name,
                    
                    # Delivery/Pickup
                    order_type=validated_data.get('order_type', 'delivery'),
                    delivery_address=validated_data.get('delivery_address', ''),
                    delivery_latitude=validated_data.get('delivery_latitude'),
                    delivery_longitude=validated_data.get('delivery_longitude'),
                    distance_km=validated_data.get('distance_km'),
                    
                    # Notes
                    notes=(
                        f"Bulk order for {validated_data['num_persons']} persons. "
                        f"Menu: {bulk_menu.menu_name}."
                    ),
                    customer_notes=validated_data.get('special_instructions', ''),
                    
                    # Timestamps
                    estimated_delivery_time=estimated_delivery,
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
                
                # We don't have order items stored on a regular Order for bulk orders in this flow.
                # Keep a chef_notes-like summary in the BulkOrder.notes for easy reference.
                try:
                    summary = (
                        f"Bulk Menu: {bulk_menu.menu_name}\n"
                        f"Meal Type: {bulk_menu.get_meal_type_display()}\n"
                        f"Persons: {num_persons}\n\nIncluded Items:\n"
                        + "\n".join([f"- {item.item_name}" for item in mandatory_items])
                    )
                    if optional_items:
                        summary += (
                            "\n\nOptional Items:\n"
                            + "\n".join([f"- {item.item_name} (+Rs.{item.extra_cost}/person)" for item in optional_items])
                        )
                    # Append to notes
                    bulk_order.notes = (bulk_order.notes or "") + "\n\n" + summary
                    bulk_order.save()
                except Exception:
                    # non-critical; continue
                    pass
                
                # Return success response
                logger.info(f"✅ Bulk order created successfully: BulkOrder #{bulk_order.bulk_order_id}")
                return Response({
                    'message': 'Bulk order placed successfully',
                    'bulk_order_id': bulk_order.bulk_order_id,
                    'bulk_order_number': f"BULK-{bulk_order.bulk_order_id:06d}",
                    'total_amount': str(bulk_order.total_amount),
                    'event_datetime': event_datetime.isoformat(),
                    'estimated_delivery_time': estimated_delivery.isoformat(),
                }, status=status.HTTP_201_CREATED)
                
        except BulkMenu.DoesNotExist:
            logger.error(f"❌ Bulk menu not found: {validated_data.get('bulk_menu_id')}")
            return Response(
                {'error': 'Bulk menu not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"💥 Error creating bulk order: {str(e)}", exc_info=True)
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
    
    @action(detail=False, methods=['post'], url_path='ai-search')
    def ai_search(self, request):
        """
        AI-powered natural language search for bulk menus
        
        Request body:
        {
            "query": "healthy vegetarian food for corporate event",
            "meal_type": "lunch" (optional)
        }
        """
        query = request.data.get('query', '').strip()
        meal_type_filter = request.data.get('meal_type')
        
        if not query:
            return Response(
                {'error': 'Search query is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"🔍 AI Search query: '{query}' from user: {request.user.email}")
        
        try:
            # Get available bulk menus
            menus_queryset = BulkMenu.objects.filter(
                availability_status=True,
                approval_status='approved'
            ).select_related('chef')
            
            if meal_type_filter:
                menus_queryset = menus_queryset.filter(meal_type=meal_type_filter)
            
            # Convert to list of dicts for AI processing
            menus_data = []
            for menu in menus_queryset:
                menu_items = BulkMenuItem.objects.filter(bulk_menu=menu)
                mandatory_items = [item.item_name for item in menu_items if not item.is_optional]
                optional_items = [item.item_name for item in menu_items if item.is_optional]
                
                menus_data.append({
                    'id': menu.id,
                    'menu_name': menu.menu_name,
                    'description': menu.description or '',
                    'meal_type': menu.meal_type,
                    'meal_type_display': menu.get_meal_type_display(),
                    'chef_name': menu.chef.name if hasattr(menu.chef, 'name') else menu.chef.username,
                    'base_price_per_person': float(menu.base_price_per_person),
                    'min_persons': menu.min_persons,
                    'max_persons': menu.max_persons,
                    'image_url': str(menu.image) if menu.image else None,
                    'menu_items_summary': {
                        'mandatory_items': mandatory_items,
                        'optional_items': optional_items,
                        'total_items': len(mandatory_items) + len(optional_items)
                    }
                })
            
            # Use AI to filter and rank menus
            filtered_menus = ai_service.filter_menus_by_query(query, menus_data)
            
            return Response({
                'query': query,
                'total_results': len(filtered_menus),
                'ai_powered': ai_service.is_available(),
                'menus': filtered_menus
            })
            
        except Exception as e:
            logger.error(f"❌ AI search failed: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Search failed', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], url_path='ai-analyze')
    def ai_analyze_menu(self, request, pk=None):
        """
        Get AI-powered analysis and categorization of a specific bulk menu
        
        URL: /api/orders/customer-bulk-orders/{menu_id}/ai-analyze/
        """
        try:
            menu = BulkMenu.objects.select_related('chef').get(
                id=pk,
                availability_status=True,
                approval_status='approved'
            )
            
            # Get menu items
            menu_items = BulkMenuItem.objects.filter(bulk_menu=menu)
            items_list = [item.item_name for item in menu_items]
            
            menu_data = {
                'menu_name': menu.menu_name,
                'description': menu.description or '',
                'meal_type': menu.get_meal_type_display(),
                'items': items_list
            }
            
            # Get AI analysis
            analysis = ai_service.analyze_menu_categories(menu_data)
            
            return Response({
                'menu_id': menu.id,
                'menu_name': menu.menu_name,
                'analysis': analysis
            })
            
        except BulkMenu.DoesNotExist:
            return Response(
                {'error': 'Bulk menu not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"❌ AI analysis failed: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Analysis failed', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='ai-recommendations')
    def ai_recommendations(self, request):
        """
        Get AI-powered personalized menu recommendations
        
        Query params:
        - dietary_preference: vegetarian, vegan, etc.
        - occasion: corporate_event, wedding, etc.
        - guest_count: number of guests
        """
        try:
            # Extract user preferences from query params
            user_preferences = {
                'dietary_preference': request.query_params.get('dietary_preference'),
                'occasion': request.query_params.get('occasion'),
                'guest_count': request.query_params.get('guest_count'),
                'meal_type': request.query_params.get('meal_type')
            }
            
            # Remove None values
            user_preferences = {k: v for k, v in user_preferences.items() if v is not None}
            
            # Get available menus
            menus_queryset = BulkMenu.objects.filter(
                availability_status=True,
                approval_status='approved'
            ).select_related('chef')
            
            # Convert to list of dicts
            menus_data = []
            for menu in menus_queryset:
                menu_items = BulkMenuItem.objects.filter(bulk_menu=menu)
                mandatory_items = [item.item_name for item in menu_items if not item.is_optional]
                
                menus_data.append({
                    'id': menu.id,
                    'menu_name': menu.menu_name,
                    'description': menu.description or '',
                    'meal_type': menu.meal_type,
                    'chef_name': menu.chef.name if hasattr(menu.chef, 'name') else menu.chef.username,
                    'base_price_per_person': float(menu.base_price_per_person),
                    'items': mandatory_items[:10]  # First 10 items
                })
            
            # Get AI recommendations
            recommendations = ai_service.get_smart_recommendations(user_preferences, menus_data)
            
            return Response({
                'preferences': user_preferences,
                'recommendations': recommendations[:5],  # Top 5
                'ai_powered': ai_service.is_available()
            })
            
        except Exception as e:
            logger.error(f"❌ AI recommendations failed: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Recommendations failed', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

