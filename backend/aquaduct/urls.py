from django.urls import path
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    UserProfileView,
    AddressListCreateView,
    AddressDetailView
)

urlpatterns = [
    # Authentication endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', RegisterView.as_view(), name='register'),
    
    # Profile and address endpoints
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('addresses/', AddressListCreateView.as_view(), name='address-list'),
    #path('admin/profile-logs/', AdminProfileChangeLogListView.as_view(), name='admin-profile-logs'),
    path('addresses/<int:pk>/', AddressDetailView.as_view(), name='address-detail'),
]