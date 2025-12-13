"""
Custom User model with role-based access control for specialty pharmacy
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser
    Adds role-based access control for pharmacy workflows
    """
    
    class Role(models.TextChoices):
        PHARMACIST = 'pharmacist', 'Pharmacist'
        TECHNICIAN = 'technician', 'Pharmacy Technician'
        ADMIN = 'admin', 'Administrator'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.TECHNICIAN,
        help_text="User's role determines their access level"
    )
    
    # Optional: Link to Provider for pharmacists
    provider_npi = models.CharField(
        max_length=10, 
        null=True, 
        blank=True,
        help_text="NPI number if user is a licensed provider"
    )
    
    # Session management
    last_activity = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_pharmacist(self):
        return self.role == self.Role.PHARMACIST
    
    @property
    def is_technician(self):
        return self.role == self.Role.TECHNICIAN
    
    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN
    
    def can_edit_care_plan(self):
        """Only pharmacists and admins can edit care plans"""
        return self.role in [self.Role.PHARMACIST, self.Role.ADMIN]
    
    def can_generate_care_plan(self):
        """All authenticated users can generate care plans"""
        return True
    
    def can_manage_users(self):
        """Only admins can manage users"""
        return self.role == self.Role.ADMIN
