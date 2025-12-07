from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from .serializers import (
    SubmitFormSerializer, ProviderSerializer, PatientSerializer, 
    PatientCredentialSerializer, CarePlanUpdateSerializer, 
    FeedbackSubmissionSerializer, CarePlanSerializer
)
import logging
import csv

logger = logging.getLogger(__name__)
from .services import (
    check_provider, check_provider_by_name, create_provider,
    check_patient, check_patient_by_name, create_patient,
    check_duplicate_order, create_order,
    calculate_diff, process_feedback_batch
)
from .models import Order, CarePlan, CarePlanFeedback
from .llm import generate_care_plan, extract_feedback_keypoints

class ProviderValidationView(APIView):
    def post(self, request):
        serializer = ProviderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        provider_by_name = check_provider_by_name(data['name'])
        provider_by_npi = check_provider(data['npi'])

        if provider_by_name and provider_by_name.npi != data['npi']:
            return Response(
                {'error': "Provider is already registered with different credentials. Please verify the correct NPI for this provider."},
                status=status.HTTP_409_CONFLICT
            )

        if provider_by_npi and provider_by_npi.name.lower() != data['name'].lower():
            return Response(
                {'error': "This NPI is registered to a different provider. Please use matching provider credentials."},
                status=status.HTTP_409_CONFLICT
            )

        return Response({'success': True}, status=status.HTTP_200_OK)

