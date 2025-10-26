# Generated migration to add order field to BulkOrder

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0003_order_order_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='bulkorder',
            name='order',
            field=models.ForeignKey(
                default=1,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='bulk_orders',
                to='orders.order'
            ),
            preserve_default=False,
        ),
    ]

