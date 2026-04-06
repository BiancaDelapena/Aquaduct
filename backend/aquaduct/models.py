from decimal import Decimal
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('DRIVER', 'Driver'),
        ('CUSTOMER', 'Customer'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

class CustomerProfile(models.Model):

    class AddressType(models.TextChoices):
        HOUSE = "HOUSE", "House"
        BUILDING = "BUILDING", "Building"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_profile",
    )

    full_name = models.CharField(max_length=200)

    address_type = models.CharField(
        max_length=10,
        choices=AddressType.choices,
        default=AddressType.HOUSE,
    )

    address = models.TextField()

    building_name = models.CharField(max_length=200, blank=True)
    unit_number = models.CharField(max_length=50, blank=True)
    delivery_notes = models.TextField(blank=True)

    phone_number = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name"]

    def clean(self):
        if self.address_type == self.AddressType.BUILDING:
            if not self.building_name or not self.unit_number:
                raise ValidationError(
                    "Building name and unit number are required for building addresses."
                )

    def get_full_delivery_address(self):
        if self.address_type == self.AddressType.HOUSE:
            return self.address
        return f"{self.building_name}, Unit {self.unit_number}, {self.address} ({self.delivery_notes})"

    def __str__(self):
        return self.full_name

class DriverProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="driver_profile",
    )
    full_name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20, blank=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self):
        return self.full_name


class Jug(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        PAUSED = "PAUSED", "Paused"
        LOST = "LOST", "Lost"
        BROKEN = "BROKEN", "Broken"
        RETIRED = "RETIRED", "Retired"

    customer = models.ForeignKey(
        CustomerProfile,
        on_delete=models.CASCADE,
        related_name="jugs",
    )
    jug_label = models.CharField(max_length=100)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    refill_interval_days = models.PositiveIntegerField(null=True, blank=True)
    frequency_enabled = models.BooleanField(default=False)
    last_refilled_at = models.DateTimeField(null=True, blank=True)
    next_refill_due_at = models.DateTimeField(null=True, blank=True)
    purchased_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-purchased_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["customer", "jug_label"],
                name="unique_jug_label_per_customer",
            )
        ]

    def __str__(self):
        return f"{self.jug_label} - {self.customer.full_name}"


class ServiceOrder(models.Model):
    class OrderType(models.TextChoices):
        NEW_JUG = "NEW_JUG", "New Jug"
        REFILL = "REFILL", "Refill"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ASSIGNED = "ASSIGNED", "Assigned"
        DRIVER_ON_WAY_TO_PICKUP = "PICKUP", "Driver on the way to pick up jug"
        REFILLING = "REFILLING", "Refilling"
        ON_THE_WAY = "ON_THE_WAY", "On the way"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"

    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        REFUNDED = "REFUNDED", "Refunded"

    customer = models.ForeignKey(
        CustomerProfile,
        on_delete=models.CASCADE,
        related_name="service_orders",
    )
    jug = models.ForeignKey(
        Jug,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="service_orders",
    )

    order_type = models.CharField(
        max_length=10,
        choices=OrderType.choices,
    )
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PENDING,
    )

    requested_at = models.DateTimeField(auto_now_add=True)
    pickup_window_start = models.DateTimeField(null=True, blank=True)
    pickup_window_end = models.DateTimeField(null=True, blank=True)

    assigned_driver = models.ForeignKey(
        DriverProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_orders",
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders_assigned_by_me",
    )
    assigned_at = models.DateTimeField(null=True, blank=True)

    delivered_at = models.DateTimeField(null=True, blank=True)

    customer_name_snapshot = models.CharField(max_length=200, blank=True)
    delivery_address_snapshot = models.TextField(blank=True)

    unit_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    total_amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    payment_status = models.CharField(
        max_length=10,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )

    class Meta:
        ordering = ["-requested_at"]
        indexes = [
            models.Index(fields=["status", "requested_at"]),
            models.Index(fields=["customer", "requested_at"]),
        ]

    def clean(self):
        if self.order_type == self.OrderType.REFILL and self.jug_id is None:
            raise ValidationError({"jug": "Refill orders must be linked to a jug."})

        if self.order_type == self.OrderType.NEW_JUG and self.jug_id is not None:
            raise ValidationError({"jug": "New jug orders should not use an existing jug."})

    def __str__(self):
        return f"Order #{self.id} - {self.get_order_type_display()}"


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(
        ServiceOrder,
        on_delete=models.CASCADE,
        related_name="status_history",
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_status_changes",
    )
    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)
    changed_at = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ["-changed_at"]

    def __str__(self):
        return f"Order #{self.order_id}: {self.from_status} -> {self.to_status}"


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        REMINDER = "REMINDER", "Reminder"
        DELIVERY_UPDATE = "DELIVERY_UPDATE", "Delivery Update"
        SYSTEM = "SYSTEM", "System"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
    )
    title = models.CharField(max_length=255)
    message = models.TextField()

    related_order = models.ForeignKey(
        ServiceOrder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    related_jug = models.ForeignKey(
        Jug,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    is_read = models.BooleanField(default=False)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_type_display()} - {self.title}"


class Payment(models.Model):
    class PaymentFor(models.TextChoices):
        NEW_JUG = "NEW_JUG", "New Jug"
        REFILL = "REFILL", "Refill"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        REFUNDED = "REFUNDED", "Refunded"

    order = models.OneToOneField(
        ServiceOrder,
        on_delete=models.CASCADE,
        related_name="payment",
    )
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    payment_for = models.CharField(
        max_length=10,
        choices=PaymentFor.choices,
    )
    method = models.CharField(max_length=50, blank=True)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    reference_no = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def clean(self):
        if self.amount < 0:
            raise ValidationError({"amount": "Payment amount cannot be negative."})

    def __str__(self):
        return f"Payment #{self.id} - {self.get_status_display()}"