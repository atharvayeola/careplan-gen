from decouple import config
import google.generativeai as genai
from django.conf import settings
import logging
from datetime import datetime, date
import json

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

def extract_feedback_keypoints(feedback_text, diff_data):
    """
    LLM extracts structured data from free-form feedback
    """
    prompt = f"""Extract key information from this pharmacist's feedback on an AI-generated care plan.

FEEDBACK TEXT:
{feedback_text}

CARE PLAN CHANGES:
- {len(diff_data['additions'])} lines added
- {len(diff_data['deletions'])} lines removed

TASK: Extract and categorize the feedback into structured JSON:
{{
    "categories": ["dosing", "safety", "monitoring"],  // Choose from: dosing, safety, drug_interactions, monitoring, administration, contraindications, allergies, documentation, formatting, other
    "issues": [
        "Missing renal dose adjustment for CrCl <30",
        "No mention of hepatitis B screening"
    ],
    "suggestions": [
        "Add renal dosing table",
        "Include HBsAg/HBcAb testing in pre-treatment labs"
    ],
    "severity": "high"  // Choose: high, medium, or low based on clinical impact
}}

Return ONLY valid JSON, no other text."""

    try:
        model = genai.GenerativeModel('models/gemini-3-pro-preview')
        response = model.generate_content(prompt)
        
        # Extract JSON from response
        response_text = response.text.strip()
        # Remove markdown code blocks if present
        if response_text.startswith('```'):
            response_text = response_text.split('\n', 1)[1]
            response_text = response_text.rsplit('\n```', 1)[0]
        if response_text.startswith('json'):
            response_text = response_text[4:].strip()
        
        extracted = json.loads(response_text)
        return extracted
    except Exception as e:
        logger.error(f"Feedback extraction failed: {str(e)}")
        # Fallback to basic categorization
        return {
            "categories": ["other"],
            "issues": [feedback_text[:200]],  # First 200 chars
            "suggestions": [],
            "severity": "medium"
        }

def extract_improvement_rules(feedback_batch):
    """
    Meta-LLM call to analyze feedback and extract general rules
    """
    prompt = """You are a clinical AI prompt engineer. Analyze the following 5 pieces of feedback on care plan generation to extract general, high-confidence improvement rules.

FEEDBACK DATA:
"""
    
    for i, feedback in enumerate(feedback_batch, 1):
        prompt += f"\n--- Feedback {i} ---\n"
        prompt += f"Categories: {', '.join(feedback.feedback_categories)}\n"
        prompt += f"Issues Identified: {', '.join(feedback.extracted_issues)}\n"
        prompt += f"Suggestions: {', '.join(feedback.extracted_suggestions)}\n"
        prompt += f"Severity: {feedback.severity}\n"
        prompt += f"User Comment: {feedback.feedback_text[:300]}\n"  # Truncate if too long
        prompt += f"Changes Made:\n"
        prompt += f"  - Added {len(feedback.diff_data.get('additions', []))} lines\n"
        prompt += f"  - Removed {len(feedback.diff_data.get('deletions', []))} lines\n"
        
        if feedback.diff_data.get('additions'):
            sample_additions = feedback.diff_data['additions'][:3]
            prompt += f"  Sample additions: {sample_additions}\n"
    
    prompt += """
TASK: Extract 1-3 general rules that appear across multiple feedback instances (80%+ confidence).
Format as JSON:
{
    "high_confidence_rules": [
        {
            "rule": "Always include baseline lab requirements before infusion",
            "confidence": "high",
            "applies_to": "all infusion therapies",
            "supporting_feedback_count": 4
        }
    ],
    "medium_confidence_patterns": [
        {
            "pattern": "Consider mentioning drug-drug interactions more explicitly",
            "supporting_feedback_count": 2
        }
    ],
    "recommendation": "update_prompt"
}

Choose recommendation from: "update_prompt", "monitor_more_data", "no_action_needed"

Return ONLY the JSON, no other text."""

    try:
        model = genai.GenerativeModel('models/gemini-3-pro-preview')
        response = model.generate_content(prompt)
        
        # Extract JSON from response
        response_text = response.text.strip()
        # Remove markdown code blocks if present
        if response_text.startswith('```'):
            response_text = response_text.split('\n', 1)[1]
            response_text = response_text.rsplit('\n```', 1)[0]
        if response_text.startswith('json'):
            response_text = response_text[4:].strip()
        
        rules = json.loads(response_text)
        return rules
    except Exception as e:
        logger.error(f"Rule extraction failed: {str(e)}")
        return {
            "error": str(e),
            "high_confidence_rules": [],
            "medium_confidence_patterns": [],
            "recommendation": "monitor_more_data"
        }
