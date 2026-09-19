from django.db import migrations

SEED_TREE = [
    ("IT", 1, [
        ("Programming & Development", 1, [
            "Programming Languages",
            "Web Development",
        ]),
        ("Networking & Security", 2, [
            "Networking",
            "Cybersecurity",
        ]),
    ]),
    ("Non-IT", 2, [
        ("Management & Finance", 1, [
            "Management",
            "Finance & Accounts",
        ]),
        ("General Aptitude", 2, [
            "Quantitative Aptitude",
            "Logical Reasoning",
        ]),
    ]),
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model("assignments", "Category")
    SubCategory = apps.get_model("assignments", "SubCategory")
    InterCategory = apps.get_model("assignments", "InterCategory")

    for cat_name, cat_position, subs in SEED_TREE:
        category, _ = Category.objects.get_or_create(
            name=cat_name, defaults={"position": cat_position}
        )
        for sub_name, sub_position, inters in subs:
            sub, _ = SubCategory.objects.get_or_create(
                category=category, name=sub_name, defaults={"position": sub_position}
            )
            for inter_position, inter_name in enumerate(inters, start=1):
                InterCategory.objects.get_or_create(
                    sub_category=sub,
                    name=inter_name,
                    defaults={"position": inter_position},
                )


def unseed_categories(apps, schema_editor):
    Category = apps.get_model("assignments", "Category")
    Category.objects.filter(name__in=[name for name, _, _ in SEED_TREE]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("assignments", "0002_assignment_draft_data"),
    ]

    operations = [
        migrations.RunPython(seed_categories, unseed_categories),
    ]