from .models import Provider, Patient, Order
from django.utils import timezone
from datetime import timedelta

def check_provider(npi):
    return Provider.objects.filter(npi=npi).first()

def create_provider(data):
    return Provider.objects.create(**data)

def check_provider_by_name(name):
    # Case-insensitive match on provider name to catch conflicts
    return Provider.objects.filter(name__iexact=name).first()

def check_patient(mrn):
    return Patient.objects.filter(mrn=mrn).first()

def check_patient_by_name(first_name, last_name):
    return Patient.objects.filter(
        first_name__iexact=first_name,
        last_name__iexact=last_name
    ).first()

def create_patient(data):
    return Patient.objects.create(**data)

def check_duplicate_order(patient_id, medication):
    last_24_hours = timezone.now() - timedelta(hours=24)
    return Order.objects.filter(
        patient_id=patient_id,
        medication__iexact=medication,
        created_at__gte=last_24_hours
    ).first()

def create_order(data):
    return Order.objects.create(**data)
