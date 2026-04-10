from rest_framework import generics, permissions, viewsets
from django.core.mail import send_mail
from django.conf import settings
from .serializers import UserSerializer, RegisterSerializer
from .models import User

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3001')
        
        # Check if the creator is an admin (optional check, currently any register triggers)
        # But specifically tailored for student role
        if user.role == 'student':
            subject = 'INSTITUTIONAL ACCOUNT PROVISIONED - School Portal'
            message = (
                f'Greetings {user.first_name if user.first_name else user.username},\n\n'
                'An administrative node has manually provisioned your student account.\n\n'
                f'CREDENTIALS:\n'
                f'Email/Username: {user.email}\n'
                f'Temporary Password: ChangeMe123!\n\n'
                'Please click the link below to continue your registration, update your profile, and complete your payment.\n\n'
                f'CONTINUE REGISTRATION: {frontend_url}/#/auth\n\n'
                'Best regards,\n'
                'Portal Administration'
            )
        elif user.role == 'admin':
            subject = 'Welcome Admin - Finish your setup'
            message = f'Hi {user.username}, please login to {frontend_url}/#/admin/login and change your password.'
        else:
            subject = 'Welcome to School Portal - Continue Registration'
            message = f'Hi {user.username}, thank you for registering! Please login to {frontend_url}/#/auth to continue.'
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset

class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user
