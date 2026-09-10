import json
from django.db.models.signals import post_save, post_delete
from django.contrib.auth.signals import user_login_failed, user_logged_in, user_logged_out
from django.dispatch import receiver
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from .models import AdminAuditLog, Order, OrderStatusHistory, JugType, User, Notification


User = get_user_model()

def get_request_data(request=None):
    """Extract IP and user agent from request"""
    ip_address = None
    user_agent = ""
    
    if request:
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
    
    return ip_address, user_agent

def serialize_model(obj):
    """Convert model instance to dict for audit logging"""
    data = {}
    for field in obj._meta.fields:
        value = getattr(obj, field.name)
        # Convert non-JSON-serializable types
        if hasattr(value, 'isoformat'):  # datetime
            value = value.isoformat()
        elif not isinstance(value, (str, int, float, bool, type(None))):
            value = str(value)
        data[field.name] = value
    return data

@receiver(post_save, sender=OrderStatusHistory)
def log_order_status_change(sender, instance, created, **kwargs):
    """Log when order status changes and notify the customer."""
    if created:
        order = instance.order

        AdminAuditLog.objects.create(
            admin_user=instance.changed_by,
            action=AdminAuditLog.Action.ORDER_STATUS_CHANGED,
            resource_type='Order',
            resource_id=order.id,
            old_values={'status': str(order.status)},
            new_values={'status': instance.status},
            details=f"Order status changed to {instance.status}. {instance.remarks}" if instance.remarks else f"Order status changed to {instance.status}",
        )

        notify_statuses = [
            Order.Status.TO_BE_PICKED_UP,
            Order.Status.DELIVERED,
        ]
        if instance.status in notify_statuses:
            customer = order.customer
            title = f"Order #{order.id} Update"
            if instance.status == Order.Status.TO_BE_PICKED_UP:
                message = f"Your order #{order.id} is now 'To Be Picked Up'. Please have your jug ready."
            elif instance.status == Order.Status.DELIVERED:
                message = f"Your order #{order.id} has been delivered. Enjoy your water!"
            else:
                message = f"Your order #{order.id} status changed to {instance.status}."

            Notification.objects.create(
                user=customer,
                title=title,
                message=message,
                notification_type=Notification.NotificationType.ORDER_UPDATE,
                order=order,
            )

@receiver(post_save, sender=JugType)
def log_jug_type_change(sender, instance, created, **kwargs):
    """Log JugType creation and updates"""
    if created:
        action = AdminAuditLog.Action.JUG_TYPE_CREATED
        action_desc = "Jug Type created"
    else:
        action = AdminAuditLog.Action.JUG_TYPE_UPDATED
        action_desc = "Jug Type updated"
    
    AdminAuditLog.objects.create(
        admin_user=None,  # Django signals don't have request context
        action=action,
        resource_type='JugType',
        resource_id=instance.id,
        new_values=serialize_model(instance),
        details=f"{action_desc}: {instance.type_name}",
    )

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """Log user login"""
    if user.is_admin_user:
        ip_address, user_agent = get_request_data(request)
        AdminAuditLog.objects.create(
            admin_user=user,
            action=AdminAuditLog.Action.LOGIN,
            resource_type='Auth',
            details=f"Admin {user.email} logged in",
            ip_address=ip_address,
            user_agent=user_agent,
        )

@receiver(post_delete, sender=User)
def log_user_delete(sender, instance, **kwargs):
    """Log when a user (customer) is deleted"""
    if instance.role == User.Role.CUSTOMER:
        AdminAuditLog.objects.create(
            admin_user=None,
            action=AdminAuditLog.Action.CUSTOMER_DELETED,
            resource_type='User',
            resource_id=instance.id,
            old_values={
                'email': instance.email,
                'username': instance.username,
                'name': instance.name,
                'phone_number': instance.phone_number,
            },
            details=f"Customer deleted: {instance.email}",
        )

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """Log user login"""
    if user.is_admin_user:
        ip_address, user_agent = get_request_data(request)
        AdminAuditLog.objects.create(
            admin_user=user,
            action=AdminAuditLog.Action.LOGIN,
            resource_type='Auth',
            details=f"Admin {user.email} logged in",
            ip_address=ip_address,
            user_agent=user_agent,
        )

@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """Log user logout"""
    if user and user.is_admin_user:
        ip_address, user_agent = get_request_data(request)
        AdminAuditLog.objects.create(
            admin_user=user,
            action=AdminAuditLog.Action.LOGOUT,
            resource_type='Auth',
            details=f"Admin {user.email} logged out",
            ip_address=ip_address,
            user_agent=user_agent,
        )