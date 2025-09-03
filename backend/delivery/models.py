from django.db import models
from django.conf import settings
from django.utils import timezone

# -----------------------------
# Order Model
# -----------------------------
class Order(models.Model):
    STATUS_CHOICES = [
        ("Placed", "Placed"),
        ("Preparing", "Preparing"),
        ("Ready", "Ready"),
        ("Out for Delivery", "Out for Delivery"),
        ("Delivered", "Delivered"),
        ("Cancelled", "Cancelled"),
    ]
    
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders"
    )
    food_item = models.CharField(max_length=255)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="Placed")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)  # Track last update

    def __str__(self):
        return f"Order {self.id} - {self.status}"


# -----------------------------
# Delivery Model
# -----------------------------
class Delivery(models.Model):
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Accepted", "Accepted"),
        ("Out for Delivery", "Out for Delivery"),
        ("Delivered", "Delivered")
    ]
    
    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="delivery"
    )
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deliveries"
    )
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="Pending")
    
    # Track timestamps for each stage
    assigned_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    picked_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Delivery for Order {self.order.id} - {self.status}"


# -----------------------------
# Optional: Delivery Notification
# -----------------------------
class DeliveryNotification(models.Model):
    delivery = models.ForeignKey(
        Delivery,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for Delivery {self.delivery.id}"