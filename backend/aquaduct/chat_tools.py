# aquaduct/chat_tools.py
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from .models import (
    Jug, Order, OrderItem, Address, User,
    JugType, RefillSchedule, OrderStatusHistory,
)
from zoneinfo import ZoneInfo
LOCAL_TZ = ZoneInfo('Asia/Manila')


def _format_dt(dt):
    """Return a friendly local-time string like 'June 24, 2026 at 11:22 PM'."""
    if not dt:
        return "Not set"
    if dt.tzinfo is not None:
        dt = dt.astimezone(LOCAL_TZ)
    return dt.strftime('%B %d, %Y at %I:%M %p')

# ── Single‑purpose tools (kept for non‑ordering questions) ──────────────────

def get_customer_jugs(user: User):
    """Return a list of the user's active jugs."""
    jugs = Jug.objects.filter(owner=user, status=Jug.Status.ACTIVE)
    return [
        {
            "id": jug.id,
            "unique_id": jug.unique_id,
            "label": jug.jug_label or jug.unique_id,
            "jug_type": jug.jug_type.type_name,
            "image_url": jug.jug_type.image.url if jug.jug_type.image else None,
        }
        for jug in jugs
    ]

def get_all_jugs_with_status(user: User):
    jugs = Jug.objects.filter(owner=user)
    result = []
    for jug in jugs:
        last_del = jug.last_delivered_at
        date_str = _format_dt(last_del) if last_del else 'N/A'
        label = jug.jug_label or jug.unique_id
        jug_type = jug.jug_type.type_name
        display = f"- {label} ({jug_type}), last delivered: {date_str}"
        result.append({
            "id": jug.id,
            "unique_id": jug.unique_id,
            "label": label,
            "jug_type": jug_type,
            "status": jug.status,
            "last_delivered_at": _format_dt(last_del) if last_del else None,
            "reminder_active": jug.reminder_active,
            "display": display,
        })
    return result

def get_active_order_status(user: User):
    orders = Order.objects.filter(
        customer=user
    ).exclude(status__in=[Order.Status.DELIVERED, Order.Status.CANCELLED])
    if not orders.exists():
        return {"message": "You have no active orders at the moment."}
    return [
        {
            "order_id": order.id,
            "status": order.status,
            "items": [
                f"{item.item_type} ({item.jug_label or item.jug.unique_id})"
                for item in order.items.all()
            ],
            "estimated_arrival": _format_dt(order.estimated_arrival),
            "created_at": _format_dt(order.created_at),
        }
        for order in orders
    ]

def get_customer_address(user: User):
    addr = Address.objects.filter(user=user, is_default=True).first()
    if not addr:
        addr = Address.objects.filter(user=user).first()
    return {
        "full_address": addr.full_address() if addr else "No address on file",
        "id": addr.id if addr else None,
    }

def update_refill_schedule(user: User, jug_label: str, frequency_days: int = None, pause: bool = False, resume: bool = False):
    jug = Jug.objects.filter(owner=user).filter(
        Q(jug_label=jug_label) | Q(unique_id=jug_label)
    ).first()
    if not jug:
        return {"error": f"Could not find a jug named '{jug_label}'."}

    try:
        schedule = jug.refill_schedule
    except RefillSchedule.DoesNotExist:
        schedule = RefillSchedule.objects.create(
            jug=jug,
            frequency_days=14,
            next_reminder_at=None,
            status=RefillSchedule.Status.PAUSED,
        )

    if pause:
        schedule.status = RefillSchedule.Status.PAUSED
        schedule.save(update_fields=['status'])
        return {"success": True, "message": f"Reminders paused for {jug_label}."}

    if resume:
        schedule.status = RefillSchedule.Status.ACTIVE
        if frequency_days:
            schedule.frequency_days = frequency_days
        if jug.last_delivered_at:
            schedule.next_reminder_at = jug.last_delivered_at + timezone.timedelta(days=schedule.frequency_days)
        else:
            schedule.next_reminder_at = timezone.now() + timezone.timedelta(days=schedule.frequency_days)
        schedule.save()
        return {"success": True, "message": f"Reminders resumed for {jug_label} every {schedule.frequency_days} days."}

    if not frequency_days or frequency_days < 1 or frequency_days > 365:
        return {"error": "Frequency must be between 1 and 365 days."}

    schedule.frequency_days = frequency_days
    schedule.status = RefillSchedule.Status.ACTIVE
    if jug.last_delivered_at:
        schedule.next_reminder_at = jug.last_delivered_at + timezone.timedelta(days=frequency_days)
    else:
        schedule.next_reminder_at = timezone.now() + timezone.timedelta(days=frequency_days)
    schedule.save()
    return {"success": True, "message": f"Refill schedule for {jug_label} set to every {frequency_days} days."}

def create_order(user: User, jug_id: int, confirmed: bool):
    if not confirmed:
        return {"error": "Order must be explicitly confirmed by the user before creation."}
    try:
        jug = Jug.objects.get(id=jug_id, owner=user, status=Jug.Status.ACTIVE)
    except Jug.DoesNotExist:
        return {"error": "Jug not found or not active."}
    with transaction.atomic():
        order = Order.objects.create(
            customer=user,
            status=Order.Status.ORDERED,
            order_source=Order.OrderSource.CHATBOT,
            delivery_address_snapshot=get_customer_address(user)['full_address'],
            price_snapshot=jug.jug_type.refill_price,
        )
        OrderItem.objects.create(
            order=order,
            item_type='Refill',
            jug=jug,
            quantity=1,
            unit_price=jug.jug_type.refill_price,
        )
    return {
        "order_id": order.id,
        "status": order.status,
        "estimated_arrival": _format_dt(order.estimated_arrival),
    }

