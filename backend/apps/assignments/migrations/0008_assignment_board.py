from django.db import migrations, models
import django.db.models.deletion

# The instructor picks a single exam board, so the taxonomy is flat. The
# SubCategory / InterCategory levels stay in the schema because packs and
# older assignments still reference them; they are simply not offered.
BOARDS = [
    "SSC",
    "IBPS",
    "Railways",
    "UPSC",
    "SBI",
    "RBI",
    "LIC",
    "CTET",
    "NET / UGC",
    "State PSC",
    "Defence",
    "Central Government",
]


def add_board(apps, schema_editor):
    Category = apps.get_model("assignments", "Category")
    for position, name in enumerate(BOARDS, start=1):
        Category.objects.get_or_create(
            name=name, defaults={"position": position, "is_active": True}
        )


def backfill_assignment_boards(apps, schema_editor):
    """Derive each board from the 3-level chain the row already points at, so
    nothing is lost when instructors stop choosing a leaf subject.
    """
    Assignment = apps.get_model("assignments", "Assignment")
    rows = Assignment.objects.filter(inter_category__isnull=False).select_related(
        "inter_category__sub_category__category"
    )
    for row in rows:
        row.board_id = row.inter_category.sub_category.category_id
        row.save(update_fields=["board"])


def drop_board(apps, schema_editor):
    Assignment = apps.get_model("assignments", "Assignment")
    Assignment.objects.update(board=None)
    Category = apps.get_model("assignments", "Category")
    Category.objects.filter(name__in=BOARDS).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("assignments", "0007_seed_govt_exam_taxonomy"),
    ]

    operations = [
        migrations.AddField(
            model_name="assignment",
            name="board",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assignments",
                to="assignments.category",
            ),
        ),
        migrations.RunPython(add_board, drop_board),
        migrations.RunPython(backfill_assignment_boards, migrations.RunPython.noop),
    ]
