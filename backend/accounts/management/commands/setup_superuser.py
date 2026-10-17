import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import OperationalError, ProgrammingError

class Command(BaseCommand):
    help = 'Create or update superuser account using ADMIN_EMAIL and ADMIN_PASSWORD environment variables'

    def handle(self, *args, **options):
        User = get_user_model()
        admin_email = os.getenv('ADMIN_EMAIL', os.getenv('DEFAULT_ADMIN_EMAIL', 'admin@university.edu')).strip().lower()
        admin_password = os.getenv('ADMIN_PASSWORD', os.getenv('DEFAULT_ADMIN_PASSWORD', '9582897rR@'))

        username = admin_email.split('@')[0] if '@' in admin_email else admin_email

        try:
            user = User.objects.filter(email__iexact=admin_email).first() or User.objects.filter(is_superuser=True).first()
            if user:
                user.email = admin_email
                if not user.username:
                    user.username = username
                user.set_password(admin_password)
                user.is_superuser = True
                user.is_staff = True
                user.role = 'admin'
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Successfully updated superuser credentials for {admin_email}"))
            else:
                User.objects.create_superuser(
                    username=username,
                    email=admin_email,
                    password=admin_password,
                    role='admin'
                )
                self.stdout.write(self.style.SUCCESS(f"Successfully created superuser for {admin_email}"))
        except (OperationalError, ProgrammingError) as e:
            self.stdout.write(self.style.WARNING("Database tables not ready yet. Please run 'python manage.py migrate' first."))
