# aquaduct/models.py
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

# ============================================================
# USER MODEL
# ============================================================
class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "Admin", "Admin"
        DRIVER = "Driver", "Driver"
        CUSTOMER = "Customer", "Customer"

    class DriverStatus(models.TextChoices):
        AVAILABLE = "Available", "Available"
        BUSY = "Busy", "Busy"
        INACTIVE = "Inactive", "Inactive"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    phone_number = models.CharField(max_length=20, blank=True)   # mandatory for customers, enforced in forms/serializers

    # Driver-only
    license_no = models.CharField(max_length=100, blank=True, null=True)
    driver_status = models.CharField(
        max_length=20,
        choices=DriverStatus.choices,
        blank=True,
        null=True
    )

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.email or self.username} ({self.role})"

    @property
    def is_driver(self):
        return self.role == self.Role.DRIVER

    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN

# ============================================================
# BASE
# ============================================================
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ============================================================
# ADDRESS
# ============================================================
class Address(TimeStampedModel):
    class AddressType(models.TextChoices):
        HOUSE = "House", "House"
        APARTMENT = "Apartment", "Apartment"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    address_type = models.CharField(max_length=20, choices=AddressType.choices, default=AddressType.HOUSE)
    street_address = models.CharField(max_length=255)
    barangay = models.CharField(max_length=100, blank=True)
    landmark = models.CharField(max_length=255, blank=True)
    building_name = models.CharField(max_length=100, blank=True)
    unit_number = models.CharField(max_length=50, blank=True)
    address_notes = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def clean(self):
        if self.address_type == self.AddressType.APARTMENT:
            if not self.building_name or not self.unit_number:
                raise ValidationError("Building name and unit number are required for apartments.")

    def full_address(self):
        parts = []
        if self.unit_number:
            parts.append(f"Unit {self.unit_number}")
        if self.building_name:
            parts.append(self.building_name)
        parts.append(self.street_address)
        if self.barangay:
            parts.append(f"Brgy. {self.barangay}")
        if self.landmark:
            parts.append(f"Near {self.landmark}")
        return ", ".join(parts)

    def save(self, *args, **kwargs):
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

# ============================================================
# JUG TYPE
# ============================================================
class JugType(models.Model):
    type_name = models.CharField(max_length=50, unique=True)
    gallon_capacity = models.DecimalField(max_digits=5, decimal_places=2)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    refill_price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='jug_types/', blank=True, null=True)
    is_available = models.BooleanField(default=True)

    class Meta:
        ordering = ['type_name']

    def __str__(self):
        return f"{self.type_name} ({self.gallon_capacity} gal)"

# ============================================================
# JUG (individual physical jug)
# ============================================================
class Jug(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        INACTIVE = "Inactive", "Inactive"
        LOST = "Lost", "Lost"
        BROKEN = "Broken", "Broken"

    unique_id = models.CharField(max_length=50, unique=True)   # physical jug identifier
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="jugs")
    jug_type = models.ForeignKey(JugType, on_delete=models.PROTECT)
    jug_label = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    last_delivered_at = models.DateTimeField(null=True, blank=True)   # for reminder calculation
    reminder_active = models.BooleanField(default=True)               # pause/unpause toggle

    class Meta:
        indexes = [
            models.Index(fields=['owner', 'status']),
        ]

    def __str__(self):
        label = self.jug_label or self.unique_id
        return f"{label} ({self.owner.email})"

    def can_be_refilled(self):
        return self.status == self.Status.ACTIVE