class PatientValidationView(APIView):
    def post(self, request):
        credential_data = {
            'firstName': request.data.get('firstName'),
            'lastName': request.data.get('lastName'),
            'mrn': request.data.get('mrn'),
            'dob': request.data.get('dob'),
            'sex': request.data.get('sex'),
        }
        serializer = PatientCredentialSerializer(data=credential_data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        patient_by_name = check_patient_by_name(data['first_name'], data['last_name'])
        if patient_by_name:
            if str(patient_by_name.dob) != str(data['dob']) or patient_by_name.sex.lower() != data['sex'].lower():
                return Response(
                    {'error': "Patient is already registered with different credentials. Please verify DOB and sex."},
                    status=status.HTTP_409_CONFLICT
                )
            if patient_by_name.mrn != data['mrn']:
                return Response(
                    {'error': "Patient is already registered with different credentials. Please verify MRN."},
                    status=status.HTTP_409_CONFLICT
                )

        patient_by_mrn = check_patient(data['mrn'])
        if patient_by_mrn and (patient_by_mrn.first_name.lower() != data['first_name'].lower() or patient_by_mrn.last_name.lower() != data['last_name'].lower()):
            return Response(
                {'error': "This MRN is registered to a different patient. Please verify patient credentials."},
                status=status.HTTP_409_CONFLICT
            )

        return Response({'success': True}, status=status.HTTP_200_OK)

class SubmitView(APIView):
    def post(self, request):
        serializer = SubmitFormSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"Form validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        warnings = []

        # 1. Provider Logic - reuse existing silently
        provider_data = data['provider']
        provider_by_name = check_provider_by_name(provider_data['name'])
        provider_by_npi = check_provider(provider_data['npi'])

        if provider_by_name and provider_by_name.npi != provider_data['npi']:
            return Response(
                {'error': "Provider is already registered with different credentials. Please verify the correct NPI for this provider."},
                status=status.HTTP_409_CONFLICT
            )

        if provider_by_npi and provider_by_npi.name.lower() != provider_data['name'].lower():
            return Response(
                {'error': "This NPI is registered to a different provider. Please use matching provider credentials."},
                status=status.HTTP_409_CONFLICT
            )

        if provider_by_npi:
            db_provider = provider_by_npi
        elif provider_by_name:
            db_provider = provider_by_name
        else:
            db_provider = create_provider(provider_data)

        # 2. Patient Logic - block duplicates
        patient_data = data['patient']
        patient_by_name = check_patient_by_name(patient_data['first_name'], patient_data['last_name'])
        if patient_by_name:
            if str(patient_by_name.dob) != str(patient_data['dob']) or patient_by_name.sex.lower() != patient_data['sex'].lower():
                return Response(
                    {'error': "Patient is already registered with different DOB/sex. Please verify patient credentials."},
                    status=status.HTTP_409_CONFLICT
                )
            if patient_by_name.mrn != patient_data['mrn']:
                return Response(
                    {'error': "Patient is already registered with different credentials. Please verify the MRN for this patient."},
                    status=status.HTTP_409_CONFLICT
                )

        db_patient = check_patient(patient_data['mrn'])
        if db_patient:
            return Response(
                {'error': 'Patient with this MRN already exists. Cannot create duplicate patient record.'},
                status=status.HTTP_409_CONFLICT
            )
        db_patient = create_patient(patient_data)

        # 3. Order Logic - warn but allow
        order_data = data['order']
        duplicate_order = check_duplicate_order(db_patient.id, order_data['medication'])
        if duplicate_order:
            warnings.append(f"Duplicate order detected: {order_data['medication']} was ordered recently for this patient.")

        db_order = create_order({
            'patient': db_patient,
            'provider': db_provider,
            'medication': order_data['medication'],
            'notes': order_data.get('notes')
        })

        return Response({
            'success': True,
            'warnings': warnings,
            'data': {'orderId': db_order.id}
        })

class GenerateCarePlanView(APIView):
    def post(self, request):
        order_id = request.data.get('orderId')
        if not order_id:
            return Response({'error': 'Order ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.select_related('patient', 'provider').get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            care_plan_content = generate_care_plan(order.patient, order)
            
            care_plan = CarePlan.objects.create(
                patient=order.patient,
                order=order,
                content=care_plan_content
            )

            return Response({
                'success': True,
                'carePlan': {
                    'id': care_plan.id,
                    'content': care_plan_content,
                    'version': care_plan.version
                }
            })
        except Exception as e:
            logger.error(f"Care plan generation failed for order {order_id}: {str(e)}")
            return Response({'error': 'Failed to generate care plan'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CarePlanUpdateView(APIView):
    """
    POST /api/care-plan/update/
    Updates a care plan with user edits
    """
    def post(self, request):
        serializer = CarePlanUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        care_plan = get_object_or_404(CarePlan, id=serializer.validated_data['carePlanId'])
        care_plan.content = serializer.validated_data['editedContent']
        care_plan.is_edited = True
        care_plan.edit_count += 1
        care_plan.version += 1
        care_plan.save()
        
        logger.info(f"Care plan {care_plan.id} updated to version {care_plan.version}")
        
        return Response({
            'success': True,
            'updatedCarePlan': CarePlanSerializer(care_plan).data
        })

class FeedbackSubmitView(APIView):
    """
    POST /api/feedback/submit/
    Submits user feedback, extracts key points via LLM, triggers batch processing
    """
    def post(self, request):
        serializer = FeedbackSubmissionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate diff
        diff_data = calculate_diff(
            serializer.validated_data['originalContent'],
            serializer.validated_data['editedContent']
        )
        
        logger.info(f"Diff calculated: {diff_data['summary']}")
        
        # Extract structured feedback using LLM
        extracted_data = extract_feedback_keypoints(
            serializer.validated_data['feedbackText'],
            diff_data
        )
        
        logger.info(f"Extracted categories: {extracted_data['categories']}")
        
        # Create feedback record with extracted categories
        feedback = CarePlanFeedback.objects.create(
            care_plan_id=serializer.validated_data['carePlanId'],
            original_content=serializer.validated_data['originalContent'],
            edited_content=serializer.validated_data['editedContent'],
            diff_data=diff_data,
            feedback_categories=extracted_data['categories'],
            feedback_text=serializer.validated_data['feedbackText'],
            extracted_issues=extracted_data['issues'],
            extracted_suggestions=extracted_data['suggestions'],
            severity=extracted_data.get('severity', 'medium')
        )
        
        logger.info(f"Feedback {feedback.id} created successfully")
        
        # Check if we've hit batch threshold (5 unprocessed records)
        unprocessed_count = CarePlanFeedback.objects.filter(
            processed_for_prompt=False
        ).count()
        
        batch_triggered = False
        if unprocessed_count >= 5:
            logger.info(f"Batch threshold reached ({unprocessed_count}). Triggering batch processing...")
            try:
                process_feedback_batch()
                batch_triggered = True
            except Exception as e:
                logger.error(f"Batch processing failed: {str(e)}")
        
        return Response({
            'success': True,
            'feedbackId': feedback.id,
            'extractedCategories': extracted_data['categories'],
            'extractedIssues': extracted_data['issues'],
            'extractedSuggestions': extracted_data['suggestions'],
            'severity': extracted_data.get('severity', 'medium'),
            'batchTriggered': batch_triggered,
            'unprocessedCount': unprocessed_count
        })

class ExportView(APIView):
    def get(self, request):
        orders = Order.objects.select_related('patient', 'provider').order_by('-created_at')
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="pharma-report.csv"'

        writer = csv.writer(response)
        headers = [
            'orderID', 'orderDate', 'patientMRN', 'patientFirstName', 'patientLastName',
            'patientDOB', 'patientSex', 'providerNPI', 'providerName', 'medication',
            'primaryDiagnosis', 'additionalDiagnoses', 'medicationHistory'
        ]
        writer.writerow(headers)

        for order in orders:
            writer.writerow([
                order.id,
                order.created_at.isoformat(),
                order.patient.mrn,
                order.patient.first_name,
                order.patient.last_name,
                order.patient.dob.isoformat(),
                order.patient.sex,
                order.provider.npi,
                order.provider.name,
                order.medication,
                order.patient.primary_diagnosis,
                '; '.join(order.patient.additional_diagnoses) if order.patient.additional_diagnoses else '',
                '; '.join(order.patient.medication_history) if order.patient.medication_history else '',
            ])

        return response
