from django.db import transaction
from .models import Jug, OrderNewJugItem

@transaction.atomic
def create_jug_from_new_order_item(order_new_jug_item):
    """
    Creates a Jug when a New Jug order item is processed.
    """

    # prevent duplicate creation
    if order_new_jug_item.generated_jug:
        return order_new_jug_item.generated_jug

    jug = Jug.objects.create(
        customer_profile=order_new_jug_item.order_item.order.customer_profile,
        jug_type=order_new_jug_item.jug_type,
        status=Jug.Status.ACTIVE,
    )

    order_new_jug_item.generated_jug = jug
    order_new_jug_item.save(update_fields=["generated_jug"])

    return jug

