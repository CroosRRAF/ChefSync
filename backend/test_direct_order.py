#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.orders.models import CartItem, Order
from apps.food.models import Food, FoodPrice
from apps.authentication.models import Cook

User = get_user_model()

def test_order_placement_logic():
    """Test the order placement logic directly"""
    print("Testing order placement logic...")
    
    # Check if we have a customer
    try:
        customer = User.objects.get(username='testcustomer')
        print(f"Found customer: {customer.username}")
    except User.DoesNotExist:
        print("No customer found. Let's create one.")
        customer = User.objects.create_user(
            username='testcustomer',
            email='customer@test.com',
            password='testpass123'
        )
        print(f"Created customer: {customer.username}")
    
    # Check if we have a chef
    try:
        chef = User.objects.get(username='testchef')
        print(f"Found chef: {chef.username}")
    except User.DoesNotExist:
        print("No chef found. Let's create one.")
        chef = User.objects.create_user(
            username='testchef',
            email='chef@test.com',
            password='testpass123'
        )
        # Also create cook profile
        Cook.objects.create(
            user=chef,
            name='Test Chef',
            email='chef@test.com',
            kitchen_location='19.076,72.8777'
        )
        print(f"Created chef: {chef.username}")
    
    # Check cart items
    cart_items = CartItem.objects.filter(customer=customer)
    print(f"Cart items for customer: {cart_items.count()}")
    
    if not cart_items.exists():
        # Try to add some items to cart
        food_prices = FoodPrice.objects.filter(food__status='Approved')[:2]
        print(f"Available food prices: {food_prices.count()}")
        
        if food_prices.exists():
            for food_price in food_prices:
                CartItem.objects.create(
                    customer=customer,
                    price=food_price,
                    quantity=1,
                    # total_price is calculated automatically as a property
                )
                print(f"Added to cart: {food_price.food.name}")
            
            cart_items = CartItem.objects.filter(customer=customer)
            print(f"Cart items after adding: {cart_items.count()}")
        else:
            print("No food prices available. Cannot test order placement.")
            return False
    
    # Test calculation logic
    from decimal import Decimal
    subtotal = sum(item.total_price for item in cart_items)
    tax_amount = round(subtotal * Decimal('0.10'), 2)
    delivery_fee = Decimal('50.00')  # Assuming <= 5km
    total_amount = subtotal + tax_amount + delivery_fee
    
    print(f"Order calculations:")
    print(f"  Subtotal: ₹{subtotal}")
    print(f"  Tax (10%): ₹{tax_amount}")
    print(f"  Delivery fee: ₹{delivery_fee}")
    print(f"  Total: ₹{total_amount}")
    
    # Try to create order directly
    try:
        order = Order.objects.create(
            customer=customer,
            chef=chef,
            status='pending',
            payment_method='cash',
            subtotal=subtotal,
            tax_amount=tax_amount,
            delivery_fee=delivery_fee,
            total_amount=total_amount,
            delivery_latitude=19.076,
            delivery_longitude=72.8777,
            distance_km=1.5,
            customer_notes='Test order'
        )
        print(f"Order created successfully: {order.order_number}")
        
        # Create order items
        from apps.orders.models import OrderItem
        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                price=cart_item.price,
                quantity=cart_item.quantity,
                special_instructions=cart_item.special_instructions or ''
            )
        
        print(f"Order items created: {order.items.count()}")
        return True
        
    except Exception as e:
        print(f"Error creating order: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_order_placement_logic()
    print(f"\nTest {'PASSED' if success else 'FAILED'}")