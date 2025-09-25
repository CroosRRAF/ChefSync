from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import ChefProfile
from apps.food.models import Food, FoodPrice
from apps.orders.models import Order, OrderItem

User = get_user_model()

class Command(BaseCommand):
    help = 'Verify the created sample cook data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Sample Cook Data Verification ==='))
        
        # Check Chefs
        chefs = User.objects.filter(role='cook')
        self.stdout.write(f'\n📍 Total Chefs Created: {chefs.count()}')
        for chef in chefs:
            profile = getattr(chef, 'chef_profile', None)
            if profile:
                self.stdout.write(f'  👨‍🍳 {chef.name} (@{chef.username}) - {profile.specialty_cuisines} - {profile.experience_years} years exp')
        
        # Check Foods
        foods = Food.objects.filter(chef__role='cook')
        self.stdout.write(f'\n🍽️ Total Foods Created: {foods.count()}')
        for food in foods:
            prices = food.prices.all()
            price_info = ', '.join([f'{p.size}: ${p.price}' for p in prices])
            self.stdout.write(f'  🥘 {food.name} by {food.chef.name} - [{price_info}]')
        
        # Check FoodPrices
        food_prices = FoodPrice.objects.all()
        self.stdout.write(f'\n💰 Total Food Prices Created: {food_prices.count()}')
        
        # Check Orders
        orders = Order.objects.all()
        self.stdout.write(f'\n📋 Total Orders Created: {orders.count()}')
        for order in orders:
            items = order.items.all()
            items_info = ', '.join([f'{item.quantity}x {item.food_name}' for item in items])
            self.stdout.write(f'  📦 {order.order_number} - {order.customer.name} → {order.chef.name} - [{items_info}] - ${order.total_amount}')
        
        # Check OrderItems
        order_items = OrderItem.objects.all()
        self.stdout.write(f'\n🛒 Total Order Items Created: {order_items.count()}')
        
        self.stdout.write(self.style.SUCCESS('\n✅ Verification Complete!'))