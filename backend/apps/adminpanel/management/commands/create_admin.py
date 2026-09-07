import re

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from apps.users.models import User


class Command(BaseCommand):
    help = "Create or promote a user to platform admin (role=admin, is_staff=True)."

    def add_arguments(self, parser):
        parser.add_argument("--mobile", required=True, help="10-digit Indian mobile number")
        parser.add_argument("--name", default="Admin", help="Display name (first [last])")
        parser.add_argument("--email", default="", help="Optional email for the admin")
        parser.add_argument(
            "--password",
            default="",
            help="Optional password (admins normally sign in via OTP on mobile)",
        )

    def handle(self, *args, **options):
        mobile = options["mobile"]
        if not re.fullmatch(r"[6-9]\d{9}", mobile):
            raise CommandError("mobile must be a 10-digit Indian mobile number")
        name = options["name"].strip()
        parts = name.split(" ", 1)

        user, _ = get_user_model().objects.update_or_create(
            mobile=mobile,
            defaults={
                "username": mobile,
                "first_name": parts[0],
                "last_name": parts[1] if len(parts) > 1 else "",
                "email": options["email"],
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "is_mobile_verified": True,
            },
        )
        if options["password"]:
            user.set_password(options["password"])
            user.save(update_fields=["password"])
        self.stdout.write(
            self.style.SUCCESS(f"Admin ready: {user.get_full_name()} ({user.mobile}) id={user.id}")
        )
