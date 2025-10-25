import logging
import math
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

import pytz

from apps.food.models import FoodPrice, FoodReview

logger = logging.getLogger(__name__)
from apps.payments.models import Payment
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, F, Q, Sum
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    CartItem,
    DeliveryChat,
    DeliveryIssue,
    DeliveryLog,
    DeliveryReview,
    LocationUpdate,
    Order,
    OrderItem,
    OrderStatusHistory,
    UserAddress,
)
from .serializers import (
    CartItemSerializer,
    CustomerSerializer,
    ChefSerializer,
    DeliveryChatSerializer,
    DeliveryReviewSerializer,
    UserAddressSerializer,
)

User = get_user_model()


class UserAddressViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user addresses"""

    serializer_class = UserAddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # If this is the first address or marked as default, set it as default
        user = self.request.user
        if not UserAddress.objects.filter(
            user=user
        ).exists() or serializer.validated_data.get("is_default", False):
            # Remove default flag from other addresses
            UserAddress.objects.filter(user=user, is_default=True).update(
                is_default=False
            )
            serializer.save(user=user, is_default=True)
        else:
            serializer.save(user=user)

    @action(detail=True, methods=["post"])
    def set_default(self, request, pk=None):
        """Set an address as the default address"""
        address = self.get_object()
        # Remove default flag from other addresses
        UserAddress.objects.filter(user=request.user, is_default=True).update(
            is_default=False
        )
        address.is_default = True
        address.save()
        return Response({"message": "Address set as default"})


# Helper to resolve and (optionally) persist a chef's location
def _resolve_chef_location(chef, request_data):
    """Return (lat, lng) for the given chef and persist if provided in request.
    Resolution order:
    1) Use chef_latitude/chef_longitude from request if provided (and persist if missing in profile)
    2) Chef profile: authentication.Cook.kitchen_location formatted as "lat,lng"
    3) Chef's saved UserAddress (default or most recent) with lat/lng

    If coordinates are provided in request and the chef has no persisted kitchen_location,
    we will persist them to chef.cook.kitchen_location and ensure a 'Kitchen' UserAddress exists.
    """
    chef_lat = request_data.get("chef_latitude")
    chef_lng = request_data.get("chef_longitude")

    # Normalize to floats if present
    def _to_float(v):
        try:
            return float(v) if v is not None and v != "" else None
        except (TypeError, ValueError):
            return None

    lat = _to_float(chef_lat)
    lng = _to_float(chef_lng)

    # 1) If request provided coords, use them first
    if lat is not None and lng is not None:
        # Persist if profile missing or empty
        if hasattr(chef, "cook"):
            cook_profile = chef.cook
            if not getattr(cook_profile, "kitchen_location", None):
                cook_profile.kitchen_location = f"{lat},{lng}"
                cook_profile.save(update_fields=["kitchen_location"])

        # Ensure a 'Kitchen' address exists/updated for chef (best effort; use placeholders where needed)
        try:
            kitchen_address, created = UserAddress.objects.get_or_create(
                user=chef,
                label="Kitchen",
                defaults={
                    "address_line1": request_data.get("chef_address") or "Chef Kitchen",
                    "city": request_data.get("chef_city") or "Unknown",
                    "pincode": request_data.get("chef_pincode") or "000000",
                    "latitude": lat,
                    "longitude": lng,
                    "is_default": False,
                },
            )
            # Update coordinates if already existed but empty or different
            updated = False
            if kitchen_address.latitude != (
                Decimal(str(lat)) if lat is not None else None
            ):
                kitchen_address.latitude = Decimal(str(lat))
                updated = True
            if kitchen_address.longitude != (
                Decimal(str(lng)) if lng is not None else None
            ):
                kitchen_address.longitude = Decimal(str(lng))
                updated = True
            if (
                request_data.get("chef_address")
                and kitchen_address.address_line1 != request_data["chef_address"]
            ):
                kitchen_address.address_line1 = request_data["chef_address"]
                updated = True
            if updated:
                kitchen_address.save()
        except Exception:
            # Do not block checkout/order if saving address fails
            pass

        return lat, lng

    # 2) Try persisted cook profile location
    if hasattr(chef, "cook"):
        cook_profile = chef.cook
        location = getattr(cook_profile, "kitchen_location", None)
        if isinstance(location, str) and "," in location:
            try:
                lat_str, lng_str = location.split(",")
                lat, lng = _to_float(lat_str), _to_float(lng_str)
                if lat is not None and lng is not None:
                    return lat, lng
            except Exception:
                pass

    # 3) Try chef's saved address with coordinates
    kitchen_addr = (
        UserAddress.objects.filter(
            user=chef, latitude__isnull=False, longitude__isnull=False
        )
        .order_by("-is_default", "-created_at")
        .first()
    )
    if (
        kitchen_addr
        and kitchen_addr.latitude is not None
        and kitchen_addr.longitude is not None
    ):
        try:
            return float(kitchen_addr.latitude), float(kitchen_addr.longitude)
        except Exception:
            pass

    # Not available
    return None, None


def _get_chef_address(chef):
    """Get the chef's kitchen address as a formatted string"""
    # Try to get Kitchen address first
    kitchen_addr = UserAddress.objects.filter(user=chef, label="Kitchen").first()

    if kitchen_addr:
        # Format the full address
        parts = []
        if kitchen_addr.address_line1:
            parts.append(kitchen_addr.address_line1)
        if kitchen_addr.address_line2:
            parts.append(kitchen_addr.address_line2)
        if kitchen_addr.city:
            parts.append(kitchen_addr.city)
        if kitchen_addr.pincode and kitchen_addr.pincode != "000000":
            parts.append(kitchen_addr.pincode)

        if parts:
            return ", ".join(parts)

    # Try any address with coordinates
    any_addr = (
        UserAddress.objects.filter(
            user=chef, latitude__isnull=False, longitude__isnull=False
        )
        .order_by("-is_default", "-created_at")
        .first()
    )

    if any_addr:
        parts = []
        if any_addr.address_line1:
            parts.append(any_addr.address_line1)
        if any_addr.city:
            parts.append(any_addr.city)
        if parts:
            return ", ".join(parts)

    # Fallback to chef name
    chef_name = chef.get_full_name() or chef.name or chef.username
    return f"{chef_name}'s Kitchen"


# Temporary simple serializer to fix the 500 error
class SimpleOrderSerializer(serializers.ModelSerializer):
    """Simple order serializer that works"""
    
    customer = CustomerSerializer(read_only=True)
    chef = ChefSerializer(read_only=True)
    customer_name = serializers.SerializerMethodField()
    chef_name = serializers.SerializerMethodField()
    time_since_order = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    total_items = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "status_display",
            "total_amount",
            "delivery_fee",
            "created_at",
            "updated_at",
            "customer",
            "chef",
            "customer_name",
            "chef_name",
            "time_since_order",
            "total_items",
            "delivery_address",
            "customer_notes",
            "chef_notes",
            "items",
        ]

    def get_customer_name(self, obj):
        if obj.customer:
            return (
                obj.customer.get_full_name()
                or obj.customer.name
                or obj.customer.username
            )
        return "Unknown Customer"

    def get_chef_name(self, obj):
        if obj.chef:
            return obj.chef.get_full_name() or obj.chef.name or obj.chef.username
        return "Unknown Chef"

    def get_time_since_order(self, obj):
        from django.utils import timezone

        diff = timezone.now() - obj.created_at
        minutes = int(diff.total_seconds() / 60)
        if minutes < 60:
            return f"{minutes} minutes ago"
        elif minutes < 1440:
            hours = int(minutes / 60)
            return f"{hours} hours ago"
        else:
            days = int(minutes / 1440)
            return f"{days} days ago"

    def get_total_items(self, obj):
        return obj.items.aggregate(total=Sum("quantity"))["total"] or 0

    def get_items(self, obj):
        items = []
        try:
            for order_item in obj.items.select_related(
                "price__food", "price__cook"
            ).all():
                try:
                    # Get food name with proper fallbacks
                    food_name = order_item.food_name
                    if not food_name and order_item.price and order_item.price.food:
                        food_name = order_item.price.food.name
                    if not food_name:
                        food_name = "Unknown Food"

                    # Get food description with proper fallbacks
                    food_description = order_item.food_description or ""
                    if (
                        not food_description
                        and order_item.price
                        and order_item.price.food
                    ):
                        food_description = (
                            getattr(order_item.price.food, "description", "") or ""
                        )

                    # Get food image with proper fallbacks
                    food_image = None
                    try:
                        if order_item.price:
                            if (
                                hasattr(order_item.price, "image_url")
                                and order_item.price.image_url
                            ):
                                food_image = str(order_item.price.image_url)
                            elif order_item.price.food:
                                if (
                                    hasattr(order_item.price.food, "image_url")
                                    and order_item.price.food.image_url
                                ):
                                    food_image = str(order_item.price.food.image_url)
                                elif (
                                    hasattr(order_item.price.food, "image")
                                    and order_item.price.food.image
                                ):
                                    food_image = (
                                        str(order_item.price.food.image.url)
                                        if order_item.price.food.image
                                        else None
                                    )
                    except Exception:
                        food_image = None

                    # Get cook name with proper fallbacks
                    cook_name = "Unknown Cook"
                    try:
                        if order_item.price and order_item.price.cook:
                            cook = order_item.price.cook
                            cook_name = (
                                getattr(cook, "name", None)
                                or cook.get_full_name()
                                or cook.username
                            )
                    except Exception:
                        cook_name = "Unknown Cook"

                    # Get size with fallback
                    size = "Medium"
                    try:
                        if order_item.price and hasattr(order_item.price, "size"):
                            size = order_item.price.size
                    except Exception:
                        pass

                    items.append(
                        {
                            "id": order_item.order_item_id,
                            "quantity": int(order_item.quantity or 0),
                            "unit_price": float(order_item.unit_price or 0),
                            "total_price": float(order_item.total_price or 0),
                            "special_instructions": str(
                                order_item.special_instructions or ""
                            ),
                            "food_name": food_name,
                            "food_description": food_description,
                            "food_image": food_image,
                            "size": size,
                            "cook_name": cook_name,
                        }
                    )
                except Exception as item_error:
                    # Log the error but continue processing other items
                    import logging

                    logger = logging.getLogger(__name__)
                    logger.error(
                        f"Error processing order item {order_item.order_item_id}: {str(item_error)}"
                    )
                    continue
        except Exception as e:
            # Log the error and return empty list
            import logging

            logger = logging.getLogger(__name__)
            logger.error(f"Error getting items for order {obj.id}: {str(e)}")

        return items


