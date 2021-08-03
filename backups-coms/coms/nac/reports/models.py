from django.db import models

# Create your models here.


class PriceAuditCapture(models.Model):
    id = models.AutoField(primary_key=True)
    series_code=models.CharField(max_length=500, null=True)
    existing_wholesale_price=models.CharField(max_length=500, null=True)
    new_wholesale_price=models.CharField(max_length=500, null=True)
    existing_retail_price=models.CharField(max_length=500, null=True)
    new_retail_price=models.CharField(max_length=500, null=True)
    price_changed_datetime=models.CharField(max_length=500, null=True)
    price_changed_user=models.CharField(max_length=500, null=True)
    
    fixtures_autodump = ['dev']

    class Meta:
        ordering = ('id', )
        db_table = 'pricechange_audit_capture'
        verbose_name = 'Price Audit Capture'
        verbose_name_plural = 'Price Audit Capture'
