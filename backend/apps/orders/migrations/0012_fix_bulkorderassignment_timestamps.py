from django.db import migrations


def add_updated_at_if_missing(apps, schema_editor):
    from django.db import connection
    with connection.cursor() as cursor:
        try:
            cursor.execute("ALTER TABLE `BulkOrderAssignment` ADD COLUMN `updated_at` DATETIME NULL;")
        except Exception:
            # If column exists or any other issue, ignore to keep migration idempotent
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0011_add_created_at_bulkorderassignment'),
    ]

    operations = [
        migrations.RunPython(add_updated_at_if_missing, reverse_code=migrations.RunPython.noop),
    ]