class OrderViewSet(viewsets.ModelViewSet):
    queryset = (
        Order.objects.select_related("customer", "chef", "delivery_partner")
        .prefetch_related("items__price__food", "items__price__cook")
        .all()
    )
    serializer_class = SimpleOrderSerializer  # Use our working simple serializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter orders based on user role"""
        user = self.request.user
        queryset = (
            super()
            .get_queryset()
            .select_related("customer", "chef", "delivery_partner")
            .prefetch_related("items__price__food", "items__price__cook")
            .order_by("-created_at")
        )

        # Handle anonymous users (return empty queryset for security)
        if not user.is_authenticated:
            return queryset.none()

        # For chefs, only show their own orders
        if (
            hasattr(user, "chef_profile")
            or user.groups.filter(name="Chefs").exists()
            or (hasattr(user, "role") and user.role == "cook")
        ):
            return queryset.filter(chef=user)
        # For delivery partners, show available and assigned orders
        elif (
            hasattr(user, "delivery_profile")
            or user.groups.filter(name="Delivery").exists()
            or (hasattr(user, "role") and user.role == "delivery_agent")
        ):
            return queryset.filter(
                Q(delivery_partner=user)
                | Q(status__in=["confirmed", "preparing", "ready"], delivery_partner__isnull=True)
            )
        # For admins, show all orders
        elif (
            user.is_staff
            or user.is_superuser
            or (hasattr(user, "role") and user.role == "admin")
        ):
            return queryset
        # For customers, show their own orders
        else:
            return queryset.filter(customer=user)

    @action(detail=False, methods=["get"])
    def available(self, request):
        available_orders = Order.objects.filter(
            status="ready", delivery_partner__isnull=True
        ).order_by("-created_at")
        serializer = self.get_serializer(available_orders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        order = self.get_object()
        if order.delivery_partner is not None:
            return Response(
                {"error": "Order already taken"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get delivery agent's current location for distance checking
        agent_lat = request.data.get("agent_latitude")
        agent_lng = request.data.get("agent_longitude")

        if agent_lat is None or agent_lng is None or agent_lat == "" or agent_lng == "":
            return Response(
                {
                    "error": "Location required",
                    "message": "Please enable location access to accept orders",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate that coordinates are valid numbers
        try:
            agent_lat = float(agent_lat)
            agent_lng = float(agent_lng)

            # Basic sanity check for coordinates
            if not (-90 <= agent_lat <= 90) or not (-180 <= agent_lng <= 180):
                raise ValueError("Invalid coordinates")

        except (ValueError, TypeError):
            return Response(
                {
                    "error": "Invalid location data",
                    "message": "The location coordinates are invalid. Please try again.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get chef location (pickup location) - we'll need to get this from chef's profile
        # For now, let's assume the chef location is passed or we get a default
        chef_lat = request.data.get("chef_latitude")
        chef_lng = request.data.get("chef_longitude")

        # If chef location is provided, calculate distance
        if chef_lat is not None and chef_lng is not None:
            from math import atan2, cos, radians, sin, sqrt

            # Calculate distance using Haversine formula
            def calculate_distance(lat1, lon1, lat2, lon2):
                R = 6371  # Earth's radius in kilometers

                lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
                dlat = lat2 - lat1
                dlon = lon2 - lon1

                a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
                c = 2 * atan2(sqrt(a), sqrt(1 - a))
                distance = R * c

                return distance

            distance_km = calculate_distance(
                agent_lat, agent_lng, float(chef_lat), float(chef_lng)
            )
            # Validate distance to avoid DB out-of-range and unrealistic deliveries
            MAX_DELIVERY_KM = 50.0  # business rule: serviceable radius
            if math.isnan(distance_km) or distance_km <= 0:
                return Response(
                    {"error": "Invalid distance calculation. Please verify addresses."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if distance_km > MAX_DELIVERY_KM:
                return Response(
                    {
                        "error": f"Delivery distance {round(distance_km, 2)} km is out of service range (max {int(MAX_DELIVERY_KM)} km)."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Check if distance is greater than 10km
            if distance_km > 10:
                return Response(
                    {
                        "warning": "Distance exceeds 10km",
                        "distance": round(distance_km, 2),
                        "message": f"Pickup location is {round(distance_km, 2)}km away. This is beyond the recommended 10km range.",
                        "allow_accept": True,  # Still allow acceptance but with warning
                    },
                    status=status.HTTP_200_OK,
                )

        order.delivery_partner = request.user
        order.status = "out_for_delivery"
        order.save()

        # Add status history
        OrderStatusHistory.objects.create(
            order=order,
            status="out_for_delivery",
            changed_by=request.user,
            notes="Order accepted by delivery agent",
        )

        return Response(
            {
                "success": "Order accepted successfully",
                "order_id": order.id,
                "status": "out_for_delivery",
            }
        )

    @action(detail=True, methods=["post"])
    def chef_accept(self, request, pk=None):
        """Chef accepts a pending order"""
        order = self.get_object()

        # Check if user is the chef for this order
        if order.chef != request.user:
            return Response(
                {"error": "You are not authorized to accept this order"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if order.status != "pending":
            return Response(
                {"error": "Order cannot be accepted in current status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update order status to confirmed
        order.status = "confirmed"
        order.chef_notes = request.data.get("notes", "Order accepted by chef")
        order.save()

        # Add status history
        OrderStatusHistory.objects.create(
            order=order,
            status="confirmed",
            changed_by=request.user,
            notes=order.chef_notes,
        )

        # Send notification to customer
        try:
            from apps.communications.services.order_notification_service import (
                OrderNotificationService,
            )

            OrderNotificationService.notify_order_confirmed(order)
        except Exception as e:
            import logging

            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send order confirmation notification: {str(e)}")

        return Response(
            {"success": "Order accepted successfully", "status": "confirmed"}
        )

    @action(detail=True, methods=["post"])
    def chef_reject(self, request, pk=None):
        """Chef rejects a pending order with reason"""
        order = self.get_object()

        # Check if user is the chef for this order
        if order.chef != request.user:
            return Response(
                {"error": "You are not authorized to reject this order"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if order.status != "pending":
            return Response(
                {"error": "Order cannot be rejected in current status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rejection_reason = request.data.get("reason", "")
        if not rejection_reason:
            return Response(
                {"error": "Rejection reason is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update order status to cancelled
        order.status = "cancelled"
        order.chef_notes = f"Order rejected: {rejection_reason}"
        order.save()

        # Add status history
        OrderStatusHistory.objects.create(
            order=order,
            status="cancelled",
            changed_by=request.user,
            notes=order.chef_notes,
        )

        # Send notification to customer
        try:
            from apps.communications.services.order_notification_service import (
                OrderNotificationService,
            )

            OrderNotificationService.notify_order_rejected(
                order, reason=rejection_reason
            )
        except Exception as e:
            import logging

            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send order rejection notification: {str(e)}")

        return Response(
            {"success": "Order rejected successfully", "status": "cancelled"}
        )

    @action(detail=True, methods=["post"])
    def cancel_order(self, request, pk=None):
        """Cancel an order within 10 minutes of placement"""
        order = self.get_object()

        # Check if user is authorized to cancel this order
        if order.customer != request.user:
            return Response(
                {"error": "You are not authorized to cancel this order"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if order can be cancelled
        if order.status not in ["pending", "confirmed"]:
            return Response(
                {"error": "Order cannot be cancelled in current status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if order is within 10-minute cancellation window
        from datetime import timedelta

        from django.utils import timezone

        time_since_order = timezone.now() - order.created_at
        if time_since_order > timedelta(minutes=10):
            return Response(
                {
                    "error": "Order can only be cancelled within 10 minutes of placement",
                    "time_remaining": "0 minutes",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate remaining time for cancellation
        remaining_time = timedelta(minutes=10) - time_since_order
        remaining_minutes = int(remaining_time.total_seconds() // 60)

        cancellation_reason = request.data.get(
            "reason", "Customer requested cancellation"
        )

        # Update order status
        order.status = "cancelled"
        order.cancelled_at = timezone.now()
        order.customer_notes = (
            f"{order.customer_notes}\n\nCancelled: {cancellation_reason}".strip()
        )
        order.save()

        # Add status history
        OrderStatusHistory.objects.create(
            order=order,
            status="cancelled",
            changed_by=request.user,
            notes=f"Order cancelled by customer: {cancellation_reason}",
        )

        return Response(
            {
                "success": "Order cancelled successfully",
                "status": "cancelled",
                "refund_status": "pending",
                "message": "Your refund will be processed within 3-5 business days",
            }
        )

    @action(detail=True, methods=["get"])
    def can_cancel(self, request, pk=None):
        """Check if an order can be cancelled and return remaining time"""
        order = self.get_object()

        # Check if user is authorized
        if order.customer != request.user:
            return Response(
                {"error": "You are not authorized to view this order"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if order can be cancelled based on status
        if order.status not in ["pending", "confirmed"]:
            return Response(
                {
                    "can_cancel": False,
                    "reason": "Order cannot be cancelled in current status",
                    "time_remaining": "0 minutes",
                }
            )

        # Check time window
        from datetime import timedelta

        from django.utils import timezone

        time_since_order = timezone.now() - order.created_at
        if time_since_order > timedelta(minutes=10):
            return Response(
                {
                    "can_cancel": False,
                    "reason": "Cancellation window has expired",
                    "time_remaining": "0 minutes",
                }
            )

        # Calculate remaining time
        remaining_time = timedelta(minutes=10) - time_since_order
        remaining_minutes = int(remaining_time.total_seconds() // 60)
        remaining_seconds = int(remaining_time.total_seconds() % 60)

        return Response(
            {
                "can_cancel": True,
                "time_remaining": f"{remaining_minutes} minutes {remaining_seconds} seconds",
                "time_remaining_seconds": int(remaining_time.total_seconds()),
            }
        )

    @action(detail=True, methods=["patch"])
    def status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get("status")

        # Define valid status transitions for delivery agents
        valid_delivery_statuses = ["picked_up", "in_transit", "delivered"]

        if new_status not in valid_delivery_statuses:
            return Response(
                {
                    "error": f"Invalid status '{new_status}'. Valid statuses: {valid_delivery_statuses}"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user is authorized to update this order
        if order.delivery_partner != request.user:
            return Response(
                {"error": "You are not authorized to update this order"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Validate status transitions
        current_status = order.status
        if new_status == "picked_up" and current_status not in [
            "out_for_delivery",
            "ready",
        ]:
            return Response(
                {"error": f"Cannot mark picked_up from {current_status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        elif new_status == "in_transit" and current_status not in [
            "picked_up",
            "out_for_delivery",
            "ready",
        ]:
            return Response(
                {"error": f"Cannot mark in_transit from {current_status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        elif new_status == "delivered" and current_status not in [
            "picked_up",
            "in_transit",
            "out_for_delivery",
            "ready",
        ]:
            return Response(
                {"error": f"Cannot mark delivered from {current_status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get additional data
        notes = request.data.get("notes", f"Status changed to {new_status}")
        location = request.data.get("location", {})

        order.status = new_status
        if new_status == "delivered":
            order.actual_delivery_time = timezone.now()
        order.save()

        OrderStatusHistory.objects.create(
            order=order, status=new_status, changed_by=request.user, notes=notes
        )

        return Response(
            {
                "success": f"Order status updated to {new_status}",
                "order_id": order.id,
                "status": new_status,
            }
        )

    @action(detail=True, methods=["patch"])
    def chef_update_status(self, request, pk=None):
        """Chef updates order status through the kitchen workflow"""
        order = self.get_object()

        # Check if user is the chef for this order
        if order.chef != request.user:
            return Response(
                {"error": "You are not authorized to update this order"},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_status = request.data.get("status")
        chef_notes = request.data.get("notes", "")

        # Define valid status transitions for chef workflow
        valid_transitions = {
            "confirmed": "preparing",
            "preparing": "ready",
            "ready": "out_for_delivery",
        }

        if order.status not in valid_transitions:
            return Response(
                {"error": "Order status cannot be updated from current state"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expected_status = valid_transitions.get(order.status)
        if new_status != expected_status:
            return Response(
                {"error": f"Invalid status transition. Expected: {expected_status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update order
        order.status = new_status
        if chef_notes:
            order.chef_notes = chef_notes
        order.save()

        # Add status history
        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            changed_by=request.user,
            notes=chef_notes or f"Status updated to {new_status}",
        )

        return Response(
            {"success": f"Order status updated to {new_status}", "status": new_status}
        )

    @action(detail=False, methods=["get"])
    def history(self, request):
        completed_orders = Order.objects.filter(
            delivery_partner=request.user, status="delivered"
        ).order_by("-updated_at")
        serializer = self.get_serializer(completed_orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def dashboard_summary(self, request):
        today = timezone.now().date()

        # Get delivery partner's orders
        delivery_orders = Order.objects.filter(delivery_partner=request.user)

        active_deliveries = delivery_orders.exclude(
            status__in=["delivered", "cancelled"]
        ).count()
        completed_today = delivery_orders.filter(
            status="delivered", updated_at__date=today
        ).count()
        todays_earnings = (
            delivery_orders.filter(
                status="delivered", updated_at__date=today
            ).aggregate(total=Sum("delivery_fee"))["total"]
            or 0
        )

        # Calculate average delivery time
        completed_orders = delivery_orders.filter(status="delivered").exclude(
            actual_delivery_time__isnull=True
        )

        avg_time_minutes = 0
        if completed_orders.exists():
            total_seconds = sum(
                [
                    (order.actual_delivery_time - order.created_at).total_seconds()
                    for order in completed_orders
                    if order.actual_delivery_time
                ]
            )
            avg_time_minutes = total_seconds / 60 / completed_orders.count()

        return Response(
            {
                "active_deliveries": active_deliveries,
                "completed_today": completed_today,
                "todays_earnings": float(todays_earnings),
                "avg_delivery_time_min": round(avg_time_minutes, 1),
            }
        )

    @action(detail=True, methods=["post"])
    def mark_picked_up(self, request, pk=None):
        """Delivery agent marks order as picked up from chef"""
        order = self.get_object()

        # Check if user is the assigned delivery partner
        if order.delivery_partner != request.user:
            return Response(
                {"error": "You are not authorized to update this order"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if order is in correct status
        if order.status not in ["out_for_delivery", "ready"]:
            return Response(
                {"error": "Order cannot be marked as picked up in current status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notes = request.data.get("notes", "Order picked up from chef")

        # Transition: ready/out_for_delivery -> picked_up
        order.status = "picked_up"
        order.save(update_fields=["status", "updated_at"])
        OrderStatusHistory.objects.create(
            order=order, status="picked_up", changed_by=request.user, notes=notes
        )

        return Response(
            {
                "success": "Order marked as picked up successfully",
                "order_id": order.id,
                "status": "picked_up",
            }
        )

    @action(detail=True, methods=["get"])
    def chef_location(self, request, pk=None):
        """Get chef location details for navigation (delivery agent only)"""
        order = self.get_object()

        # Check if user is the assigned delivery partner
        if order.delivery_partner != request.user:
            return Response(
                {"error": "You are not authorized to access this information"},
                status=status.HTTP_403_FORBIDDEN,
            )

        chef = order.chef
        if not chef:
            return Response(
                {"error": "No chef assigned to this order"},
                status=status.HTTP_404_NOT_FOUND,
            )

        chef_location = {}
        if getattr(chef, "address", None):
            chef_location["address"] = chef.address
        if hasattr(chef, "chef_profile"):
            profile = chef.chef_profile
            if getattr(profile, "service_location", None):
                chef_location["service_location"] = profile.service_location

        chef_info = {
            "id": chef.id,
            "name": chef.get_full_name() or chef.name or chef.username,
            "phone": getattr(chef, "phone_no", None),
            "email": chef.email,
            "location": chef_location,
        }

        return Response(
            {
                "chef": chef_info,
                "order_id": order.id,
                "pickup_address": chef_location.get("address")
                or chef_location.get("service_location", "Address not available"),
            }
        )

    @action(detail=True, methods=["get"])
    def tracking(self, request, pk=None):
        """Get comprehensive real-time tracking information for an order"""
        order = self.get_object()

        # Check authorization: customer, chef, delivery partner, or admin
        if not (
            order.customer == request.user
            or order.chef == request.user
            or order.delivery_partner == request.user
            or request.user.is_staff
        ):
            return Response(
                {"error": "You are not authorized to track this order"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Get order with related data (skip location_updates if table doesn't exist)
        try:
            order = (
                Order.objects.select_related("customer", "chef", "delivery_partner")
                .prefetch_related(
                    "status_history", "items__price__food", "location_updates"
                )
                .get(pk=pk)
            )
        except Exception as e:
            # Fallback without location_updates if table doesn't exist
            order = (
                Order.objects.select_related("customer", "chef", "delivery_partner")
                .prefetch_related("status_history", "items__price__food")
                .get(pk=pk)
            )

        # Build timeline from status_timestamps
        timeline = []
        status_order = [
            "cart",
            "pending",
            "confirmed",
            "preparing",
            "ready",
            "out_for_delivery",
            "delivered",
            "cancelled",
        ]

        # Handle case where status_timestamps might not exist or be None
        status_timestamps = order.status_timestamps if order.status_timestamps else {}

        for status_key in status_order:
            status_display = dict(Order.ORDER_STATUS_CHOICES).get(
                status_key, status_key
            )
            timestamp = status_timestamps.get(status_key)

            timeline.append(
                {
                    "status": status_key,
                    "status_display": status_display,
                    "timestamp": timestamp,
                    "completed": timestamp is not None,
                    "current": order.status == status_key,
                }
            )

        # Get chef location for map
        chef_location = None
        if order.chef:
            chef_lat, chef_lng = _resolve_chef_location(order.chef, {})
            if chef_lat and chef_lng:
                chef_address = _get_chef_address(order.chef)
                chef_location = {
                    "latitude": chef_lat,
                    "longitude": chef_lng,
                    "address": chef_address,
                }

        # Get delivery location
        delivery_location = None
        if order.delivery_latitude and order.delivery_longitude:
            delivery_location = {
                "latitude": float(order.delivery_latitude),
                "longitude": float(order.delivery_longitude),
                "address": order.delivery_address,
            }

        # Get latest delivery agent location (if table exists)
        agent_location = None
        if order.delivery_partner:
            try:
                latest_location = LocationUpdate.objects.filter(
                    delivery_agent=order.delivery_partner, order=order
                ).first()

                if latest_location:
                    agent_location = {
                        "latitude": float(latest_location.latitude),
                        "longitude": float(latest_location.longitude),
                        "timestamp": latest_location.timestamp.isoformat(),
                        "address": latest_location.address,
                    }
            except Exception:
                # LocationUpdate table doesn't exist yet
                pass

        # Get order items summary
        items_summary = []
        for item in order.items.all():
            items_summary.append(
                {
                    "id": item.order_item_id,
                    "food_name": item.food_name,
                    "quantity": item.quantity,
                    "price": float(item.unit_price) if item.unit_price else 0,
                }
            )

        # Calculate ETA if out for delivery
        estimated_time_remaining = None
        if order.status == "out_for_delivery" and order.estimated_delivery_time:
            time_remaining = order.estimated_delivery_time - timezone.now()
            estimated_time_remaining = max(0, int(time_remaining.total_seconds() / 60))

        # Build response
        tracking_data = {
            "id": order.id,
            "order_number": order.order_number,
            "status": order.status,
            "status_display": order.get_status_display(),
            "order_type": getattr(
                order, "order_type", "delivery"
            ),  # 'delivery' or 'pickup'
            "created_at": order.created_at.isoformat(),
            "updated_at": order.updated_at.isoformat(),
            # Timeline
            "timeline": timeline,
            "status_timestamps": status_timestamps,
            # Locations
            "chef_location": chef_location,
            "delivery_location": delivery_location,
            "agent_location": agent_location,
            "distance_km": float(order.distance_km) if order.distance_km else None,
            # Order details
            "total_amount": float(order.total_amount),
            "delivery_fee": float(order.delivery_fee) if order.delivery_fee else 0,
            "items": items_summary,
            "total_items": sum(item["quantity"] for item in items_summary),
            # Time estimates
            "estimated_delivery_time": (
                order.estimated_delivery_time.isoformat()
                if order.estimated_delivery_time
                else None
            ),
            "estimated_time_remaining_minutes": estimated_time_remaining,
            "actual_delivery_time": (
                order.actual_delivery_time.isoformat()
                if order.actual_delivery_time
                else None
            ),
            # People
            "customer": (
                {
                    "name": order.customer.name or order.customer.username,
                    "phone": getattr(order.customer, "phone_no", None),
                }
                if order.customer
                else None
            ),
            "chef": (
                {
                    "name": order.chef.name or order.chef.username,
                    "phone": getattr(order.chef, "phone_no", None),
                    "specialty": (
                        getattr(order.chef, "specialty", None)
                        if hasattr(order.chef, "cook")
                        else None
                    ),
                }
                if order.chef
                else None
            ),
            "delivery_partner": (
                {
                    "name": order.delivery_partner.name
                    or order.delivery_partner.username,
                    "phone": getattr(order.delivery_partner, "phone_no", None),
                }
                if order.delivery_partner
                else None
            ),
            # Cancellation info
            "can_cancel": order.can_be_cancelled,
            "cancellation_time_remaining_seconds": order.cancellation_time_remaining,
        }

        return Response(tracking_data)

    @action(detail=True, methods=["get"], url_path="chat/messages")
    def get_chat_messages(self, request, pk=None):
        """Get all chat messages for an order between customer and delivery agent"""
        order = self.get_object()

        # Check authorization: customer or delivery partner
        if not (
            order.customer == request.user or order.delivery_partner == request.user
        ):
            return Response(
                {"error": "You are not authorized to view these messages"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Get all messages for this order
        messages = DeliveryChat.objects.filter(order=order).order_by("created_at")

        # Mark messages as read if user is the receiver
        messages.filter(receiver=request.user, is_read=False).update(is_read=True)

        serializer = DeliveryChatSerializer(
            messages, many=True, context={"request": request}
        )

        return Response(
            {
                "order_number": order.order_number,
                "messages": serializer.data,
                "unread_count": messages.filter(
                    receiver=request.user, is_read=False
                ).count(),
            }
        )

    @action(detail=True, methods=["post"], url_path="chat/send")
    def send_chat_message(self, request, pk=None):
        """Send a chat message to delivery agent or customer"""
        order = self.get_object()

        # Check authorization: customer or delivery partner
        if not (
            order.customer == request.user or order.delivery_partner == request.user
        ):
            return Response(
                {"error": "You are not authorized to send messages for this order"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if delivery partner is assigned
        if not order.delivery_partner:
            return Response(
                {"error": "No delivery partner assigned yet"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message_text = request.data.get("message", "").strip()
        message_type = request.data.get("message_type", "text")

        if not message_text:
            return Response(
                {"error": "Message cannot be empty"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Determine receiver (if sender is customer, receiver is delivery partner and vice versa)
        sender = request.user
        receiver = (
            order.delivery_partner if sender == order.customer else order.customer
        )

        # Create message
        chat_message = DeliveryChat.objects.create(
            order=order,
            sender=sender,
            receiver=receiver,
            message=message_text,
            message_type=message_type,
        )

        serializer = DeliveryChatSerializer(chat_message, context={"request": request})

        return Response(
            {"success": True, "message": serializer.data},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], url_path="chat/quick-messages")
    def get_quick_messages(self, request, pk=None):
        """Get suggested quick messages based on order status"""
        order = self.get_object()

        # Check authorization
        if not (
            order.customer == request.user or order.delivery_partner == request.user
        ):
            return Response(
                {"error": "You are not authorized"}, status=status.HTTP_403_FORBIDDEN
            )

        # Quick messages for customers
        customer_messages = [
            "Where are you right now?",
            "How long will it take?",
            "Can you call me when you arrive?",
            "I'm waiting outside",
            "Please ring the doorbell",
            "Leave it at the door, thanks!",
        ]

        # Quick messages for delivery agents
        delivery_agent_messages = [
            "I'm on my way!",
            "Arriving in 5 minutes",
            "I'm at your location",
            "Please come down, I'm outside",
            "Order delivered successfully!",
            "Having trouble finding your address",
        ]

        # Determine which messages to show
        if request.user == order.customer:
            quick_messages = customer_messages
        else:
            quick_messages = delivery_agent_messages

        return Response({"quick_messages": quick_messages})

    @action(detail=False, methods=["get"], url_path="delivery/available")
    def available_for_delivery(self, request):
        """Get orders available for delivery agents to accept"""
        # Orders that are confirmed, preparing, or ready and don't have a delivery partner yet
        available_orders = (
            Order.objects.filter(
                Q(status__in=["confirmed", "preparing", "ready"])
                & Q(delivery_partner__isnull=True)
            )
            .select_related("customer", "chef")
            .prefetch_related("items__price__food")
            .order_by("-created_at")
        )

        serializer = self.get_serializer(available_orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="delivery/assigned")
    def my_assigned_deliveries(self, request):
        """Get orders assigned to the current delivery agent"""
        # Orders assigned to this delivery agent
        assigned_orders = (
            Order.objects.filter(
                delivery_partner=request.user,
                status__in=["ready", "out_for_delivery", "in_transit"],
            )
            .select_related("customer", "chef")
            .prefetch_related("items__price__food")
            .order_by("-created_at")
        )

        serializer = self.get_serializer(assigned_orders, many=True)
        return Response(serializer.data)


# Temporarily disabled other ViewSets to fix 500 error
# Will be re-enabled once serializers are fixed

# class OrderItemViewSet(viewsets.ModelViewSet):
#     queryset = OrderItem.objects.all()
#     serializer_class = OrderItemSerializer
#     permission_classes = [IsAuthenticated]


# class OrderStatusHistoryViewSet(viewsets.ModelViewSet):
#     queryset = OrderStatusHistory.objects.all()
#     serializer_class = OrderStatusHistorySerializer
#     permission_classes = [IsAuthenticated]


class CartItemViewSet(viewsets.ModelViewSet):
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter cart items to only show the current user's items"""
        return CartItem.objects.filter(customer=self.request.user)

    @action(detail=False, methods=["post"])
    def add_to_cart(self, request):
        """Add an item to the cart or update quantity if it already exists"""
        try:
            price_id = request.data.get("price_id")
            quantity = request.data.get("quantity", 1)
            special_instructions = request.data.get("special_instructions", "")

            if not price_id:
                return Response(
                    {"error": "price_id is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if item already exists in cart
            cart_item, created = CartItem.objects.get_or_create(
                customer=request.user,
                price_id=price_id,  # Django will automatically map this to the FoodPrice primary key
                defaults={
                    "quantity": quantity,
                    "special_instructions": special_instructions,
                },
            )

            if not created:
                # Item exists, update quantity
                cart_item.quantity += quantity
                cart_item.save()

            serializer = self.get_serializer(cart_item)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=["get"])
    def cart_summary(self, request):
        """Get cart summary with total price and items"""
        try:
            cart_items = self.get_queryset()
            total_price = sum(item.total_price for item in cart_items)
            total_items = sum(item.quantity for item in cart_items)

            serializer = self.get_serializer(cart_items, many=True)

            return Response(
                {
                    "total_value": total_price,  # Changed from total_price to total_value
                    "total_items": total_items,
                    "cart_items": serializer.data,
                }
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=["delete"])
    def clear_cart(self, request):
        """Clear all items from the cart"""
        try:
            deleted_count = self.get_queryset().delete()[0]
            return Response({"message": f"Removed {deleted_count} items from cart"})
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Chef Dashboard API Views
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def chef_dashboard_stats(request):
    """
    API endpoint that returns counts of completed orders, active orders, bulk orders, and reviews from the database
    Used to replace hardcoded stats in the React TypeScript Home component
    """
    try:
        # Get the current chef (assuming the requesting user is a chef)
        chef = request.user
        today = timezone.now().date()
        current_month = timezone.now().month
        current_year = timezone.now().year

        # Import BulkOrder here to avoid circular imports
        from .models import BulkOrder

        # Count different order types for this chef
        chef_orders = Order.objects.filter(chef=chef)
        chef_bulk_orders = BulkOrder.objects.filter(chef=chef)

        # Calculate main stats including bulk orders
        completed_regular_orders = chef_orders.filter(status__in=["delivered"]).count()
        completed_bulk_orders = chef_bulk_orders.filter(status__in=["completed"]).count()
        
        active_regular_orders = chef_orders.filter(
            status__in=["confirmed", "preparing", "ready", "out_for_delivery"]
        ).count()
        active_bulk_orders = chef_bulk_orders.filter(
            status__in=["confirmed", "preparing", "ready_for_delivery"]
        ).count()
        
        pending_regular_orders = chef_orders.filter(status="pending").count()
        pending_bulk_orders = chef_bulk_orders.filter(status="pending").count()

        # Calculate revenue including bulk orders
        # For today revenue, include all completed payments for orders delivered or out for delivery today
        regular_revenue_today = float(
            Payment.objects.filter(
                order__chef=chef, 
                status="completed"
            ).filter(
                Q(created_at__date=today) |  # Payment made today
                Q(order__updated_at__date=today, order__status__in=["out_for_delivery", "delivered", "in_transit"])  # Order delivered/dispatched today
            ).aggregate(total=Sum("amount"))["total"] or 0
        )
        
        # Calculate bulk order revenue for delivered/completed orders
        bulk_revenue_today = float(
            chef_bulk_orders.filter(
                status__in=["completed", "ready_for_delivery"],
                updated_at__date=today
            ).aggregate(total=Sum("total_amount"))["total"] or 0
        )

        stats = {
            # Regular Order counts only (not mixed with bulk orders)
            "orders_completed": completed_regular_orders,  # Only regular orders
            "orders_active": active_regular_orders,        # Only regular orders  
            "pending_orders": pending_regular_orders,      # Only regular orders
            "total_orders": chef_orders.count(),           # Only regular orders
            
            # Separate bulk order counts
            "bulk_orders_completed": completed_bulk_orders,
            "bulk_orders_active": active_bulk_orders,
            "bulk_orders_pending": pending_bulk_orders,
            "bulk_orders_total": chef_bulk_orders.count(),
            
            # Revenue includes both regular and bulk orders (this makes sense for total revenue)
            "today_revenue": regular_revenue_today + bulk_revenue_today,
            "total_revenue": float(
                Payment.objects.filter(
                    order__chef=chef, status="completed"
                ).aggregate(total=Sum("amount"))["total"] or 0
            ) + float(
                chef_bulk_orders.filter(
                    status__in=["completed", "ready_for_delivery"]
                ).aggregate(total=Sum("total_amount"))["total"] or 0
            ),
            
            # General stats
            "bulk_orders": chef_bulk_orders.count(),
            "total_reviews": FoodReview.objects.filter(price__cook=chef).count(),
            "average_rating": float(
                FoodReview.objects.filter(price__cook=chef).aggregate(
                    avg=Avg("rating")
                )["avg"] or 0
            ),
            "monthly_orders": chef_orders.filter(
                created_at__month=current_month, created_at__year=current_year
            ).count() + chef_bulk_orders.filter(
                created_at__month=current_month, created_at__year=current_year
            ).count(),
            "customer_satisfaction": 94,  # Placeholder - can be calculated from reviews later
        }

        return JsonResponse(stats)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def chef_recent_reviews(request):
    """
    API endpoint that returns recent customer reviews for the chef
    """
    try:
        chef = request.user

        # Get recent reviews for this chef's food items
        reviews = (
            FoodReview.objects.filter(price__cook=chef)
            .select_related("customer", "price", "order")
            .order_by("-created_at")[:10]
        )

        reviews_data = []
        for review in reviews:
            reviews_data.append(
                {
                    "customer": review.customer.get_full_name()
                    or review.customer.username,
                    "rating": review.rating,
                    "comment": review.comment or "No comment provided",
                    "dish": review.price.food.name,
                    "time": review.created_at.strftime("%H:%M %d/%m/%Y"),
                    "order_id": review.order.order_number if review.order else "N/A",
                }
            )

        return JsonResponse(reviews_data, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def chef_recent_activity(request):
    """
    API endpoint that returns recent activity feed for the chef dashboard
    """
    try:
        chef = request.user
        activities = []

        # Get recent orders
        recent_orders = Order.objects.filter(chef=chef).order_by("-created_at")[:5]

        for order in recent_orders:
            time_ago = timezone.now() - order.created_at
            if time_ago.days > 0:
                time_str = f"{time_ago.days} day{'s' if time_ago.days > 1 else ''} ago"
            elif time_ago.seconds > 3600:
                hours = time_ago.seconds // 3600
                time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
            else:
                minutes = time_ago.seconds // 60
                time_str = f"{minutes} minute{'s' if minutes > 1 else ''} ago"

            activities.append(
                {
                    "action": f"New order received from {order.customer.get_full_name() or order.customer.username}",
                    "time": time_str,
                    "type": "order",
                }
            )

        # Get recent reviews
        recent_reviews = FoodReview.objects.filter(price__cook=chef).order_by(
            "-created_at"
        )[:3]

        for review in recent_reviews:
            time_ago = timezone.now() - review.created_at
            if time_ago.days > 0:
                time_str = f"{time_ago.days} day{'s' if time_ago.days > 1 else ''} ago"
            elif time_ago.seconds > 3600:
                hours = time_ago.seconds // 3600
                time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
            else:
                minutes = time_ago.seconds // 60
                time_str = f"{minutes} minute{'s' if minutes > 1 else ''} ago"

            activities.append(
                {
                    "action": f"{review.rating}-star review received for {review.price.food.name}",
                    "time": time_str,
                    "type": "review",
                }
            )

        # Get recent completed orders
        completed_orders = Order.objects.filter(chef=chef, status="delivered").order_by(
            "-updated_at"
        )[:3]

        for order in completed_orders:
            time_ago = timezone.now() - order.updated_at
            if time_ago.days > 0:
                time_str = f"{time_ago.days} day{'s' if time_ago.days > 1 else ''} ago"
            elif time_ago.seconds > 3600:
                hours = time_ago.seconds // 3600
                time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
            else:
                minutes = time_ago.seconds // 60
                time_str = f"{minutes} minute{'s' if minutes > 1 else ''} ago"

            activities.append(
                {
                    "action": f"Order #{order.order_number} marked as completed",
                    "time": time_str,
                    "type": "success",
                }
            )

        # Sort activities by most recent first
        # Since we can't easily sort by actual datetime, we'll return them in order
        return JsonResponse(activities[:8], safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def chef_income_data(request):
    """
    API endpoint that returns chef income analytics data for different time periods
    Includes both regular orders and bulk orders
    """
    try:
        chef = request.user
        period = request.GET.get('period', '7days')
        
        # Import BulkOrder here to avoid circular imports
        from .models import BulkOrder
        
        # Calculate date range based on period
        today = timezone.now().date()
        if period == '7days':
            start_date = today - timedelta(days=7)
            days = 7
        elif period == '30days':
            start_date = today - timedelta(days=30)
            days = 30
        elif period == '90days':
            start_date = today - timedelta(days=90)
            days = 90
        else:
            start_date = today - timedelta(days=7)
            days = 7
        
        # Get chef's payments in the date range (regular orders)
        payments = Payment.objects.filter(
            order__chef=chef,
            status='completed',
            created_at__date__gte=start_date,
            created_at__date__lte=today
        ).select_related('order')
        
        # Get chef's bulk orders in the date range
        bulk_orders = BulkOrder.objects.filter(
            chef=chef,
            status__in=['completed', 'ready_for_delivery'],
            updated_at__date__gte=start_date,
            updated_at__date__lte=today
        )
        
        # Calculate daily data
        daily_data = {}
        for i in range(days):
            date = start_date + timedelta(days=i)
            daily_data[date.isoformat()] = {
                'date': date.isoformat(),
                'income': 0.0,
                'orders': 0,
                'tips': 0.0,
                'bulk_orders': 0,
                'delivery_fees': 0.0
            }
        
        # Process regular order payments
        for payment in payments:
            date_key = payment.created_at.date().isoformat()
            if date_key in daily_data:
                order = payment.order
                daily_data[date_key]['income'] += float(payment.amount)
                daily_data[date_key]['orders'] += 1
                
                # Calculate estimated tips (8% of order value)
                daily_data[date_key]['tips'] += float(payment.amount) * 0.08
                
                # Estimate delivery fees (300 LKR per order)
                daily_data[date_key]['delivery_fees'] += 300.0
        
        # Process bulk orders
        for bulk_order in bulk_orders:
            date_key = bulk_order.updated_at.date().isoformat()
            if date_key in daily_data:
                daily_data[date_key]['income'] += float(bulk_order.total_amount)
                daily_data[date_key]['orders'] += 1
                daily_data[date_key]['bulk_orders'] += 1
                
                # Calculate estimated tips for bulk orders (5% since they're usually business)
                daily_data[date_key]['tips'] += float(bulk_order.total_amount) * 0.05
                
                # Add bulk order delivery fee if it's a delivery order
                if bulk_order.order_type == 'delivery':
                    daily_data[date_key]['delivery_fees'] += float(bulk_order.delivery_fee)
        
        # Convert to list and round values
        data_list = []
        for date_key in sorted(daily_data.keys()):
            day_data = daily_data[date_key]
            day_data['income'] = round(day_data['income'], 2)
            day_data['tips'] = round(day_data['tips'], 2)
            day_data['delivery_fees'] = round(day_data['delivery_fees'], 2)
            data_list.append(day_data)
        
        # Calculate totals
        total_income = sum(day['income'] for day in data_list)
        total_orders = sum(day['orders'] for day in data_list)
        total_tips = sum(day['tips'] for day in data_list)
        total_bulk_orders = sum(day['bulk_orders'] for day in data_list)
        average_daily = total_income / days if days > 0 else 0
        
        response_data = {
            'period': period,
            'total_income': round(total_income, 2),
            'total_orders': total_orders,
            'total_bulk_orders': total_bulk_orders,
            'total_tips': round(total_tips, 2),
            'average_daily': round(average_daily, 2),
            'data': data_list
        }
        
        return JsonResponse(response_data)
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def chef_income_breakdown(request):
    """
    API endpoint that returns chef income breakdown by categories
    """
    try:
        chef = request.user
        period = request.GET.get('period', '7days')
        
        # Calculate date range based on period
        today = timezone.now().date()
        if period == '7days':
            start_date = today - timedelta(days=7)
        elif period == '30days':
            start_date = today - timedelta(days=30)
        elif period == '90days':
            start_date = today - timedelta(days=90)
        else:
            start_date = today - timedelta(days=7)
        
        # Get chef's completed payments in the date range
        payments = Payment.objects.filter(
            order__chef=chef,
            status='completed',
            created_at__date__gte=start_date,
            created_at__date__lte=today
        ).select_related('order')
        
        total_revenue = sum(float(payment.amount) for payment in payments)
        
        # Calculate breakdown
        regular_orders = total_revenue * 0.7  # 70% from regular orders
        bulk_orders = total_revenue * 0.2     # 20% from bulk orders
        delivery_fees = total_revenue * 0.1   # 10% delivery fees
        tips = total_revenue * 0.08           # 8% tips
        
        categories = [
            {
                'name': 'Regular Orders',
                'amount': round(regular_orders, 2),
                'percentage': 70
            },
            {
                'name': 'Bulk Orders',
                'amount': round(bulk_orders, 2),
                'percentage': 20
            },
            {
                'name': 'Delivery Fees',
                'amount': round(delivery_fees, 2),
                'percentage': 10
            }
        ]
        
        response_data = {
            'period': period,
            'total_revenue': round(total_revenue, 2),
            'regular_orders': round(regular_orders, 2),
            'bulk_orders': round(bulk_orders, 2),
            'delivery_fees': round(delivery_fees, 2),
            'tips': round(tips, 2),
            'categories': categories
        }
        
        return JsonResponse(response_data)
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

    @action(detail=True, methods=["post"])
    def mark_picked_up(self, request, pk=None):
        """Delivery agent marks order as picked up from chef"""
        order = self.get_object()

        # Check if user is the assigned delivery partner
        if order.delivery_partner != request.user:
            return Response(
                {"error": "You are not authorized to update this order"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if order is in correct status
        if order.status not in ["out_for_delivery", "ready"]:
            return Response(
                {"error": "Order cannot be marked as picked up in current status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get pickup location and notes
        pickup_location = request.data.get("pickup_location", {})
        notes = request.data.get("notes", "Order picked up from chef")

        # Update order status
        order.status = "in_transit"
        order.save()

        # Add status history
        OrderStatusHistory.objects.create(
            order=order, status="in_transit", changed_by=request.user, notes=notes
        )

        return Response(
            {
                "success": "Order marked as picked up successfully",
                "order_id": order.id,
                "status": "in_transit",
            }
        )

    @action(detail=True, methods=["get"])
    def chef_location(self, request, pk=None):
        """Get chef location details for navigation"""
        order = self.get_object()

        # Check if user is the assigned delivery partner
        if order.delivery_partner != request.user:
            return Response(
                {"error": "You are not authorized to access this information"},
                status=status.HTTP_403_FORBIDDEN,
            )

        chef = order.chef
        if not chef:
            return Response(
                {"error": "No chef assigned to this order"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Try to get chef's location from various sources
        chef_location = {}

        # First, try to get from user's address
        if chef.address:
            chef_location["address"] = chef.address

        # Try to get from chef profile if exists
        if hasattr(chef, "chef_profile"):
            profile = chef.chef_profile
            if hasattr(profile, "service_location") and profile.service_location:
                chef_location["service_location"] = profile.service_location

        # Get basic chef info
        chef_info = {
            "id": chef.id,
            "name": chef.name or chef.name or chef.username,
            "phone": chef.phone_no,
            "email": chef.email,
            "location": chef_location,
        }

        return Response(
            {
                "chef": chef_info,
                "order_id": order.id,
                "pickup_address": chef_location.get("address")
                or chef_location.get("service_location", "Address not available"),
            }
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def calculate_checkout(request):
    """Calculate delivery fee, tax, and total for checkout with dynamic pricing"""
    print("\n" + "="*80)
    print("🚀 CALCULATE_CHECKOUT API CALLED!")
    print(f"📥 Request Data: {request.data}")
    print("="*80 + "\n")
    
    try:
        from .services.delivery_fee_service import delivery_fee_calculator

        cart_items = request.data.get("cart_items", [])
        order_type = request.data.get("order_type", "regular")  # 'regular' or 'bulk'
        
        print(f"📦 Cart Items: {len(cart_items)}")
        print(f"🏷️  Order Type: {order_type}")
        
        # Delivery address information
        delivery_address_id = request.data.get("delivery_address_id")
        delivery_latitude = request.data.get("delivery_latitude")
        delivery_longitude = request.data.get("delivery_longitude")
        
        # Kitchen/chef location
        chef_latitude = request.data.get("chef_latitude")
        chef_longitude = request.data.get("chef_longitude")
        
        # Delivery time (optional, defaults to now)
        delivery_time_str = request.data.get("delivery_time")
        delivery_time = None
        if delivery_time_str:
            from dateutil import parser
            delivery_time = parser.parse(delivery_time_str)

        if not cart_items:
            return Response(
                {"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Initialize calculation variables
        subtotal = Decimal("0.00")
        tax_rate = Decimal("0.10")  # 10% tax

        # Calculate subtotal
        for item in cart_items:
            # Get the price record
            try:
                food_price = FoodPrice.objects.select_related("food", "cook").get(
                    id=item["price_id"]
                )
            except FoodPrice.DoesNotExist:
                return Response(
                    {"error": f'Price with ID {item["price_id"]} not found'},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Calculate item total
            item_total = food_price.price * item["quantity"]
            subtotal += item_total

        # Get chef location if not provided
        if not chef_latitude or not chef_longitude:
            first_item = cart_items[0]
            try:
                food_price = FoodPrice.objects.select_related("cook").get(
                    id=first_item["price_id"]
                )
                chef = food_price.cook
                chef_lat, chef_lng = _resolve_chef_location(chef, request.data)
                if chef_lat and chef_lng:
                    chef_latitude = chef_lat
                    chef_longitude = chef_lng
            except Exception:
                pass

        # Get delivery location if address ID provided
        if delivery_address_id and (not delivery_latitude or not delivery_longitude):
            try:
                from apps.users.models import Address
                address = Address.objects.get(
                    id=delivery_address_id, 
                    user=request.user, 
                    address_type="customer"
                )
                delivery_latitude = float(address.latitude) if address.latitude else None
                delivery_longitude = float(address.longitude) if address.longitude else None
            except Exception:
                try:
                    address = UserAddress.objects.get(
                        id=delivery_address_id, 
                        user=request.user
                    )
                    delivery_latitude = float(address.latitude) if address.latitude else None
                    delivery_longitude = float(address.longitude) if address.longitude else None
                except Exception:
                    pass

        # Calculate dynamic delivery fee
        delivery_fee_result = None
        delivery_fee = Decimal("0.00")
        
        print(f"\n📍 Coordinates Check:")
        print(f"   Chef: ({chef_latitude}, {chef_longitude})")
        print(f"   Delivery: ({delivery_latitude}, {delivery_longitude})")
        
        if chef_latitude and chef_longitude and delivery_latitude and delivery_longitude:
            try:
                print(f"\n🚀 Calling delivery_fee_calculator.calculate_delivery_fee()...")
                print(f"   Order Type: {order_type}")
                
                logger.info(f"🚀 Calling delivery_fee_calculator with order_type={order_type}")
                delivery_fee_result = delivery_fee_calculator.calculate_delivery_fee(
                    order_type=order_type,
                    origin_lat=float(chef_latitude),
                    origin_lng=float(chef_longitude),
                    dest_lat=float(delivery_latitude),
                    dest_lng=float(delivery_longitude),
                    delivery_time=delivery_time
                )
                delivery_fee = Decimal(str(delivery_fee_result['total_fee']))
                
                print(f"\n✅ API Response from calculator:")
                print(f"   Total Fee: {delivery_fee} LKR")
                print(f"   Breakdown: {delivery_fee_result.get('breakdown', {})}")
                print(f"   Factors: {delivery_fee_result.get('factors', {})}")
                
                logger.info(f"✅ Delivery fee calculated: {delivery_fee} LKR (with surcharges)")
            except Exception as e:
                logger.warning(f"⚠️ Failed to calculate dynamic delivery fee: {str(e)}")
                # Fallback to basic calculation with surcharges
                distance_km = delivery_fee_calculator._haversine_distance(
                    float(chef_latitude), float(chef_longitude),
                    float(delivery_latitude), float(delivery_longitude)
                )
                
                # Calculate base distance fee
                if order_type == 'bulk':
                    if distance_km <= 5:
                        distance_fee = Decimal('250.00')
                    else:
                        distance_fee = Decimal('250.00') + (Decimal(str(distance_km - 5)) * Decimal('15.00'))
                else:
                    if distance_km <= 5:
                        distance_fee = Decimal('50.00')
                    else:
                        distance_fee = Decimal('50.00') + (Decimal(str(distance_km - 5)) * Decimal('15.00'))
                
                # Calculate surcharges
                time_surcharge = Decimal('0')
                weather_surcharge = Decimal('0')
                is_night = False
                is_rainy = False
                
                # Check if night time (6 PM - 5 AM) in Sri Lanka time
                current_time = delivery_time if delivery_time else datetime.now(pytz.UTC)
                # Convert to Sri Lanka timezone
                sri_lanka_tz = pytz.timezone('Asia/Colombo')
                if current_time.tzinfo is None:
                    current_time = pytz.UTC.localize(current_time)
                local_time = current_time.astimezone(sri_lanka_tz)
                current_hour = local_time.hour
                logger.info(f"🌙 FALLBACK Night Check: Sri Lanka time = {local_time.strftime('%H:%M')}, Hour = {current_hour}")
                if current_hour >= 18 or current_hour < 5:
                    is_night = True
                    time_surcharge = distance_fee * Decimal('0.10')
                    logger.info(f"💰 FALLBACK Night Surcharge Applied: {time_surcharge} LKR")
                
                # Note: Weather check requires API, so skip in fallback
                # Total includes surcharges
                total_fee = distance_fee + time_surcharge + weather_surcharge
                logger.info(f"📊 FALLBACK Total: Distance={distance_fee} + Night={time_surcharge} = {total_fee}")
                
                delivery_fee_result = {
                    'total_fee': float(total_fee),
                    'breakdown': {
                        'distance_fee': float(distance_fee),
                        'time_surcharge': float(time_surcharge),
                        'weather_surcharge': float(weather_surcharge),
                    },
                    'factors': {
                        'distance_km': distance_km,
                        'order_type': order_type,
                        'is_night_delivery': is_night,
                        'is_rainy': is_rainy,
                    }
                }
                
                # Update delivery_fee to total
                delivery_fee = total_fee
        else:
            # No location data, use minimal fee
            delivery_fee = Decimal("50.00")
            delivery_fee_result = {
                'total_fee': 50.0,
                'breakdown': {
                    'distance_fee': 50.0,
                    'time_surcharge': 0,
                    'weather_surcharge': 0,
                },
                'factors': {
                    'distance_km': 0,
                    'order_type': order_type,
                    'is_night_delivery': False,
                    'is_rainy': False,
                }
            }

        # Calculate tax
        tax_amount = subtotal * tax_rate

        # Calculate total
        total_amount = subtotal + delivery_fee + tax_amount

        response_data = {
            "subtotal": float(subtotal),
            "delivery_fee": float(delivery_fee),
            "tax_amount": float(tax_amount),
            "total_amount": float(total_amount),
            "tax_rate": float(tax_rate),
        }
        
        # Add delivery fee breakdown if available
        if delivery_fee_result:
            response_data["delivery_fee_breakdown"] = delivery_fee_result
            print(f"\n📤 SENDING RESPONSE WITH BREAKDOWN:")
            print(f"   Delivery Fee: {float(delivery_fee)}")
            print(f"   Night Surcharge: {delivery_fee_result.get('breakdown', {}).get('time_surcharge', 0)}")
            print(f"   Is Night: {delivery_fee_result.get('factors', {}).get('is_night_delivery', False)}")
        else:
            print(f"\n⚠️  WARNING: No delivery_fee_breakdown in response!")

        print("\n" + "="*80)
        return Response(response_data)

    except Exception as e:
        logger.error(f"Checkout calculation error: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def place_order(request):
    """Place a comprehensive order with delivery address reference and distance-based fee"""
    try:
        order_type = request.data.get(
            "order_type", "delivery"
        )  # 'delivery' or 'pickup'
        delivery_address_id = request.data.get("delivery_address_id")
        delivery_instructions = request.data.get("delivery_instructions", "")
        customer_notes = request.data.get("customer_notes", "")
        payment_method = request.data.get("payment_method", "cash")
        phone = request.data.get("phone", "")
        delivery_fee = request.data.get("delivery_fee", 0)
        subtotal = request.data.get("subtotal", 0)
        tax_amount = request.data.get("tax_amount", 0)
        total_amount = request.data.get("total_amount", 0)

        # Validate required fields - address only required for delivery
        if order_type == "delivery" and not delivery_address_id:
            return Response(
                {"error": "Delivery address is required for delivery orders"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get cart items for the user (CartItem uses 'customer' FK)
        import logging

        logger = logging.getLogger(__name__)

        logger.info(
            f"🛒 Fetching cart for user: {request.user} (ID: {request.user.id if request.user else 'None'})"
        )

        cart_items = CartItem.objects.filter(customer=request.user).select_related(
            "price__food", "price__cook"
        )

        logger.info(f"🛒 Cart items count: {cart_items.count()}")

        if not cart_items.exists():
            # Check if cart items exist without customer filter to debug
            all_cart_count = CartItem.objects.count()
            logger.error(
                f"❌ Cart is empty for user {request.user.id}. Total cart items in DB: {all_cart_count}"
            )
            return Response(
                {"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get delivery address (supports both old UserAddress and new Address systems)
        delivery_address = None
        new_address = None
        if order_type == "delivery":
            try:
                # First try new Address model from users app
                from apps.users.models import Address

                new_address = Address.objects.get(
                    id=delivery_address_id, user=request.user, address_type="customer"
                )
                logger.info(
                    f"✅ Found new delivery address: {new_address.label} - {new_address.city}"
                )
            except:
                # Fallback to old UserAddress model
                try:
                    delivery_address = UserAddress.objects.get(
                        id=delivery_address_id, user=request.user
                    )
                    logger.info(
                        f"✅ Found old delivery address: {delivery_address.label} - {delivery_address.city}"
                    )
                except UserAddress.DoesNotExist:
                    logger.error(
                        f"❌ Delivery address ID {delivery_address_id} not found for user {request.user.id}"
                    )
                    # List all addresses for this user for debugging
                    user_addresses = UserAddress.objects.filter(user=request.user)
                    from apps.users.models import Address

                    new_addresses = Address.objects.filter(
                        user=request.user, address_type="customer"
                    )
                    logger.error(
                        f"Available old addresses: {list(user_addresses.values_list('id', 'label'))}"
                    )
                    logger.error(
                        f"Available new addresses: {list(new_addresses.values_list('id', 'label'))}"
                    )
                    return Response(
                        {"error": "Delivery address not found"},
                        status=status.HTTP_404_NOT_FOUND,
                    )

        # Get chef from first cart item
        first_item = cart_items.first()
        chef = first_item.price.cook if first_item and first_item.price else None

        if not chef:
            return Response(
                {"error": "Chef information not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get chef's kitchen location and calculate distance (only for delivery)
        distance_km = None
        if order_type == "delivery" and (delivery_address or new_address):
            chef_lat, chef_lng = _resolve_chef_location(chef, request.data)

            # Get delivery coordinates from either old or new address system
            delivery_lat = None
            delivery_lng = None
            if new_address:
                delivery_lat = new_address.latitude
                delivery_lng = new_address.longitude
            elif delivery_address:
                delivery_lat = delivery_address.latitude
                delivery_lng = delivery_address.longitude

            # Calculate distance if both coordinates available
            if chef_lat and chef_lng and delivery_lat and delivery_lng:
                from math import atan2, cos, radians, sin, sqrt

                def haversine_distance(lat1, lon1, lat2, lon2):
                    R = 6371  # Earth's radius in km
                    lat1, lon1, lat2, lon2 = map(
                        radians, [float(lat1), float(lon1), float(lat2), float(lon2)]
                    )
                    dlat = lat2 - lat1
                    dlon = lon2 - lon1
                    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
                    c = 2 * atan2(sqrt(a), sqrt(1 - a))
                    return R * c

                distance_km = haversine_distance(
                    chef_lat, chef_lng, delivery_lat, delivery_lng
                )

        # Prepare address data for order creation
        # For cash on delivery, auto-confirm the order so it shows up for delivery agents
        initial_status = "confirmed" if payment_method == "cash" else "pending"
        
        order_data = {
            "customer": request.user,
            "chef": chef,
            "order_number": f"ORD-{uuid.uuid4().hex[:8].upper()}",
            "status": initial_status,
            "payment_method": payment_method,
            "payment_status": "pending",
            "subtotal": Decimal(str(subtotal)),
            "tax_amount": Decimal(str(tax_amount)),
            "delivery_fee": Decimal(str(delivery_fee)),
            "total_amount": Decimal(str(total_amount)),
            "delivery_instructions": (
                delivery_instructions if order_type == "delivery" else ""
            ),
            "customer_notes": customer_notes or delivery_instructions,
            "distance_km": Decimal(str(distance_km)) if distance_km else None,
        }

        # Add address-specific fields based on which system is used
        if order_type == "delivery":
            if new_address:
                # Use new address system
                order_data.update(
                    {
                        "delivery_address_new_id": new_address.id,
                        "delivery_address": f"{new_address.address_line1}, {new_address.city}",
                        "delivery_latitude": new_address.latitude,
                        "delivery_longitude": new_address.longitude,
                    }
                )
            elif delivery_address:
                # Use old address system (backward compatibility)
                order_data.update(
                    {
                        "delivery_address_ref": delivery_address,
                        "delivery_address": f"{delivery_address.address_line1}, {delivery_address.city}",
                        "delivery_latitude": delivery_address.latitude,
                        "delivery_longitude": delivery_address.longitude,
                    }
                )
        else:
            # Pickup order
            order_data["delivery_address"] = "Pickup"

        # Create order
        order = Order.objects.create(**order_data)

        logger.info(
            f"✅ Order {order.order_number} created successfully with status 'pending' for user {request.user.username}"
        )

        # Create order items from cart
        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                price=cart_item.price,
                quantity=cart_item.quantity,
                unit_price=cart_item.price.price,
                total_price=cart_item.price.price * cart_item.quantity,
                food_name=cart_item.price.food.name,
                food_description=cart_item.price.food.description,
            )

        # Clear cart after order placement
        cart_items.delete()

        # Create initial status history
        status_note = (
            "Order placed and confirmed successfully. Chef can start preparing."
            if initial_status == "confirmed"
            else "Order placed successfully. Waiting for payment confirmation."
        )
        OrderStatusHistory.objects.create(
            order=order,
            status=initial_status,
            changed_by=request.user,
            notes=status_note,
        )

        # Create notifications
        try:
            from apps.communications.services.order_notification_service import (
                OrderNotificationService,
            )

            # Notify customer
            OrderNotificationService.notify_customer_order_placed(order)
            # Notify chef
            OrderNotificationService.notify_chef_new_order(order)
        except Exception as e:
            logger.error(f"Failed to send order notifications: {str(e)}")

        return Response(
            {
                "success": "Order placed successfully",
                "order_id": order.pk,
                "order_number": order.order_number,
                "status": order.status,
                "total_amount": float(total_amount),
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# DELIVERY TRACKING VIEWSET
# ==========================================


class DeliveryTrackingViewSet(viewsets.ViewSet):
    """
    Comprehensive delivery tracking and management endpoints
    """

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def active_deliveries(self, request):
        """
        Get all active deliveries with real-time tracking information
        Admin only - for delivery tracking dashboard
        """
        try:
            # Admin check
            if not request.user.is_staff and not request.user.is_superuser:
                return Response(
                    {"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN
                )

            # Get orders that are actively being delivered
            active_orders = (
                Order.objects.filter(
                    status__in=["out_for_delivery", "ready", "preparing"]
                )
                .select_related("customer", "chef", "delivery_partner")
                .prefetch_related("items__price__food")
                .order_by("-created_at")
            )

            deliveries = []
            for order in active_orders:
                # Get latest location update
                latest_location = LocationUpdate.objects.filter(order=order).first()

                # Get open issues
                open_issues = DeliveryIssue.objects.filter(
                    order=order,
                    status__in=["reported", "acknowledged", "in_progress"],
                ).count()

                deliveries.append(
                    {
                        "order_id": order.order_number,
                        "order_pk": order.pk,
                        "status": order.status,
                        "customer": {
                            "id": order.customer.id if order.customer else None,
                            "name": (
                                (
                                    order.customer.get_full_name()
                                    or order.customer.name
                                    or order.customer.username
                                )
                                if order.customer
                                else "Unknown"
                            ),
                            "phone": (
                                getattr(order.customer, "phone_no", None)
                                if order.customer
                                else None
                            ),
                        },
                        "delivery_partner": (
                            {
                                "id": (
                                    order.delivery_partner.id
                                    if order.delivery_partner
                                    else None
                                ),
                                "name": (
                                    (
                                        order.delivery_partner.get_full_name()
                                        or order.delivery_partner.name
                                        or order.delivery_partner.username
                                    )
                                    if order.delivery_partner
                                    else "Unassigned"
                                ),
                                "phone": (
                                    getattr(order.delivery_partner, "phone_no", None)
                                    if order.delivery_partner
                                    else None
                                ),
                            }
                            if order.delivery_partner
                            else None
                        ),
                        "delivery_address": order.delivery_address,
                        "delivery_latitude": (
                            float(order.delivery_latitude)
                            if order.delivery_latitude
                            else None
                        ),
                        "delivery_longitude": (
                            float(order.delivery_longitude)
                            if order.delivery_longitude
                            else None
                        ),
                        "current_location": (
                            {
                                "latitude": (
                                    float(latest_location.latitude)
                                    if latest_location
                                    else None
                                ),
                                "longitude": (
                                    float(latest_location.longitude)
                                    if latest_location
                                    else None
                                ),
                                "address": (
                                    latest_location.address if latest_location else None
                                ),
                                "timestamp": (
                                    latest_location.timestamp.isoformat()
                                    if latest_location
                                    else None
                                ),
                            }
                            if latest_location
                            else None
                        ),
                        "estimated_delivery_time": (
                            order.estimated_delivery_time.isoformat()
                            if order.estimated_delivery_time
                            else None
                        ),
                        "distance_km": (
                            float(order.distance_km) if order.distance_km else None
                        ),
                        "delivery_fee": (
                            float(order.delivery_fee) if order.delivery_fee else 0
                        ),
                        "total_amount": float(order.total_amount),
                        "open_issues": open_issues,
                        "created_at": order.created_at.isoformat(),
                        "time_elapsed": str(timezone.now() - order.created_at),
                    }
                )

            return Response(
                {
                    "success": True,
                    "count": len(deliveries),
                    "active_deliveries": deliveries,
                }
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to retrieve active deliveries: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def update_location(self, request, pk=None):
        """
        Update delivery agent's current location for an order
        """
        try:
            # Get the order
            try:
                order = Order.objects.get(pk=pk)
            except Order.DoesNotExist:
                return Response(
                    {"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND
                )

            # Verify user is the delivery partner or admin
            if order.delivery_partner != request.user and not request.user.is_staff:
                return Response(
                    {"error": "Not authorized to update location for this order"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get location data
            latitude = request.data.get("latitude")
            longitude = request.data.get("longitude")
            address = request.data.get("address", "")

            if not latitude or not longitude:
                return Response(
                    {"error": "Latitude and longitude are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create location update
            location_update = LocationUpdate.objects.create(
                delivery_agent=request.user,
                order=order,
                latitude=Decimal(str(latitude)),
                longitude=Decimal(str(longitude)),
                address=address,
            )

            return Response(
                {
                    "success": True,
                    "message": "Location updated successfully",
                    "location": {
                        "latitude": float(location_update.latitude),
                        "longitude": float(location_update.longitude),
                        "address": location_update.address,
                        "timestamp": location_update.timestamp.isoformat(),
                    },
                }
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to update location: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["get"])
    def track(self, request, pk=None):
        """
        Get real-time tracking information for a specific order
        Customer, delivery partner, or admin can access
        """
        try:
            # Get the order
            try:
                order = Order.objects.select_related(
                    "customer", "chef", "delivery_partner"
                ).get(pk=pk)
            except Order.DoesNotExist:
                return Response(
                    {"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND
                )

            # Verify access permission
            if not (
                order.customer == request.user
                or order.delivery_partner == request.user
                or request.user.is_staff
            ):
                return Response(
                    {"error": "Not authorized to track this order"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get latest location
            latest_location = LocationUpdate.objects.filter(order=order).first()

            # Get recent issues
            recent_issues = DeliveryIssue.objects.filter(
                order=order,
                status__in=["reported", "acknowledged", "in_progress"],
            ).values("issue_id", "issue_type", "description", "status", "created_at")

            # Get unread messages count
            unread_messages = DeliveryChat.objects.filter(
                order=order, receiver=request.user, is_read=False
            ).count()

            return Response(
                {
                    "success": True,
                    "order": {
                        "order_number": order.order_number,
                        "status": order.status,
                        "delivery_address": order.delivery_address,
                        "delivery_latitude": (
                            float(order.delivery_latitude)
                            if order.delivery_latitude
                            else None
                        ),
                        "delivery_longitude": (
                            float(order.delivery_longitude)
                            if order.delivery_longitude
                            else None
                        ),
                        "estimated_delivery_time": (
                            order.estimated_delivery_time.isoformat()
                            if order.estimated_delivery_time
                            else None
                        ),
                        "distance_km": (
                            float(order.distance_km) if order.distance_km else None
                        ),
                    },
                    "delivery_partner": (
                        {
                            "name": (
                                (
                                    order.delivery_partner.get_full_name()
                                    or order.delivery_partner.name
                                    or order.delivery_partner.username
                                )
                                if order.delivery_partner
                                else "Not assigned"
                            ),
                            "phone": (
                                getattr(order.delivery_partner, "phone_no", None)
                                if order.delivery_partner
                                else None
                            ),
                        }
                        if order.delivery_partner
                        else None
                    ),
                    "current_location": (
                        {
                            "latitude": (
                                float(latest_location.latitude)
                                if latest_location
                                else None
                            ),
                            "longitude": (
                                float(latest_location.longitude)
                                if latest_location
                                else None
                            ),
                            "address": (
                                latest_location.address if latest_location else None
                            ),
                            "timestamp": (
                                latest_location.timestamp.isoformat()
                                if latest_location
                                else None
                            ),
                        }
                        if latest_location
                        else None
                    ),
                    "active_issues": list(recent_issues),
                    "unread_messages": unread_messages,
                }
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to get tracking information: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def delivery_stats(self, request):
        """
        Get delivery performance statistics
        Admin only
        """
        try:
            # Admin check
            if not request.user.is_staff and not request.user.is_superuser:
                return Response(
                    {"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN
                )

            # Get time range from query params
            days = int(request.query_params.get("days", 7))
            start_date = timezone.now() - timedelta(days=days)

            # Active deliveries
            active_count = Order.objects.filter(
                status__in=["out_for_delivery", "ready", "preparing"]
            ).count()

            # Completed deliveries in time range
            completed_orders = Order.objects.filter(
                status="delivered", actual_delivery_time__gte=start_date
            )
            completed_count = completed_orders.count()

            # Average delivery time (in minutes)
            avg_delivery_time = None
            if completed_count > 0:
                completed_with_times = completed_orders.exclude(
                    estimated_delivery_time__isnull=True,
                    actual_delivery_time__isnull=True,
                )

                if completed_with_times.exists():
                    total_minutes = 0
                    count = 0
                    for order in completed_with_times:
                        if order.actual_delivery_time and order.created_at:
                            delta = order.actual_delivery_time - order.created_at
                            total_minutes += delta.total_seconds() / 60
                            count += 1

                    if count > 0:
                        avg_delivery_time = round(total_minutes / count, 1)

            # On-time delivery rate
            on_time_count = 0
            late_count = 0
            for order in completed_orders:
                if order.estimated_delivery_time and order.actual_delivery_time:
                    if order.actual_delivery_time <= order.estimated_delivery_time:
                        on_time_count += 1
                    else:
                        late_count += 1

            on_time_rate = (
                round((on_time_count / (on_time_count + late_count) * 100), 1)
                if (on_time_count + late_count) > 0
                else 0
            )

            # Issue statistics
            total_issues = DeliveryIssue.objects.filter(
                created_at__gte=start_date
            ).count()

            open_issues = DeliveryIssue.objects.filter(
                status__in=["reported", "acknowledged", "in_progress"],
                created_at__gte=start_date,
            ).count()

            # Revenue from deliveries
            total_revenue = (
                completed_orders.aggregate(total=Sum("total_amount"))["total"] or 0
            )

            delivery_fee_revenue = (
                completed_orders.aggregate(total=Sum("delivery_fee"))["total"] or 0
            )

            # Top performing delivery partners
            top_partners = (
                Order.objects.filter(
                    status="delivered",
                    actual_delivery_time__gte=start_date,
                    delivery_partner__isnull=False,
                )
                .values(
                    "delivery_partner__id",
                    "delivery_partner__username",
                )
                .annotate(delivery_count=Count("id"), total_earned=Sum("delivery_fee"))
                .order_by("-delivery_count")[:5]
            )

            return Response(
                {
                    "success": True,
                    "period_days": days,
                    "stats": {
                        "active_deliveries": active_count,
                        "completed_deliveries": completed_count,
                        "avg_delivery_time_minutes": avg_delivery_time,
                        "on_time_delivery_rate": on_time_rate,
                        "total_issues": total_issues,
                        "open_issues": open_issues,
                        "total_revenue": float(total_revenue),
                        "delivery_fee_revenue": float(delivery_fee_revenue),
                    },
                    "top_delivery_partners": [
                        {
                            "id": partner["delivery_partner__id"],
                            "name": partner.get("delivery_partner__username")
                            or "Unknown",
                            "deliveries": partner["delivery_count"],
                            "total_earned": (
                                float(partner["total_earned"])
                                if partner["total_earned"]
                                else 0
                            ),
                        }
                        for partner in top_partners
                    ],
                }
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to retrieve delivery stats: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def report_issue(self, request, pk=None):
        """
        Report a delivery issue
        Delivery partner can report issues
        """
        try:
            # Get the order
            try:
                order = Order.objects.get(pk=pk)
            except Order.DoesNotExist:
                return Response(
                    {"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND
                )

            # Verify user is the delivery partner
            if order.delivery_partner != request.user:
                return Response(
                    {"error": "Only the assigned delivery partner can report issues"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get issue data
            issue_type = request.data.get("issue_type")
            description = request.data.get("description")

            if not issue_type or not description:
                return Response(
                    {"error": "issue_type and description are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate issue type
            valid_types = [choice[0] for choice in DeliveryIssue.ISSUE_TYPE_CHOICES]
            if issue_type not in valid_types:
                return Response(
                    {
                        "error": f'Invalid issue_type. Must be one of: {", ".join(valid_types)}'
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create issue
            issue = DeliveryIssue.objects.create(
                order=order,
                delivery_agent=request.user,
                issue_type=issue_type,
                description=description,
                status="reported",
            )

            return Response(
                {
                    "success": True,
                    "message": "Issue reported successfully",
                    "issue": {
                        "issue_id": str(issue.issue_id),
                        "order_number": order.order_number,
                        "issue_type": issue.issue_type,
                        "description": issue.description,
                        "status": issue.status,
                        "created_at": issue.created_at.isoformat(),
                    },
                }
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to report issue: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["get", "post"])
    def chat(self, request, pk=None):
        """
        Get or send chat messages for an order
        GET: Retrieve chat history
        POST: Send a new message
        """
        try:
            # Get the order
            try:
                order = Order.objects.select_related(
                    "customer", "delivery_partner"
                ).get(pk=pk)
            except Order.DoesNotExist:
                return Response(
                    {"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND
                )

            # Verify access
            if not (
                order.customer == request.user
                or order.delivery_partner == request.user
                or request.user.is_staff
            ):
                return Response(
                    {"error": "Not authorized to access chat for this order"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if request.method == "GET":
                # Get chat messages
                messages = DeliveryChat.objects.filter(order=order).select_related(
                    "sender", "receiver"
                )

                # Mark messages as read for current user
                DeliveryChat.objects.filter(
                    order=order, receiver=request.user, is_read=False
                ).update(is_read=True)

                return Response(
                    {
                        "success": True,
                        "messages": [
                            {
                                "message_id": str(msg.message_id),
                                "sender": {
                                    "id": msg.sender.id,
                                    "name": msg.sender.name or msg.sender.username,
                                },
                                "message": msg.message,
                                "message_type": msg.message_type,
                                "is_read": msg.is_read,
                                "created_at": msg.created_at.isoformat(),
                            }
                            for msg in messages
                        ],
                    }
                )

            elif request.method == "POST":
                # Send a new message
                message_text = request.data.get("message")
                message_type = request.data.get("message_type", "text")

                if not message_text:
                    return Response(
                        {"error": "message is required"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Determine receiver
                if request.user == order.customer:
                    receiver = order.delivery_partner
                elif request.user == order.delivery_partner:
                    receiver = order.customer
                else:
                    return Response(
                        {
                            "error": "Only customer or delivery partner can send messages"
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

                if not receiver:
                    return Response(
                        {"error": "No delivery partner assigned to this order yet"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Create message
                chat_message = DeliveryChat.objects.create(
                    order=order,
                    sender=request.user,
                    receiver=receiver,
                    message=message_text,
                    message_type=message_type,
                )

                return Response(
                    {
                        "success": True,
                        "message": "Message sent successfully",
                        "chat_message": {
                            "message_id": str(chat_message.message_id),
                            "message": chat_message.message,
                            "message_type": chat_message.message_type,
                            "created_at": chat_message.created_at.isoformat(),
                        },
                    }
                )

        except Exception as e:
            return Response(
                {"error": f"Chat operation failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DeliveryReviewViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for managing delivery reviews (admin/read-only access)"""

    serializer_class = DeliveryReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return delivery reviews based on user permissions.
        Admins can see all, delivery agents can see their own, customers their own
        """
        user = self.request.user

        if user.is_staff or user.is_superuser:
            # Admin can see all delivery reviews
            return DeliveryReview.objects.select_related(
                "customer", "delivery__agent", "delivery__order"
            ).order_by("-created_at")
        elif hasattr(user, "deliveryagent"):
            # Delivery agents can see reviews for their deliveries
            return (
                DeliveryReview.objects.filter(delivery__agent=user)
                .select_related(
                    "customer", "delivery__agent", "delivery__order"
                )
                .order_by("-created_at")
            )
        else:
            # Customers can see their own reviews
            return (
                DeliveryReview.objects.filter(customer=user)
                .select_related(
                    "customer", "delivery__agent", "delivery__order"
                )
                .order_by("-created_at")
            )

    def list(self, request, *args, **kwargs):
        """
        List delivery reviews with optional filtering
        """
        queryset = self.get_queryset()

        # Apply filters
        rating = request.query_params.get("rating")
        has_response = request.query_params.get("has_response")
        search = request.query_params.get("search")

        if rating:
            try:
                rating_val = int(rating)
                queryset = queryset.filter(rating=rating_val)
            except ValueError:
                pass

        if has_response is not None:
            if has_response.lower() == "true":
                queryset = queryset.exclude(
                    admin_response__isnull=True, admin_response=""
                )
            elif has_response.lower() == "false":
                queryset = queryset.filter(
                    Q(admin_response__isnull=True) | Q(admin_response="")
                )

        if search:
            queryset = queryset.filter(
                Q(comment__icontains=search)
                | Q(customer__name__icontains=search)
                | Q(delivery__order__order_number__icontains=search)
            )

        # Pagination
        page_size = int(request.query_params.get("limit", 20))
        page = int(request.query_params.get("page", 1))

        total_count = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size

        reviews = queryset[start:end]
        serializer = self.get_serializer(reviews, many=True)

        return Response(
            {
                "results": serializer.data,
                "count": total_count,
                "next": (
                    None
                    if end >= total_count
                    else f"?page={page + 1}&limit={page_size}"
                ),
                "previous": (
                    None if page <= 1 else f"?page={page - 1}&limit={page_size}"
                ),
            }
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def reply(self, request, pk=None):
        """
        Add admin response to a delivery review
        """
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {"error": "Only admin users can reply to reviews"},
                status=status.HTTP_403_FORBIDDEN,
            )

        review = self.get_object()
        admin_response = request.data.get("admin_response", "").strip()

        if not admin_response:
            return Response(
                {"error": "admin_response is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review.admin_response = admin_response
        review.response_date = timezone.now()
        review.save(update_fields=["admin_response", "response_date"])

        serializer = self.get_serializer(review)
        return Response(
            {
                "success": True,
                "message": "Reply sent successfully",
                "review": serializer.data,
            }
        )
        return Response(
            {
                "success": True,
                "message": "Reply sent successfully",
                "review": serializer.data,
            }
        )
