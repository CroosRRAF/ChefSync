from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0010_remove_user_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='address',
            field=models.TextField(blank=True, help_text='Full address of the user', null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='gender',
            field=models.CharField(blank=True, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='phone_no',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
    ]
