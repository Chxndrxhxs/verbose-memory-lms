from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assignments', '0003_seed_default_categories'),
    ]

    operations = [
        migrations.AddField(
            model_name='assignmentquestion',
            name='question_image',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
    ]