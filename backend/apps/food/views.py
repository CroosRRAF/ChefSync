import logging
from decimal import Decimal

from django.core.paginator import Paginator
from django.db.models import Avg, Max, Min, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

logger = logging.getLogger(__name__)

from apps.users.models import KitchenLocation

from .models import (
    BulkMenu,
    BulkMenuItem,
    Cuisine,
    Food,
    FoodCategory,
    FoodPrice,
    FoodReview,
    Offer,
)
from .serializers import (
    BulkMenuItemSerializer,
    BulkMenuSerializer,
    BulkMenuWithItemsSerializer,
    ChefFoodCreateSerializer,
    ChefFoodPriceSerializer,
    CuisineSerializer,
    FoodCategorySerializer,
    FoodPriceSerializer,
    FoodReviewSerializer,
    FoodSerializer,
    OfferSerializer,
)
from .utils import calculate_delivery_fee, validate_delivery_radius


@api_view(["GET"])
def food_list(request):
    """Simple food list endpoint"""
    foods = Food.objects.filter(status="Approved")[:10]
    serializer = FoodSerializer(foods, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
def food_search(request):
    """Global food search endpoint - /api/food/search/?q=<query>"""
    query = request.GET.get("q", "").strip()
    if not query or len(query) < 2:
        return Response([])

    # Search approved foods only for general search
    foods = Food.objects.filter(
        Q(name__icontains=query) | Q(description__icontains=query), status="Approved"
    ).distinct()[:10]

    results = []
    for food in foods:
        # Get image URL directly from model property
        image_url = food.optimized_image_url or food.image_url

        results.append(
            {
                "id": food.food_id,
                "name": food.name,
                "description": food.description,
                "category": food.category,
                "image_url": image_url,
            }
        )

    return Response(results)


@api_view(["POST"])
def upload_image(request):
    """Image upload endpoint for Cloudinary"""
    from utils.cloudinary_utils import upload_image_to_cloudinary

    if "image" not in request.FILES:
        return Response(
            {"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    image_file = request.FILES["image"]
    try:
        result = upload_image_to_cloudinary(image_file)
        if result and "secure_url" in result and "public_id" in result:
            return Response(
                {"url": result["secure_url"], "public_id": result["public_id"]}
            )
        else:
            return Response(
                {"error": "Image upload failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CuisineViewSet(viewsets.ModelViewSet):
    queryset = Cuisine.objects.all()
    serializer_class = CuisineSerializer
    permission_classes = []  # Allow access to all users for viewing cuisines


class FoodCategoryViewSet(viewsets.ModelViewSet):
    queryset = FoodCategory.objects.all()
    serializer_class = FoodCategorySerializer
    permission_classes = []  # Allow access to all users for viewing categories


class ChefFoodViewSet(viewsets.ModelViewSet):
    """Chef can manage own menu - /api/food/chef/foods/"""

    serializer_class = FoodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Get foods where either:
        # 1. User is the chef (created the food)
        # 2. User has prices for the food (is a cook offering this food)
        user = self.request.user
        return (
            Food.objects.filter(Q(chef=user) | Q(prices__cook=user))
            .distinct()
            .prefetch_related("prices")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return ChefFoodCreateSerializer
        return FoodSerializer

    def get_serializer_context(self):
        """Add chef_view flag to context so serializer knows to filter prices"""
        context = super().get_serializer_context()
        context["chef_view"] = True
        return context

    def create(self, request, *args, **kwargs):
        """Create new food item with initial price"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        food = serializer.save()

        # Return the created food with all details
        response_serializer = FoodSerializer(food, context={"request": request})
        return Response(
            {
                "message": "New food submitted. Pending admin approval.",
                "food": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        """Update food item (chefs can only update availability)"""
        food = self.get_object()

        # Only allow availability updates for chefs
        allowed_fields = {"is_available"}
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

        if update_data:
            for attr, value in update_data.items():
                setattr(food, attr, value)
            food.save()

        return Response(
            {
                "message": "Food updated successfully.",
                "food": FoodSerializer(food, context={"request": request}).data,
            }
        )

    def perform_destroy(self, instance):
        """Only allow chef to delete their own foods"""
        if instance.chef != self.request.user:
            raise PermissionError("You can only delete your own foods")
        instance.delete()

    @action(detail=False, methods=["get"])
    def search(self, request):
        """Search foods for autocomplete - /api/food/chef/foods/search/?q=<query>"""
        query = request.query_params.get("q", "").strip()
        if not query or len(query) < 2:
            return Response([])

        # Search all foods for autocomplete (approved ones)
        foods = Food.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query),
            status="Approved",
        ).distinct()[:10]

        results = []
        for food in foods:
            # Get image URL directly from model property
            image_url = food.optimized_image_url or food.image_url

            results.append(
                {
                    "id": food.food_id,
                    "name": food.name,
                    "description": food.description,
                    "category": food.category,
                    "image_url": image_url,
                }
            )

        return Response(results)


class ChefFoodPriceViewSet(viewsets.ModelViewSet):
    """Chef can manage prices for foods - /api/food/chef/prices/"""

    serializer_class = ChefFoodPriceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FoodPrice.objects.filter(cook=self.request.user)

    def create(self, request, *args, **kwargs):
        """Create new price for existing food"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        price = serializer.save()

        return Response(
            {
                "message": "Price added successfully.",
                "price": FoodPriceSerializer(price).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomerFoodViewSet(viewsets.ReadOnlyModelViewSet):
    """Customers can view approved foods - /api/customer/foods/"""

    serializer_class = FoodSerializer
    permission_classes = []  # Allow access to all users including guests
    pagination_class = None  # Disable pagination to show all foods
    request: Request  # Type hint for DRF Request

    def get_queryset(self):
        queryset = (
            Food.objects.filter(status="Approved", is_available=True)
            .prefetch_related("prices")
            .select_related("chef", "food_category")
        )

        # Search functionality
        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(food_category__name__icontains=search)
                | Q(chef__first_name__icontains=search)
                | Q(chef__last_name__icontains=search)
            )

        # Filter by category
        category = self.request.query_params.get("category", None)
        if category:
            queryset = queryset.filter(food_category_id=category)

        # Filter by cuisine
        cuisine = self.request.query_params.get("cuisine", None)
        if cuisine:
            queryset = queryset.filter(food_category__cuisine_id=cuisine)

        # Filter by chef
        chef = self.request.query_params.get("chef", None)
        if chef:
            queryset = queryset.filter(chef_id=chef)

        # Price range filtering
        min_price = self.request.query_params.get("min_price", None)
        max_price = self.request.query_params.get("max_price", None)
        if min_price or max_price:
            price_filter = Q()
            if min_price:
                price_filter &= Q(prices__price__gte=min_price)
            if max_price:
                price_filter &= Q(prices__price__lte=max_price)
            queryset = queryset.filter(price_filter).distinct()

        return queryset.order_by("-created_at")

    @action(detail=True, methods=["get"], url_path="prices")
    def get_prices(self, request, pk=None):
        """Get prices for a specific food"""
        food = self.get_object()
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")

        # Get prices for this food
        prices = food.prices.all()

        # If location is provided, calculate distance and delivery time
        if lat and lng:
            # Here you could add distance calculation logic
            # For now, just return the prices as is
            pass

        serializer = FoodPriceSerializer(prices, many=True)
        return Response(serializer.data)


class FoodPriceViewSet(viewsets.ModelViewSet):
    serializer_class = FoodPriceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FoodPrice.objects.filter(food__chef=self.request.user)


class FoodReviewViewSet(viewsets.ModelViewSet):
    serializer_class = FoodReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FoodReview.objects.all()

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)


class OfferViewSet(viewsets.ModelViewSet):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    permission_classes = [IsAuthenticated]


# ================================
# ADMIN FOOD APPROVAL SYSTEM
# ================================


class AdminFoodViewSet(viewsets.ModelViewSet):
    """Admin endpoints for complete food management"""

    serializer_class = FoodSerializer
    permission_classes = [IsAuthenticated]
    request: Request  # Type hint for DRF Request

    def get_queryset(self):
        """Admin can access all foods with optimized queries"""
        if not self.request.user.is_staff:
            return Food.objects.none()

        # Get all foods for admin management with related data
        queryset = (
            Food.objects.select_related(
                "chef", "chef__chef_profile", "food_category", "food_category__cuisine"
            )
            .prefetch_related("prices", "prices__cook")
            .order_by("-created_at")
        )

        # Apply filters
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        category_filter = self.request.query_params.get("category")
        if category_filter:
            queryset = queryset.filter(food_category__name__icontains=category_filter)

        cuisine_filter = self.request.query_params.get("cuisine")
        if cuisine_filter:
            queryset = queryset.filter(
                food_category__cuisine__name__icontains=cuisine_filter
            )

        search_filter = self.request.query_params.get("search")
        if search_filter:
            queryset = queryset.filter(name__icontains=search_filter)

        availability_filter = self.request.query_params.get("availability")
        if availability_filter == "available":
            queryset = queryset.filter(is_available=True)
        elif availability_filter == "unavailable":
            queryset = queryset.filter(is_available=False)

        featured_filter = self.request.query_params.get("featured")
        if featured_filter == "featured":
            queryset = queryset.filter(is_featured=True)
        elif featured_filter == "not_featured":
            queryset = queryset.filter(is_featured=False)

        return queryset


class AdminFoodApprovalViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin endpoints for food approval workflow"""

    serializer_class = FoodSerializer
    permission_classes = [IsAuthenticated]
    request: Request  # Type hint for DRF Request

    def get_queryset(self):
        """Only admin users can access pending foods"""
        if not self.request.user.is_staff:
            return Food.objects.none()

        # Filter by status if provided
        status_filter = self.request.query_params.get("status", "Pending")
        return Food.objects.filter(status=status_filter).order_by("-created_at")

    @action(detail=False, methods=["get"])
    def pending(self, request):
        """Get all foods pending approval"""
        if not request.user.is_staff:
            return Response(
                {"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN
            )

        pending_foods = Food.objects.filter(status="Pending").order_by("-created_at")
        serializer = self.get_serializer(pending_foods, many=True)

        return Response({"count": pending_foods.count(), "foods": serializer.data})

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Approve a pending food item"""
        if not request.user.is_staff:
            return Response(
                {"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN
            )

        food = self.get_object()

        if food.status != "Pending":
            return Response(
                {"error": "Only pending foods can be approved"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Approve the food
        food.status = "Approved"
        food.admin = request.user
        food.is_available = True  # Make available when approved
        food.save()

        # Send notification to chef
        self._notify_chef(food, "approved", request.data.get("comments", ""))

        return Response(
            {
                "message": f'Food "{food.name}" has been approved successfully',
                "food": FoodSerializer(food, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Reject a pending food item"""
        if not request.user.is_staff:
            return Response(
                {"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN
            )

        food = self.get_object()

        if food.status != "Pending":
            return Response(
                {"error": "Only pending foods can be rejected"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rejection_reason = request.data.get("reason", "No reason provided")

        # Reject the food
        food.status = "Rejected"
        food.admin = request.user
        food.is_available = False
        food.save()

        # Send notification to chef
        self._notify_chef(food, "rejected", rejection_reason)

        return Response(
            {
                "message": f'Food "{food.name}" has been rejected',
                "reason": rejection_reason,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get food statistics for admin dashboard"""
        try:
            from django.db.models import Avg, Count, Max, Min

            # Food statistics
            total_foods = Food.objects.count()
            approved_foods = Food.objects.filter(status="Approved").count()
            pending_foods = Food.objects.filter(status="Pending").count()
            rejected_foods = Food.objects.filter(status="Rejected").count()

            # Category and cuisine counts
            total_categories = FoodCategory.objects.count()
            total_cuisines = Cuisine.objects.count()

            # Rating statistics
            avg_rating = (
                FoodReview.objects.aggregate(avg_rating=Avg("rating"))["avg_rating"]
                or 0
            )

            # Price statistics
            price_stats = FoodPrice.objects.aggregate(
                avg_price=Avg("price"), min_price=Min("price"), max_price=Max("price")
            )

            return Response(
                {
                    "totalFoods": total_foods,
                    "approvedFoods": approved_foods,
                    "pendingFoods": pending_foods,
                    "rejectedFoods": rejected_foods,
                    "totalCategories": total_categories,
                    "totalCuisines": total_cuisines,
                    "averageRating": round(float(avg_rating), 2),
                    "averagePrice": round(float(price_stats["avg_price"] or 0), 2),
                    "minPrice": round(float(price_stats["min_price"] or 0), 2),
                    "maxPrice": round(float(price_stats["max_price"] or 0), 2),
                }
            )

        except Exception as e:
            print(f"Error in food stats: {str(e)}")
            return Response(
                {"error": f"Failed to fetch food stats: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _notify_chef(self, food, action, comments):
        """Send notification to chef about approval decision"""
        from apps.communications.models import Notification

        if not food.chef:
            return

        if action == "approved":
            subject = f"Food Approved: {food.name}"
            message = f"Great news! Your food item '{food.name}' has been approved and is now visible to customers."
        else:
            subject = f"Food Rejected: {food.name}"
            message = (
                f"Your food item '{food.name}' has been rejected. Reason: {comments}"
            )

        if comments and action == "approved":
            message += f" Admin comments: {comments}"

        Notification.objects.create(
            user=food.chef, subject=subject, message=message, status="Unread"
        )


@api_view(["GET"])
def chef_food_status(request):
    """Get approval status of chef's submitted foods"""
    if not request.user:
        return Response(
            {"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED
        )

    chef_foods = Food.objects.filter(chef=request.user)

    from django.db.models import Count

    status_counts = chef_foods.values("status").annotate(count=Count("status"))

    recent_foods = chef_foods.order_by("-created_at")[:5]

    return Response(
        {
            "status_summary": {item["status"]: item["count"] for item in status_counts},
            "recent_submissions": FoodSerializer(
                recent_foods, many=True, context={"request": request}
            ).data,
            "total_foods": chef_foods.count(),
        }
    )


@api_view(["POST"])
@permission_classes([])  # Allow anonymous access
def calculate_delivery_fee_api(request):
    """
    Calculate delivery fee based on user location and kitchen location
    POST /api/food/delivery/calculate-fee/
    Body: {
        "user_latitude": 40.7128,
        "user_longitude": -74.0060,
        "chef_id": 1
    }
    """
    try:
        data = request.data
        user_lat = float(data.get("user_latitude"))
        user_lng = float(data.get("user_longitude"))
        chef_id = int(data.get("chef_id"))

        # Get chef's kitchen location
        try:
            from apps.users.models import Address

            kitchen_address = Address.objects.filter(
                user_id=chef_id, address_type="kitchen", is_active=True
            ).first()

            if not kitchen_address:
                return Response(
                    {"error": "Kitchen location not found for this chef"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            kitchen_lat = (
                float(kitchen_address.latitude) if kitchen_address.latitude else None
            )
            kitchen_lng = (
                float(kitchen_address.longitude) if kitchen_address.longitude else None
            )

            if not kitchen_lat or not kitchen_lng:
                return Response(
                    {"error": "Kitchen coordinates not available"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid kitchen location data"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate delivery fee
        fee_data = calculate_delivery_fee(user_lat, user_lng, kitchen_lat, kitchen_lng)

        # Validate delivery radius (default 25km)
        radius_validation = validate_delivery_radius(
            kitchen_lat, kitchen_lng, user_lat, user_lng
        )

        return Response(
            {
                **fee_data,
                "delivery_validation": radius_validation,
                "kitchen_location": {
                    "latitude": kitchen_lat,
                    "longitude": kitchen_lng,
                    "address": kitchen_address.full_address,
                },
            }
        )

    except (ValueError, TypeError, KeyError) as e:
        return Response(
            {"error": f"Invalid request data: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([])  # Allow anonymous access
def menu_with_filters(request):
    """
    Enhanced menu endpoint with advanced filtering
    GET /api/food/menu/?search=&min_price=&max_price=&categories=&cuisines=&dietary=&rating_min=&chef_ids=&user_lat=&user_lng=&page=
    """
    # Get query parameters
    search = request.GET.get("search", "").strip()
    min_price = request.GET.get("min_price")
    max_price = request.GET.get("max_price")
    categories = request.GET.getlist(
        "categories"
    )  # Can pass multiple: ?categories=1&categories=2
    cuisines = request.GET.getlist("cuisines")
    dietary = request.GET.getlist("dietary")  # vegetarian, vegan, gluten_free
    rating_min = request.GET.get("rating_min")
    chef_ids = request.GET.getlist("chef_ids")
    user_lat = request.GET.get("user_lat")
    user_lng = request.GET.get("user_lng")
    sort_by = request.GET.get("sort_by", "name")  # name, price, rating, distance
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 20))

    # Start with approved foods that are available
    foods = (
        Food.objects.filter(status="Approved", is_available=True)
        .select_related("food_category", "chef")
        .prefetch_related("prices")
    )

    # Apply search filter
    if search:
        foods = foods.filter(
            Q(name__icontains=search)
            | Q(description__icontains=search)
            | Q(chef__username__icontains=search)
            | Q(food_category__name__icontains=search)
        )

    # Apply price filter (look at food prices)
    if min_price or max_price:
        price_filter = Q()
        if min_price:
            price_filter &= Q(prices__price__gte=Decimal(min_price))
        if max_price:
            price_filter &= Q(prices__price__lte=Decimal(max_price))
        foods = foods.filter(price_filter).distinct()

    # Apply category filter
    if categories:
        foods = foods.filter(food_category__id__in=categories)

    # Apply cuisine filter
    if cuisines:
        foods = foods.filter(food_category__cuisine__id__in=cuisines)

    # Apply dietary filters
    if "vegetarian" in dietary:
        foods = foods.filter(is_vegetarian=True)
    if "vegan" in dietary:
        foods = foods.filter(is_vegan=True)
    if "gluten_free" in dietary:
        foods = foods.filter(is_gluten_free=True)

    # Apply rating filter
    if rating_min:
        foods = foods.filter(rating_average__gte=Decimal(rating_min))

    # Apply chef filter
    if chef_ids:
        foods = foods.filter(chef__user_id__in=chef_ids)

    # Sorting
    if sort_by == "price":
        foods = foods.annotate(min_price=Min("prices__price")).order_by("min_price")
    elif sort_by == "rating":
        foods = foods.order_by("-rating_average")
    elif sort_by == "distance" and user_lat and user_lng:
        # For distance sorting, we'll handle this in serializer
        pass
    else:
        foods = foods.order_by("name")

    # Pagination
    paginator = Paginator(foods, page_size)
    page_obj = paginator.get_page(page)

    # Serialize foods with location context for delivery fee calculation
    context = {"request": request}
    if user_lat and user_lng:
        context["user_location"] = {
            "latitude": float(user_lat),
            "longitude": float(user_lng),
        }

    serializer = FoodSerializer(page_obj.object_list, many=True, context=context)

    return Response(
        {
            "results": serializer.data,
            "count": paginator.count,
            "num_pages": paginator.num_pages,
            "current_page": page,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
        }
    )


@api_view(["GET"])
@permission_classes([])  # Allow anonymous access
def get_menu_filters_data(request):
    """
    Get available filter options for menu filtering
    GET /api/food/menu/filters/
    """
    # Get available cuisines
    cuisines = Cuisine.objects.filter(is_active=True).order_by("sort_order", "name")
    cuisine_data = CuisineSerializer(cuisines, many=True).data

    # Get available categories grouped by cuisine
    categories = (
        FoodCategory.objects.filter(is_active=True)
        .select_related("cuisine")
        .order_by("cuisine__name", "sort_order", "name")
    )
    category_data = FoodCategorySerializer(categories, many=True).data

    # Get price range from available food prices
    price_range = FoodPrice.objects.aggregate(
        min_price=Min("price"), max_price=Max("price")
    )

    # Get available chefs who have approved foods
    from django.contrib.auth import get_user_model

    User = get_user_model()
    active_chefs = (
        User.objects.filter(foods__status="Approved", is_active=True)
        .distinct()
        .values("user_id", "username")
    )

    return Response(
        {
            "cuisines": cuisine_data,
            "categories": category_data,
            "price_range": {
                "min": float(price_range["min_price"] or 0),
                "max": float(price_range["max_price"] or 1000),
            },
            "dietary_options": [
                {"value": "vegetarian", "label": "Vegetarian"},
                {"value": "vegan", "label": "Vegan"},
                {"value": "gluten_free", "label": "Gluten Free"},
            ],
            "spice_levels": [
                {"value": "mild", "label": "Mild"},
                {"value": "medium", "label": "Medium"},
                {"value": "hot", "label": "Hot"},
                {"value": "very_hot", "label": "Very Hot"},
            ],
            "sort_options": [
                {"value": "name", "label": "Name (A-Z)"},
                {"value": "price", "label": "Price (Low to High)"},
                {"value": "rating", "label": "Rating (High to Low)"},
                {"value": "distance", "label": "Distance (Near to Far)"},
            ],
            "active_chefs": list(active_chefs),
        }
    )
