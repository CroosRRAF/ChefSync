#!/usr/bin/env python
"""
Create a test pending cook for approval testing
"""
import os
import django
import sys

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User, DocumentType, UserDocument
from django.utils import timezone
import random
import string

def create_test_cook():
    """Create a test cook pending approval"""
    
    # Generate random email to avoid conflicts
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    email = f"testcook_{random_suffix}@example.com"
    
    try:
        # Create the user
        cook = User.objects.create_user(
            email=email,
            password='testpass123',
            name=f'Test Cook {random_suffix.upper()}',
            role='cook',
            approval_status='pending',
            phone_no='+1234567890',
            address='123 Test Street, Test City'
        )
        
        print(f"✅ Created test cook: {cook.name} ({cook.email})")
        print(f"🆔 User ID: {cook.user_id}")
        print(f"📋 Status: {cook.approval_status}")
        
        # Add some test documents
        try:
            # Get or create some document types
            doc_types = []
            for doc_name in ['Identity Proof', 'Address Proof', 'Cooking Certificate']:
                doc_type, created = DocumentType.objects.get_or_create(
                    name=doc_name,
                    defaults={
                        'description': f'{doc_name} document',
                        'required_for_roles': ['cook'],
                        'max_file_size': 5242880,  # 5MB
                        'allowed_file_types': ['pdf', 'jpg', 'png']
                    }
                )
                doc_types.append(doc_type)
                if created:
                    print(f"📄 Created document type: {doc_name}")
            
            # Create test documents
            for i, doc_type in enumerate(doc_types):
                doc = UserDocument.objects.create(
                    user=cook,
                    document_type=doc_type,
                    file=f'test_documents/cook_{random_suffix}_{doc_type.name.lower().replace(" ", "_")}.pdf',
                    file_name=f'{doc_type.name.replace(" ", "_")}_test.pdf',
                    file_size=1024 * (i + 1),  # Different sizes
                    file_type='application/pdf',
                    status='approved',
                    is_visible_to_admin=True
                )
                print(f"📎 Created document: {doc.file_name} for {doc_type.name}")
        
        except Exception as e:
            print(f"⚠️ Warning: Could not create documents: {e}")
        
        print(f"\n🎯 Cook ready for approval testing!")
        print(f"📍 You can now test approval at: http://localhost:3000/admin/approvals")
        print(f"🔑 Admin credentials: admin@gmail.com / admin123")
        
        return cook
        
    except Exception as e:
        print(f"❌ Failed to create test cook: {e}")
        return None

def list_existing_pending_users():
    """List existing pending users"""
    pending_users = User.objects.filter(
        role__in=['cook', 'delivery_agent'], 
        approval_status='pending'
    )
    
    print(f"📊 Existing pending users ({pending_users.count()}):")
    for user in pending_users:
        print(f"  👤 {user.name} ({user.email}, {user.role}) - ID: {user.user_id}")
        print(f"      Documents: {user.documents.count()}")

if __name__ == '__main__':
    print("🧪 Creating Test Pending Cook")
    print("=" * 40)
    
    list_existing_pending_users()
    print()
    
    cook = create_test_cook()
    
    if cook:
        print("\n" + "=" * 40)
        print("🎉 Test cook created successfully!")
        print("Now you can test the approval functionality from the admin panel.")
    else:
        print("❌ Failed to create test cook")