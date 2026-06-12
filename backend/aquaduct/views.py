# aquaduct/views.py
from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from django.utils.decorators import method_decorator
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status, filters, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django_ratelimit.decorators import ratelimit
from datetime import timedelta
# pyrefly: ignore [missing-import]
from .models import (
    User, Address,
    JugType, Jug, RefillSchedule, Order, OrderItem,
    OrderStatusHistory, Payment, Notification, JugReport, AdminAuditLog,
)
# pyrefly: ignore [missing-import]
from .serializers import (
    UserSerializer, AddressSerializer, RegisterSerializer,
    JugTypeSerializer, JugSerializer,
    RefillScheduleSerializer, OrderSerializer,
    OrderCreateSerializer, OrderStatusUpdateSerializer,
    PaymentSerializer, NotificationSerializer,
    JugReportSerializer, AdminAuditLogSerializer,
)
# pyrefly: ignore [missing-import]
from .permissions import IsRole, IsOwnerOrAdmin


# ═══════════════ AUTHENTICATION VIEWS ═══════════════
# @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True), name='post')
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login view that returns HttpOnly JWT cookies instead of token JSON.
    """
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')

        # --- find user by username or email ---
        user = None
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=username)
            except User.DoesNotExist:
                return Response(
                    {'detail': 'Invalid credentials.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        if user.is_locked_out:
            remaining = user.lockout_until - timezone.now()
            minutes = int(remaining.total_seconds() // 60)
            return Response(
                {'detail': f'Account temporarily locked. Try again in {minutes} minute(s).'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            handle_failed_login(user)
            if user.is_locked_out:
                remaining = user.lockout_until - timezone.now()
                minutes = int(remaining.total_seconds() // 60)
                return Response(
                    {'detail': f'Too many failed attempts. Account locked for {minutes} minute(s).'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user.failed_login_attempts = 0
        user.lockout_until = None
        user.save(update_fields=['failed_login_attempts', 'lockout_until'])

        refresh = RefreshToken.for_user(user)

        response = Response({
            'role': user.role,
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
        })

        response.set_cookie(
            key=settings.JWT_ACCESS_COOKIE,
            value=str(refresh.access_token),
            max_age=settings.JWT_COOKIE_MAX_AGE['access'],
            domain=settings.JWT_COOKIE_DOMAIN,
            secure=settings.JWT_COOKIE_SECURE,
            httponly=settings.JWT_COOKIE_HTTPONLY,
            samesite=settings.JWT_COOKIE_SAMESITE,
        )
        # refresh token cookie
        response.set_cookie(
            key=settings.JWT_REFRESH_COOKIE,
            value=str(refresh),
            max_age=settings.JWT_COOKIE_MAX_AGE['refresh'],
            domain=settings.JWT_COOKIE_DOMAIN,
            secure=settings.JWT_COOKIE_SECURE,
            httponly=settings.JWT_COOKIE_HTTPONLY,
            samesite=settings.JWT_COOKIE_SAMESITE,
        )
        return response

@method_decorator(ratelimit(key='ip', rate='3/h', method='POST', block=True), name='post')
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        response = Response({
            'role': user.role,
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'message': 'Account created successfully.'
        }, status=status.HTTP_201_CREATED)

        # Set access token cookie
        response.set_cookie(
            key=settings.JWT_ACCESS_COOKIE,
            value=str(refresh.access_token),
            max_age=settings.JWT_COOKIE_MAX_AGE['access'],
            domain=settings.JWT_COOKIE_DOMAIN,
            secure=settings.JWT_COOKIE_SECURE,
            httponly=settings.JWT_COOKIE_HTTPONLY,
            samesite=settings.JWT_COOKIE_SAMESITE,
        )
        # Set refresh token cookie
        response.set_cookie(
            key=settings.JWT_REFRESH_COOKIE,
            value=str(refresh),
            max_age=settings.JWT_COOKIE_MAX_AGE['refresh'],
            domain=settings.JWT_COOKIE_DOMAIN,
            secure=settings.JWT_COOKIE_SECURE,
            httponly=settings.JWT_COOKIE_HTTPONLY,
            samesite=settings.JWT_COOKIE_SAMESITE,
        )

        return response


class CookieTokenRefreshView(APIView):
    """
    Refreshes the access token using the refresh token stored in the HttpOnly cookie.
    """
    permission_classes = []

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE)
        if not refresh_token:
            return Response(
                {'detail': 'No refresh token'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            refresh = RefreshToken(refresh_token)
        except TokenError:
            return Response(
                {'detail': 'Invalid refresh token'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        response = Response({'detail': 'Token refreshed'})

        # set new access cookie
        response.set_cookie(
            key=settings.JWT_ACCESS_COOKIE,
            value=str(refresh.access_token),
            max_age=settings.JWT_COOKIE_MAX_AGE['access'],
            domain=settings.JWT_COOKIE_DOMAIN,
            secure=settings.JWT_COOKIE_SECURE,
            httponly=True,
            samesite=settings.JWT_COOKIE_SAMESITE,
        )

        # rotate refresh token if enabled
        if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS', False):
            response.set_cookie(
                key=settings.JWT_REFRESH_COOKIE,
                value=str(refresh),
                max_age=settings.JWT_COOKIE_MAX_AGE['refresh'],
                domain=settings.JWT_COOKIE_DOMAIN,
                secure=settings.JWT_COOKIE_SECURE,
                httponly=True,
                samesite=settings.JWT_COOKIE_SAMESITE,
            )

        return response


class LogoutView(APIView):
    def post(self, request):
        response = Response({'detail': 'Logged out'})
        response.delete_cookie(settings.JWT_ACCESS_COOKIE)
        response.delete_cookie(settings.JWT_REFRESH_COOKIE)
        return response


# ═══════════════ PROFILE & ADDRESS VIEWS ═══════════════

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        if self.request.user.role == 'Admin' and 'user_id' in self.request.query_params:
            return User.objects.get(pk=self.request.query_params['user_id'])
        return self.request.user


class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'Admin':
            user_id = self.request.query_params.get('user_id')
            return Address.objects.filter(user_id=user_id) if user_id else Address.objects.all()
        return Address.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsOwnerOrAdmin]
    queryset = Address.objects.all()


# ═══════════════ JUG VIEWS ═══════════════

class JugTypeListCreateView(generics.ListCreateAPIView):
    queryset = JugType.objects.all()
    serializer_class = JugTypeSerializer
    required_role = 'Admin'

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [permissions.IsAuthenticated()]
        return [IsRole()]


class JugTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = JugType.objects.all()
    serializer_class = JugTypeSerializer
    required_role = 'Admin'
    permission_classes = [IsRole]


class JugListCreateView(generics.ListCreateAPIView):
    serializer_class = JugSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin_user:
            owner_id = self.request.query_params.get('user_id')
            if owner_id:
                return Jug.objects.filter(owner_id=owner_id)
            return Jug.objects.all()
        return Jug.objects.filter(owner=user)

    def perform_create(self, serializer):
        if self.request.user.is_admin_user:
            owner_id = self.request.data.get('owner')
            if owner_id:
                try:
                    owner = User.objects.get(pk=owner_id)
                    serializer.save(owner=owner)
                    return
                except User.DoesNotExist:
                    raise serializers.ValidationError("Owner not found.")
        serializer.save(owner=self.request.user)


class JugDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JugSerializer
    permission_classes = [IsOwnerOrAdmin]
    queryset = Jug.objects.all()

    def perform_update(self, serializer):
        instance = self.get_object()
        if 'status' in self.request.data and self.request.data['status'] in ['Active', 'Inactive']:
            instance.status = self.request.data['status']
            instance.save()
            return Response(JugSerializer(instance).data)
        return super().perform_update(serializer)


class RefillScheduleDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = RefillScheduleSerializer
    permission_classes = [IsOwnerOrAdmin]
    queryset = RefillSchedule.objects.all()

    def get_object(self):
        jug_pk = self.kwargs.get('jug_pk') or self.request.query_params.get('jug_id')
        if jug_pk:
            return RefillSchedule.objects.get(jug__id=jug_pk, jug__owner=self.request.user)
        return super().get_object()


# ═══════════════ ORDER & PAYMENT VIEWS ═══════════════

class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin_user:
            qs = Order.objects.all()
            customer_id = self.request.query_params.get('user_id')
            if customer_id:
                qs = qs.filter(customer_id=customer_id)
            status_filter = self.request.query_params.get('status')
            if status_filter:
                qs = qs.filter(status=status_filter)
            return qs
        return Order.objects.filter(customer=user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        create_serializer = OrderCreateSerializer(data=request.data, context={'request': request})
        create_serializer.is_valid(raise_exception=True)

        address = create_serializer.validated_data['address_id']
        items_data = create_serializer.validated_data['items']
        special = create_serializer.validated_data.get('special_instructions', '')

        total = 0
        order_items = []
        for item in items_data:
            if item['item_type'] == 'Refill':
                unit_price = item['jug'].jug_type.refill_price
                total += unit_price * item['quantity']
                order_items.append(OrderItem(
                    item_type='Refill',
                    jug=item['jug'],
                    quantity=item['quantity'],
                    unit_price=unit_price,
                ))
            else:  # New Jug
                unit_price = item['jug_type'].purchase_price
                total += unit_price * item['quantity']
                order_items.append(OrderItem(
                    item_type='New Jug',
                    jug_type=item['jug_type'],
                    quantity=item['quantity'],
                    unit_price=unit_price,
                ))

        order = Order.objects.create(
            customer=request.user,
            status=Order.Status.CREATED,
            order_source=Order.OrderSource.WEB_APP,
            delivery_address_snapshot=address.full_address(),
            price_snapshot=total,
            special_instructions=special,
        )

        for item in order_items:
            item.order = order
            item.save()

        OrderStatusHistory.objects.create(
            order=order,
            status=Order.Status.CREATED,
            changed_by=request.user,
        )

        Payment.objects.create(
            order=order,
            amount=total,
            payment_method='COD',
            payment_status=Payment.PaymentStatus.PENDING,
        )

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsOwnerOrAdmin]
    queryset = Order.objects.all()


class OrderStatusUpdateView(generics.UpdateAPIView):
    serializer_class = OrderStatusUpdateSerializer
    required_role = 'Admin'
    permission_classes = [IsRole]
    queryset = Order.objects.all()

    def perform_update(self, serializer):
        new_status = serializer.validated_data['status']
        instance = self.get_object()
        instance.status = new_status
        if new_status == Order.Status.DELIVERED:
            instance.actual_arrival = timezone.now()
            instance.completed_at = timezone.now()
        instance.save()
        OrderStatusHistory.objects.create(
            order=instance,
            status=new_status,
            changed_by=self.request.user,
        )


class PaymentListCreateView(generics.ListCreateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin_user:
            return Payment.objects.all()
        return Payment.objects.filter(order__customer=user)


class PaymentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PaymentSerializer
    required_role = 'Admin'
    permission_classes = [IsRole]
    queryset = Payment.objects.all()


# ═══════════════ NOTIFICATION & REPORTS VIEWS ═══════════════

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def post(self, request):
        self.get_queryset().update(is_read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)


class JugReportListCreateView(generics.ListCreateAPIView):
    serializer_class = JugReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_admin_user:
            return JugReport.objects.all()
        return JugReport.objects.filter(reported_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)


class AdminAuditLogListView(generics.ListAPIView):
    serializer_class = AdminAuditLogSerializer
    required_role = 'Admin'
    permission_classes = [IsRole]
    queryset = AdminAuditLog.objects.all()
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['action', 'resource_id', 'admin_user__email']
    filterset_fields = ['action', 'resource_type']


# ═══════════════ LOCKOUT HELPERS ═══════════════
LOCKOUT_THRESHOLDS = {
    5: timedelta(minutes=1),
    10: timedelta(minutes=5),
    15: timedelta(minutes=20),
    20: timedelta(hours=1),
}

def get_lockout_duration(attempts):
    for threshold, duration in sorted(LOCKOUT_THRESHOLDS.items(), reverse=True):
        if attempts >= threshold:
            return duration
    return None

def handle_failed_login(user):
    """
    Increment failed attempts and set lockout if a threshold is reached.
    """
    user.failed_login_attempts = F('failed_login_attempts') + 1
    user.save(update_fields=['failed_login_attempts'])
    user.refresh_from_db()

    duration = get_lockout_duration(user.failed_login_attempts)
    if duration:
        user.lockout_until = timezone.now() + duration
        user.save(update_fields=['lockout_until'])