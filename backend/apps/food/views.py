import logging

from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

logger = logging.getLogger(__name__)

from .models import Cuisine, Food, FoodCategory, FoodPrice, FoodReview, Offer
from .serializers import (
    ChefFoodCreateSerializer,
    ChefFoodPriceSerializer,
    CuisineSerializer,
    FoodCategorySerializer,
    FoodPriceSerializer,
    FoodReviewSerializer,
    FoodSerializer,
    OfferSerializer,
)


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
        # Get image URL using serializer method for consistency
        serializer = FoodSerializer(food)
        image_url = serializer.get_image_url(food)

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
        return Response({"url": result["secure_url"], "public_id": result["public_id"]})
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
        return Food.objects.filter(chef=self.request.user).prefetch_related("prices")

    def get_serializer_class(self):
        if self.action == "create":
            return ChefFoodCreateSerializer
        return FoodSerializer

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
            # Get image URL using serializer method for consistency
            serializer = FoodSerializer(food)
            image_url = serializer.get_image_url(food)

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


class FoodReviewViewSet(viewsets.ModelViewSet):
    queryset = FoodReview.objects.all()
    serializer_class = FoodReviewSerializer
    permission_classes = [IsAuthenticated]


class CustomerFoodViewSet(viewsets.ReadOnlyModelViewSet):
    """Customers can view approved foods - /api/customer/foods/"""

    serializer_class = FoodSerializer
    permission_classes = []  # Allow access to all users including guests
    pagination_class = None  # Disable pagination to show all foods

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

    def get_queryset(self):
        """Admin can access all foods"""
        if not self.request.user.is_staff:
            return Food.objects.none()

        # Get all foods for admin management
        queryset = Food.objects.all().order_by("-created_at")

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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def food_stats(request):
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
            FoodReview.objects.aggregate(avg_rating=Avg("rating"))["avg_rating"] or 0
        )

        # Price statistics
        price_stats = FoodPrice.objects.aggregate(
            avg_price=Avg("price"), min_price=Min("price"), max_price=Max("price")
        )

        # Recent submissions (last 7 days)
        from datetime import timedelta

        from django.utils import timezone

        week_ago = timezone.now() - timedelta(days=7)
        recent_submissions = Food.objects.filter(created_at__gte=week_ago).count()

        # Top categories by food count
        top_categories = FoodCategory.objects.annotate(
            food_count=Count("foods")
        ).order_by("-food_count")[:5]

        # Top cuisines by food count (through categories)
        top_cuisines = Cuisine.objects.annotate(
            food_count=Count("categories__foods")
        ).order_by("-food_count")[:5]

        return Response(
            {
                "total_foods": total_foods,
                "approved_foods": approved_foods,
                "pending_foods": pending_foods,
                "rejected_foods": rejected_foods,
                "total_categories": total_categories,
                "total_cuisines": total_cuisines,
                "average_rating": round(avg_rating, 2),
                "price_stats": {
                    "average_price": round(price_stats["avg_price"] or 0, 2),
                    "min_price": price_stats["min_price"] or 0,
                    "max_price": price_stats["max_price"] or 0,
                },
                "recent_submissions": recent_submissions,
                "top_categories": [
                    {"id": cat.id, "name": cat.name, "food_count": cat.food_count}
                    for cat in top_categories
                ],
                "top_cuisines": [
                    {
                        "id": cuisine.id,
                        "name": cuisine.name,
                        "food_count": cuisine.food_count,
                    }
                    for cuisine in top_cuisines
                ],
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        logger.error(f"Food stats error: {str(e)}", exc_info=True)
        return Response(
            {"error": "Failed to fetch food statistics", "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class OfferViewSet(viewsets.ModelViewSet):
    """Manage food offers and discounts"""

    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter offers based on user permissions"""
        user = self.request.user
        if user.is_staff or user.is_superuser:
            # Admin can see all offers
            return Offer.objects.all()
        else:
            # Regular users can only see their own offers (if they were chefs)
            return Offer.objects.filter(price__cook=user)

    def perform_create(self, serializer):
        """Set the creator when creating an offer"""
        serializer.save()

    @action(detail=False, methods=["get"])
    def active_offers(self, request):
        """Get all active (non-expired) offers"""
        from django.utils import timezone

        active_offers = self.get_queryset().filter(
            valid_until__gte=timezone.now().date()
        )
        serializer = self.get_serializer(active_offers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def expired_offers(self, request):
        """Get all expired offers"""
        from django.utils import timezone

        expired_offers = self.get_queryset().filter(
            valid_until__lt=timezone.now().date()
        )
        serializer = self.get_serializer(expired_offers, many=True)
        return Response(serializer.data)
