# Generated by Django 2.2.7 on 2020-11-09 12:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('caravans', '0027_auto_20201019_2144'),
    ]

    operations = [
        # migrations.RemoveField(
        #     model_name='series',
        #     name='avg_ball_weight_max',
        # ),
        # migrations.RemoveField(
        #     model_name='series',
        #     name='avg_ball_weight_min',
        # ),
        # migrations.RemoveField(
        #     model_name='series',
        #     name='avg_tare_weight_max',
        # ),
        # migrations.RemoveField(
        #     model_name='series',
        #     name='avg_tare_weight_min',
        # ),
        # migrations.RemoveField(
        #     model_name='series',
        #     name='height_max_incl_ac_feet',
        # ),
        # migrations.RemoveField(
        #     model_name='series',
        #     name='height_max_incl_ac_inches',
        # ),
        # migrations.RemoveField(
        #     model_name='series',
        #     name='length_feet',
        # ),
        # migrations.RemoveField(
        #     model_name='series',
        #     name='length_inches',
        # ),
        # migrations.RemoveField(
        #     model_name='series',
        #     name='length_incl_aframe_feet',
        # ),
        # migrations.RemoveField(
        #     model_name='series',
        #     name='length_incl_aframe_inches',
        # ),
        # migrations.RemoveField(
        #     model_name='series',
        #     name='length_incl_bumper_feet',
        # ),
        # migrations.RemoveField(
        #     model_name='series',
        #     name='length_incl_bumper_inches',
        # ),
        # migrations.RemoveField(
        #     model_name='series',
        #     name='width_feet',
        # ),
        # migrations.RemoveField(
        #     model_name='series',
        #     name='width_inches',
        # ),
        # migrations.RemoveField(
        #     model_name='series',
        #     name='width_incl_awning_feet',
        # ),
        # migrations.RemoveField(
        #     model_name='series',
        #     name='width_incl_awning_inches',
        # ),
        # migrations.AddField(
        #     model_name='series',
        #     name='avg_ball_weight',
        #     field=models.IntegerField(blank=True, null=True, verbose_name='Avg Ball Weight in kg'),
        # ),
        # migrations.AddField(
        #     model_name='series',
        #     name='avg_tare_weight',
        #     field=models.IntegerField(blank=True, null=True, verbose_name='Avg Tare Weight in kg'),
        # ),
        # migrations.AddField(
        #     model_name='series',
        #     name='height_max_incl_ac_mm',
        #     field=models.IntegerField(blank=True, null=True, verbose_name='Max Internal Living Height in mm'),
        # ),
        # migrations.AddField(
        #     model_name='series',
        #     name='length_incl_aframe_mm',
        #     field=models.IntegerField(blank=True, null=True, verbose_name='Travel Length in mm'),
        # ),
        # migrations.AddField(
        #     model_name='series',
        #     name='length_incl_bumper_mm',
        #     field=models.IntegerField(blank=True, null=True, verbose_name='Max External Travel Height in mm'),
        # ),
        # migrations.AddField(
        #     model_name='series',
        #     name='length_mm',
        #     field=models.IntegerField(blank=True, null=True, verbose_name='Length in mm'),
        # ),
        # migrations.AddField(
        #     model_name='series',
        #     name='series_type',
        #     field=models.CharField(choices=[('Caravans', 'Caravans'), ('PopTops', 'PopTops'), ('Campers', 'Campers')], default='Caravans', max_length=32),
        # ),
        # migrations.AddField(
        #     model_name='series',
        #     name='width_incl_awning_mm',
        #     field=models.IntegerField(blank=True, null=True, verbose_name='Max Travel Width in mm'),
        # ),
        # migrations.AddField(
        #     model_name='series',
        #     name='width_mm',
        #     field=models.IntegerField(blank=True, null=True, verbose_name='Width in mm'),
        # ),
    ]