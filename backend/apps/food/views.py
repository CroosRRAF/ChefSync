from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Cuisine, FoodCategory, Food, FoodReview, FoodPrice, Offer
from .serializers import CuisineSerializer, FoodCategorySerializer, FoodSerializer, FoodReviewSerializer, FoodPriceSerializer, OfferSerializer


class CuisineViewSet(viewsets.ModelViewSet):
    queryset = Cuisine.objects.all()
    serializer_class = CuisineSerializer
    permission_classes = [IsAuthenticated]


class FoodCategoryViewSet(viewsets.ModelViewSet):
    queryset = FoodCategory.objects.all()
    serializer_class = FoodCategorySerializer
    permission_classes = [IsAuthenticated]


class FoodViewSet(viewsets.ModelViewSet):
    queryset = Food.objects.all()
    serializer_class = FoodSerializer
    permission_classes = [IsAuthenticated]


class FoodReviewViewSet(viewsets.ModelViewSet):
    queryset = FoodReview.objects.all()
    serializer_class = FoodReviewSerializer
    permission_classes = [IsAuthenticated]


class ChefFoodViewSet(viewsets.ModelViewSet):
    # """Chef can manage own menu"""
    serializer_class = FoodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Food.objects.filter(chef=self.request.user)

    def perform_create(self, serializer):
        # Chef submits food → needs admin approval
        serializer.save(chef=self.request.user, is_approved=False)

    @action(detail=False, methods=["get"])
    def search(self, request):
        q = request.query_params.get("q", "")
        foods = self.get_queryset().filter(
            Q(name__icontains=q) | Q(cuisine__name__icontains=q)
        )
        return Response(FoodSerializer(foods, many=True).data)


class FoodPriceViewSet(viewsets.ModelViewSet):
    queryset = FoodPrice.objects.all()
    serializer_class = FoodPriceSerializer
    permission_classes = [IsAuthenticated]


class OfferViewSet(viewsets.ModelViewSet):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    permission_classes = [IsAuthenticated]
