# Generated by Django 2.2.7 on 2019-12-29 10:47

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import production.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('production', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PortalImageCollection',
            fields=[
                ('deleted', models.DateTimeField(blank=True, default=None, editable=False, null=True)),
                ('build', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, serialize=False, to='production.Build')),
                ('url_hash', models.CharField(max_length=255, verbose_name='URL Hash')),
                ('num_visits', models.IntegerField(default=0)),
            ],
            options={
                'verbose_name': 'Portal Image Collection',
                'db_table': 'portal_image_collection',
            },
        ),
        migrations.CreateModel(
            name='PortalImage',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('deleted', models.DateTimeField(blank=True, default=None, editable=False, null=True)),
                ('image_file', models.ImageField(max_length=255, upload_to=production.models._invoke_image_file_path)),
                ('recorded_on', models.DateTimeField()),
                ('is_shared', models.BooleanField(default=False)),
                ('image_collection', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='portal.PortalImageCollection', verbose_name='Portal Image Collection')),
                ('recorded_by', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Portal Image',
                'db_table': 'portal_image',
            },
        ),
    ]
