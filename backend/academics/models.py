from django.db import models
from django.conf import settings
from portal.models import Faculty, Department, Program

class Course(models.Model):
    LEVEL_CHOICES = (
        ('undergraduate', 'Undergraduate'),
        ('postgraduate', 'Postgraduate'),
        ('both', 'Both UG & PG'),
    )
    
    code = models.CharField(max_length=15, unique=True)
    title = models.CharField(max_length=200)
    unit = models.IntegerField(default=1)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='undergraduate')
    semester = models.CharField(max_length=20, default='Harmattan')
    session = models.CharField(max_length=20, default='2024/2025')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses')
    is_elective = models.BooleanField(default=False)
    credit_hours = models.IntegerField(default=3, help_text="Credit hours for postgraduate courses")

    class Meta:
        ordering = ['department', 'code']

    def __str__(self):
        return f"{self.code}: {self.title} ({self.get_level_display()})"

class Application(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    LEVEL_CHOICES = (
        ('undergraduate', 'Undergraduate'),
        ('postgraduate', 'Postgraduate'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    type = models.CharField(max_length=100, blank=True)
    faculty = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    program = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, blank=True)
    application_level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='undergraduate')
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
    examination_number = models.CharField(max_length=30, blank=True, null=True, unique=True, help_text="Examination registration number")
    
    face_url = models.URLField(max_length=500, blank=True)
    left_index_finger_url = models.URLField(max_length=500, blank=True)
    right_index_finger_url = models.URLField(max_length=500, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.status}"

class Registration(models.Model):
    LEVEL_CHOICES = (
        ('undergraduate', 'Undergraduate'),
        ('postgraduate', 'Postgraduate'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='course_registrations')
    courses = models.ManyToManyField(Course, related_name='registrations')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='undergraduate')
    program = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, blank=True)
    semester = models.CharField(max_length=20)   # e.g., 'Harmattan', 'Rain'
    session = models.CharField(max_length=20)    # e.g., '2024/2025'
    total_units = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'semester', 'session', 'level')
        ordering = ['-session', '-semester']

    def __str__(self):
        return f"{self.user.username} ({self.get_level_display()}) - {self.semester} {self.session}"

class Result(models.Model):
    GRADE_POINTS = {
        'A': 5.0,
        'AB': 4.5,
        'B': 4.0,
        'BC': 3.5,
        'C': 3.0,
        'CD': 2.5,
        'D': 2.0,
        'F': 0.0,
    }
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='examination_results')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='student_results')
    score = models.IntegerField(help_text="Raw score (0-100)")
    grade = models.CharField(max_length=2, help_text="Letter grade (A-F)")
    semester = models.CharField(max_length=20, blank=True, help_text="e.g., 'Harmattan', 'Rain'")
    session = models.CharField(max_length=20, blank=True, help_text="e.g., '2024/2025'")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'course', 'session', 'semester')
        ordering = ['-session', '-semester', 'course__code']

    @property
    def grade_points(self):
        return self.GRADE_POINTS.get(self.grade, 0.0)

    def __str__(self):
        return f"{self.user.username} - {self.course.code} ({self.grade}) {self.session}"

class PostgraduateApplication(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='postgrad_applications')
    program = models.ForeignKey(Program, on_delete=models.CASCADE, limit_choices_to={'level': 'postgraduate'})
    undergrad_program = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, related_name='postgrad_applicants', limit_choices_to={'level': 'undergraduate'})
    cgpa = models.DecimalField(max_digits=3, decimal_places=2, help_text="Cumulative GPA from undergraduate")
    degree_classification = models.CharField(max_length=50, help_text="e.g., First Class, Upper Second Class")
    research_interest = models.TextField()
    letter_of_intent = models.URLField(max_length=500, blank=True)
    
    face_url = models.URLField(max_length=500, blank=True)
    left_index_finger_url = models.URLField(max_length=500, blank=True)
    right_index_finger_url = models.URLField(max_length=500, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.program.name} ({self.status})"

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
