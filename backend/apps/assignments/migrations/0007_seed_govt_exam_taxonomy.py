from django.db import migrations

# Board > Exam > Subject. This replaces the IT / Non-IT tree seeded in 0003,
# which did not fit a general govt exams product.
TAXONOMY = [
    ("SSC", 1, [
        ("SSC CGL", 1, [
            "Quantitative Aptitude",
            "General English",
            "General Awareness",
            "Reasoning",
        ]),
        ("SSC CHSL", 2, [
            "General Intelligence",
            "General Awareness",
            "Elementary Mathematics",
            "English",
        ]),
        ("SSC MTS", 3, [
            "Arithmetic",
            "General Intelligence",
            "General Awareness",
        ]),
    ]),
    ("IBPS", 2, [
        ("IBPS PO", 1, [
            "Quantitative Aptitude",
            "Reasoning Ability",
            "English Language",
            "General Awareness",
        ]),
        ("IBPS Clerk", 2, [
            "Quantitative Aptitude",
            "Reasoning Ability",
            "English Language",
            "General Computer Awareness",
        ]),
        ("IBPS RRB", 3, [
            "Quantitative Aptitude",
            "Reasoning Ability",
            "English Language",
        ]),
    ]),
    ("Railways", 3, [
        ("RRB NTPC", 1, [
            "General Awareness",
            "General Intelligence",
            "Arithmetic Ability",
        ]),
        ("RRB Group D", 2, [
            "General Awareness",
            "General Intelligence",
            "Arithmetic Ability",
            "General Science",
        ]),
    ]),
    ("UPSC", 4, [
        ("UPSC CSE Prelims", 1, [
            "General Studies",
            "Current Affairs",
            "Aptitude",
        ]),
        ("UPSC CDS", 2, [
            "General Knowledge",
            "English",
            "Elementary Mathematics",
        ]),
    ]),
]

# Left in place but hidden from the instructor picker and learner catalog.
# Assignments and packs may already point at these, so deactivating beats
# deleting.
LEGACY_CATEGORIES = ["IT", "Non-IT"]


def seed_taxonomy(apps, schema_editor):
    Category = apps.get_model("assignments", "Category")
    SubCategory = apps.get_model("assignments", "SubCategory")
    InterCategory = apps.get_model("assignments", "InterCategory")

    Category.objects.filter(name__in=LEGACY_CATEGORIES).update(is_active=False)

    for board_name, board_position, exams in TAXONOMY:
        # update_or_create rather than get_or_create: a board may already exist
        # from earlier manual admin work, and the seed should still normalise
        # its ordering and visibility.
        board, _ = Category.objects.update_or_create(
            name=board_name,
            defaults={"position": board_position, "is_active": True},
        )
        for exam_name, exam_position, subjects in exams:
            exam, _ = SubCategory.objects.update_or_create(
                category=board,
                name=exam_name,
                defaults={"position": exam_position, "is_active": True},
            )
            for subject_position, subject_name in enumerate(subjects, start=1):
                InterCategory.objects.update_or_create(
                    sub_category=exam,
                    name=subject_name,
                    defaults={"position": subject_position, "is_active": True},
                )


def unseed_taxonomy(apps, schema_editor):
    Category = apps.get_model("assignments", "Category")
    SubCategory = apps.get_model("assignments", "SubCategory")

    names = [name for name, _, _ in TAXONOMY]
    # Deleting the categories cascades to sub categories and topics.
    Category.objects.filter(name__in=names).delete()
    Category.objects.filter(name__in=LEGACY_CATEGORIES).update(is_active=True)


class Migration(migrations.Migration):

    dependencies = [
        ("assignments", "0006_assignment_pack_alter_assignmentmodel_code"),
    ]

    operations = [
        migrations.RunPython(seed_taxonomy, unseed_taxonomy),
    ]
