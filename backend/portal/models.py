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
