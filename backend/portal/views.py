from rest_framework import viewsets, permissions
from .models import Faculty, Department, TreasurySetting, BankDetail
from .serializers import FacultySerializer, DepartmentSerializer, TreasurySettingSerializer, BankDetailSerializer

class FacultyViewSet(viewsets.ModelViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class TreasurySettingViewSet(viewsets.ModelViewSet):
    queryset = TreasurySetting.objects.all()
    serializer_class = TreasurySettingSerializer
    permission_classes = [permissions.IsAuthenticated]

class BankDetailViewSet(viewsets.ModelViewSet):
    queryset = BankDetail.objects.all()
    serializer_class = BankDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
