# Generated manually for DeliveryChat model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0006_add_status_timestamps'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DeliveryChat',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message_id', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('message', models.TextField()),
                ('message_type', models.CharField(
                    choices=[('text', 'Text'), ('location', 'Location'), ('image', 'Image')],
                    default='text',
                    max_length=20
                )),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('order', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='chat_messages',
                    to='orders.order'
                )),
                ('sender', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='sent_delivery_messages',
                    to=settings.AUTH_USER_MODEL
                )),
                ('receiver', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='received_delivery_messages',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'db_table': 'delivery_chats',
                'ordering': ['-created_at'],
            },
        ),
    ]

