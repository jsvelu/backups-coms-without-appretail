# Generated by Django 2.2.7 on 2020-02-13 08:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('schedule', '0012_auto_20200213_1914'),
        ('caravans', '0009_auto_20200212_2124'),
    ]

    operations = [
        migrations.AlterField(
            model_name='series',
            name='production_unit',
            field=models.IntegerField(choices=[(1, 'Schedule I'), (2, 'Schedule II')]),
        ),
        migrations.DeleteModel(
            name='ProductionUnit',
        ),
    ]