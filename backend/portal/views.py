from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Faculty, Department, Program, PostgradProgram, TreasurySetting, BankDetail
from .serializers import (
    FacultySerializer, DepartmentSerializer, ProgramSerializer, 
    PostgradProgramSerializer, TreasurySettingSerializer, BankDetailSerializer
)

class FacultyViewSet(viewsets.ModelViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['faculty']
    search_fields = ['name']

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'level', 'is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'level', 'duration_years']
    ordering = ['department', 'level', 'name']

class PostgradProgramViewSet(viewsets.ModelViewSet):
    queryset = PostgradProgram.objects.all()
    serializer_class = PostgradProgramSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['postgrad__department']
    search_fields = ['postgrad__name', 'postgrad__code']

class TreasurySettingViewSet(viewsets.ModelViewSet):
    queryset = TreasurySetting.objects.all()
    serializer_class = TreasurySettingSerializer
    permission_classes = [permissions.IsAuthenticated]

class BankDetailViewSet(viewsets.ModelViewSet):
    queryset = BankDetail.objects.all()
    serializer_class = BankDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
