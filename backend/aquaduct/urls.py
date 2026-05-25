from django.urls import path
from .views import home, pay_payment

urlpatterns = [
    path('', home, name='home'),  # root path
    path("payments/<int:payment_id>/pay/", pay_payment, name="pay_payment"),
]