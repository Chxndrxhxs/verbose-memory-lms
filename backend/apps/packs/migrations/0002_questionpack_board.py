from django.db import migrations, models
import django.db.models.deletion

# Mirrors Assignment.board so the learner catalog filters packs and
# assignments with the same single "Board" dropdown.


def backfill_boards(apps, schema_editor):
    """Derive each board from the 3-level chain the pack already points at, so
    nothing is lost when the leaf subject is no longer chosen.
    """
    Pack = apps.get_model("packs", "QuestionPack")
    rows = Pack.objects.filter(inter_category__isnull=False).select_related(
        "inter_category__sub_category__category"
    )
    for row in rows:
        row.board_id = row.inter_category.sub_category.category_id
        row.save(update_fields=["board"])


def clear_boards(apps, schema_editor):
    Pack = apps.get_model("packs", "QuestionPack")
    Pack.objects.update(board=None)


class Migration(migrations.Migration):

    dependencies = [
        ("assignments", "0008_assignment_board"),
        ("packs", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="questionpack",
            name="board",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="packs",
                to="assignments.category",
            ),
        ),
        migrations.RunPython(backfill_boards, clear_boards),
    ]
