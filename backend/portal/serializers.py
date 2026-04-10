from rest_framework import serializers
from .models import Faculty, Department, TreasurySetting, BankDetail

class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)
    class Meta:
        model = Department
        fields = '__all__'

class TreasurySettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreasurySetting
        fields = '__all__'

class BankDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankDetail
        fields = '__all__'
