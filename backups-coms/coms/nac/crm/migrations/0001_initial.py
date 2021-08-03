# Generated by Django 2.2.7 on 2019-12-29 10:47

import crm.models
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BroadcastEmailAttachment',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('deleted', models.DateTimeField(blank=True, default=None, editable=False, null=True)),
                ('name', models.CharField(max_length=255)),
                ('file', models.FileField(upload_to=crm.models.email_attachment_path)),
                ('mime_type', models.CharField(max_length=100)),
            ],
            options={
                'db_table': 'broadcast_email_attachment',
            },
        ),
        migrations.CreateModel(
            name='LeadActivity',
            fields=[
                ('deleted', models.DateTimeField(blank=True, default=None, editable=False, null=True)),
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('lead_activity_type', models.IntegerField(choices=[(1, 'Phone Call'), (2, 'Email'), (3, 'Gallery Share Email'), (4, 'New Inbound'), (5, 'Sales Staff Appointment')])),
                ('activity_time', models.DateTimeField()),
                ('followup_date', models.DateField(blank=True, null=True)),
                ('followup_reminder_sent_time', models.DateTimeField(blank=True, null=True)),
                ('notes', models.TextField()),
                ('creator', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, related_name='created_by', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name_plural': 'Lead Activities',
                'db_table': 'lead_activity',
            },
        ),
        migrations.CreateModel(
            name='LeadActivityAttachment',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('deleted', models.DateTimeField(blank=True, default=None, editable=False, null=True)),
                ('attachment', models.FileField(blank=True, null=True, upload_to=crm.models.lead_activity_image_path)),
                ('activity', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='crm.LeadActivity')),
            ],
            options={
                'abstract': False,
                'base_manager_name': 'objects',
            },
        ),
    ]
