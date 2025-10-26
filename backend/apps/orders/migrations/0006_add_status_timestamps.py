# Generated manually for status tracking feature
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0005_separate_bulk_order_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='status_timestamps',
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text='Timestamps for each order status transition'
            ),
        ),
    ]

