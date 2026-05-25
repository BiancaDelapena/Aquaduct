from django.db import transaction
from django.utils import timezone

from .models import Jug, Payment, OrderItem


@transaction.atomic
def create_jugs_for_paid_order(payment):
    """
    Creates Jug records for all NEW_JUG items in a paid order.
    """
    if payment.payment_status != Payment.PaymentStatus.PAID:
        return []

    created_jugs = []

    new_jug_items = (
        payment.order.items
        .filter(item_type=OrderItem.ItemType.NEW_JUG)
        .select_related("jug_type", "generated_jug")
    )

    for item in new_jug_items:
        if item.generated_jug_id:
            continue

        jug = Jug.objects.create(
            customer_profile=payment.order.customer_profile,
            jug_type=item.jug_type,
            status=Jug.Status.ACTIVE,
        )

        item.generated_jug = jug
        item.save(update_fields=["generated_jug"])

        created_jugs.append(jug)

    return created_jugs


@transaction.atomic
def mark_payment_as_paid(payment, reference_number=None):
    """
    Marks a payment as paid, then creates all jugs for the paid order.
    """
    payment.payment_status = Payment.PaymentStatus.PAID
    payment.paid_at = timezone.now()

    if reference_number is not None:
        payment.reference_number = reference_number

    payment.save(update_fields=["payment_status", "paid_at", "reference_number"])

    return create_jugs_for_paid_order(payment)