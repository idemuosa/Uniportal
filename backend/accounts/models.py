from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('student', 'Student'),
        ('applicant', 'Applicant'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='applicant')
    faculty = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    level = models.CharField(max_length=10, default='100L')
    matricNo = models.CharField(max_length=30, blank=True, null=True, unique=True)
    examination_number = models.CharField(max_length=30, blank=True, null=True, unique=True, help_text="Examination registration number for result checking")
    isVerified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} - {self.role}"
