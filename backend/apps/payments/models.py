from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
import uuid


class Payment(models.Model):
    """Payment records for orders"""
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash on Delivery'),
        ('card', 'Credit/Debit Card'),
        ('online', 'Online Payment'),
        ('wallet', 'Digital Wallet'),
        ('bank_transfer', 'Bank Transfer'),
    ]
    
    PAYMENT_PROVIDER_CHOICES = [
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
        ('razorpay', 'Razorpay'),
        ('square', 'Square'),
        ('cash', 'Cash'),
        ('manual', 'Manual'),
    ]
    
    # Payment Identification
    payment_id = models.CharField(max_length=100, unique=True, db_index=True)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='payments')
    
    # Payment Details
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    currency = models.CharField(max_length=3, default='USD')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_provider = models.CharField(max_length=20, choices=PAYMENT_PROVIDER_CHOICES)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # Provider Details
    provider_payment_id = models.CharField(max_length=200, blank=True, help_text="Payment ID from payment provider")
    provider_transaction_id = models.CharField(max_length=200, blank=True, help_text="Transaction ID from payment provider")
    provider_response = models.JSONField(default=dict, blank=True, help_text="Raw response from payment provider")
    
    # Metadata
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.payment_id:
            self.payment_id = self.generate_payment_id()
        super().save(*args, **kwargs)
    
    def generate_payment_id(self):
        """Generate unique payment ID"""
        return f"PAY-{uuid.uuid4().hex[:8].upper()}"
    
    def __str__(self):
        return f"Payment {self.payment_id} - {self.amount} {self.currency}"
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order', 'status']),
            models.Index(fields=['payment_id']),
            models.Index(fields=['created_at']),
        ]


class Refund(models.Model):
    """Refund records for payments"""
    
    REFUND_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    REFUND_REASON_CHOICES = [
        ('customer_request', 'Customer Request'),
        ('order_cancelled', 'Order Cancelled'),
        ('quality_issue', 'Quality Issue'),
        ('delivery_issue', 'Delivery Issue'),
        ('duplicate_payment', 'Duplicate Payment'),
        ('fraud', 'Fraud'),
        ('other', 'Other'),
    ]
    
    # Refund Identification
    refund_id = models.CharField(max_length=100, unique=True, db_index=True)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='refunds')
    
    # Refund Details
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    reason = models.CharField(max_length=20, choices=REFUND_REASON_CHOICES)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=REFUND_STATUS_CHOICES, default='pending')
    
    # Provider Details
    provider_refund_id = models.CharField(max_length=200, blank=True, help_text="Refund ID from payment provider")
    provider_response = models.JSONField(default=dict, blank=True, help_text="Raw response from payment provider")
    
    # Processing
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, help_text="Internal notes about the refund")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.refund_id:
            self.refund_id = self.generate_refund_id()
        super().save(*args, **kwargs)
    
    def generate_refund_id(self):
        """Generate unique refund ID"""
        return f"REF-{uuid.uuid4().hex[:8].upper()}"
    
    def __str__(self):
        return f"Refund {self.refund_id} - {self.amount}"
    
    class Meta:
        db_table = 'refunds'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['payment', 'status']),
            models.Index(fields=['refund_id']),
            models.Index(fields=['created_at']),
        ]


class PaymentMethod(models.Model):
    """User's saved payment methods"""
    
    PAYMENT_METHOD_TYPES = [
        ('card', 'Credit/Debit Card'),
        ('bank_account', 'Bank Account'),
        ('wallet', 'Digital Wallet'),
    ]
    
    CARD_TYPES = [
        ('visa', 'Visa'),
        ('mastercard', 'Mastercard'),
        ('amex', 'American Express'),
        ('discover', 'Discover'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_methods')
    method_type = models.CharField(max_length=20, choices=PAYMENT_METHOD_TYPES)
    
    # Card Details (encrypted)
    card_last_four = models.CharField(max_length=4, blank=True)
    card_brand = models.CharField(max_length=20, choices=CARD_TYPES, blank=True)
    card_exp_month = models.PositiveIntegerField(blank=True, null=True)
    card_exp_year = models.PositiveIntegerField(blank=True, null=True)
    
    # Provider Details
    provider_payment_method_id = models.CharField(max_length=200, blank=True)
    provider_customer_id = models.CharField(max_length=200, blank=True)
    
    # Status
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        if self.method_type == 'card':
            return f"{self.card_brand.title()} ****{self.card_last_four}"
        return f"{self.get_method_type_display()}"
    
    class Meta:
        db_table = 'payment_methods'
        ordering = ['-is_default', '-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['provider_payment_method_id']),
        ]


class Transaction(models.Model):
    """Transaction log for all payment activities"""
    
    TRANSACTION_TYPES = [
        ('payment', 'Payment'),
        ('refund', 'Refund'),
        ('chargeback', 'Chargeback'),
        ('adjustment', 'Adjustment'),
    ]
    
    TRANSACTION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Transaction Identification
    transaction_id = models.CharField(max_length=100, unique=True, db_index=True)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    refund = models.ForeignKey(Refund, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    
    # Transaction Details
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=TRANSACTION_STATUS_CHOICES, default='pending')
    
    # Provider Details
    provider_transaction_id = models.CharField(max_length=200, blank=True)
    provider_response = models.JSONField(default=dict, blank=True)
    
    # Metadata
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.transaction_id:
            self.transaction_id = self.generate_transaction_id()
        super().save(*args, **kwargs)
    
    def generate_transaction_id(self):
        """Generate unique transaction ID"""
        return f"TXN-{uuid.uuid4().hex[:8].upper()}"
    
    def __str__(self):
        return f"Transaction {self.transaction_id} - {self.amount} {self.currency}"
    
    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['payment', 'status']),
            models.Index(fields=['refund', 'status']),
            models.Index(fields=['transaction_id']),
            models.Index(fields=['created_at']),
        ]