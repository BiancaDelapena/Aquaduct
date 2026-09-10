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
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django_ratelimit.decorators import ratelimit
from datetime import timedelta
from django.db.models import Count
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from django.core.mail import send_mail
import uuid
import csv


# pyrefly: ignore [missing-import]
from .models import (
    User, Address,
    JugType, Jug, RefillSchedule, Order, OrderItem, Notification, PasswordResetOTP,
    OrderStatusHistory, Notification, AdminAuditLog, ProfileChangeLog,
)

# pyrefly: ignore [missing-import]
from .serializers import (
    UserSerializer, AddressSerializer, RegisterSerializer, JugTypeSerializer, JugSerializer,
    RefillScheduleSerializer, OrderSerializer, OrderCreateSerializer, OrderStatusUpdateSerializer, 
    NotificationSerializer, AdminAuditLogSerializer, ProfileChangeLogSerializer, 
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
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        if 'name' in request.data:
            last_name_change = ProfileChangeLog.objects.filter(
                user=user, field_name='name'
            ).order_by('-changed_at').first()
            if last_name_change:
                thirty_days_ago = timezone.now() - timedelta(days=30)
                if last_name_change.changed_at > thirty_days_ago:
                    return Response(
                        {'detail': 'You can only change your name once every 30 days.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        return super().update(request, *args, **kwargs)


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

class UserProfileChangeLogView(generics.ListAPIView):
    serializer_class = ProfileChangeLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProfileChangeLog.objects.filter(user=self.request.user).order_by('-changed_at')

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

        qs = Jug.objects.filter(owner=user)
        self._process_overdue_schedules(user)
        return qs

    def _process_overdue_schedules(self, user):
        """
        For each active schedule of the user that has a past due date,
        create a reminder notification and advance the date by frequency_days.
        """
        now = timezone.now()
        overdue_schedules = RefillSchedule.objects.filter(
            jug__owner=user,
            status=RefillSchedule.Status.ACTIVE,
            next_reminder_at__lte=now,
        ).select_related('jug')

        for schedule in overdue_schedules:
            Notification.objects.create(
                user=user,
                title='Refill Reminder',
                message=f'Your jug {schedule.jug.unique_id} is due for a refill.',
                notification_type=Notification.NotificationType.REMINDER,
            )
            schedule.next_reminder_at = now + timedelta(days=schedule.frequency_days)
            schedule.save(update_fields=['next_reminder_at'])

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
        old_label = instance.jug_label
        new_label = self.request.data.get('jug_label', old_label)

        if not old_label and new_label:
            Notification.objects.create(
                user=instance.owner,
                title='Jug Named',
                message=f'Your new jug has been named "{new_label}" and is now registered to your account.',
                notification_type=Notification.NotificationType.SYSTEM,
            )

        super().perform_update(serializer)

class RefillScheduleDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = RefillScheduleSerializer
    permission_classes = [IsOwnerOrAdmin]
    queryset = RefillSchedule.objects.all()

    def get_object(self):
        jug_pk = self.kwargs.get('jug_pk') or self.request.query_params.get('jug_id')
        if jug_pk:
            return RefillSchedule.objects.get(jug__id=jug_pk, jug__owner=self.request.user)
        return super().get_object()


# ═══════════════ ORDER VIEWS ═══════════════

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
            status=Order.Status.ORDERED,
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
            status=Order.Status.ORDERED,
            changed_by=request.user,
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

            for item in instance.items.filter(
                item_type=OrderItem.ItemType.NEW_JUG,
                generated_jug__isnull=True
            ):
                jug = Jug.objects.create(
                    unique_id=f"JUG-{uuid.uuid4().hex[:8].upper()}",   # ← THIS LINE MUST BE PRESENT
                    owner=instance.customer,
                    jug_type=item.jug_type,
                    status=Jug.Status.ACTIVE,
                    last_delivered_at=timezone.now()
                )
                item.generated_jug = jug
                item.save(update_fields=['generated_jug'])
                RefillSchedule.objects.create(
                    jug=jug,
                    frequency_days=14,          # a sensible default
                    next_reminder_at=None,      # paused → no reminder date
                    status=RefillSchedule.Status.PAUSED,
                )

            # Update refill jugs
            for item in instance.items.filter(
                item_type=OrderItem.ItemType.REFILL,
                jug__isnull=False
            ):
                item.jug.last_delivered_at = timezone.now()
                item.jug.save(update_fields=['last_delivered_at'])
        else:
            instance.save()   # for other status changes

        OrderStatusHistory.objects.create(
            order=instance,
            status=new_status,
            changed_by=self.request.user,
        )

class OrderETAUpdateView(generics.UpdateAPIView):
    serializer_class = serializers.Serializer  # we'll create a simple serializer
    required_role = 'Admin'
    permission_classes = [IsRole]
    queryset = Order.objects.all()

    def get_serializer_class(self):
        # inline simple serializer
        class ETASerializer(serializers.Serializer):
            estimated_arrival = serializers.DateTimeField()
        return ETASerializer

    def perform_update(self, serializer):
        instance = self.get_object()
        instance.estimated_arrival = serializer.validated_data['estimated_arrival']
        instance.save()

# ═══════════════ NOTIFICATION ═══════════════

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def post(self, request):
        """Mark all notifications as read."""
        self.get_queryset().update(is_read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── NEW ──
    def delete(self, request):
        """Delete all notifications for the current user."""
        self.get_queryset().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CustomerConsumptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        months = []
        for i in range(5, -1, -1):
            first_of_month = (now.replace(day=1) - timedelta(days=i*30)).replace(day=1)
            month_name = first_of_month.strftime('%b')
            months.append({
                'month': month_name,
                'year': first_of_month.year,
                'month_start': first_of_month,
                'count': 0,
            })

        refill_counts = (
            Order.objects.filter(
                customer=request.user,
                status=Order.Status.DELIVERED,
                items__item_type=OrderItem.ItemType.REFILL,
                completed_at__isnull=False,
            )
            .annotate(month=TruncMonth('completed_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        for item in refill_counts:
            if item['month']:
                for m in months:
                    if (item['month'].year == m['year'] and
                        item['month'].month == m['month_start'].month):
                        m['count'] = item['count']
                        break

        return Response([{'month': m['month'], 'count': m['count']} for m in months])

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class AdminAuditLogListView(generics.ListAPIView):
    serializer_class = AdminAuditLogSerializer
    required_role = 'Admin'
    permission_classes = [IsRole]
    queryset = AdminAuditLog.objects.all()
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['action', 'resource_id', 'admin_user__email']
    filterset_fields = ['action', 'resource_type']
    pagination_class = StandardResultsSetPagination

class OrderReportDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRole]
    required_role = 'Admin'

    def get(self, request):
        period = request.query_params.get('period', 'month')  # 'week' or 'month'

        now = timezone.now()
        if period == 'week':
            start_date = now - timedelta(days=now.weekday())  # Monday
            end_date = now
            file_prefix = 'weekly'
        else:
            start_date = now.replace(day=1)
            end_date = now
            file_prefix = 'monthly'

        orders = Order.objects.filter(
            status=Order.Status.DELIVERED,
            completed_at__gte=start_date,
            completed_at__lte=end_date
        ).select_related('customer')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{file_prefix}_report_{now.strftime("%Y-%m-%d")}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Order ID', 'Customer', 'Amount', 'Date Delivered'])
        total = 0
        for order in orders:
            writer.writerow([
                order.id,
                order.customer.email,
                order.price_snapshot,
                order.completed_at.strftime('%Y-%m-%d %H:%M') if order.completed_at else ''
            ])
            total += order.price_snapshot

        writer.writerow([])
        writer.writerow(['Total Earnings', '', total, ''])
        return response

class CancelOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        # Only the customer who owns the order can cancel
        if order.customer != request.user:
            return Response({"detail": "You can only cancel your own orders."}, status=status.HTTP_403_FORBIDDEN)

        if not order.can_be_cancelled():
            return Response(
                {"detail": "Only orders with status 'Ordered' can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = order.status
        order.status = Order.Status.CANCELLED
        order.save(update_fields=['status'])

        # Record status change
        OrderStatusHistory.objects.create(
            order=order,
            status=Order.Status.CANCELLED,
            changed_by=request.user,
            remarks="Cancelled by customer"
        )

        return Response({
            "detail": f"Order #{order.id} has been cancelled.",
            "order_id": order.id,
            "status": order.status,
        })

# ═══════════════ FORGOT PASSWORD (OTP) ═══════════════

class RequestOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required.'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'If that email is registered, an OTP has been sent.'})

        # Invalidate old OTPs
        PasswordResetOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        otp = PasswordResetOTP.objects.create(
            user=user,
            otp=PasswordResetOTP.generate_otp(),
        )

        send_mail(
            'Aquaduct - Password Reset OTP',
            f'Your OTP is: {otp.otp}\nIt expires in 10 minutes.',
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )

        return Response({'message': 'If that email is registered, an OTP has been sent.'})


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()

        if not email or not otp:
            return Response({'error': 'Email and OTP are required.'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid request.'}, status=400)

        ten_min_ago = timezone.now() - timedelta(minutes=10)
        otp_obj = PasswordResetOTP.objects.filter(
            user=user,
            otp=otp,
            is_used=False,
            created_at__gte=ten_min_ago
        ).first()

        if not otp_obj:
            return Response({'error': 'Invalid or expired OTP.'}, status=400)

        otp_obj.is_used = True
        otp_obj.save(update_fields=['is_used'])

        return Response({'message': 'OTP verified.', 'email': email})


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()
        new_password = request.data.get('password', '')

        if not email or not otp or not new_password:
            return Response({'error': 'Email, OTP, and new password are required.'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid request.'}, status=400)

        ten_min_ago = timezone.now() - timedelta(minutes=10)
        otp_obj = PasswordResetOTP.objects.filter(
            user=user,
            otp=otp,
            is_used=True,
            created_at__gte=ten_min_ago
        ).first()

        if not otp_obj:
            return Response({'error': 'OTP verification required or expired.'}, status=400)

        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password has been reset successfully.'})

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