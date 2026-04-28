from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User,
    CustomerProfile,
    DriverProfile,
    Address,
    JugType,
    Jug,
    RefillSchedule,
    ServiceOrder,
    OrderItem,
    OrderRefillItem,
    OrderNewJugItem,
    OrderStatusHistory,
    Payment,
    Notification,
    JugReport,
)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin for your User model with role support.
    """
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Role Info", {"fields": ("role",)}),
    )

    list_display = ("username", "email", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("username", "email")
    ordering = ("username",)

class AddressInline(admin.TabularInline):
    """
    Lets you see a customer's addresses directly inside CustomerProfile admin.
    """
    model = Address
    extra = 0

@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    """
    Customer profile uses only fields that actually exist in the model.
    """
    list_display = ("id", "user", "user_email", "created_at", "updated_at")
    search_fields = ("user__username", "user__email")
    list_select_related = ("user",)
    inlines = [AddressInline]

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "Email"
    readonly_fields = ("created_at", "updated_at")

@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    """
    Driver profile admin updated to match the current model fields.
    """
    list_display = ("id", "user", "user_email", "phone_number", "license_no", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("user__username", "user__email", "phone_number", "license_no")
    list_select_related = ("user",)

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "Email"
    readonly_fields = ("created_at", "updated_at")

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    """
    Admin for customer delivery addresses.
    """
    list_display = ("id", "customer_profile", "address_type", "full_address", "is_default", "created_at")
    list_filter = ("address_type", "is_default")
    search_fields = ("street_address","building_name", "address_notes", "customer_profile__user__username", "customer_profile__user__email")
    list_select_related = ("customer_profile",)
    readonly_fields = ("created_at", "updated_at")

@admin.register(JugType)
class JugTypeAdmin(admin.ModelAdmin):
    """
    Master table for jug types.
    """
    list_display = ("id", "type_name", "gallon_capacity", "purchase_price", "refill_price")
    search_fields = ("type_name",)
    ordering = ("type_name",)

class RefillScheduleInline(admin.StackedInline):
    """
    Shows refill schedule inside Jug admin.
    Because RefillSchedule is OneToOne with Jug.
    """
    model = RefillSchedule
    extra = 0
    can_delete = True


@admin.register(Jug)
class JugAdmin(admin.ModelAdmin):
    """
    Admin for actual jug records owned by customers.
    """
    list_display = ("id", "jug_label", "customer_profile", "jug_type", "status", "created_at")
    list_filter = ("status", "jug_type")
    search_fields = (
        "jug_label",
        "customer_profile__user__username",
        "customer_profile__user__email",
        "jug_type__type_name",
    )
    autocomplete_fields = ("customer_profile", "jug_type")
    list_select_related = ("customer_profile", "jug_type")
    inlines = [RefillScheduleInline]
    readonly_fields = ("created_at", "updated_at")


class OrderItemInline(admin.TabularInline):
    """
    Lets you manage order items directly from the ServiceOrder admin.
    """
    model = OrderItem
    extra = 0


@admin.register(ServiceOrder)
class ServiceOrderAdmin(admin.ModelAdmin):
    """
    Order header admin.
    Matches current fields:
    - customer_profile
    - driver_profile
    - status
    - total_amount
    - delivery_address_snapshot
    - scheduled_pickup_at
    - completed_at
    - created_at / updated_at
    """
    list_display = (
        "id",
        "customer_profile",
        "driver_profile",
        "status",
        "total_amount",
        "scheduled_pickup_at",
        "completed_at",
        "created_at",
    )
    list_filter = ("status", "created_at", "scheduled_pickup_at")
    search_fields = (
        "id",
        "customer_profile__user__username",
        "customer_profile__user__email",
        "driver_profile__user__username",
        "driver_profile__user__email",
        "delivery_address_snapshot",
    )
    autocomplete_fields = ("customer_profile", "driver_profile")
    list_select_related = ("customer_profile", "driver_profile")
    inlines = [OrderItemInline]
    date_hierarchy = "created_at"
    readonly_fields = ("created_at", "updated_at")

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """
    Base order item admin.
    The type is determined by whether the item has a related subtype record.
    """
    list_display = ("id", "order", "quantity", "unit_price", "item_kind", "created_at")
    search_fields = ("order__id",)
    autocomplete_fields = ("order",)
    list_select_related = ("order",)

    def item_kind(self, obj):
        if hasattr(obj, "refill_detail"):
            return "REFILL"
        if hasattr(obj, "new_jug_detail"):
            return "NEW_JUG"
        return "UNKNOWN"
    item_kind.short_description = "Item Type"

@admin.register(OrderRefillItem)
class OrderRefillItemAdmin(admin.ModelAdmin):
    """
    Refill subtype admin.
    """
    list_display = ("order_item", "jug")
    search_fields = ("order_item__order__id", "jug__jug_label", "jug__customer_profile__user__email")
    autocomplete_fields = ("order_item", "jug")
    list_select_related = ("order_item", "jug")

@admin.register(OrderNewJugItem)
class OrderNewJugItemAdmin(admin.ModelAdmin):
    """
    New-jug subtype admin.
    """
    list_display = ("order_item", "jug_type", "generated_jug")
    search_fields = ("order_item__order__id", "jug_type__type_name", "generated_jug__jug_label")
    autocomplete_fields = ("order_item", "jug_type", "generated_jug")
    list_select_related = ("order_item", "jug_type", "generated_jug")


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    """
    Tracks every status change for an order.
    """
    list_display = ("id", "order", "status", "changed_by", "changed_at", "remarks")
    list_filter = ("status", "changed_at")
    search_fields = ("order__id", "changed_by__username", "changed_by__email", "remarks")
    autocomplete_fields = ("order", "changed_by")
    list_select_related = ("order", "changed_by")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """
    Payment admin matches your current payment fields.
    """
    list_display = ("id", "order", "amount", "payment_status", "paid_at", "reference_number")
    list_filter = ("payment_status", "paid_at")
    search_fields = ("order__id", "reference_number")
    autocomplete_fields = ("order",)
    list_select_related = ("order",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """
    Notification admin using the correct field names.
    """
    list_display = ("id", "title", "notification_type", "user", "order", "is_read", "sent_at")
    list_filter = ("notification_type", "is_read", "sent_at")
    search_fields = ("title", "message", "user__username", "user__email", "order__id")
    autocomplete_fields = ("user", "order")
    list_select_related = ("user", "order")

@admin.register(JugReport)
class JugReportAdmin(admin.ModelAdmin):
    """
    Admin for jug issue reports.
    """
    list_display = ("id", "jug", "customer_profile", "report_type", "status", "resolved_by", "created_at", "resolved_at")
    list_filter = ("report_type", "status", "created_at")
    search_fields = (
        "jug__jug_label",
        "jug__customer_profile__user__email",
        "customer_profile__user__email",
        "description",
    )
    autocomplete_fields = ("jug", "customer_profile", "resolved_by")
    list_select_related = ("jug", "customer_profile", "resolved_by")