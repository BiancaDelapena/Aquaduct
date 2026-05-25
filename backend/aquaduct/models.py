from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.db import transaction



class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "Admin", "Admin"
        DRIVER = "Driver", "Driver"
        CUSTOMER = "Customer", "Customer"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)

# ---------------------------------------------------------
class TimeStampedModel(models.Model):
    """
    Abstract base model that adds created_at and updated_at fields
    to every table that needs them.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

# ---------------------------------------------------------
# 1. Customer Profile
# ---------------------------------------------------------
class CustomerProfile(TimeStampedModel):
    """
    Extends the base User account with customer-specific data.
    One user = one customer profile.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_profile"
    )

    def __str__(self):
        return f"CustomerProfile: {self.user.email}"


# ---------------------------------------------------------
# 2. Driver Profile
# ---------------------------------------------------------
class DriverProfile(TimeStampedModel):
    """
    Extends the base User account with driver-specific data.
    One user = one driver profile.
    """
    class Status(models.TextChoices):
        AVAILABLE = "Available", "Available"
        BUSY = "Busy", "Busy"
        INACTIVE = "Inactive", "Inactive"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="driver_profile"
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    license_no = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE
    )

    def __str__(self):
        return f"DriverProfile: {self.user.email}"


# ---------------------------------------------------------
# 3. Address
# ---------------------------------------------------------
class Address(TimeStampedModel):

    class AddressType(models.TextChoices):
        HOUSE = "House", "House"
        APARTMENT = "Apartment", "Apartment"

    customer_profile = models.ForeignKey(
        CustomerProfile,
        on_delete=models.CASCADE,
        related_name="addresses"
    )
    address_type = models.CharField(
        max_length=20,
        choices=AddressType.choices
    )

    building_name = models.CharField(max_length=100, blank=True, null=True)
    unit_number = models.CharField(max_length=50, blank=True, null=True)

    street_address = models.CharField(max_length=255)

    address_notes = models.TextField(blank=True, null=True)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.full_address()} ({self.customer_profile.user.email})"

    def full_address(self):
        parts = []

        if self.unit_number:
            parts.append(self.unit_number)

        if self.building_name:
            parts.append(self.building_name)

        parts.append(self.street_address)

        return ", ".join(parts)

    def save(self, *args, **kwargs):
        if self.is_default:
            Address.objects.filter(
                customer_profile=self.customer_profile,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)

        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Address"
        verbose_name_plural = "Addresses"

# ---------------------------------------------------------
# 4. Jug Type
# ---------------------------------------------------------
class JugType(models.Model):
    """
    Master table for jug types.
    Example: Round, Slim, 5-gallon, etc.
    """
    type_name = models.CharField(max_length=50, unique=True)
    gallon_capacity = models.DecimalField(max_digits=5, decimal_places=2)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    refill_price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.type_name} ({self.gallon_capacity} gal)"



class Jug(TimeStampedModel):
    """
    Represents an actual jug owned by a customer.
    Important business rule:
    - A Jug record is created only after a New Jug order is placed.
    """
    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        LOST = "Lost", "Lost"
        BROKEN = "Broken", "Broken"
        RETIRED = "Retired", "Retired"

    customer_profile = models.ForeignKey(
        CustomerProfile,
        on_delete=models.CASCADE,
        related_name="jugs"
    )
    jug_type = models.ForeignKey(
        JugType,
        on_delete=models.PROTECT,
        related_name="jugs"
    )
    jug_label = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    def __str__(self):
        label = self.jug_label or f"Jug #{self.pk}"
        return f"{label} - {self.customer_profile.user.email}"


