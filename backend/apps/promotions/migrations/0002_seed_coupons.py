from django.db import migrations

SEEDS = [
    {"code": "WELCOME10", "discount_type": "percent", "discount_value": 10},
    {"code": "LEARN20", "discount_type": "percent", "discount_value": 20},
    {
        "code": "QTNXT50",
        "discount_type": "percent",
        "discount_value": 50,
        "max_discount_paise": 50000,
    },
]


def seed(apps, schema_editor):
    Coupon = apps.get_model("promotions", "Coupon")
    for row in SEEDS:
        Coupon.objects.update_or_create(
            code=row["code"],
            defaults={
                **row,
                "applies_to": "all",
                "per_user_limit": 1,
                "is_active": True,
            },
        )


def unseed(apps, schema_editor):
    Coupon = apps.get_model("promotions", "Coupon")
    Coupon.objects.filter(code__in=[row["code"] for row in SEEDS]).delete()


class Migration(migrations.Migration):
    dependencies = [("promotions", "0001_initial")]

    operations = [migrations.RunPython(seed, unseed)]
