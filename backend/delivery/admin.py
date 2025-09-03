from django.contrib import admin
from .models import Order, Delivery, DeliveryNotification

# Register your models here.
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'food_item', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('customer__username', 'food_item')

@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'agent', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('order__id', 'agent__username')

@admin.register(DeliveryNotification)
class DeliveryNotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'delivery', 'message', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('message',)
