from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profiles', views.UserProfileViewSet, basename='profiles')
router.register(r'chef-profiles', views.ChefProfileViewSet, basename='chef-profiles')
router.register(r'delivery-profiles', views.DeliveryProfileViewSet, basename='delivery-profiles')

# Address management
router.register(r'addresses', views.AddressViewSet, basename='address')
router.register(r'customer-addresses', views.CustomerAddressViewSet, basename='customer-address')
router.register(r'kitchen-locations', views.KitchenLocationViewSet, basename='kitchen-location')
router.register(r'delivery-locations', views.DeliveryAgentLocationViewSet, basename='delivery-location')

urlpatterns = [
    path('', include(router.urls)),
]
