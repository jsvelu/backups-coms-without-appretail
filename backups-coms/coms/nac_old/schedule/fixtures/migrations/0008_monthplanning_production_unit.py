# Generated by Django 2.2.7 on 2020-02-06 10:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('schedule', '0007_delete_productionunit'),
    ]

    operations = [
        migrations.AddField(
            model_name='monthplanning',
            name='production_unit',
            field=models.IntegerField(choices=[(1, 'Schedule I'), (2, 'Schedule II')], default=1),
            preserve_default=False,
        ),
    ]
