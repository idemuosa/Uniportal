from django.db import models

class Faculty(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Faculties"

class Department(models.Model):
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.faculty.name})"

class Program(models.Model):
    LEVEL_CHOICES = (
        ('undergraduate', 'Undergraduate'),
        ('postgraduate', 'Postgraduate'),
    )
    
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='programs')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='undergraduate')
    description = models.TextField(blank=True)
    duration_years = models.IntegerField(default=4, help_text="Program duration in years")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('department', 'code')
        ordering = ['department', 'level', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_level_display()}) - {self.department.name}"

class PostgradProgram(models.Model):
    """
    Postgraduate program linked to undergraduate programs
    """
    postgrad = models.OneToOneField(
        Program, 
        on_delete=models.CASCADE, 
        related_name='postgrad_details',
        limit_choices_to={'level': 'postgraduate'}
    )
    related_undergrad = models.ManyToManyField(
        Program, 
        related_name='postgrad_options',
        limit_choices_to={'level': 'undergraduate'},
        help_text="Undergraduate programs that can lead to this postgraduate degree"
    )
    entry_requirement = models.TextField(help_text="Minimum entry requirements (e.g., 2.2 degree classification)")
    thesis_required = models.BooleanField(default=True)
    research_component_percent = models.IntegerField(default=40, help_text="Percentage of coursework dedicated to research")
    internship_required = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.postgrad.name} (Postgrad) - {self.postgrad.department.name}"

class TreasurySetting(models.Model):
    acceptance_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    early_payment_discount = models.IntegerField(default=0)
    # Add other global financial settings here if needed
    
    def __str__(self):
        return "Global Treasury Settings"

class BankDetail(models.Model):
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=20)
    account_name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.bank_name} - {self.account_number}"
