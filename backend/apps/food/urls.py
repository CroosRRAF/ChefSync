from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.food.views import ChefFoodViewSet
from . import views

router = DefaultRouter()
router.register(r'cuisines', views.CuisineViewSet, basename='cuisines')
router.register(r'categories', views.FoodCategoryViewSet, basename='categories')
router.register(r'foods', views.FoodViewSet, basename='foods')
router.register(r'reviews', views.FoodReviewViewSet, basename='reviews')
router.register(r'prices', views.FoodPriceViewSet, basename='prices')
router.register(r'offers', views.OfferViewSet, basename='offers')


router.register(r"chef/foods", ChefFoodViewSet, basename="chef-foods")


urlpatterns = [
    path('', include(router.urls)),
]
