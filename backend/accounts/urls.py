from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, UserDetailView, UserViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('user/', UserDetailView.as_view(), name='user-detail'),
    path('', include(router.urls)),
]
