import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField

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
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Care Plan for {self.patient}"
