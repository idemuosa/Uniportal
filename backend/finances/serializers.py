from rest_framework import serializers
from .models import Payment, Loan

class PaymentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('user',)

class LoanSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = Loan
        fields = '__all__'
