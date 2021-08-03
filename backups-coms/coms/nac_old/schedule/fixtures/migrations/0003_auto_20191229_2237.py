# Generated by Django 2.2.7 on 2019-12-29 11:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('schedule', '0002_auto_20191229_2211'),
    ]

    operations = [
        migrations.AddField(
            model_name='ordertransport',
            name='aluminium',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='ordertransport',
            name='aluminium_comments',
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name='ordertransport',
            name='finishing',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='ordertransport',
            name='finishing_comments',
            field=models.TextField(null=True),
        ),
    ]