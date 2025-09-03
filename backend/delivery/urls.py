from django.urls import path
from . import views

urlpatterns = [
    path('deliveries/ready/', views.ready_deliveries, name='ready_deliveries'),
    path('deliveries/<int:pk>/accept/', views.accept_delivery, name='accept_delivery'),
    path('deliveries/<int:pk>/status/', views.update_status, name='update_status'),
]