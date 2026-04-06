from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, CustomerProfile, DriverProfile, Jug, ServiceOrder, OrderStatusHistory, Notification, Payment

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role Info', {'fields': ('role',)}),
    )
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('username', 'email')

@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = (
        'full_name',
        'user',
        'address_type',
        'phone_number',
        'created_at'
    )
    list_filter = ('address_type',)
    search_fields = ('full_name', 'user__username', 'address')

    fieldsets = (
        ("Basic Info", {
            'fields': ('user', 'full_name', 'phone_number')
        }),
        ("Address Info", {
            'fields': ('address_type', 'address')
        }),
        ("Building Details (if applicable)", {
            'fields': ('building_name', 'unit_number', 'delivery_notes')
        }),
    )

@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'phone_number', 'is_available')
    list_filter = ('is_available',)
    search_fields = ('full_name', 'user__username')



@admin.register(Jug)
class JugAdmin(admin.ModelAdmin):
    list_display = ('jug_label', 'customer', 'status', 'purchased_at')
    list_filter = ('status',)
    search_fields = ('jug_label', 'customer__full_name')



@admin.register(ServiceOrder)
class ServiceOrderAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'order_type',
        'status',
        'customer',
        'assigned_driver',
        'requested_at'
    )
    list_filter = ('status', 'order_type')
    search_fields = ('customer__full_name', 'id')
    autocomplete_fields = ('customer', 'assigned_driver', 'jug')

@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('order', 'from_status', 'to_status', 'changed_by', 'changed_at')
    list_filter = ('to_status',)
    search_fields = ('order__id',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'user', 'is_read', 'created_at')
    list_filter = ('type', 'is_read')
    search_fields = ('title', 'user__username')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('order', 'amount', 'status', 'paid_at')
    list_filter = ('status',)
    search_fields = ('order__id', 'reference_no')