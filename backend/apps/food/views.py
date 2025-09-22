from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
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


class FoodPriceViewSet(viewsets.ModelViewSet):
    queryset = FoodPrice.objects.all()
    serializer_class = FoodPriceSerializer
    permission_classes = [IsAuthenticated]


class OfferViewSet(viewsets.ModelViewSet):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    permission_classes = [IsAuthenticated]