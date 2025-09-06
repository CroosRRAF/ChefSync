from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profiles', views.UserProfileViewSet, basename='profiles')
router.register(r'chef-profiles', views.ChefProfileViewSet, basename='chef-profiles')
router.register(r'delivery-profiles', views.DeliveryProfileViewSet, basename='delivery-profiles')

urlpatterns = [
    path('', include(router.urls)),
]
