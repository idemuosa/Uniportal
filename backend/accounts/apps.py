import os
from django.apps import AppConfig
from django.db.models.signals import post_migrate

def create_or_update_superuser(sender, **kwargs):
    from django.contrib.auth import get_user_model
    User = get_user_model()

    admin_email = os.getenv('ADMIN_EMAIL', os.getenv('DEFAULT_ADMIN_EMAIL', 'admin@university.edu')).strip().lower()
    admin_password = os.getenv('ADMIN_PASSWORD', os.getenv('DEFAULT_ADMIN_PASSWORD', '9582897rR@'))

    if not admin_email or not admin_password:
        return

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
            print(f"🔑 Django superuser synchronized successfully: {admin_email}")
        else:
            User.objects.create_superuser(
                username=username,
                email=admin_email,
                password=admin_password,
                role='admin'
            )
            print(f"🔑 Django superuser created successfully: {admin_email}")
    except Exception as e:
        print(f"⚠️ Warning: Could not auto-sync Django superuser: {e}")

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = "accounts"

    def ready(self):
        post_migrate.connect(create_or_update_superuser, sender=self)
