# Generated manually for separating BulkOrder fields

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('orders', '0004_bulkorder_order'),
    ]

    operations = [
        # Make order field nullable for backward compatibility
        migrations.AlterField(
            model_name='bulkorder',
            name='order',
            field=models.ForeignKey(
                blank=True, 
                null=True, 
                on_delete=django.db.models.deletion.SET_NULL, 
                related_name='bulk_orders', 
                to='orders.order'
            ),
        ),
        
        # Add order_number field
        migrations.AddField(
            model_name='bulkorder',
            name='order_number',
            field=models.CharField(
                blank=True, 
                db_index=True, 
                max_length=50, 
                null=True, 
                unique=True
            ),
        ),
        
        # Add customer field (separate from created_by)
        migrations.AddField(
            model_name='bulkorder',
            name='customer',
            field=models.ForeignKey(
                blank=True,
                help_text='Customer who placed the bulk order',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='bulk_orders_as_customer',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        
        # Add chef field
        migrations.AddField(
            model_name='bulkorder',
            name='chef',
            field=models.ForeignKey(
                blank=True,
                help_text='Chef assigned to this bulk order',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='bulk_orders_as_chef',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        
        # Add delivery_partner field
        migrations.AddField(
            model_name='bulkorder',
            name='delivery_partner',
            field=models.ForeignKey(
                blank=True,
                help_text='Delivery agent assigned to this bulk order',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='bulk_delivery_orders',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        
        # Add payment_status field
        migrations.AddField(
            model_name='bulkorder',
            name='payment_status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'), 
                    ('paid', 'Paid'), 
                    ('failed', 'Failed'), 
                    ('refunded', 'Refunded')
                ],
                default='pending',
                max_length=20
            ),
        ),
        
        # Add subtotal field
        migrations.AddField(
            model_name='bulkorder',
            name='subtotal',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        
        # Add delivery_fee field
        migrations.AddField(
            model_name='bulkorder',
            name='delivery_fee',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        
        # Add order_type field
        migrations.AddField(
            model_name='bulkorder',
            name='order_type',
            field=models.CharField(
                choices=[('delivery', 'Delivery'), ('pickup', 'Pickup')],
                default='delivery',
                help_text='Whether this is a delivery or pickup order',
                max_length=20
            ),
        ),
        
        # Add delivery_address field
        migrations.AddField(
            model_name='bulkorder',
            name='delivery_address',
            field=models.TextField(blank=True, null=True),
        ),
        
        # Add delivery_latitude field
        migrations.AddField(
            model_name='bulkorder',
            name='delivery_latitude',
            field=models.DecimalField(
                blank=True, 
                decimal_places=8, 
                max_digits=10, 
                null=True
            ),
        ),
        
        # Add delivery_longitude field
        migrations.AddField(
            model_name='bulkorder',
            name='delivery_longitude',
            field=models.DecimalField(
                blank=True, 
                decimal_places=8, 
                max_digits=11, 
                null=True
            ),
        ),
        
        # Add distance_km field
        migrations.AddField(
            model_name='bulkorder',
            name='distance_km',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text='Distance from kitchen to delivery address in km',
                max_digits=5,
                null=True
            ),
        ),
        
        # Add event_date field
        migrations.AddField(
            model_name='bulkorder',
            name='event_date',
            field=models.DateField(
                blank=True, 
                help_text='Date of the event', 
                null=True
            ),
        ),
        
        # Add event_time field
        migrations.AddField(
            model_name='bulkorder',
            name='event_time',
            field=models.TimeField(
                blank=True, 
                help_text='Time of the event', 
                null=True
            ),
        ),
        
        # Add num_persons field
        migrations.AddField(
            model_name='bulkorder',
            name='num_persons',
            field=models.PositiveIntegerField(
                default=0, 
                help_text='Number of persons for the event'
            ),
        ),
        
        # Add menu_name field
        migrations.AddField(
            model_name='bulkorder',
            name='menu_name',
            field=models.CharField(
                blank=True, 
                help_text='Name of the bulk menu', 
                max_length=255, 
                null=True
            ),
        ),
        
        # Add customer_notes field
        migrations.AddField(
            model_name='bulkorder',
            name='customer_notes',
            field=models.TextField(
                blank=True, 
                help_text='Special instructions from customer', 
                null=True
            ),
        ),
        
        # Add chef_notes field
        migrations.AddField(
            model_name='bulkorder',
            name='chef_notes',
            field=models.TextField(
                blank=True, 
                help_text='Notes from chef', 
                null=True
            ),
        ),
        
        # Add confirmed_at field
        migrations.AddField(
            model_name='bulkorder',
            name='confirmed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        
        # Add estimated_delivery_time field
        migrations.AddField(
            model_name='bulkorder',
            name='estimated_delivery_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
        
        # Add actual_delivery_time field
        migrations.AddField(
            model_name='bulkorder',
            name='actual_delivery_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
        
        # Add indexes
        migrations.AddIndex(
            model_name='bulkorder',
            index=models.Index(fields=['customer', 'status'], name='BulkOrder_custome_idx'),
        ),
        migrations.AddIndex(
            model_name='bulkorder',
            index=models.Index(fields=['chef', 'status'], name='BulkOrder_chef_st_idx'),
        ),
    ]
