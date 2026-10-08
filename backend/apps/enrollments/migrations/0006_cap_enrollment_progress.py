from django.db import migrations


def cap_progress(apps, schema_editor):
    # Enrollment rows written before the write-path clamp
    # (mark_lesson_done / curriculum re-save) can hold progress
    # above 100 (RAM-54). Progress is a percentage — cap it.
    Enrollment = apps.get_model("enrollments", "Enrollment")
    Enrollment.objects.filter(progress__gt=100).update(progress=100)


class Migration(migrations.Migration):
    dependencies = [
        ("enrollments", "0005_activityevent"),
    ]

    operations = [
        migrations.RunPython(cap_progress, migrations.RunPython.noop),
    ]