# ---------------------------------------------------------
# 6. Refill Schedule
# ---------------------------------------------------------
class RefillSchedule(models.Model):
    """
    Stores refill schedule data for a jug.
    Business rule:
    - This should only be valid when jug.status = 'Active'
    """
    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        PAUSED = "Paused", "Paused"
        DISABLED = "Disabled", "Disabled"

    jug = models.OneToOneField(
        Jug,
        on_delete=models.CASCADE,
        related_name="refill_schedule"
    )
    frequency_days = models.PositiveIntegerField(blank=True, null=True)
    next_refill_date = models.DateField(blank=True, null=True)
    last_delivery_date = models.DateField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    def clean(self):
        """
        Validate business rules that are not simple field checks.
        """
        # Refill schedules should only exist for active jugs.
        if self.jug_id and self.jug.status != Jug.Status.ACTIVE:
            raise ValidationError("Refill schedules are only valid for Active jugs.")

        # If frequency is set, it should be positive.
        if self.frequency_days is not None and self.frequency_days <= 0:
            raise ValidationError("frequency_days must be greater than 0.")

    def __str__(self):
        return f"Refill schedule for {self.jug}"
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


# ---------------------------------------------------------
# 7. Service Order
# ---------------------------------------------------------
class ServiceOrder(TimeStampedModel):
    """
    Main order header.
    One order can contain multiple order items.
    """
    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        ASSIGNED = "Assigned", "Assigned"
        ON_THE_WAY = "On the way", "On the way"
        DELIVERED = "Delivered", "Delivered"
        CANCELLED = "Cancelled", "Cancelled"

    customer_profile = models.ForeignKey(
        CustomerProfile,
        on_delete=models.PROTECT,
        related_name="service_orders"
    )
    driver_profile = models.ForeignKey(
        DriverProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_orders"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    delivery_address_snapshot = models.TextField(
        help_text="Stores the exact address string used when the order was placed."
    )
    scheduled_pickup_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    @transaction.atomic
    def recalculate_total(self):
        total = sum(
            item.quantity * item.unit_price for item in self.items.all()
        )
        self.total_amount = total
        self.save(update_fields=["total_amount", "updated_at"])

    def __str__(self):
        return f"Order #{self.pk} - {self.customer_profile.user.email}"

# ---------------------------------------------------------
# 8. Order Item (base table only)
# ---------------------------------------------------------
class OrderItem(TimeStampedModel):
    """
    Single unified order item model.
    Handles both refill and new jug orders.
    """

    class ItemType(models.TextChoices):
        REFILL = "Refill", "Refill"
        NEW_JUG = "New Jug", "New Jug"

    order = models.ForeignKey(
        ServiceOrder,
        on_delete=models.CASCADE,
        related_name="items"
    )

    item_type = models.CharField(
        max_length=20,
        choices=ItemType.choices
    )

    # For refill items
    jug = models.ForeignKey(
        Jug,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="refill_items"
    )

    # For new jug items
    jug_type = models.ForeignKey(
        JugType,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="new_jug_items"
    )

    # Filled only after payment is confirmed for NEW_JUG items
    generated_jug = models.OneToOneField(
        Jug,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="source_order_item"
    )

    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def clean(self):
        super().clean()

        if self.item_type not in self.ItemType.values:
            raise ValidationError({"item_type": "Invalid item type."})

        if self.item_type == self.ItemType.REFILL:
            if not self.jug:
                raise ValidationError({"jug": "Refill items must have a jug."})
            if self.jug_type_id:
                raise ValidationError({"jug_type": "Refill items cannot have a jug type."})
            if self.order_id and self.jug.customer_profile_id != self.order.customer_profile_id:
                raise ValidationError({"jug": "This jug does not belong to the customer."})
            if self.jug.status != Jug.Status.ACTIVE:
                raise ValidationError({"jug": "Only active jugs can be refilled."})
            if self.generated_jug_id:
                raise ValidationError({"generated_jug": "Refill items cannot generate jugs."})

        elif self.item_type == self.ItemType.NEW_JUG:
            if not self.jug_type:
                raise ValidationError({"jug_type": "New Jug items must have a jug type."})
            if self.jug_id:
                raise ValidationError({"jug": "New Jug items cannot have an existing jug."})
            if self.quantity != 1:
                raise ValidationError({"quantity": "New Jug items must have quantity = 1."})

    def __str__(self):
        return f"{self.item_type} - Order #{self.order_id}"


