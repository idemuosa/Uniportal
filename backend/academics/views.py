from rest_framework import viewsets, permissions
from .models import Course, Application, Registration, Result
from .serializers import CourseSerializer, ApplicationSerializer, RegistrationSerializer, ResultSerializer

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Application.objects.all()
        return Application.objects.filter(user=user)

class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.all()
    serializer_class = RegistrationSerializer
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Registration.objects.all()
        return Registration.objects.filter(user=user)

class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.all()
    serializer_class = ResultSerializer
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.role == 'staff':
            return Result.objects.all()
        return Result.objects.filter(user=user)
