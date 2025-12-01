from decouple import config
import google.generativeai as genai
from django.conf import settings
import logging
from datetime import datetime, date

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=config('GEMINI_API_KEY', default='mock-key'))

def calculate_age(dob):
    """Calculate age from date of birth"""
    if isinstance(dob, str):
        dob = datetime.strptime(dob, '%Y-%m-%d').date()
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return age

def generate_care_plan(patient_data, order_data):
    # Calculate age
    age = calculate_age(patient_data.dob)
    
    # Format DOB as mm/dd/yyyy
    if isinstance(patient_data.dob, str):
        dob_obj = datetime.strptime(patient_data.dob, '%Y-%m-%d')
    else:
        dob_obj = datetime.combine(patient_data.dob, datetime.min.time())
    formatted_dob = dob_obj.strftime('%m/%d/%Y')
    
    # Get current timestamp
    now = datetime.now()
    generation_date = now.strftime('%m/%d/%Y')
    generation_time = now.strftime('%H:%M')
    
    if not config('GEMINI_API_KEY', default=None):
        logger.warning("No Gemini API Key configured. Returning mock care plan.")
        return f"""MOCK CARE PLAN for {patient_data.first_name} {patient_data.last_name}

Age: {age} years
DOB: {formatted_dob}
Generation Date: {generation_date}
Generation Time: {generation_time}

Problem list / Drug therapy problems (DTPs)
- Sample problem 1
- Sample problem 2

Goals (SMART)
- Primary: Sample goal
- Safety: Sample safety goal
- Process: Sample process goal

Pharmacist interventions / plan
Dosing & Administration
- Sample dosing recommendation

Monitoring plan & lab schedule
- Sample monitoring plan
"""

    prompt = f"""You are an expert clinical pharmacist. Generate a comprehensive Pharmacist Care Plan based on the following patient data.

IMPORTANT: Start the care plan with this exact header format:
Age: {age} years
DOB: {formatted_dob}
Generation Date: {generation_date}
Generation Time: {generation_time}

PATIENT DEMOGRAPHICS:
Name: {patient_data.first_name} {patient_data.last_name}
MRN: {patient_data.mrn}
DOB: {patient_data.dob}
Sex: {patient_data.sex}
Weight: {patient_data.weight if patient_data.weight else 'Not provided'} kg
Allergies: {patient_data.allergies if patient_data.allergies else 'Not documented'}
Primary Diagnosis: {patient_data.primary_diagnosis}
Additional Diagnoses: {', '.join(patient_data.additional_diagnoses) if patient_data.additional_diagnoses else 'None documented'}
Current Home Medications: {', '.join(patient_data.medication_history) if patient_data.medication_history else 'None documented'}

CURRENT ORDER:
Medication: {order_data.medication}
Notes: {order_data.notes if order_data.notes else 'None'}

CRITICAL: You MUST use this EXACT structure with these EXACT headers. Do not skip any section:

Problem list / Drug therapy problems (DTPs)
[List all relevant DTPs including:
- Need for efficacy (why this medication is indicated)
- Safety concerns (infusion reactions, organ toxicity, adverse events)
- Drug-drug interactions with current medications
- Contraindications based on allergies
- Patient-specific risk factors]

Goals (SMART)
[Provide specific, measurable goals:
- Primary: [Clinical efficacy goal with timeline]
- Safety goal: [Specific adverse event prevention targets]
- Process: [Completion and monitoring documentation goals]]

Pharmacist interventions / plan
[Organize by these subheaders as relevant to the medication:]

Dosing & Administration
[Calculate weight-based dosing if applicable. If weight not provided, recommend obtaining it. Specify total dose, daily dose, duration. Include lot/product documentation requirements.]

Premedication
[Based on allergies and medication type, recommend specific premedications with doses and timing]

Infusion rates & titration
[If applicable: starting rate, escalation protocol, max rate, what to do if reactions occur]

Hydration & renal protection
[Pre-hydration requirements, monitoring, product selection considerations for renal safety]

Thrombosis risk mitigation
[If applicable: risk assessment, prophylaxis recommendations, patient education]

Concomitant medications
[How to manage timing of current medications during treatment. Address drug-drug interactions identified in DTP section]

Monitoring during infusion
[Vital signs frequency, respiratory monitoring, documentation requirements]

Adverse event management
[Protocol for mild, moderate, and severe reactions with specific interventions]

Documentation & communication
[EMR documentation, team communication requirements]

Monitoring plan & lab schedule
[Specific labs/tests with timing:]
- Before treatment: [labs, vitals, baselines]
- During treatment: [monitoring frequency]
- After treatment: [follow-up labs, timing]
- Clinical follow-up: [timeline and purpose]

Be clinically accurate, specific to {order_data.medication}, consider all patient factors provided, and maintain a professional tone. Use bullet points for clarity within each section."""

    try:
        model = genai.GenerativeModel('models/gemini-3-pro-preview')
        response = model.generate_content(prompt)
        return response.text or "Failed to generate plan."
    except Exception as e:
        logger.error(f"Gemini API Error: {str(e)}")
        raise Exception("Failed to generate care plan via LLM.")
