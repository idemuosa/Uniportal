from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FacultyViewSet, DepartmentViewSet, TreasurySettingViewSet, BankDetailViewSet

router = DefaultRouter()
router.register(r'faculties', FacultyViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'treasury-settings', TreasurySettingViewSet)
router.register(r'bank-details', BankDetailViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
