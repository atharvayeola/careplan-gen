from rest_framework import serializers
from .models import Provider, Patient, Order, CarePlan, CarePlanFeedback
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

    def validate_dob(self, value):
        from datetime import date
        if value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future")
        return value

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['medication', 'notes']

class CarePlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarePlan
        fields = ['id', 'content', 'version', 'is_edited', 'created_at']

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

# New serializers for feedback system

class CarePlanUpdateSerializer(serializers.Serializer):
    carePlanId = serializers.UUIDField()
    editedContent = serializers.CharField()

    def validate_editedContent(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Care plan content cannot be empty")
        return value.strip()

class FeedbackSubmissionSerializer(serializers.Serializer):
    carePlanId = serializers.UUIDField()
    originalContent = serializers.CharField()
    editedContent = serializers.CharField()
    feedbackText = serializers.CharField(
        min_length=10,
        error_messages={
            'min_length': 'Feedback must be at least 10 characters',
            'required': 'Feedback text is required'
        }
    )

    def validate_feedbackText(self, value):
        # Basic validation - ensure it's not just whitespace
        if not value.strip():
            raise serializers.ValidationError("Feedback cannot be empty")
        return value.strip()

class CarePlanFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarePlanFeedback
        fields = [
            'id', 'care_plan', 'original_content', 'edited_content', 
            'diff_data', 'feedback_text', 'feedback_categories',
            'extracted_issues', 'extracted_suggestions', 'severity',
            'processed_for_prompt', 'batch_number', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
