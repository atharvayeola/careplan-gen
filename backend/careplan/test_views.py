from django.test import TestCase, Client
from django.urls import reverse
from careplan.models import Provider, Patient, Order
import json

class ProviderValidationTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse('provider-validate')

    def test_mismatched_name_and_npi_conflict(self):
        Provider.objects.create(npi='1234567890', name='Dr. Match')
        payload = {'npi': '9999999999', 'name': 'Dr. Match'}
        response = self.client.post(self.url, data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 409)
        self.assertIn('error', response.json())

    def test_npi_belongs_to_other_provider_conflict(self):
        Provider.objects.create(npi='1234567890', name='Dr. Match')
        payload = {'npi': '1234567890', 'name': 'Dr. Other'}
        response = self.client.post(self.url, data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 409)
        self.assertIn('error', response.json())

    def test_new_provider_passes(self):
        payload = {'npi': '1111111111', 'name': 'Dr. New'}
        response = self.client.post(self.url, data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json().get('success'))

class PatientValidationTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.submit_url = reverse('submit')
        self.validate_url = reverse('patient-validate')

    def test_patient_name_conflict_different_dob_sex(self):
        existing_payload = {
            'provider': {'npi': '1234567890', 'name': 'Dr. Match'},
            'patient': {
                'firstName': 'John',
                'lastName': 'Doe',
                'mrn': '123456',
                'dob': '1980-01-01',
                'sex': 'Male',
                'primaryDiagnosis': 'Hypertension'
            },
            'order': {'medication': 'Aspirin'}
        }
        self.client.post(self.submit_url, data=json.dumps(existing_payload), content_type='application/json')

        conflicting_payload = {
            'provider': {'npi': '9999999999', 'name': 'Dr. Other'},
            'patient': {
                'firstName': 'John',
                'lastName': 'Doe',
                'mrn': '654321',
                'dob': '1990-02-02',
                'sex': 'Female',
                'primaryDiagnosis': 'Asthma'
            },
            'order': {'medication': 'Albuterol'}
        }
        response = self.client.post(self.submit_url, data=json.dumps(conflicting_payload), content_type='application/json')
        self.assertEqual(response.status_code, 409)
        self.assertIn('error', response.json())

    def test_patient_name_conflict_different_mrn(self):
        existing_payload = {
            'provider': {'npi': '1234567890', 'name': 'Dr. Match'},
            'patient': {
                'firstName': 'Jane',
                'lastName': 'Smith',
                'mrn': '123456',
                'dob': '1985-05-05',
                'sex': 'Female',
                'primaryDiagnosis': 'Diabetes'
            },
            'order': {'medication': 'Aspirin'}
        }
        self.client.post(self.submit_url, data=json.dumps(existing_payload), content_type='application/json')

        conflicting_payload = {
            'provider': {'npi': '9999999999', 'name': 'Dr. Other'},
            'patient': {
                'firstName': 'Jane',
                'lastName': 'Smith',
                'mrn': '654321',
                'dob': '1985-05-05',
                'sex': 'Female',
                'primaryDiagnosis': 'Asthma'
            },
            'order': {'medication': 'Albuterol'}
        }
        response = self.client.post(self.submit_url, data=json.dumps(conflicting_payload), content_type='application/json')
        self.assertEqual(response.status_code, 409)
        self.assertIn('error', response.json())

    def test_patient_validate_endpoint_conflict_by_name(self):
        Patient.objects.create(
            first_name='John',
            last_name='Doe',
            mrn='123456',
            dob='1980-01-01',
            sex='Male',
            primary_diagnosis='Hypertension'
        )
        payload = {
            'firstName': 'John',
            'lastName': 'Doe',
            'mrn': '654321',
            'dob': '1990-02-02',
            'sex': 'Female',
            'primaryDiagnosis': 'Asthma'
        }
        response = self.client.post(self.validate_url, data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 409)
        self.assertIn('error', response.json())

    def test_patient_validate_endpoint_conflict_by_mrn(self):
        Patient.objects.create(
            first_name='Jane',
            last_name='Smith',
            mrn='123456',
            dob='1985-05-05',
            sex='Female',
            primary_diagnosis='Diabetes'
        )
        payload = {
            'firstName': 'Other',
            'lastName': 'Person',
            'mrn': '123456',
            'dob': '1990-02-02',
            'sex': 'Male',
            'primaryDiagnosis': 'Asthma'
        }
        response = self.client.post(self.validate_url, data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 409)
        self.assertIn('error', response.json())

    def test_patient_validate_endpoint_success(self):
        payload = {
            'firstName': 'Fresh',
            'lastName': 'Patient',
            'mrn': '555555',
            'dob': '1990-02-02',
            'sex': 'Male',
            'primaryDiagnosis': 'Asthma'
        }
        response = self.client.post(self.validate_url, data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json().get('success'))

class SubmitViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse('submit')
    
    def test_valid_submission(self):
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
        response = self.client.post(
            self.url,
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        self.assertIn('orderId', response.json()['data'])
    
    def test_duplicate_patient_blocked(self):
        # Create first patient
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
            'order': {'medication': 'Aspirin'}
        }
        self.client.post(
            self.url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Try to create duplicate patient
        response = self.client.post(
            self.url,
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 409)
        self.assertIn('error', response.json())
    
    def test_duplicate_medication_warning(self):
        # Create first order
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
            'order': {'medication': 'Aspirin'}
        }
        self.client.post(
            self.url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Create different patient, same medication
        data2 = {
            'provider': {'npi': '1234567890', 'name': 'Dr. Test'},
            'patient': {
                'firstName': 'Jane',
                'lastName': 'Smith',
                'mrn': '654321',
                'dob': '1985-05-05',
                'sex': 'Female',
                'primaryDiagnosis': 'Diabetes'
            },
            'order': {'medication': 'Aspirin'}
        }
        response = self.client.post(
            self.url,
            data=json.dumps(data2),
            content_type='application/json'
        )
        # Should succeed (different patient)
        self.assertEqual(response.status_code, 200)

    def test_provider_name_mismatch_npi(self):
        # Create provider via first submission
        initial_data = {
            'provider': {'npi': '1234567890', 'name': 'Dr. Match'},
            'patient': {
                'firstName': 'John',
                'lastName': 'Doe',
                'mrn': '123456',
                'dob': '1980-01-01',
                'sex': 'Male',
                'primaryDiagnosis': 'Hypertension'
            },
            'order': {'medication': 'Aspirin'}
        }
        self.client.post(
            self.url,
            data=json.dumps(initial_data),
            content_type='application/json'
        )

        # Submit same name but different NPI should conflict
        mismatched_provider = {
            'provider': {'npi': '9999999999', 'name': 'Dr. Match'},
            'patient': {
                'firstName': 'Jane',
                'lastName': 'Smith',
                'mrn': '654321',
                'dob': '1985-05-05',
                'sex': 'Female',
                'primaryDiagnosis': 'Diabetes'
            },
            'order': {'medication': 'Aspirin'}
        }
        response = self.client.post(
            self.url,
            data=json.dumps(mismatched_provider),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 409)
        self.assertIn('error', response.json())
    
    def test_invalid_npi(self):
        data = {
            'provider': {'npi': '123', 'name': 'Dr. Test'},
            'patient': {
                'firstName': 'John',
                'lastName': 'Doe',
                'mrn': '123456',
                'dob': '1980-01-01',
                'sex': 'Male',
                'primaryDiagnosis': 'Hypertension'
            },
            'order': {'medication': 'Aspirin'}
        }
        response = self.client.post(
            self.url,
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
    
    def test_missing_required_field(self):
        data = {
            'provider': {'npi': '1234567890', 'name': 'Dr. Test'},
            'patient': {
                'firstName': 'John',
                # lastName missing
                'mrn': '123456',
                'dob': '1980-01-01',
                'sex': 'Male',
                'primaryDiagnosis': 'Hypertension'
            },
            'order': {'medication': 'Aspirin'}
        }
        response = self.client.post(
            self.url,
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

class ExportViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse('export')
    
    def test_export_empty(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')
        # Should have headers at minimum
        content = response.content.decode('utf-8')
        self.assertIn('orderID', content)
