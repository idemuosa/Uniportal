from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, LoanViewSet

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'loans', LoanViewSet, basename='loan')

urlpatterns = [
    path('', include(router.urls)),
]
