# Generated by Django 2.2.7 on 2020-02-12 10:04

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('caravans', '0007_auto_20200212_2100'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='productionunit',
            options={'ordering': ('id',), 'verbose_name_plural': 'Schedule Unit'},
        ),
    ]