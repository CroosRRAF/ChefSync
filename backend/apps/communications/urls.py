from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'communications', views.CommunicationViewSet)
router.register(r'responses', views.CommunicationResponseViewSet)
router.register(r'templates', views.CommunicationTemplateViewSet)
router.register(r'categories', views.CommunicationCategoryViewSet)
router.register(r'tags', views.CommunicationTagViewSet)
router.register(r'notifications', views.NotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]