from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0010_fix_collaborationrequest_columns'),
    ]

    operations = [
        migrations.AddField(
            model_name='bulkorderassignment',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
    ]
