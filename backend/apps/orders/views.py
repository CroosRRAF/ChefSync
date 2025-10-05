import math
from datetime import timedelta
from decimal import Decimal

from apps.food.models import FoodPrice, FoodReview
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
    LocationUpdate,
    Order,
    OrderItem,
    OrderStatusHistory,
    UserAddress,
)
from .serializers import CartItemSerializer, UserAddressSerializer

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
            if kitchen_address.latitude != lat:
                kitchen_address.latitude = lat
                updated = True
            if kitchen_address.longitude != lng:
                kitchen_address.longitude = lng
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


# Temporary simple serializer to fix the 500 error
class SimpleOrderSerializer(serializers.ModelSerializer):
    """Simple order serializer that works"""

    customer_name = serializers.SerializerMethodField()
    chef_name = serializers.SerializerMethodField()
    time_since_order = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    total_items = serializers.SerializerMethodField()

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
            "customer_name",
            "chef",
            "delivery_partner",
            "items",
            "time_since_order",
            "total_items",
            "delivery_address",
            "customer_notes",
            "chef_notes",
        ]

    def get_customer_name(self, obj):
        if obj.customer:
            return (
                obj.customer.name
                or obj.customer.name
                or obj.customer.username
            )
        return "Unknown Customer"

    def get_chef(self, obj):
        if obj.chef:
            return (
                obj.chef.name
                or obj.chef.name
                or obj.chef.username
            )
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
        for order_item in obj.items.select_related("price__food", "price__cook").all():
            items.append(
                {
                    "id": order_item.order_item_id,
                    "quantity": order_item.quantity,
                    "unit_price": float(order_item.unit_price or 0),
                    "total_price": float(order_item.total_price or 0),
                    "special_instructions": order_item.special_instructions or "",
                    "food_name": (
                        order_item.food_name or order_item.price.food.name
                        if order_item.price
                        else "Unknown Food"
                    ),
                    "food_description": order_item.food_description
                    or (order_item.price.food.description if order_item.price else ""),
                    "food_image": (
                        order_item.price.image_url
                        if order_item.price and order_item.price.image_url
                        else (
                            order_item.price.food.image_url
                            if order_item.price and order_item.price.food.image_url
                            else None
                        )
                    ),
                    "size": order_item.price.size if order_item.price else "Medium",
                    "cook_name": (
                        order_item.price.cook.name
                        or order_item.price.cook.name
                        or order_item.price.cook.username
                        if order_item.price
                        else "Unknown Cook"
                    ),
                }
            )
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
                | Q(status="ready", delivery_partner__isnull=True)
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

        if agent_lat is None or agent_lng is None:
            return Response(
                {
                    "error": "Location required",
                    "message": "Please enable location access to accept orders",
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
                float(agent_lat), float(agent_lng), float(chef_lat), float(chef_lng)
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
        valid_delivery_statuses = ["picked_up", "delivered"]

        if new_status not in valid_delivery_statuses:
            return Response(
                {"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST
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
        elif new_status == "delivered" and current_status not in [
            "picked_up",
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
            "name": chef.name
            or chef.name
            or chef.username,
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


class UserAddressViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user addresses"""

    serializer_class = UserAddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["post"])
    def set_default(self, request):
        """Set an address as default"""
        address_id = request.data.get("address_id")
        try:
            address = UserAddress.objects.get(id=address_id, user=request.user)
            # Remove default from other addresses
            UserAddress.objects.filter(user=request.user).update(is_default=False)
            # Set this address as default
            address.is_default = True
            address.save()
            return Response({"success": "Default address updated"})
        except UserAddress.DoesNotExist:
            return Response(
                {"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND
            )


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

        # Count different order types for this chef
        chef_orders = Order.objects.filter(chef=chef)

        # Calculate main stats
        stats = {
            "orders_completed": chef_orders.filter(status__in=["delivered"]).count(),
            "orders_active": chef_orders.filter(
                status__in=["confirmed", "preparing", "ready", "out_for_delivery"]
            ).count(),
            "bulk_orders": chef_orders.filter(
                # Assuming bulk orders have multiple items or a specific field
                # You can adjust this logic based on your bulk order definition
                items__quantity__gte=5
            )
            .distinct()
            .count(),
            "total_reviews": FoodReview.objects.filter(price__cook=chef).count(),
            "average_rating": float(
                FoodReview.objects.filter(price__cook=chef).aggregate(
                    avg=Avg("rating")
                )["avg"]
                or 0
            ),
            "today_revenue": float(
                Payment.objects.filter(
                    order__chef=chef, status="completed", created_at__date=today
                ).aggregate(total=Sum("amount"))["total"]
                or 0
            ),
            "pending_orders": chef_orders.filter(status="pending").count(),
            "monthly_orders": chef_orders.filter(
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
            "name": chef.name
            or chef.name
            or chef.username,
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
    """Calculate delivery fee, tax, and total for checkout with comprehensive validation"""
    try:
        cart_items = request.data.get("cart_items", [])
        customer_location = request.data.get("customer_location", {})

        if not cart_items:
            return Response(
                {"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Initialize calculation variables
        subtotal = Decimal("0.00")
        delivery_fee = Decimal("15.00")  # Base delivery fee
        tax_rate = Decimal("0.08")  # 8% tax

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

        # Calculate tax
        tax_amount = subtotal * tax_rate

        # Calculate total
        total_amount = subtotal + delivery_fee + tax_amount

        return Response(
            {
                "subtotal": float(subtotal),
                "delivery_fee": float(delivery_fee),
                "tax_amount": float(tax_amount),
                "total_amount": float(total_amount),
                "tax_rate": float(tax_rate),
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def place_order(request):
    """Place a comprehensive order with full validation and processing"""
    try:
        cart_items = request.data.get("cart_items", [])
        customer_location = request.data.get("customer_location", {})
        payment_method = request.data.get("payment_method", "cash")
        special_instructions = request.data.get("special_instructions", "")

        if not cart_items:
            return Response(
                {"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Create order
        import uuid

        order = Order.objects.create(
            customer=request.user,
            chef=None,  # Will be set based on first item
            order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
            status="pending",
            payment_method=payment_method,
            special_instructions=special_instructions,
            delivery_address=customer_location.get("formatted_address", ""),
            delivery_latitude=customer_location.get("latitude"),
            delivery_longitude=customer_location.get("longitude"),
        )

        # Process cart items
        for item_data in cart_items:
            try:
                food_price = FoodPrice.objects.select_related("food", "cook").get(
                    id=item_data["price_id"]
                )

                # Set chef for order (from first item)
                if not order.chef:
                    order.chef = food_price.cook
                    order.save()

                # Create order item
                OrderItem.objects.create(
                    order=order,
                    price=food_price,
                    quantity=item_data["quantity"],
                    total_amount=food_price.price * item_data["quantity"],
                )

            except FoodPrice.DoesNotExist:
                # Clean up if error
                order.delete()
                return Response(
                    {"error": f'Price with ID {item_data["price_id"]} not found'},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Calculate totals
        subtotal = sum(item.total_amount for item in order.items.all())
        delivery_fee = Decimal("15.00")
        tax_amount = subtotal * Decimal("0.08")
        total_amount = subtotal + delivery_fee + tax_amount

        # Update order totals
        order.subtotal = subtotal
        order.delivery_fee = delivery_fee
        order.tax_amount = tax_amount
        order.total_amount = total_amount
        order.save()

        # Create initial status history
        OrderStatusHistory.objects.create(
            order=order,
            status="pending",
            changed_by=request.user,
            notes="Order placed successfully",
        )

        return Response(
            {
                "success": "Order placed successfully",
                "order_id": order.id,
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
                .prefetch_related(
                    "items__price__food", "location_updates", "delivery_issues"
                )
                .order_by("-created_at")
            )

            deliveries = []
            for order in active_orders:
                # Get latest location update
                latest_location = order.location_updates.first()

                # Get open issues
                open_issues = order.delivery_issues.filter(
                    status__in=["reported", "acknowledged", "in_progress"]
                ).count()

                deliveries.append(
                    {
                        "order_id": order.order_number,
                        "order_pk": order.pk,
                        "status": order.status,
                        "customer": {
                            "id": order.customer.id if order.customer else None,
                            "name": (
                                order.customer.name
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
                                    order.delivery_partner.name
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
                order = (
                    Order.objects.select_related("customer", "chef", "delivery_partner")
                    .prefetch_related(
                        "location_updates", "delivery_issues", "chat_messages"
                    )
                    .get(pk=pk)
                )
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
            latest_location = order.location_updates.first()

            # Get recent issues
            recent_issues = order.delivery_issues.filter(
                status__in=["reported", "acknowledged", "in_progress"]
            ).values("issue_id", "issue_type", "description", "status", "created_at")

            # Get unread messages count
            unread_messages = order.chat_messages.filter(
                receiver=request.user, is_read=False
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
                                order.delivery_partner.name
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
                    "delivery_partner__name",
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
                            "name": partner["delivery_partner__name"] or "Unknown",
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
                messages = order.chat_messages.all().select_related(
                    "sender", "receiver"
                )

                # Mark messages as read for current user
                order.chat_messages.filter(receiver=request.user, is_read=False).update(
                    is_read=True
                )

                return Response(
                    {
                        "success": True,
                        "messages": [
                            {
                                "message_id": str(msg.message_id),
                                "sender": {
                                    "id": msg.sender.id,
                                    "name": msg.sender.name
                                    or msg.sender.username,
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
