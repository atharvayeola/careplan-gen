from django.test import TestCase
from careplan.models import Provider, Patient, Order
from careplan.services import (
    check_provider, create_provider,
    check_patient, create_patient,
    check_duplicate_order, create_order
)
from django.utils import timezone
from datetime import timedelta

class ProviderServicesTest(TestCase):
    def test_check_provider_not_exists(self):
        result = check_provider('9999999999')
        self.assertIsNone(result)
    
    def test_create_provider(self):
        provider = create_provider({'npi': '1234567890', 'name': 'Dr. Test'})
        self.assertIsNotNone(provider)
        self.assertEqual(provider.npi, '1234567890')
        self.assertEqual(provider.name, 'Dr. Test')
    
    def test_check_provider_exists(self):
        create_provider({'npi': '1234567890', 'name': 'Dr. Test'})
        result = check_provider('1234567890')
        self.assertIsNotNone(result)
        self.assertEqual(result.npi, '1234567890')

class PatientServicesTest(TestCase):
    def test_check_patient_not_exists(self):
        result = check_patient('999999')
        self.assertIsNone(result)
    
    def test_create_patient(self):
        from datetime import date
        patient = create_patient({
            'first_name': 'John',
            'last_name': 'Doe',
            'mrn': '123456',
            'dob': date(1980, 1, 1),
            'sex': 'Male',
            'primary_diagnosis': 'Hypertension'
        })
        self.assertIsNotNone(patient)
        self.assertEqual(patient.mrn, '123456')
        self.assertEqual(patient.first_name, 'John')
    
    def test_check_patient_exists(self):
        from datetime import date
        create_patient({
            'first_name': 'John',
            'last_name': 'Doe',
            'mrn': '123456',
            'dob': date(1980, 1, 1),
            'sex': 'Male',
            'primary_diagnosis': 'Hypertension'
        })
        result = check_patient('123456')
        self.assertIsNotNone(result)
        self.assertEqual(result.mrn, '123456')

class OrderServicesTest(TestCase):
    def setUp(self):
        from datetime import date
        self.provider = create_provider({'npi': '1234567890', 'name': 'Dr. Test'})
        self.patient = create_patient({
            'first_name': 'John',
            'last_name': 'Doe',
            'mrn': '123456',
            'dob': date(1980, 1, 1),
            'sex': 'Male',
            'primary_diagnosis': 'Hypertension'
        })
    
    def test_create_order(self):
        order = create_order({
            'patient': self.patient,
            'provider': self.provider,
            'medication': 'Aspirin',
            'notes': 'Test'
        })
        self.assertIsNotNone(order)
        self.assertEqual(order.medication, 'Aspirin')
    
    def test_check_duplicate_order_not_exists(self):
        result = check_duplicate_order(self.patient.id, 'Aspirin')
        self.assertIsNone(result)
    
    def test_check_duplicate_order_exists_recent(self):
        create_order({
            'patient': self.patient,
            'provider': self.provider,
            'medication': 'Aspirin',
            'notes': 'Test'
        })
        result = check_duplicate_order(self.patient.id, 'Aspirin')
        self.assertIsNotNone(result)
    
    def test_check_duplicate_order_exists_old(self):
        # Create an old order (25 hours ago)
        order = create_order({
            'patient': self.patient,
            'provider': self.provider,
            'medication': 'Aspirin',
            'notes': 'Test'
        })
        # Manually set the created_at to 25 hours ago
        order.created_at = timezone.now() - timedelta(hours=25)
        order.save()
        
        # Should not find it (outside 24 hour window)
        result = check_duplicate_order(self.patient.id, 'Aspirin')
        self.assertIsNone(result)
