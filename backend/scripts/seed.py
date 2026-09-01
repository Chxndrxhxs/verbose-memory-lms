import os
import sys
from decimal import Decimal
from pathlib import Path

import django

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.courses.models import Course, Lesson, Section  # noqa: E402
from apps.users.models import User  # noqa: E402


def run() -> None:
    instr, _ = User.objects.get_or_create(
        mobile="9999999999",
        defaults={
            "username": "9999999999",
            "first_name": "Ayse Sharma",
            "role": "instructor",
            "is_mobile_verified": True,
        },
    )
    instr.first_name = "Ayse Sharma"
    instr.role = "instructor"
    instr.is_mobile_verified = True
    instr.save()
    User.objects.get_or_create(
        mobile="9999999991",
        defaults={
            "username": "9999999991",
            "first_name": "Demo Learner",
            "role": "learner",
            "is_mobile_verified": True,
        },
    )

    data = [
        (
            "UX/UI Design Fundamentals",
            "Design intuitive interfaces",
            "Design",
            Decimal(0),
            "https://images.unsplash.com/photo-1558655146-d09347e92766?w=600",
            "beginner",
            Decimal("4.9"),
        ),
        (
            "Strategic Business Leadership",
            "Lead with clarity",
            "Business",
            Decimal(29),
            "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600",
            "intermediate",
            Decimal("4.8"),
        ),
        (
            "Python Programming Basics",
            "Start coding with Python",
            "Engineering",
            Decimal(19),
            "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600",
            "beginner",
            Decimal("4.7"),
        ),
        (
            "Digital Marketing Analytics",
            "Become data-driven",
            "Marketing",
            Decimal(35),
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600",
            "advanced",
            Decimal("4.6"),
        ),
    ]
    for title, sub, cat, price, img, level, rating in data:
        c, _ = Course.objects.get_or_create(
            title=title,
            instructor=instr,
            defaults={
                "subtitle": sub,
                "category": cat,
                "price": price,
                "cover_image": img,
                "level": level,
                "average_rating": rating,
                "status": Course.Status.PUBLISHED,
            },
        )
        if not c.sections.exists():
            s1 = Section.objects.create(course=c, title="Getting started", order=1)
            Section.objects.create(course=c, title="Core concepts", order=2)
            Lesson.objects.create(section=s1, title="Welcome", duration="03:12", order=1)
            Lesson.objects.create(section=s1, title="Setup", duration="06:20", order=2)
    print(f"OK: {Course.objects.count()} courses, {User.objects.count()} users")


if __name__ == "__main__":
    run()
