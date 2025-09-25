import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User
from apps.authentication.serializers import UserApprovalSerializer

# Test the serializer directly
pending_users = User.objects.filter(role__in=['cook', 'delivery_agent'], approval_status='pending')
print(f'Found {pending_users.count()} pending users')

for user in pending_users:
    serializer = UserApprovalSerializer(user)
    data = serializer.data
    print(f'User: {user.name}, Data keys: {list(data.keys()) if hasattr(data, "keys") else "Not a dict"}')
    documents = data.get("documents", []) if hasattr(data, "get") else getattr(data, "documents", [])
    print(f'Documents count: {len(documents)}')

# Test the view response format
if pending_users.exists():
    serializer = UserApprovalSerializer(pending_users, many=True)
    data = serializer.data
    response_format = {'users': data}
    print(f'Response format keys: {list(response_format.keys())}')
    print(f'Users array length: {len(response_format["users"])}')