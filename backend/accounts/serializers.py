from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'faculty', 'department', 'first_name', 'last_name', 'is_staff', 'is_superuser')
        read_only_fields = ('id', 'role')

    def get_role(self, obj):
        if obj.is_superuser or obj.is_staff:
            return 'admin'
        return obj.role

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'role', 'first_name', 'last_name')

    def create(self, validated_data):
        role = validated_data.get('role', 'applicant')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=role,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        if role == 'admin':
            user.is_staff = True
            user.save()
        return user
