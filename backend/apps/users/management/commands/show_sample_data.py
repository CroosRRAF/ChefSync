from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import ChefProfile
from apps.food.models import Food, FoodPrice, Cuisine
from apps.orders.models import Order, OrderItem

User = get_user_model()

class Command(BaseCommand):
    help = 'Display summary of all sample data created'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== CHEFSYNC SAMPLE DATA SUMMARY ==='))
        
        # Cuisines
        cuisines = Cuisine.objects.all()
        self.stdout.write(f'\n🍽️  CUISINES ({cuisines.count()}):')
        for cuisine in cuisines:
            self.stdout.write(f'  - {cuisine.name}: {cuisine.description}')
        
        # Chefs
        chefs = User.objects.filter(role='cook', chef_profile__approval_status='approved')
        self.stdout.write(f'\n👨‍🍳 APPROVED CHEFS ({chefs.count()}):')
        for chef in chefs:
            profile = chef.chef_profile
            foods_count = Food.objects.filter(chef=chef).count()
            self.stdout.write(f'  - {chef.username} ({chef.name})')
            self.stdout.write(f'    Specialties: {", ".join(profile.specialty_cuisines)}')
            self.stdout.write(f'    Experience: {profile.experience_years} years')
            self.stdout.write(f'    Food Items: {foods_count}')
            self.stdout.write(f'    Rating: {profile.rating_average}/5.0')
        
        # Foods
        foods = Food.objects.filter(status='Approved')
        self.stdout.write(f'\n🍕 FOOD ITEMS ({foods.count()}):')
        for food in foods:
            prices = FoodPrice.objects.filter(food=food)
            price_info = ', '.join([f'{p.size}: ${p.price}' for p in prices])
            self.stdout.write(f'  - {food.name} by {food.chef.username}')
            self.stdout.write(f'    Category: {food.category} | Prep: {food.preparation_time}min')
            self.stdout.write(f'    Prices: {price_info}')
            if food.spice_level:
                self.stdout.write(f'    Spice Level: {food.spice_level}')
        
        # Orders
        orders = Order.objects.all()
        self.stdout.write(f'\n📦 ORDERS ({orders.count()}):')
        for order in orders:
            items_count = OrderItem.objects.filter(order=order).count()
            self.stdout.write(f'  - {order.order_number} ({order.status})')
            self.stdout.write(f'    Customer: {order.customer.name}')
            self.stdout.write(f'    Chef: {order.chef.username}')
            self.stdout.write(f'    Items: {items_count} | Total: ${order.total_amount}')
            self.stdout.write(f'    Created: {order.created_at.strftime("%Y-%m-%d")}')
        
        # Summary
        total_prices = FoodPrice.objects.count()
        total_order_items = OrderItem.objects.count()
        
        self.stdout.write(f'\n📊 SUMMARY:')
        self.stdout.write(f'  Cuisines: {cuisines.count()}')
        self.stdout.write(f'  Chefs: {chefs.count()}')
        self.stdout.write(f'  Food Items: {foods.count()}')
        self.stdout.write(f'  Food Prices: {total_prices}')
        self.stdout.write(f'  Orders: {orders.count()}')
        self.stdout.write(f'  Order Items: {total_order_items}')
        
        self.stdout.write(self.style.SUCCESS('\n✅ Sample data verification complete!'))