# ============================================================
# REFILL SCHEDULE
# ============================================================
class RefillSchedule(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        PAUSED = "Paused", "Paused"
        DISABLED = "Disabled", "Disabled"

    jug = models.OneToOneField(Jug, on_delete=models.CASCADE, related_name="refill_schedule")
    frequency_days = models.PositiveIntegerField()
    next_reminder_at = models.DateTimeField()   # calculated as last_delivered_at + frequency_days
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        indexes = [
            models.Index(fields=['next_reminder_at', 'status']),
        ]

    def clean(self):
        if self.jug_id and self.jug.status != Jug.Status.ACTIVE:
            raise ValidationError("Schedule only allowed for active jugs.")
        if self.frequency_days <= 0:
            raise ValidationError("Frequency must be > 0.")


# ============================================================
# ORDER
# ============================================================
class Order(TimeStampedModel):
    class Status(models.TextChoices):
        CREATED = "Created", "Created"
        TO_BE_PICKED_UP = "To Be Picked Up", "To Be Picked Up"
        REFILLING = "Refilling", "Refilling"
        ON_THE_WAY = "On The Way", "On The Way"
        DELIVERED = "Delivered", "Delivered"
        CANCELLED = "Cancelled", "Cancelled"

    class OrderSource(models.TextChoices):
        WEB_APP = "Web App", "Web App"
        CHATBOT = "Chatbot", "Chatbot"

    customer = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="orders",
        limit_choices_to={'role': User.Role.CUSTOMER}
    )
    driver = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="deliveries",
        limit_choices_to={'role': User.Role.DRIVER}
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CREATED)
    order_source = models.CharField(max_length=20, choices=OrderSource.choices, default=OrderSource.WEB_APP)
    delivery_address_snapshot = models.TextField()
    price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)   # frozen total at order time
    special_instructions = models.TextField(blank=True)
    estimated_arrival = models.DateTimeField(null=True, blank=True)         # default = created_at + 2h
    actual_arrival = models.DateTimeField(null=True, blank=True)            # set when DELIVERED
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['driver', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]

    def save(self, *args, **kwargs):
        # auto-set ETA on creation
        if not self.pk and not self.estimated_arrival:
            self.estimated_arrival = timezone.now() + timezone.timedelta(hours=2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.pk} - {self.customer.email}"

    def can_be_cancelled(self):
        return self.status in [self.Status.CREATED]


# ============================================================
# ORDER ITEM
# ============================================================
class OrderItem(TimeStampedModel):
    class ItemType(models.TextChoices):
        NEW_JUG = "New Jug", "New Jug"
        REFILL = "Refill", "Refill"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    item_type = models.CharField(max_length=20, choices=ItemType.choices)
    jug_type = models.ForeignKey(JugType, on_delete=models.PROTECT, null=True, blank=True)
    jug = models.ForeignKey(Jug, on_delete=models.PROTECT, null=True, blank=True)   # for refills
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    generated_jug = models.OneToOneField(
        Jug, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="originating_order_item"
    )  # filled when new jug is delivered

    @property
    def subtotal(self):
        return self.quantity * self.unit_price

    def clean(self):
        if self.item_type == self.ItemType.REFILL:
            if not self.jug:
                raise ValidationError("Refill requires an existing jug.")
            if self.jug_type:
                raise ValidationError("Refill should not specify jug type.")
        elif self.item_type == self.ItemType.NEW_JUG:
            if not self.jug_type:
                raise ValidationError("New jug requires a jug type.")
            if self.jug:
                raise ValidationError("New jug should not reference an existing jug.")


# ============================================================
# ORDER STATUS HISTORY (audit trail for status changes)
# ============================================================
class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    status = models.CharField(max_length=20, choices=Order.Status.choices)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f"Order #{self.order_id} → {self.status} at {self.changed_at}"


# ============================================================
# PAYMENT
# ============================================================
class Payment(models.Model):
    class PaymentStatus(models.TextChoices):
        PENDING = "Pending", "Pending"
        PAID = "Paid", "Paid"
        FAILED = "Failed", "Failed"
        REFUNDED = "Refunded", "Refunded"

    order = models.OneToOneField(Order, on_delete=models.PROTECT, related_name="payment")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    reference_number = models.CharField(max_length=100, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment for Order #{self.order_id} - {self.payment_status}"


# ============================================================
# NOTIFICATIONS
# ============================================================
class Notification(models.Model):
    class NotificationType(models.TextChoices):
        REMINDER = "Reminder", "Reminder"
        ORDER_UPDATE = "Order Update", "Order Update"
        SYSTEM = "System", "System"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sent_at']


# ============================================================
# JUG REPORT (disputes / issues)
# ============================================================
class JugReport(TimeStampedModel):
    class ReportType(models.TextChoices):
        LOST = "Lost", "Lost"
        BROKEN = "Broken", "Broken"
        NOT_DELIVERED = "Not Delivered", "Not Delivered"
        OTHER = "Other", "Other"

    class ReportStatus(models.TextChoices):
        OPEN = "Open", "Open"
        RESOLVED = "Resolved", "Resolved"

    jug = models.ForeignKey(Jug, on_delete=models.CASCADE, related_name="reports")
    reported_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="jug_reports")
    report_type = models.CharField(max_length=20, choices=ReportType.choices)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=ReportStatus.choices, default=ReportStatus.OPEN)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="resolved_reports")
    resolved_at = models.DateTimeField(null=True, blank=True)


# ============================================================
# PROFILE CHANGE LOG (for Name/Address history)
# ============================================================
class ProfileChangeLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="profile_changes")
    field_name = models.CharField(max_length=50)   # e.g., 'first_name', 'last_name', 'address'
    old_value = models.TextField()
    new_value = models.TextField()
    changed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} changed {self.field_name} at {self.changed_at}"