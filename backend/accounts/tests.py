from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

class AccountsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_superuser_role_defaults_to_admin(self):
        superuser = User.objects.create_superuser(
            username='admin_test',
            email='admin@test.com',
            password='Password123!'
        )
        self.assertEqual(superuser.role, 'admin')

    def test_admin_registration_sets_staff(self):
        response = self.client.post('/api/accounts/register/', {
            'username': 'admin_reg@test.com',
            'email': 'admin_reg@test.com',
            'password': 'Password123!',
            'role': 'admin'
        })
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(email='admin_reg@test.com')
        self.assertTrue(user.is_staff)
        self.assertEqual(user.role, 'admin')
