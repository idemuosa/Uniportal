from django.contrib import admin
from .models import Course, Application, Registration, Result, PostgraduateApplication

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'level', 'unit', 'semester', 'session', 'department')
    list_filter = ('level', 'semester', 'session', 'department')
    search_fields = ('code', 'title')

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('user', 'application_level', 'program', 'status', 'created_at')
    list_filter = ('application_level', 'status', 'department')
    search_fields = ('user__username', 'user__email')

@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('user', 'level', 'program', 'semester', 'session', 'total_units', 'is_completed')
    list_filter = ('level', 'is_completed', 'session')
    search_fields = ('user__username',)

@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'score', 'grade')
    list_filter = ('grade', 'course__department')
    search_fields = ('user__username', 'course__code')

@admin.register(PostgraduateApplication)
class PostgraduateApplicationAdmin(admin.ModelAdmin):
    list_display = ('user', 'program', 'undergrad_program', 'degree_classification', 'status', 'created_at')
    list_filter = ('status', 'program__department')
    search_fields = ('user__username', 'user__email', 'program__name')
    readonly_fields = ('created_at', 'updated_at')
