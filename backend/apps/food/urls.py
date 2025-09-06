from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'cuisines', views.CuisineViewSet, basename='cuisines')
router.register(r'categories', views.FoodCategoryViewSet, basename='categories')
router.register(r'foods', views.FoodViewSet, basename='foods')
router.register(r'reviews', views.FoodReviewViewSet, basename='reviews')

urlpatterns = [
    path('', include(router.urls)),
]
