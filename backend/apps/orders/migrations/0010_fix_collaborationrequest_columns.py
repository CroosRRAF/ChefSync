from django.db import migrations


def add_missing_columns_and_constraints(apps, schema_editor):
    from django.db import connection
    with connection.cursor() as cursor:
        # Add bulk_order_id column if missing
        try:
            cursor.execute("ALTER TABLE `CollaborationRequest` ADD COLUMN `bulk_order_id` INT NULL;")
        except Exception:
            pass
        # Add from_user_id and to_user_id if missing
        try:
            cursor.execute("ALTER TABLE `CollaborationRequest` ADD COLUMN `from_user_id` INT NULL;")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE `CollaborationRequest` ADD COLUMN `to_user_id` INT NULL;")
        except Exception:
            pass
        # Add foreign key constraints (ignore if fail)
        try:
            cursor.execute("ALTER TABLE `CollaborationRequest` ADD CONSTRAINT `fk_collab_bulkorder` FOREIGN KEY (`bulk_order_id`) REFERENCES `BulkOrder`(`bulk_order_id`) ON DELETE CASCADE;")
        except Exception:
            pass
        try:
            # Attempt to find auth user table name
            cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name LIKE 'auth_user' LIMIT 1;")
            row = cursor.fetchone()
            user_table = row[0] if row else 'auth_user'
            cursor.execute(f"ALTER TABLE `CollaborationRequest` ADD CONSTRAINT `fk_collab_from_user` FOREIGN KEY (`from_user_id`) REFERENCES `{user_table}`(`id`) ON DELETE CASCADE;")
        except Exception:
            pass
        try:
            cursor.execute(f"ALTER TABLE `CollaborationRequest` ADD CONSTRAINT `fk_collab_to_user` FOREIGN KEY (`to_user_id`) REFERENCES `{user_table}`(`id`) ON DELETE CASCADE;")
        except Exception:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0009_collaborationrequest_alter_deliverychat_options_and_more'),
    ]

    operations = [
        migrations.RunPython(add_missing_columns_and_constraints, reverse_code=migrations.RunPython.noop),
    ]
