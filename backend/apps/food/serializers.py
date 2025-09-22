from rest_framework import serializers
from .models import Cuisine, FoodCategory, Food, FoodReview, FoodPrice, Offer


class CuisineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuisine
        fields = '__all__'


class FoodCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodCategory
        fields = '__all__'


class FoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Food
        fields = '__all__'


class FoodReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodReview
        fields = '__all__'


class FoodPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodPrice
        fields = ['price_id', 'size', 'price', 'image_url', 'food', 'cook', 'created_at', 'updated_at']


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = '__all__'
