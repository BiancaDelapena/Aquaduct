from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import (
    User, Address, JugType, Jug, RefillSchedule,
    Order, OrderItem, OrderStatusHistory, Payment,
    Notification, JugReport, ProfileChangeLog,
)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Role Info", {"fields": ("role", "phone_number", "license_no", "driver_status")}),
    )
    list_display = ("username", "email", "role", "phone_number", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("username", "email", "phone_number")

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "address_type", "full_address", "is_default", "created_at")
    list_filter = ("address_type", "is_default")
    search_fields = ("street_address", "barangay", "building_name", "user__email")
    readonly_fields = ("created_at", "updated_at")

@admin.register(JugType)
class JugTypeAdmin(admin.ModelAdmin):
    list_display = ("id", "type_name", "gallon_capacity", "purchase_price", "refill_price", "image_preview")
    search_fields = ("type_name",)
    readonly_fields = ("image_preview",)
    fields = (
        "type_name",
        "gallon_capacity",
        "purchase_price",
        "refill_price",
        "description",
        "image",
        "image_preview",
        "is_available",
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 100px; max-width: 150px;"/>', obj.image.url)
        return "No image"
    image_preview.short_description = "Image Preview"

class RefillScheduleInline(admin.StackedInline):
    model = RefillSchedule
    extra = 0

@admin.register(Jug)
class JugAdmin(admin.ModelAdmin):
    list_display = ("unique_id", "jug_label", "owner", "jug_type", "status", "reminder_active")
    list_filter = ("status", "jug_type")
    search_fields = ("unique_id", "jug_label", "owner__email")
    inlines = [RefillScheduleInline]
    readonly_fields = ("created_at", "updated_at")

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ("item_type", "jug", "jug_type", "quantity", "unit_price", "generated_jug")
    readonly_fields = ("generated_jug",)

class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    fields = ("status", "changed_by", "changed_at", "remarks")
    readonly_fields = ("changed_at",)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "driver", "status", "order_source", "total_amount", "created_at")
    list_filter = ("status", "order_source", "created_at")
    search_fields = ("id", "customer__email", "driver__email", "delivery_address_snapshot")
    inlines = [OrderItemInline, OrderStatusHistoryInline]
    readonly_fields = ("created_at", "updated_at", "price_snapshot", "delivery_address_snapshot")

    def total_amount(self, obj):
        return obj.price_snapshot
    total_amount.short_description = "Total (snapshot)"

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "item_type", "quantity", "unit_price", "generated_jug")
    search_fields = ("order__id",)
    autocomplete_fields = ("order", "jug", "jug_type")
    list_filter = ("item_type",)
    readonly_fields = ("created_at",)

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "amount", "payment_status", "paid_at", "reference_number")
    list_filter = ("payment_status", "paid_at")
    search_fields = ("order__id", "reference_number")
    readonly_fields = ("amount", "paid_at")

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "notification_type", "user", "order", "is_read", "sent_at")
    list_filter = ("notification_type", "is_read")
    search_fields = ("title", "message", "user__email")

@admin.register(JugReport)
class JugReportAdmin(admin.ModelAdmin):
    list_display = ("id", "jug", "reported_by", "report_type", "status", "resolved_by", "created_at")
    list_filter = ("report_type", "status")
    search_fields = ("description", "jug__unique_id", "reported_by__email")

@admin.register(ProfileChangeLog)
class ProfileChangeLogAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "field_name", "changed_at")
    list_filter = ("field_name",)
    search_fields = ("user__email",)
    readonly_fields = ("changed_at",)