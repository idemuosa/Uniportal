from django.contrib import admin
from .models import Payment, Loan

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'amount', 'status', 'reference', 'created_at')
    list_filter = ('type', 'status')
    search_fields = ('reference', 'user__username')

@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'type', 'status', 'created_at')
    list_filter = ('status',)
