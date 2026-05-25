from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST
from .models import Payment
from .services import mark_payment_as_paid

def home(request):
    data = {
        "message": "Hello from Aquaduct API!"
    }
    return JsonResponse(data)

@require_POST
def pay_payment(request, payment_id):
    payment = get_object_or_404(Payment, pk=payment_id)
    created_jugs = mark_payment_as_paid(payment)

    return JsonResponse({
        "message": "Payment marked as paid.",
        "payment_id": payment.id,
        "created_jugs": [jug.id for jug in created_jugs],
    })