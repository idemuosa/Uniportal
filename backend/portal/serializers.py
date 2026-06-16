from rest_framework import serializers
from .models import Faculty, Department, Program, PostgradProgram, TreasurySetting, BankDetail

class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)
    class Meta:
        model = Department
        fields = '__all__'

class ProgramSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    faculty_name = serializers.CharField(source='department.faculty.name', read_only=True)
    
    class Meta:
        model = Program
        fields = '__all__'

class PostgradProgramSerializer(serializers.ModelSerializer):
    postgrad_details = serializers.SerializerMethodField()
    related_undergrad_programs = ProgramSerializer(source='related_undergrad', many=True, read_only=True)
    
    class Meta:
        model = PostgradProgram
        fields = '__all__'
    
    def get_postgrad_details(self, obj):
        if obj.postgrad:
            return ProgramSerializer(obj.postgrad).data
        return None

class TreasurySettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreasurySetting
        fields = '__all__'

class BankDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankDetail
        fields = '__all__'
