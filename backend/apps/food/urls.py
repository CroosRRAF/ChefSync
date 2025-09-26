from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'chef/foods', views.ChefFoodViewSet, basename='chef-foods')
router.register(r'chef/prices', views.ChefFoodPriceViewSet, basename='chef-prices')
router.register(r'customer/foods', views.CustomerFoodViewSet, basename='customer-foods')
router.register(r'cuisines', views.CuisineViewSet, basename='cuisines')
router.register(r'categories', views.FoodCategoryViewSet, basename='categories')
router.register(r'reviews', views.FoodReviewViewSet, basename='reviews')
router.register(r'offers', views.OfferViewSet, basename='offers')

# Admin approval endpoints
router.register(r'admin/approvals', views.AdminFoodApprovalViewSet, basename='admin-approvals')

urlpatterns = [
    # Include all router URLs
    path('', include(router.urls)),
    
    # Global search endpoint for autocomplete
    path('search/', views.food_search, name='food-search'),
    
    # Simple test endpoint
    path('test/', views.food_list, name='food-list'),
    
    # Chef food status endpoint
    path('chef/status/', views.chef_food_status, name='chef-food-status'),
    
    # Image upload endpoint
    path('upload-image/', views.upload_image, name='upload-image'),
]
