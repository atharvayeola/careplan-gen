from rest_framework import serializers
from .models import Provider, Patient, Order, CarePlan
import re

class ProviderSerializer(serializers.Serializer):
    npi = serializers.CharField()
    name = serializers.CharField()

    def validate_npi(self, value):
        if not re.match(r'^\d{10}$', value):
            raise serializers.ValidationError("NPI must be exactly 10 digits")
        return value

class PatientSerializer(serializers.Serializer):
    # Accept camelCase from frontend, map to snake_case
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    mrn = serializers.CharField()
    dob = serializers.DateField()
    sex = serializers.CharField()
    weight = serializers.FloatField(required=False, allow_null=True)
    primaryDiagnosis = serializers.CharField(source='primary_diagnosis')
    additionalDiagnoses = serializers.ListField(
        child=serializers.CharField(), 
        source='additional_diagnoses', 
        required=False, 
        default=list
    )
    allergies = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    medicationHistory = serializers.ListField(
        child=serializers.CharField(), 
        source='medication_history', 
        required=False, 
        default=list
    )

    def validate_mrn(self, value):
        if not re.match(r'^\d{6}$', value):
            raise serializers.ValidationError("MRN must be exactly 6 digits")
        return value

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['medication', 'notes']

class CarePlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarePlan
        fields = ['id', 'content', 'created_at']

class SubmitFormSerializer(serializers.Serializer):
    provider = ProviderSerializer()
    patient = PatientSerializer()
    order = OrderSerializer()

class PatientCredentialSerializer(serializers.Serializer):
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    mrn = serializers.CharField()
    dob = serializers.DateField()
    sex = serializers.CharField()

    def validate_mrn(self, value):
        if not re.match(r'^\d{6}$', value):
            raise serializers.ValidationError("MRN must be exactly 6 digits")
        return value
