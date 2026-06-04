from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import User, Address, ProfileChangeLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'phone_number', 'role', 'license_no', 'driver_status']
        read_only_fields = ['role']

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
    full_name = serializers.CharField(required=True, max_length=255)
    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True, min_length=6)


    def create(self, validated_data):
        # Extract data
        email = validated_data['email']
        password = validated_data.pop('password')
        full_name = validated_data.get('full_name', '')
        phone = validated_data.get('phone', '')
        address = validated_data.get('address', '')
        
        # Generate username from email (use the part before @)
        username = email.split('@')[0]
        
        # Ensure username is unique
        counter = 1
        original_username = username
        while User.objects.filter(username=username).exists():
            username = f"{original_username}{counter}"
            counter += 1
        
        # Split full name into first and last name
        name_parts = full_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        # Create user with role as Customer
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone,
            role='Customer',
            password=password
        )
        
        # Create default address if provided
        if address:
            Address.objects.create(
                user=user,
                street_address=address,
                address_type='House',
                is_default=True
            )
        
        return user

    def validate_phone(self, value):
        if self.instance and self.instance.role == 'Customer' and not value:
            raise serializers.ValidationError("Phone number is required for customers.")
        return value

    def update(self, instance, validated_data):
        tracked_fields = ['first_name', 'last_name']
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
        fields = ['id', 'address_type', 'street_address', 'barangay', 'landmark',
                  'building_name', 'unit_number', 'address_notes', 'is_default']
        read_only_fields = ['id']

    def validate(self, data):
        if data.get('address_type') == 'Apartment':
            if not data.get('building_name') or not data.get('unit_number'):
                raise serializers.ValidationError(
                    "Building name and unit number are required for apartments."
                )
        return data

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

