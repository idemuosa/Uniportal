from django.contrib import admin
from .models import Faculty, Department, TreasurySetting, BankDetail

@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'faculty')
    list_filter = ('faculty',)

@admin.register(TreasurySetting)
class TreasurySettingAdmin(admin.ModelAdmin):
    list_display = ('acceptance_fee', 'early_payment_discount')

@admin.register(BankDetail)
class BankDetailAdmin(admin.ModelAdmin):
    list_display = ('bank_name', 'account_number', 'account_name')
