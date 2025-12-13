"""
URL configuration for authentication endpoints
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views_auth import (
    CustomTokenObtainPairView,
    RegisterView,
    LogoutView,
    ProfileView,
    ChangePasswordView,
    VerifyTokenView,
)

urlpatterns = [
    # Token endpoints
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # Registration
    path('register/', RegisterView.as_view(), name='register'),
    
    # User management
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('verify/', VerifyTokenView.as_view(), name='verify_token'),
]
