from django.test import TestCase
from careplan.serializers import ProviderSerializer, PatientSerializer, OrderSerializer, SubmitFormSerializer

class ProviderSerializerTest(TestCase):
    def test_valid_provider(self):
        data = {'npi': '1234567890', 'name': 'Dr. Test'}
        serializer = ProviderSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_invalid_npi_length(self):
        data = {'npi': '123', 'name': 'Dr. Test'}
        serializer = ProviderSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('npi', serializer.errors)
    
    def test_invalid_npi_non_numeric(self):
        data = {'npi': 'ABCD567890', 'name': 'Dr. Test'}
        serializer = ProviderSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('npi', serializer.errors)

class PatientSerializerTest(TestCase):
    def test_valid_patient(self):
        data = {
            'firstName': 'John',
            'lastName': 'Doe',
            'mrn': '123456',
            'dob': '1980-01-01',
            'sex': 'Male',
            'primaryDiagnosis': 'Hypertension'
        }
        serializer = PatientSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_invalid_mrn_length(self):
        data = {
            'firstName': 'John',
            'lastName': 'Doe',
            'mrn': '123',
            'dob': '1980-01-01',
            'sex': 'Male',
            'primaryDiagnosis': 'Hypertension'
        }
        serializer = PatientSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('mrn', serializer.errors)
    
    def test_invalid_mrn_non_numeric(self):
        data = {
            'firstName': 'John',
            'lastName': 'Doe',
            'mrn': 'ABCDEF',
            'dob': '1980-01-01',
            'sex': 'Male',
            'primaryDiagnosis': 'Hypertension'
        }
        serializer = PatientSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('mrn', serializer.errors)
    
    def test_invalid_date(self):
        data = {
            'firstName': 'John',
            'lastName': 'Doe',
            'mrn': '123456',
            'dob': 'not-a-date',
            'sex': 'Male',
            'primaryDiagnosis': 'Hypertension'
        }
        serializer = PatientSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('dob', serializer.errors)
    
    def test_missing_required_field(self):
        data = {
            'firstName': 'John',
            # lastName missing
            'mrn': '123456',
            'dob': '1980-01-01',
            'sex': 'Male',
            'primaryDiagnosis': 'Hypertension'
        }
        serializer = PatientSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('lastName', serializer.errors)

class OrderSerializerTest(TestCase):
    def test_valid_order(self):
        data = {'medication': 'Aspirin', 'notes': 'Take daily'}
        serializer = OrderSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_valid_order_no_notes(self):
        data = {'medication': 'Aspirin'}
        serializer = OrderSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_missing_medication(self):
        data = {'notes': 'Take daily'}
        serializer = OrderSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('medication', serializer.errors)

class SubmitFormSerializerTest(TestCase):
    def test_valid_full_form(self):
        data = {
            'provider': {'npi': '1234567890', 'name': 'Dr. Test'},
            'patient': {
                'firstName': 'John',
                'lastName': 'Doe',
                'mrn': '123456',
                'dob': '1980-01-01',
                'sex': 'Male',
                'primaryDiagnosis': 'Hypertension'
            },
            'order': {'medication': 'Aspirin', 'notes': 'Test'}
        }
        serializer = SubmitFormSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
