from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.mail import send_mail
from django.http import HttpResponse
from django.template.loader import get_template
from io import BytesIO
from .models import Payment, Loan
from .serializers import PaymentSerializer, LoanSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Payment.objects.all()
        return Payment.objects.filter(user=user)

    def perform_create(self, serializer):
        payment = serializer.save(user=self.request.user)
        # If payment is successful (e.g., from a real gateway callback in future)
        if payment.status == 'success':
            self.send_payment_email(payment)

    def perform_update(self, serializer):
        payment = serializer.save()
        if payment.status == 'success':
            self.send_payment_email(payment)

    def send_payment_email(self, payment):
        subject = f'Payment Confirmed: {payment.type.capitalize()}'
        message = f'Hi {payment.user.username}, your payment of {payment.amount} for {payment.type} has been confirmed. Thank you!'
        send_mail(
            subject,
            message,
            'portal@school.edu',
            [payment.user.email],
            fail_silently=True,
        )

    @action(detail=True, methods=['get'])
    def download_receipt(self, request, pk=None):
        payment = self.get_object()
        template_path = 'receipt_template.html'
        context = {'payment': payment}
        
        template = get_template(template_path)
        html = template.render(context)
        return HttpResponse(html, content_type='text/html')

class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.all()
    serializer_class = LoanSerializer
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Loan.objects.all()
        return Loan.objects.filter(user=user)