def get_jug_types(user: User):
    types = JugType.objects.filter(is_available=True)
    return [
        {
            "id": jt.id,
            "type_name": jt.type_name,
            "gallon_capacity": float(jt.gallon_capacity),
            "purchase_price": float(jt.purchase_price),
            "description": jt.description or "",
        }
        for jt in types
    ]

def create_new_jug_order(user: User, jug_type_id: int, confirmed: bool):
    if not confirmed:
        return {"error": "Order must be explicitly confirmed by the user."}
    try:
        jug_type = JugType.objects.get(id=jug_type_id, is_available=True)
    except JugType.DoesNotExist:
        return {"error": "Jug type not available."}
    address = Address.objects.filter(user=user, is_default=True).first()
    if not address:
        address = Address.objects.filter(user=user).first()
    if not address:
        return {"error": "No delivery address found. Please add one in your profile."}
    with transaction.atomic():
        order = Order.objects.create(
            customer=user,
            status=Order.Status.ORDERED,
            order_source=Order.OrderSource.CHATBOT,
            delivery_address_snapshot=address.full_address(),
            price_snapshot=jug_type.purchase_price,
        )
        OrderItem.objects.create(
            order=order,
            item_type=OrderItem.ItemType.NEW_JUG,
            jug_type=jug_type,
            quantity=1,
            unit_price=jug_type.purchase_price,
        )
    return {
        "order_id": order.id,
        "status": order.status,
        "estimated_arrival": _format_dt(order.estimated_arrival),
    }

def get_order_by_id(user: User, order_id: int):
    try:
        order = Order.objects.get(id=order_id, customer=user)
    except Order.DoesNotExist:
        return {"error": f"No order found with ID #{order_id}."}
    items = []
    for item in order.items.all():
        if item.item_type == 'Refill' and item.jug:
            name = item.jug_label or item.jug.unique_id
            items.append(f"Refill ({name})")
        elif item.item_type == 'New Jug' and item.jug_type:
            name = item.generated_jug_label or item.jug_type.type_name
            items.append(f"New Jug - {name}")
        else:
            items.append(item.item_type)
    return {
        "order_id": order.id,
        "status": order.status,
        "items": items,
        "estimated_arrival": _format_dt(order.estimated_arrival),
        "actual_arrival": _format_dt(order.actual_arrival) if order.actual_arrival else None,
        "created_at": _format_dt(order.created_at),
        "price_snapshot": float(order.price_snapshot),
    }

def cancel_order(user: User, order_id: int, confirmed: bool):
    if not confirmed:
        return {"error": "Order cancellation must be explicitly confirmed by the user."}
    try:
        order = Order.objects.get(id=order_id, customer=user)
    except Order.DoesNotExist:
        return {"error": f"Order #{order_id} not found."}
    if not order.can_be_cancelled():
        return {"error": f"Order #{order_id} cannot be cancelled because its status is '{order.status}'."}
    order.status = Order.Status.CANCELLED
    order.save(update_fields=['status'])
    OrderStatusHistory.objects.create(
        order=order,
        status=Order.Status.CANCELLED,
        changed_by=user,
        remarks="Cancelled via chatbot"
    )
    return {"success": True, "message": f"Order #{order_id} has been cancelled successfully."}

def get_refill_context(user: User):
    """
    Return the user's active jugs AND default address in one call.
    Used when the customer wants to refill a jug.
    """
    jugs = get_customer_jugs(user)
    address = get_customer_address(user)
    return {
        "jugs": jugs,
        "address": address,
    }

def get_new_jug_context(user: User):
    """
    Return available jug types AND the user's default address in one call.
    Used when the customer wants to buy a new jug.
    """
    jug_types = get_jug_types(user)
    address = get_customer_address(user)
    return {
        "jug_types": jug_types,
        "address": address,
    }

def create_batch_order(user: User, jug_ids: list[int], confirmed: bool):
    """
    Create a single order with multiple refill items.
    jug_ids: list of jug database IDs.
    Only creates the order if `confirmed` is True.
    """
    if not confirmed:
        return {"error": "Batch order must be explicitly confirmed by the user."}

    if not jug_ids or not isinstance(jug_ids, list):
        return {"error": "Please provide a list of jug IDs to refill."}

    # Validate all jugs
    jugs = []
    errors = []
    for jid in jug_ids:
        try:
            jug = Jug.objects.get(id=jid, owner=user, status=Jug.Status.ACTIVE)
            jugs.append(jug)
        except Jug.DoesNotExist:
            errors.append(f"Jug with ID {jid} not found or not active.")

    if errors:
        return {"error": "Some jugs could not be ordered: " + "; ".join(errors)}

    # Get address (default or first)
    address = Address.objects.filter(user=user, is_default=True).first()
    if not address:
        address = Address.objects.filter(user=user).first()
    if not address:
        return {"error": "No delivery address found. Please add one in your profile."}

    total_price = sum(jug.jug_type.refill_price for jug in jugs)

    with transaction.atomic():
        order = Order.objects.create(
            customer=user,
            status=Order.Status.ORDERED,
            order_source=Order.OrderSource.CHATBOT,
            delivery_address_snapshot=address.full_address(),
            price_snapshot=total_price,
        )
        for jug in jugs:
            OrderItem.objects.create(
                order=order,
                item_type='Refill',
                jug=jug,
                quantity=1,
                unit_price=jug.jug_type.refill_price,
            )

    return {
        "order_id": order.id,
        "status": order.status,
        "total_price": float(total_price),
        "jug_count": len(jugs),
        "estimated_arrival": _format_dt(order.estimated_arrival),
    }