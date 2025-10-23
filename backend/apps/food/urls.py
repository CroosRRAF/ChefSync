from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .bulk_menu_views import BulkMenuViewSet, BulkMenuItemViewSet

# Create router for ViewSets
router = DefaultRouter()
router.register(r'chef/foods', views.ChefFoodViewSet, basename='chef-foods')
router.register(r'chef/prices', views.ChefFoodPriceViewSet, basename='chef-prices')
router.register(r'customer/foods', views.CustomerFoodViewSet, basename='customer-foods')
router.register(r'cuisines', views.CuisineViewSet, basename='cuisines')
router.register(r'categories', views.FoodCategoryViewSet, basename='categories')
router.register(r'reviews', views.FoodReviewViewSet, basename='reviews')

# Bulk Menu Management URLs
router.register(r'bulk-menus', BulkMenuViewSet, basename='bulk-menus')
router.register(r'bulk-menu-items', BulkMenuItemViewSet, basename='bulk-menu-items')
router.register(r'offers', views.OfferViewSet, basename='offers')

# Admin approval endpoints
router.register(r'admin/approvals', views.AdminFoodApprovalViewSet, basename='admin-approvals')
router.register(r'admin/foods', views.AdminFoodViewSet, basename='admin-foods')

urlpatterns = [
    # Include all router URLs
    path('', include(router.urls)),
    
    # Global search endpoint for autocomplete
    path('search/', views.food_search, name='food-search'),
    
    # Simple test endpoint
    path('test/', views.food_list, name='food-list'),
    
    # Chef food status endpoint
    path('chef/status/', views.chef_food_status, name='chef-food-status'),
    
    # New delivery and menu endpoints
    path('delivery/calculate-fee/', views.calculate_delivery_fee_api, name='calculate-delivery-fee'),
    path('menu/', views.menu_with_filters, name='menu-with-filters'),
    path('menu/filters/', views.get_menu_filters_data, name='menu-filters-data'),
    
    # Image upload endpoint
    path('upload-image/', views.upload_image, name='upload-image'),
    
    # Image upload endpoint
    path('upload-image/', views.upload_image, name='upload-image'),
    
    # Food statistics endpoint
    path('stats/', views.AdminFoodApprovalViewSet.as_view({'get': 'stats'}), name='food-stats'),
]
