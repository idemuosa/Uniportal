from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, ApplicationViewSet, RegistrationViewSet, ResultViewSet, ResultCheckerViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'registrations', RegistrationViewSet, basename='registration')
router.register(r'results', ResultViewSet, basename='result')
router.register(r'result-checker', ResultCheckerViewSet, basename='result-checker')

urlpatterns = [
    path('', include(router.urls)),
]
