from django.db import models
from django.conf import settings
from portal.models import Faculty, Department

class Course(models.Model):
    code = models.CharField(max_length=15, unique=True)
    title = models.CharField(max_length=200)
    unit = models.IntegerField(default=1)
    semester = models.CharField(max_length=20, default='Harmattan')
    session = models.CharField(max_length=20, default='2024/2025')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses')

    def __str__(self):
        return f"{self.code}: {self.title}"

class Application(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    type = models.CharField(max_length=100, blank=True)
    faculty = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    gender = models.CharField(max_length=10, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    state_of_origin = models.CharField(max_length=50, blank=True)
    lga = models.CharField(max_length=50, blank=True)
    permanent_address = models.TextField(blank=True)
    
    nok_name = models.CharField(max_length=100, blank=True)
    nok_phone = models.CharField(max_length=20, blank=True)
    nok_relation = models.CharField(max_length=50, blank=True)

    jamb_reg_no = models.CharField(max_length=20, blank=True)
    jamb_score = models.IntegerField(default=0)
    
    face_url = models.URLField(max_length=500, blank=True)
    left_index_finger_url = models.URLField(max_length=500, blank=True)
    right_index_finger_url = models.URLField(max_length=500, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.status}"

class Registration(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    courses = models.ManyToManyField(Course, related_name='registrations')
    semester = models.CharField(max_length=20)   # e.g., 'Harmattan', 'Rain'
    session = models.CharField(max_length=20)    # e.g., '2024/2025'
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.semester} {self.session}"

class Result(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    score = models.IntegerField()
    grade = models.CharField(max_length=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.course.code} ({self.grade})"

class Clearance(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('uploaded', 'Uploaded'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    affidavit_url = models.URLField(max_length=500, blank=True, null=True)
    lga_origin_url = models.URLField(max_length=500, blank=True, null=True)
    age_declaration_url = models.URLField(max_length=500, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.status}"
