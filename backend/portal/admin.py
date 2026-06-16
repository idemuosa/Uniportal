from django.contrib import admin
from .models import Faculty, Department, Program, PostgradProgram, TreasurySetting, BankDetail

@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'faculty')
    list_filter = ('faculty',)

@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'level', 'department', 'duration_years', 'is_active')
    list_filter = ('level', 'is_active', 'department')
    search_fields = ('name', 'code')

@admin.register(PostgradProgram)
class PostgradProgramAdmin(admin.ModelAdmin):
    list_display = ('postgrad', 'thesis_required', 'research_component_percent')
    filter_horizontal = ('related_undergrad',)

@admin.register(TreasurySetting)
class TreasurySettingAdmin(admin.ModelAdmin):
    list_display = ('acceptance_fee', 'early_payment_discount')

@admin.register(BankDetail)
class BankDetailAdmin(admin.ModelAdmin):
    list_display = ('bank_name', 'account_number', 'account_name')
