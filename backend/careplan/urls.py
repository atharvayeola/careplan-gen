from django.urls import path
from .views import SubmitView, GenerateCarePlanView, ExportView, ProviderValidationView, PatientValidationView

urlpatterns = [
    path('submit/', SubmitView.as_view(), name='submit'),
    path('generate-care-plan/', GenerateCarePlanView.as_view(), name='generate-care-plan'),
    path('export/', ExportView.as_view(), name='export'),
    path('provider/validate/', ProviderValidationView.as_view(), name='provider-validate'),
    path('patient/validate/', PatientValidationView.as_view(), name='patient-validate'),
]
