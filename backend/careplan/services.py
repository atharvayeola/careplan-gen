from .models import Provider, Patient, Order, CarePlanFeedback
from django.utils import timezone
from django.db import models
from datetime import timedelta
import difflib
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

def check_provider(npi):
    return Provider.objects.filter(npi=npi).first()

def create_provider(data):
    return Provider.objects.create(**data)

def check_provider_by_name(name):
    # Case-insensitive match on provider name to catch conflicts
    return Provider.objects.filter(name__iexact=name).first()

def check_patient(mrn):
    return Patient.objects.filter(mrn=mrn).first()

def check_patient_by_name(first_name, last_name):
    return Patient.objects.filter(
        first_name__iexact=first_name,
        last_name__iexact=last_name
    ).first()

def create_patient(data):
    return Patient.objects.create(**data)

def check_duplicate_order(patient_id, medication):
    last_24_hours = timezone.now() - timedelta(hours=24)
    return Order.objects.filter(
        patient_id=patient_id,
        medication__iexact=medication,
        created_at__gte=last_24_hours
    ).first()

def create_order(data):
    return Order.objects.create(**data)

# New feedback-related services

def calculate_diff(original, edited):
    """
    Calculate structured diff between original and edited content
    Uses difflib for line-by-line comparison
    """
    original_lines = original.split('\n')
    edited_lines = edited.split('\n')
    
    diff = list(difflib.unified_diff(original_lines, edited_lines, lineterm=''))
    
    additions = []
    deletions = []
    
    for line in diff:
        if line.startswith('+') and not line.startswith('+++'):
            additions.append(line[1:].strip())
        elif line.startswith('-') and not line.startswith('---'):
            deletions.append(line[1:].strip())
    
    return {
        'additions': additions,
        'deletions': deletions,
        'summary': f"{len(additions)} lines added, {len(deletions)} lines removed"
    }

def process_feedback_batch():
    """
    Process accumulated feedback to extract improvement rules
    Called when 5 unprocessed feedback records exist
    """
    from .llm import extract_improvement_rules
    
    # Get unprocessed feedback
    feedback_batch = CarePlanFeedback.objects.filter(
        processed_for_prompt=False
    ).order_by('created_at')[:5]
    
    if feedback_batch.count() < 5:
        logger.info(f"Only {feedback_batch.count()} unprocessed feedback records. Need 5 to process batch.")
        return
    
    logger.info(f"Processing batch of {feedback_batch.count()} feedback records...")
    
    # Extract rules using meta-LLM call
    rules = extract_improvement_rules(feedback_batch)
    
    # Determine batch number
    max_batch = CarePlanFeedback.objects.filter(
        processed_for_prompt=True
    ).aggregate(models.Max('batch_number'))['batch_number__max']
    batch_number = (max_batch or 0) + 1
    
    # Mark as processed and store rules
    for feedback in feedback_batch:
        feedback.processed_for_prompt = True
        feedback.batch_number = batch_number
        feedback.extracted_rules = rules
        feedback.save()
    
    logger.info(f"Batch {batch_number} processed successfully")
    
    # Append to prompt improvement file
    append_to_prompt_improvements(batch_number, rules)
    
    return batch_number

def append_to_prompt_improvements(batch_number, rules):
    """
    Append high-confidence rules to a prompt improvement file
    Human pharmacist reviews these periodically to update main prompt
    """
    improvement_file = Path(__file__).parent / "prompt_improvements.md"
    
    from datetime import datetime
    
    with open(improvement_file, 'a') as f:
        f.write(f"\n\n## Batch {batch_number} - {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        
        high_confidence_rules = rules.get('high_confidence_rules', [])
        if not high_confidence_rules:
            f.write("\n*No high-confidence rules extracted from this batch.*\n")
            return
        
        for rule in high_confidence_rules:
            # Only include rules with strong support
            if rule.get('supporting_feedback_count', 0) >= 3:
                f.write(f"\n### {rule.get('rule', 'N/A')}\n")
                f.write(f"- **Confidence**: {rule.get('confidence', 'unknown')}\n")
                f.write(f"- **Applies to**: {rule.get('applies_to', 'general')}\n")
                f.write(f"- **Support**: {rule.get('supporting_feedback_count', 0)}/5 feedback instances\n")
                f.write(f"- **Action**: Consider adding to main prompt\n")
        
        # Add recommendation
        recommendation = rules.get('recommendation', 'monitor_more_data')
        f.write(f"\n**Recommendation**: {recommendation}\n")
    
    logger.info(f"Appended batch {batch_number} rules to {improvement_file}")
