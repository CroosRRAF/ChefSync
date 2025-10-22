from django.contrib import admin
from .models import Order, OrderItem, OrderStatusHistory, CartItem, Delivery, BulkOrder, BulkOrderAssignment

# Register Order model
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'customer', 'chef', 'status', 'payment_status', 'total_amount', 'created_at']
    list_filter = ['status', 'payment_status', 'created_at']
    search_fields = ['order_number', 'customer__username', 'chef__username']
    readonly_fields = ['order_number', 'created_at', 'updated_at']

# Register other order-related models
@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order_item_id', 'order', 'quantity', 'unit_price', 'total_price']
    list_filter = ['created_at']
    search_fields = ['order__order_number']

@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['order', 'status', 'changed_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['order__order_number']

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['customer', 'quantity', 'created_at']
    list_filter = ['created_at']
    search_fields = ['customer__username']

@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ['delivery_id', 'order', 'status', 'agent', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['order__order_number']

# Register BulkOrder models
@admin.register(BulkOrder)
class BulkOrderAdmin(admin.ModelAdmin):
    list_display = ['bulk_order_id', 'status', 'total_quantity', 'created_by', 'created_at', 'deadline']
    list_filter = ['status', 'created_at', 'deadline']
    search_fields = ['bulk_order_id', 'description', 'created_by__username']
    readonly_fields = ['bulk_order_id', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    autocomplete_fields = ['created_by']
    
    fieldsets = (
        ('Order Information', {
            'fields': ('bulk_order_id', 'status', 'total_quantity')
        }),
        ('Details', {
            'fields': ('description', 'deadline', 'created_by', 'order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('created_by', 'order')

@admin.register(BulkOrderAssignment)
class BulkOrderAssignmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'bulk_order', 'chef', 'get_bulk_order_status']
    list_filter = ['bulk_order__status']
    search_fields = ['bulk_order__bulk_order_id', 'chef__username', 'chef__email']
    autocomplete_fields = ['chef']
    
    def get_bulk_order_status(self, obj):
        return obj.bulk_order.get_status_display() if hasattr(obj.bulk_order, 'get_status_display') else obj.bulk_order.status
    get_bulk_order_status.short_description = 'Bulk Order Status'
    get_bulk_order_status.admin_order_field = 'bulk_order__status'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('bulk_order', 'chef')
