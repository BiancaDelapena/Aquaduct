# aquaduct/serializers.py
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.utils import timezone
from django.core.validators import FileExtensionValidator
from .models import (
    User, Address, ProfileChangeLog,
    JugType, Jug, RefillSchedule, Order, OrderItem,
    OrderStatusHistory, Notification, AdminAuditLog
)

# ══════════════════ EXISTING SERIALIZERS ══════════════════

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'name', 'phone_number', 'role']
        read_only_fields = ['role']

    def validate_phone_number(self, value):
        user = self.instance
        if user and user.role == 'Customer' and not value:
            raise serializers.ValidationError("Phone number is required for customers.")
        return value


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration"""
    email = serializers.EmailField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="This email is already registered."
            )
        ]
    )
    name = serializers.CharField(required=True, max_length=255)
    phone = serializers.CharField(required=True, allow_blank=False)
    address = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True, min_length=6)

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data.pop('password')
        name = validated_data.get('name', '')
        phone = validated_data.get('phone', '')
        address = validated_data.get('address', '')

        username = email.split('@')[0]
        counter = 1
        original_username = username
        while User.objects.filter(username=username).exists():
            username = f"{original_username}{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            name=name,
            phone_number=phone,
            role='Customer',
            password=password
        )

        if address:
            Address.objects.create(
                user=user,
                street_address=address,
                address_type='House',
                is_default=True
            )

        return user

    def validate_phone(self, value):
        import re
        if not value or not value.strip():
            raise serializers.ValidationError("Phone number is required.")
        if not re.match(r'^\+?[0-9]{7,15}$', value):
            raise serializers.ValidationError("Phone number must be 7–15 digits and may start with '+'.")
        return value

    def update(self, instance, validated_data):
        tracked_fields = ['name']
        for field in tracked_fields:
            old = getattr(instance, field)
            new = validated_data.get(field, old)
            if old != new:
                ProfileChangeLog.objects.create(
                    user=instance,
                    field_name=field,
                    old_value=str(old),
                    new_value=str(new)
                )
        return super().update(instance, validated_data)


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'address_type', 'street_address', 'barangay',
                  'building_name', 'unit_number', 'is_default', 'full_address']
        read_only_fields = ['id', 'full_address']

    def validate(self, data):
        if data.get('address_type') == 'Apartment':
            if not data.get('unit_number'):
                raise serializers.ValidationError(
                    "Unit number is required for apartments."
                )
        return data

    def get_full_address(self, obj):
        return obj.full_address()

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        old_address = instance.full_address()
        instance = super().update(instance, validated_data)
        new_address = instance.full_address()
        if old_address != new_address:
            ProfileChangeLog.objects.create(
                user=instance.user,
                field_name='address',
                old_value=old_address,
                new_value=new_address
            )
        return instance


# ══════════════════ NEW SERIALIZERS ══════════════════

class ProfileChangeLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileChangeLog
        fields = ['id', 'field_name', 'old_value', 'new_value', 'changed_at']


# ── JugType ─────────────────────────────────────────────────

class JugTypeSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(
        required=False,
        validators=[FileExtensionValidator(allowed_extensions=['png'])]
    )
    class Meta:
        model = JugType
        fields = [
            'id', 'type_name', 'gallon_capacity',
            'purchase_price', 'refill_price',
            'description', 'image', 'is_available',
        ]
        read_only_fields = ['id']


# ── RefillSchedule ──────────────────────────────────────────
class RefillScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = RefillSchedule
        fields = ['id', 'jug', 'frequency_days', 'next_reminder_at', 'status']
        read_only_fields = ['id', 'jug', 'next_reminder_at']

    def update(self, instance, validated_data):
        if 'frequency_days' in validated_data:
            instance.frequency_days = validated_data['frequency_days']
            if instance.jug.last_delivered_at:
                instance.next_reminder_at = instance.jug.last_delivered_at + timezone.timedelta(days=instance.frequency_days)
            else:
                instance.next_reminder_at = timezone.now() + timezone.timedelta(days=instance.frequency_days)
        if 'status' in validated_data:
            instance.status = validated_data['status']
        instance.save()
        return instance

    def validate_frequency_days(self, value):
        if value > 365:
            raise serializers.ValidationError("Frequency cannot exceed 365 days.")
        return value


# ── Jug ─────────────────────────────────────────────────────
class JugSerializer(serializers.ModelSerializer):
    jug_type_name = serializers.CharField(source='jug_type.type_name', read_only=True)
    jug_type_image = serializers.ImageField(source='jug_type.image', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    refill_schedule = RefillScheduleSerializer(read_only=True)

    class Meta:
        model = Jug
        fields = [
            'id', 'unique_id', 'owner', 'owner_email',
            'jug_type', 'jug_type_name', 'jug_type_image', 'jug_label',
            'status', 'last_delivered_at', 'reminder_active', 'refill_schedule',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at', 'unique_id']

    def create(self, validated_data):
        import uuid
        validated_data['unique_id'] = f"JUG-{uuid.uuid4().hex[:8].upper()}"
        jug = super().create(validated_data)
        # Ensure every new jug has a schedule (paused by default)
        if not hasattr(jug, 'refill_schedule'):
            RefillSchedule.objects.create(
                jug=jug,
                frequency_days=14,
                next_reminder_at=None,
                status=RefillSchedule.Status.PAUSED,
            )
        return jug


# ── Order & OrderItem ───────────────────────────────────────
class OrderItemSerializer(serializers.ModelSerializer):
    jug_type_name = serializers.CharField(source='jug_type.type_name', read_only=True, allow_null=True)
    jug_label = serializers.CharField(source='jug.jug_label', read_only=True, allow_null=True)
    generated_jug_label = serializers.CharField(
        source='generated_jug.jug_label', read_only=True, allow_null=True
    )

    class Meta:
        model = OrderItem
        fields = [
            'id', 'item_type', 'jug_type', 'jug', 'quantity', 'unit_price',
            'generated_jug', 'jug_type_name', 'jug_label', 'generated_jug_label',
        ]
        read_only_fields = ['id', 'generated_jug', 'jug_type_name', 'generated_jug_label']


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.CharField(source='changed_by.email', read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'status', 'changed_by', 'changed_by_email', 'changed_at', 'remarks']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', read_only=True)
    status_history = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'customer_email', 'customer_name', 'customer_phone',
            'status', 'order_source',
            'delivery_address_snapshot', 'price_snapshot',
            'special_instructions', 'estimated_arrival', 'actual_arrival',
            'completed_at', 'created_at', 'updated_at',
            'items', 'status_history',
        ]
        read_only_fields = [
            'id', 'customer', 'price_snapshot', 'created_at', 'updated_at',
            'completed_at', 'actual_arrival', 'items',
        ]

    def get_status_history(self, obj):
        return OrderStatusHistorySerializer(obj.status_history.all(), many=True).data


class OrderCreateSerializer(serializers.Serializer):
    """Used to place a new order (customer side)."""
    address_id = serializers.IntegerField()
    items = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()  # will validate manually
        ),
        allow_empty=False
    )
    special_instructions = serializers.CharField(required=False, allow_blank=True)

    def validate_address_id(self, value):
        user = self.context['request'].user
        try:
            address = Address.objects.get(id=value, user=user)
        except Address.DoesNotExist:
            raise serializers.ValidationError("Invalid address.")
        return address

    def validate_items(self, value):
        validated_items = []
        for item in value:
            item_type = item.get('item_type')
            if item_type not in ['New Jug', 'Refill']:
                raise serializers.ValidationError(f"Invalid item_type: {item_type}")
            if item_type == 'Refill':
                jug_id = item.get('jug_id')
                if not jug_id:
                    raise serializers.ValidationError("jug_id is required for refill.")
                try:
                    jug = Jug.objects.get(id=jug_id, owner=self.context['request'].user, status='Active')
                except Jug.DoesNotExist:
                    raise serializers.ValidationError(f"Jug {jug_id} not available.")
                validated_items.append({
                    'item_type': 'Refill',
                    'jug': jug,
                    'quantity': int(item.get('quantity', 1)),
                })
            elif item_type == 'New Jug':
                jug_type_id = item.get('jug_type_id')
                if not jug_type_id:
                    raise serializers.ValidationError("jug_type_id is required for new jug.")
                try:
                    jug_type = JugType.objects.get(id=jug_type_id, is_available=True)
                except JugType.DoesNotExist:
                    raise serializers.ValidationError(f"Jug type {jug_type_id} not available.")
                validated_items.append({
                    'item_type': 'New Jug',
                    'jug_type': jug_type,
                    'quantity': int(item.get('quantity', 1)),
                })
        return validated_items


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status']


# ── Notification ────────────────────────────────────────────
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'order', 'is_read', 'sent_at']
        read_only_fields = ['id', 'sent_at']


# ── AdminAuditLog ───────────────────────────────────────────
class AdminAuditLogSerializer(serializers.ModelSerializer):
    admin_email = serializers.CharField(source='admin_user.email', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AdminAuditLog
        fields = ['id', 'admin_user', 'admin_email', 'action', 'action_display',
                  'resource_type', 'resource_id', 'details', 'timestamp']
        read_only_fields = ['id', 'timestamp']