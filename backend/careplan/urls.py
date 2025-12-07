from django.urls import path
from .views import (
    ProviderValidationView, PatientValidationView, 
    SubmitView, GenerateCarePlanView, ExportView,
    CarePlanUpdateView, FeedbackSubmitView
)

urlpatterns = [
    path('provider/validate/', ProviderValidationView.as_view()),
    path('patient/validate/', PatientValidationView.as_view()),
    path('submit/', SubmitView.as_view()),
    path('generate-care-plan/', GenerateCarePlanView.as_view()),
    path('care-plan/update/', CarePlanUpdateView.as_view()),
    path('feedback/submit/', FeedbackSubmitView.as_view()),
    path('export/', ExportView.as_view()),
]
