import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField

# Import User model for AUTH_USER_MODEL
from .models_auth import User  # noqa: F401

class Provider(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    npi = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.npi})"

class Patient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mrn = models.CharField(max_length=6, unique=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    dob = models.DateField()
    sex = models.CharField(max_length=50)
    weight = models.FloatField(null=True, blank=True)
    primary_diagnosis = models.CharField(max_length=255)
    additional_diagnoses = ArrayField(models.CharField(max_length=255), default=list, blank=True)
    allergies = models.CharField(max_length=255, null=True, blank=True)
    medication_history = ArrayField(models.CharField(max_length=255), default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.mrn})"

class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='orders')
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='orders')
    medication = models.CharField(max_length=255)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order for {self.patient} by {self.provider}"

class CarePlan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='care_plans')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='care_plans', null=True, blank=True)
    content = models.TextField()
    
    # Version tracking
    version = models.IntegerField(default=1)
    is_edited = models.BooleanField(default=False)
    edit_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Care Plan for {self.patient} (v{self.version})"

class CarePlanFeedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    care_plan = models.ForeignKey(CarePlan, on_delete=models.CASCADE, related_name='feedbacks')
    
    # Content tracking
    original_content = models.TextField(help_text="Snapshot of original AI-generated content")
    edited_content = models.TextField(help_text="User's edited version")
    diff_data = models.JSONField(help_text="Structured diff: additions, deletions, summary")
    
    # Feedback data
    feedback_text = models.TextField(help_text="User's free-form feedback")
    feedback_categories = ArrayField(
        models.CharField(max_length=50), 
        default=list, 
        help_text="LLM-extracted categories"
    )
    extracted_issues = ArrayField(
        models.TextField(), 
        default=list, 
        help_text="LLM-extracted specific issues"
    )
    extracted_suggestions = ArrayField(
        models.TextField(), 
        default=list, 
        help_text="LLM-extracted suggestions"
    )
    severity = models.CharField(
        max_length=10, 
        choices=[('high', 'High'), ('medium', 'Medium'), ('low', 'Low')],
        default='medium',
        help_text="Clinical impact severity (LLM-extracted)"
    )
    
    # Batch processing metadata
    processed_for_prompt = models.BooleanField(default=False)
    batch_number = models.IntegerField(null=True, blank=True)
    extracted_rules = models.JSONField(null=True, blank=True, help_text="Rules extracted from batch processing")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['processed_for_prompt']),
            models.Index(fields=['batch_number']),
        ]

    def __str__(self):
        return f"Feedback for {self.care_plan} ({self.created_at.strftime('%Y-%m-%d')})"
