# Generated by Django 2.2.7 on 2020-02-06 14:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('schedule', '0009_auto_20200206_2150'),
    ]

    operations = [
        migrations.AddField(
            model_name='capacity',
            name='production_unit',
            field=models.IntegerField(choices=[(1, 'Schedule I'), (2, 'Schedule II')], default=1),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='capacity',
            name='day',
            field=models.DateField(verbose_name='Day'),
        ),
        migrations.AlterUniqueTogether(
            name='capacity',
            unique_together={('day', 'production_unit')},
        ),
    ]