# ---------------------------------------------------------
# 11. Order Status History
# ---------------------------------------------------------
class OrderStatusHistory(models.Model):
    """
    Stores every order status change for auditing and tracking.
    """
    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        ASSIGNED = "Assigned", "Assigned"
        ON_THE_WAY = "On the way", "On the way"
        DELIVERED = "Delivered", "Delivered"
        CANCELLED = "Cancelled", "Cancelled"

    order = models.ForeignKey(
        ServiceOrder,
        on_delete=models.CASCADE,
        related_name="status_history"
    )
    status = models.CharField(max_length=20, choices=Status.choices)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="status_changes_made"
    )
    remarks = models.TextField(blank=True, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.order_id} -> {self.status}"


# ---------------------------------------------------------
# 12. Payment
# ---------------------------------------------------------
class Payment(models.Model):
    """
    One order = one payment record.
    Since order_id is unique, this enforces a 1:1 relationship.
    """
    class PaymentStatus(models.TextChoices):
        PENDING = "Pending", "Pending"
        PAID = "Paid", "Paid"
        FAILED = "Failed", "Failed"
        REFUNDED = "Refunded", "Refunded"

    order = models.OneToOneField(
        ServiceOrder,
        on_delete=models.CASCADE,
        related_name="payment"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    payment_method = models.CharField(max_length=50)
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING
    )
    paid_at = models.DateTimeField(blank=True, null=True)
    reference_number = models.CharField(max_length=100, blank=True, null=True)

    def clean(self):
        super().clean()
        if self.amount <= 0:
            raise ValidationError({"amount": "Payment amount must be greater than 0."})

    def __str__(self):
        return f"Payment for Order #{self.order_id}"

    def save(self, *args, **kwargs):
        if self.order_id:
            self.amount = self.order.total_amount

        if self.payment_status == self.PaymentStatus.PAID and self.paid_at is None:
            self.paid_at = timezone.now()

        self.full_clean()
        super().save(*args, **kwargs)

# ---------------------------------------------------------
# 13. Notification
# ---------------------------------------------------------
class Notification(models.Model):
    """
    Stores user notifications.
    Notifications may be linked to an order, but that link is optional.
    """
    class NotificationType(models.TextChoices):
        ORDER_UPDATE = "Order Update", "Order Update"
        PAYMENT = "Payment", "Payment"
        SYSTEM = "System", "System"
        REMINDER = "Reminder", "Reminder"
        ASSIGNMENT = "Assignment", "Assignment"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    order = models.ForeignKey(
        ServiceOrder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications"
    )
    title = models.CharField(max_length=100)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices
    )
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification to {self.user} - {self.title}"


# ---------------------------------------------------------
# 14. Jug Report
# ---------------------------------------------------------
class JugReport(TimeStampedModel):
    """
    Used when a customer reports a jug problem.
    """
    class ReportType(models.TextChoices):
        LOST = "Lost", "Lost"
        BROKEN = "Broken", "Broken"
        LEAKING = "Leaking", "Leaking"
        WRONG_JUG = "Wrong Jug", "Wrong Jug"
        OTHER = "Other", "Other"

    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        REVIEWED = "Reviewed", "Reviewed"
        APPROVED = "Approved", "Approved"
        RESOLVED = "Resolved", "Resolved"
        REJECTED = "Rejected", "Rejected"

    jug = models.ForeignKey(
        Jug,
        on_delete=models.PROTECT,
        related_name="reports"
    )
    customer_profile = models.ForeignKey(
        CustomerProfile,
        on_delete=models.PROTECT,
        related_name="jug_reports"
    )
    report_type = models.CharField(
        max_length=50,
        choices=ReportType.choices
    )
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="jug_reports_resolved"
    )
    resolved_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.report_type} report for Jug #{self.jug_id}"