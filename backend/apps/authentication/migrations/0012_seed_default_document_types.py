from django.db import migrations

COOK_DOCUMENTS = [
    {
        "name": "Food Safety Certificate",
        "description": "Valid food safety certification from a recognized authority",
        "is_required": True,
        "allowed_file_types": ["pdf", "jpg", "jpeg", "png"],
        "max_file_size_mb": 5,
        "is_single_page_only": False,
        "max_pages": 5,
    },
    {
        "name": "Culinary Certification",
        "description": "Professional culinary certification or diploma",
        "is_required": True,
        "allowed_file_types": ["pdf", "jpg", "jpeg", "png"],
        "max_file_size_mb": 5,
        "is_single_page_only": False,
        "max_pages": 5,
    },
    {
        "name": "Health Certificate",
        "description": "Medical health certificate for food handling",
        "is_required": True,
        "allowed_file_types": ["pdf", "jpg", "jpeg", "png"],
        "max_file_size_mb": 5,
        "is_single_page_only": False,
        "max_pages": 5,
    },
    {
        "name": "Portfolio/Work Samples",
        "description": "Photos or documents showcasing cooking skills and experience",
        "is_required": False,
        "allowed_file_types": ["jpg", "jpeg", "png", "pdf"],
        "max_file_size_mb": 15,
        "is_single_page_only": False,
        "max_pages": 10,
    },
]

DELIVERY_DOCUMENTS = [
    {
        "name": "Driving License",
        "description": "Valid driving license for vehicle operation",
        "is_required": True,
        "allowed_file_types": ["pdf", "jpg", "jpeg", "png"],
        "max_file_size_mb": 5,
        "is_single_page_only": False,
        "max_pages": 5,
    },
    {
        "name": "Vehicle Registration",
        "description": "Vehicle registration document for delivery vehicle",
        "is_required": True,
        "allowed_file_types": ["pdf", "jpg", "jpeg", "png"],
        "max_file_size_mb": 5,
        "is_single_page_only": False,
        "max_pages": 5,
    },
    {
        "name": "Insurance Certificate",
        "description": "Vehicle insurance certificate",
        "is_required": True,
        "allowed_file_types": ["pdf", "jpg", "jpeg", "png"],
        "max_file_size_mb": 5,
        "is_single_page_only": False,
        "max_pages": 5,
    },
    {
        "name": "Background Check",
        "description": "Criminal background check or police clearance",
        "is_required": False,
        "allowed_file_types": ["pdf", "jpg", "jpeg", "png"],
        "max_file_size_mb": 5,
        "is_single_page_only": False,
        "max_pages": 5,
    },
]


def seed_document_types(apps, schema_editor):
    DocumentType = apps.get_model("authentication", "DocumentType")
    payloads = []
    for doc in COOK_DOCUMENTS:
        payload = doc.copy()
        payload["category"] = "cook"
        payloads.append(payload)
    for doc in DELIVERY_DOCUMENTS:
        payload = doc.copy()
        payload["category"] = "delivery_agent"
        payloads.append(payload)

    for data in payloads:
        DocumentType.objects.update_or_create(
            name=data["name"],
            category=data["category"],
            defaults=data,
        )


def unseed_document_types(apps, schema_editor):
    DocumentType = apps.get_model("authentication", "DocumentType")
    names = [doc["name"] for doc in COOK_DOCUMENTS + DELIVERY_DOCUMENTS]
    DocumentType.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0011_restore_user_contact_fields"),
    ]

    operations = [
        migrations.RunPython(seed_document_types, reverse_code=unseed_document_types),
    ]
