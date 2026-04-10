from django.contrib import admin
from .models import Course, Application, Registration, Result

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'unit', 'semester', 'session')
    list_filter = ('semester', 'session')

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'status', 'created_at')
    list_filter = ('type', 'status')

@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('user', 'semester', 'session', 'is_completed')
    list_filter = ('is_completed',)

@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'score', 'grade')
    list_filter = ('grade',)
