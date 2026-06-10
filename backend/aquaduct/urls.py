# aquaduct/urls.py

from django.urls import path
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    UserProfileView,
    CookieTokenRefreshView,
    LogoutView,      
    AddressListCreateView,
    AddressDetailView,
    JugTypeListCreateView,
    JugTypeDetailView,
    JugListCreateView,
    JugDetailView,
    RefillScheduleDetailView,
    OrderListCreateView,
    OrderDetailView,
    OrderStatusUpdateView,
    PaymentListCreateView,
    PaymentDetailView,
    NotificationListView,
    JugReportListCreateView,
    AdminAuditLogListView,
)

urlpatterns = [
    # Auth & Profile (existing)
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('addresses/', AddressListCreateView.as_view(), name='address-list'),
    path('addresses/<int:pk>/', AddressDetailView.as_view(), name='address-detail'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),

    # Jug Types (Admin)
    path('jug-types/', JugTypeListCreateView.as_view(), name='jugtype-list'),
    path('jug-types/<int:pk>/', JugTypeDetailView.as_view(), name='jugtype-detail'),

    # Jugs
    path('jugs/', JugListCreateView.as_view(), name='jug-list'),
    path('jugs/<int:pk>/', JugDetailView.as_view(), name='jug-detail'),

    # Refill Schedule (by jug pk or schedule pk)
    path('jugs/<int:jug_pk>/schedule/', RefillScheduleDetailView.as_view(), name='jug-schedule'),
    path('schedules/<int:pk>/', RefillScheduleDetailView.as_view(), name='schedule-detail'),

    # Orders
    path('orders/', OrderListCreateView.as_view(), name='order-list'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/status/', OrderStatusUpdateView.as_view(), name='order-status-update'),

    # Payments
    path('payments/', PaymentListCreateView.as_view(), name='payment-list'),
    path('payments/<int:pk>/', PaymentDetailView.as_view(), name='payment-detail'),

    # Notifications
    path('notifications/', NotificationListView.as_view(), name='notification-list'),

    # Jug Reports
    path('jug-reports/', JugReportListCreateView.as_view(), name='jugreport-list'),

    # Admin Audit Logs
    path('admin/audit-logs/', AdminAuditLogListView.as_view(), name='admin-audit-logs'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
]