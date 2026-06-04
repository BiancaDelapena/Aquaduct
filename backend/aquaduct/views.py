from django.http import JsonResponse
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Address
from .serializers import UserSerializer, AddressSerializer, RegisterSerializer
from .permissions import IsOwnerOrAdmin

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that returns user role along with JWT tokens.
    Accepts username/email and password, along with optional role parameter.
    """
    def post(self, request, *args, **kwargs):
        try:
            # Try to get user by username or email
            username = request.data.get('username')
            password = request.data.get('password')
            
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
            
            # Verify password
            if not user.check_password(password):
                return Response(
                    {'detail': 'Invalid credentials.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'role': user.role,
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
            })
        except Exception as e:
            return Response(
                {'detail': 'An error occurred during authentication.'},
                status=status.HTTP_400_BAD_REQUEST
            )

class RegisterView(generics.CreateAPIView):
    """
    Register a new user account.
    Accepts: username, email, full_name, phone, address, password
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for the newly created user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'role': user.role,
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'message': 'Account created successfully.'
        }, status=status.HTTP_201_CREATED)

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