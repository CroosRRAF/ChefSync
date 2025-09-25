import os
import django
import sys

# Add the project root to the Python path
sys.path.append('C:/Users/User/Documents/GIt/ChefSync/backend')

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.orders.models import BulkOrder
from apps.orders.serializers import BulkOrderListSerializer

# Test the serializer
print("Testing BulkOrder serializer...")

try:
    # Get some bulk orders from the database
    bulk_orders = BulkOrder.objects.all()[:5]  # Get first 5 records
    print(f"Found {bulk_orders.count()} bulk orders in database")
    
    if bulk_orders.exists():
        # Serialize the data
        serializer = BulkOrderListSerializer(bulk_orders, many=True)
        data = serializer.data
        
        print("Serialized data:")
        for i, order_data in enumerate(data[:2]):  # Show first 2 orders
            print(f"Order {i+1}:")
            print(f"  ID: {order_data.get('id')}")
            print(f"  Order Number: {order_data.get('order_number')}")
            print(f"  Customer Name: {order_data.get('customer_name')}")
            print(f"  Status: {order_data.get('status')}")
            print(f"  Event Type: {order_data.get('event_type')}")
            print(f"  Items: {len(order_data.get('items', []))}")
            print(f"  Collaborators: {len(order_data.get('collaborators', []))}")
            print()
        
        print(f"✅ Serializer working correctly! Returns list of {len(data)} items")
        print(f"✅ Each item has 'id' field: {all('id' in item for item in data)}")
        print(f"✅ Each item has 'customer_name' field: {all('customer_name' in item for item in data)}")
        
    else:
        print("⚠️ No bulk orders found in database. The API will return an empty array []")
        # Test empty serializer
        serializer = BulkOrderListSerializer([], many=True)
        data = serializer.data
        print(f"✅ Empty serializer works correctly: {data}")
        
except Exception as e:
    print(f"❌ Error testing serializer: {e}")
    import traceback
    traceback.print_exc()