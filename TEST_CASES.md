# Quality Test Cases for Care Plan System

## Test Case 1: IVIG for Myasthenia Gravis (Complex Case)

### Provider Information
- **Provider Name**: Dr. Sarah Chen
- **NPI**: 1234567890

### Patient Information
- **First Name**: Jane
- **Last Name**: Doe
- **MRN**: 123456
- **DOB**: 1979-06-08
- **Sex**: Female
- **Weight**: 72
- **Allergies**: None known to medications
- **Primary Diagnosis**: Generalized myasthenia gravis (AChR antibody positive), MGFA class IIb
- **Additional Diagnoses**:
  ```
  Hypertension (well controlled)
  GERD
  ```
- **Current Medications**:
  ```
  Pyridostigmine 60 mg PO q6h PRN
  Prednisone 10 mg PO daily
  Lisinopril 10 mg PO daily
  Omeprazole 20 mg PO daily
  ```

### Order Information
- **Medication**: IVIG (Privigen 10%)
- **Notes**: 2 g/kg total dose (144g) given as 0.4 g/kg/day x 5 days. Planned course prior to thymectomy.

---

## Test Case 2: Rituxan for Rheumatoid Arthritis (Drug Interaction)

### Provider Information
- **Provider Name**: Dr. Michael Johnson
- **NPI**: 9876543210

### Patient Information
- **First Name**: Robert
- **Last Name**: Smith
- **MRN**: 654321
- **DOB**: 1965-03-15
- **Sex**: Male
- **Weight**: 85
- **Allergies**: Penicillin (rash)
- **Primary Diagnosis**: Rheumatoid arthritis (moderate to severe, DMARD-refractory)
- **Additional Diagnoses**:
  ```
  Type 2 Diabetes Mellitus
  Chronic Kidney Disease Stage 3a
  Hypertension
  ```
- **Current Medications**:
  ```
  Methotrexate 15 mg PO weekly
  Folic acid 1 mg PO daily
  Metformin 1000 mg PO BID
  Amlodipine 10 mg PO daily
  Prednisone 5 mg PO daily
  ```

### Order Information
- **Medication**: Rituximab (Rituxan) 1000 mg IV
- **Notes**: Two doses separated by 2 weeks. Monitor for hepatitis B reactivation (HBsAg negative, HBcAb positive).

---

## Test Case 3: Chemotherapy - Pediatric ALL (High Risk)

### Provider Information
- **Provider Name**: Dr. Emily Rodriguez
- **NPI**: 5555666677

### Patient Information
- **First Name**: Thomas
- **Last Name**: Anderson
- **MRN**: 789012
- **DOB**: 2015-11-20
- **Sex**: Male
- **Weight**: 28.5
- **Allergies**: NKDA
- **Primary Diagnosis**: Acute Lymphoblastic Leukemia (B-cell ALL, high-risk)
- **Additional Diagnoses**:
  ```
  Chemotherapy-induced neutropenia
  Chemotherapy-induced nausea/vomiting
  ```
- **Current Medications**:
  ```
  Ondansetron 4 mg PO q8h PRN nausea
  Acyclovir 200 mg PO BID (prophylaxis)
  Fluconazole 100 mg PO daily (prophylaxis)
  ```

### Order Information
- **Medication**: Vincristine 1.5 mg/m² IV (Maximum 2 mg)
- **Notes**: Part of consolidation chemotherapy protocol. BSA 0.95 m². Monitor for peripheral neuropathy.

---

## Test Case 4: Hemophilia A - Factor Replacement

### Provider Information
- **Provider Name**: Dr. David Park
- **NPI**: 3333444455

### Patient Information
- **First Name**: Marcus
- **Last Name**: Williams
- **MRN**: 345678
- **DOB**: 1998-07-22
- **Sex**: Male
- **Weight**: 75
- **Allergies**: Latex
- **Primary Diagnosis**: Hemophilia A (severe, Factor VIII <1%)
- **Additional Diagnoses**:
  ```
  Hemophilic arthropathy (left knee)
  History of inhibitor development (now negative)
  ```
- **Current Medications**:
  ```
  Ibuprofen 400 mg PO q6h PRN pain
  Acetaminophen 650 mg PO q6h PRN pain
  ```

### Order Information
- **Medication**: Recombinant Factor VIII (Advate) - Prophylaxis
- **Notes**: 40 IU/kg TIW (Monday-Wednesday-Friday). Home infusion patient. Last inhibitor screen negative 3 months ago.

---

## Test Case 5: Multiple Sclerosis - DMT Switch

### Provider Information
- **Provider Name**: Dr. Amanda Foster
- **NPI**: 7777888899

### Patient Information
- **First Name**: Lisa
- **Last Name**: Martinez
- **MRN**: 901234
- **DOB**: 1982-09-10
- **Sex**: Female
- **Weight**: 68
- **Allergies**: Sulfa drugs (Stevens-Johnson syndrome)
- **Primary Diagnosis**: Relapsing-Remitting Multiple Sclerosis (highly active)
- **Additional Diagnoses**:
  ```
  Depression (treated, stable)
  Migraine
  ```
- **Current Medications**:
  ```
  Glatiramer acetate 20 mg SC daily (to be discontinued)
  Sertraline 100 mg PO daily
  Sumatriptan 50 mg PO PRN migraine
  ```

### Order Information
- **Medication**: Ocrelizumab (Ocrevus) 300 mg IV
- **Notes**: Initial dose (first of two 300 mg infusions separated by 2 weeks). Screen for hepatitis B/C completed. JC virus antibody positive.

---

## Test Scenarios

### Validation Testing
1. **Invalid NPI**: Enter "123" → Should show error "NPI must be exactly 10 digits"
2. **Invalid MRN**: Enter "ABC" → Should show error "MRN must contain only numbers"
3. **Duplicate Patient**: Submit Case 1, then try submitting with same MRN → Should get 409 error

### Care Plan Quality Testing
- **Test Case 1** (IVIG): Should generate detailed premedication, infusion rate protocols, renal monitoring
- **Test Case 2** (Rituxan): Should flag methotrexate interaction, hepatitis B reactivation risk
- **Test Case 3** (Pediatric): Should calculate BSA-based dosing, mention vincristine extravasation risk
- **Test Case 4** (Hemophilia): Should discuss inhibitor monitoring, prophylaxis schedule
- **Test Case 5** (MS): Should discuss PML risk from JC virus positivity, infusion reaction management

### Export Testing
Submit multiple orders, then click "Export Pharma Report" to verify CSV contains all data

---

## Test Case 6: Iron Infusion - Anemia Management

### Provider Information
- **Provider Name**: Dr. Jennifer Lee
- **NPI**: 2222333344

### Patient Information
- **First Name**: Maria
- **Last Name**: Garcia
- **MRN**: 567890
- **DOB**: 1990-04-12
- **Sex**: Female
- **Weight**: 62
- **Allergies**: None known
- **Primary Diagnosis**: Iron deficiency anemia (Hgb 8.2 g/dL, ferritin 4 ng/mL)
- **Additional Diagnoses**:
  ```
  Menorrhagia
  History of gastric bypass surgery
  ```
- **Current Medications**:
  ```
  Ferrous sulfate 325 mg PO BID (poor absorption)
  Norethindrone 0.35 mg PO daily
  Vitamin D3 2000 IU PO daily
  ```

### Order Information
- **Medication**: Injectafer (ferric carboxymaltose) 750 mg IV
- **Notes**: Two doses separated by at least 7 days (1500 mg total dose). Monitor phosphate levels.

---

## Test Case 7: Immunodeficiency - Subcutaneous Immunoglobulin

### Provider Information
- **Provider Name**: Dr. Kevin Patel
- **NPI**: 4444555566

### Patient Information
- **First Name**: Benjamin
- **Last Name**: Thompson
- **MRN**: 234567
- **DOB**: 2010-08-05
- **Sex**: Male
- **Weight**: 45
- **Allergies**: NKDA
- **Primary Diagnosis**: Common Variable Immunodeficiency (CVID)
- **Additional Diagnoses**:
  ```
  Recurrent sinopulmonary infections
  Bronchiectasis
  ```
- **Current Medications**:
  ```
  Azithromycin 250 mg PO 3x/week (prophylaxis)
  Albuterol HFA 2 puffs q4h PRN
  Budesonide/formoterol 160/4.5 mcg 2 puffs BID
  ```

### Order Information
- **Medication**: Hizentra 20% (Subcutaneous IgG)
- **Notes**: 10 g (50 mL) subcutaneously weekly. Home infusion patient. Target IgG trough >500 mg/dL.

---

## UI/UX Test Cases

### Form Navigation & Flow
1. **Multi-Step Wizard**: 
   - Verify 4 steps display correctly: Provider Details → Patient Demographics → Clinical & Order → Review & Submit
   - Verify active step is highlighted with slate-900 background and sky-100 ring
   - Verify completed steps show sky-500 background

2. **Prevent Premature Submission**:
   - On Step 3 (Clinical & Order), press "Enter" key → Form should NOT submit
   - Click "Next" button on Step 3 → Should advance to Review step, NOT submit order
   - Verify "Submit Order" button only appears on Step 4 (Review & Submit)

3. **Back Navigation**:
   - Navigate to Step 2, click "Back" → Should return to Step 1
   - Submit an order successfully → Click "Back" button → Should be disabled (grayed out)
   - Verify user cannot navigate backwards after successful submission

### Validation Test Cases

4. **Name Field Validation**:
   - **Provider Name**: Enter "Dr. Smith123" → Error: "Provider name cannot contain numbers"
   - **Patient First Name**: Enter "John456" → Error: "First name cannot contain numbers"
   - **Patient Last Name**: Enter "789Doe" → Error: "Last name cannot contain numbers"

5. **NPI Validation**:
   - Enter "123" → Error: "NPI must be exactly 10 digits"
   - Enter "abcdefghij" → Error: "NPI must contain only numbers"
   - Enter "1234567890" → Valid ✓

6. **MRN Validation**:
   - Enter "123" → Error: "MRN must be exactly 6 digits"
   - Enter "ABC123" → Error: "MRN must contain only numbers"
   - Enter "123456" → Valid ✓

7. **Error Message Styling**:
   - Trigger any validation error → Verify error message appears in:
     - Red color (`text-red-600`)
     - Italic style
     - Monospace/robotic font (`font-mono`)
     - Small font size (`text-xs`)

### Start New Order Feature

8. **Same Provider Workflow**:
   - Complete full form submission and generate care plan
   - Click "Same Provider" button
   - Verify Provider Name and NPI are pre-filled
   - Verify all other fields are cleared
   - Verify form returns to Step 1 (Provider Details)

9. **New Provider Workflow**:
   - Complete full form submission and generate care plan
   - Click "New Provider" button
   - Verify ALL fields are cleared (including provider)
   - Verify form returns to Step 1 (Provider Details)

### Progress Updates Test Cases

10. **Care Plan Generation Progress**:
    - Submit order, click "Generate Care Plan"
    - Verify button displays animated pulsing text
    - Verify messages cycle through:
      - "Analyzing patient demographics..."
      - "Reviewing clinical history and medications..."
      - "Identifying drug therapy problems..."
      - "Formulating care plan goals..."
      - "Finalizing recommendations..."
      - "Generating document..."
    - Verify messages change approximately every 2.5 seconds

### Duplicate Detection

11. **Duplicate Patient Prevention**:
    - Submit Test Case 1 (Jane Doe, MRN 123456)
    - Try submitting again with same MRN → Should receive 409 error
    - Error message should state: "Patient with MRN 123456 already exists. Cannot create duplicate patient record."

12. **Duplicate Order Warning**:
    - Submit Test Case 1 (IVIG for Jane Doe)
    - Delete patient from database
    - Submit same patient with same medication again → Should show warning about duplicate order

### Accessibility & Responsiveness

13. **Form Labels**:
    - Verify all field labels are:
      - Uppercase
      - Bold
      - Small font (`text-xs`)
      - Wide letter spacing (`tracking-wider`)
      - Slate-500 color

14. **Input Field Styling**:
    - Verify inputs have:
      - Rounded corners (`rounded-lg`)
      - Slate-50 background when idle
      - White background on focus
      - Sky-500 border and ring on focus
      - Smooth transitions

### Edge Cases

15. **Optional Fields**:
    - Submit form with Weight field empty → Should submit successfully
    - Submit form with Additional Diagnoses empty → Should submit successfully
    - Submit form with Allergies empty → Should submit successfully
    - Submit form with Current Medications empty → Should submit successfully

16. **Special Characters**:
    - Enter multiline text in "Additional Diagnoses" → Should accept line breaks
    - Enter multiline text in "Current Medications" → Should accept line breaks
    - Verify line breaks are preserved in Review step

17. **Date Validation**:
    - Enter future date for DOB → Should accept (backend validation may differ)
    - Enter date in correct format → Should display properly in Review step

### Care Plan & Export

18. **Care Plan Download**:
    - Generate care plan → Click "Download Care Plan"
    - Verify file downloads as `care-plan.txt`
    - Verify file contains plain text content

19. **Form Reset After Download**:
    - After downloading care plan, verify "Start New Order" buttons are visible
    - Verify previously entered data persists until explicit reset

20. **Multi-Order Export**:
    - Submit Test Cases 1, 2, and 3 in sequence (using "New Provider" flow)
    - Click "Export Pharma Report"
    - Verify CSV contains all 3 orders with complete data

---

## Feedback System Test Cases

### Test Case 21: Care Plan Editing & Feedback Submission

**Objective**: Verify that users can edit AI-generated care plans and submit structured feedback that gets processed by the LLM extraction layer.

**Prerequisites**:
- Complete Test Case 1 (IVIG for Myasthenia Gravis) through care plan generation
- Care plan should be displayed on screen

**Test Steps**:

1. **Edit Care Plan**
   - Click the "✏️ Edit" button on the generated care plan
   - Verify the care plan becomes editable (textarea appears)
   - Verify "Editing Mode" label appears next to title
   - Make the following edits:
     ```
     Add under "Monitoring plan & lab schedule":
     - Pre-treatment: Obtain baseline IgA level to screen for IgA deficiency
     - Monitor: Vital signs every 30 minutes during infusion
     ```
   - Click "💾 Save Changes"
   - Verify success message appears
   - Verify care plan updates with your changes
   - Click "👁️ View Only" to toggle back to read-only mode

2. **Submit Structured Feedback**
   - Click "📝 Provide Feedback on This Care Plan"
   - Verify feedback form expands with amber background
   - Enter the following feedback in the textarea:
     ```
     Issue: Missing IgA deficiency screening
     Suggestion: Add baseline IgA level to pre-treatment labs section for IVIG patients
     
     Issue: Infusion monitoring frequency not specified
     Suggestion: Recommend vital signs every 30 minutes during infusion
     
     Issue: No mention of renal protection for elderly patients
     Suggestion: Consider pre-hydration for patients >65 years old
     ```
   - Verify character count validation (should be >10 characters)
   - Click "✉️ Submit Feedback"

3. **Verify LLM Extraction**
   - Wait for submission to complete (~2-3 seconds)
   - Verify success alert appears with extracted categories
   - Expected extracted categories should include: `monitoring`, `safety`, or `administration`
   - Verify green "AI Extracted Categories" box appears
   - Verify extracted categories are displayed as rounded pills
   - Check alert message indicates severity level (high/medium/low)

4. **Verify Backend Storage**
   - Open browser DevTools → Network tab
   - Find the POST request to `/api/feedback/submit/`
   - Verify response includes:
     ```json
     {
       "success": true,
       "feedbackId": "<uuid>",
       "extractedCategories": ["monitoring", "safety", ...],
       "extractedIssues": ["Missing IgA deficiency screening", ...],
       "extractedSuggestions": ["Add baseline IgA level...", ...],
       "severity": "medium" or "high",
       "batchTriggered": false,
       "unprocessedCount": 1
     }
     ```

**Expected Results**:
- ✓ Care plan editing works smoothly
- ✓ Changes are saved to backend
- ✓ Feedback submission succeeds
- ✓ LLM correctly extracts categories from free-form text
- ✓ Extracted categories are displayed to user
- ✓ Severity is assessed appropriately
- ✓ `unprocessedCount` increments (shown in API response)

**Edge Cases to Test**:
- Try submitting feedback with <10 characters → Should show validation error
- Try editing care plan without saving → Changes should not persist
- Submit feedback without editing care plan → Should work (diff will be empty)

---

### Test Case 22: Batch Processing & LLM Rule Extraction

**Objective**: Verify that the system automatically triggers batch processing after 5 feedback submissions and generates improvement rules.

**Prerequisites**:
- Clean database or <5 unprocessed feedback records exist
- Access to backend logs and file system

**Test Steps**:

1. **Submit First 4 Feedbacks**
   - Complete Test Cases 1-4 (IVIG, Rituxan, Chemotherapy, Hemophilia)
   - For each, generate care plan and submit feedback with different issues:
   
   **Feedback 1 (IVIG):**
   ```
   Issue: No pre-medication protocol specified
   Suggestion: Add acetaminophen 650mg and diphenhydramine 25mg pre-medications
   ```
   
   **Feedback 2 (Rituxan):**
   ```
   Issue: Hepatitis B screening mentioned but no action plan
   Suggestion: Specify prophylactic antiviral if HBcAb positive
   ```
   
   **Feedback 3 (Pediatric Chemo):**
   ```
   Issue: No BSA calculation shown
   Suggestion: Show BSA calculation: weight(kg)^0.425 × height(cm)^0.725 × 0.007184
   ```
   
   **Feedback 4 (Hemophilia):**
   ```
   Issue: No breakthrough bleeding protocol
   Suggestion: Add emergency dosing instructions for breakthrough bleeding
   ```
   
   - Verify each submission shows `"batchTriggered": false`
   - Verify `unprocessedCount` increments: 1, 2, 3, 4

2. **Submit 5th Feedback (Trigger Batch)**
   - Complete Test Case 5 (Multiple Sclerosis with Ocrelizumab)
   - Generate care plan
   - Submit feedback:
     ```
     Issue: PML risk mentioned but monitoring plan incomplete
     Suggestion: Specify MRI frequency and JC virus antibody titer monitoring schedule
     
     Issue: No infusion reaction management protocol
     Suggestion: Add step-by-step protocol for mild, moderate, severe reactions
     ```
   - **Important**: Watch for batch processing trigger

3. **Verify Batch Processing Triggered**
   - Check API response for 5th feedback:
     ```json
     {
       "success": true,
       "feedbackId": "<uuid>",
       "extractedCategories": [...],
       "batchTriggered": true,  // ← Should be TRUE
       "unprocessedCount": 0     // ← Should reset to 0
     }
     ```
   - Alert message should indicate: "🎯 Batch processing triggered!"

4. **Verify Backend Logs**
   - Check terminal running Django server
   - Look for log messages:
     ```
     Batch threshold reached (5). Triggering batch processing...
     Processing batch of 5 feedback records...
     Batch 1 processed successfully
     Appended batch 1 rules to .../prompt_improvements.md
     ```

5. **Verify Prompt Improvements File Created**
   - Navigate to: `/Users/ayeola/Downloads/lamarhealth_ta/backend/careplan/`
   - Verify `prompt_improvements.md` file exists
   - Open the file and verify format:
     ```markdown
     ## Batch 1 - 2025-12-04 14:XX
     
     ### Always include pre-medication protocols for infusion therapies
     - **Confidence**: high
     - **Applies to**: all infusion therapies
     - **Support**: 4/5 feedback instances
     - **Action**: Consider adding to main prompt
     
     ### Specify BSA calculations for weight-based dosing
     - **Confidence**: high
     - **Applies to**: pediatric chemotherapy
     - **Support**: 3/5 feedback instances
     - **Action**: Consider adding to main prompt
     
     **Recommendation**: update_prompt
     ```

6. **Verify Database State**
   - Check that all 5 feedback records are marked as processed
   - Verify `batch_number = 1` for all 5 records
   - Verify `processed_for_prompt = True` for all 5 records

7. **Test Next Batch** (Optional)
   - Submit 5 more feedbacks
   - Verify batch_number increments to 2
   - Verify `prompt_improvements.md` appends new batch section

**Expected Results**:
- ✓ System tracks unprocessed feedback count accurately
- ✓ Batch processing triggers automatically on 5th feedback
- ✓ LLM analyzes all 5 feedbacks and extracts common patterns
- ✓ High-confidence rules (≥3/5 support) are identified
- ✓ `prompt_improvements.md` file is created/updated
- ✓ All feedback records marked as processed
- ✓ Batch number assigned correctly
- ✓ Frontend receives `batchTriggered: true` notification

**Verification Checklist**:
- [ ] `unprocessedCount` increments from 1→2→3→4→5
- [ ] 5th feedback triggers batch processing
- [ ] Backend logs show batch processing messages
- [ ] `prompt_improvements.md` file created
- [ ] File contains high-confidence rules with ≥3/5 support
- [ ] Database records updated correctly
- [ ] Next 5 feedbacks create Batch 2

**Edge Cases to Test**:
- What if LLM extraction fails for one feedback? (Should use fallback categorization)
- What if LLM rule extraction fails? (Check logs for error, file should show error message)
- Submit 6 feedbacks rapidly → Verify only first 5 are batched, 6th starts new count

---

## Testing the Complete Feedback Loop

**Full Integration Test** (Combines Test Cases 21 & 22):

1. Start with clean database
2. Complete 5 different test cases (1-5)
3. For each:
   - Generate care plan
   - Edit care plan with real improvements
   - Submit structured feedback
4. On 5th submission, verify:
   - Batch processing triggers
   - Rules extracted make clinical sense
   - System is ready for next batch
5. Review `prompt_improvements.md` with a pharmacist
6. Update main LLM prompt based on high-confidence rules
7. Test new care plan generation to verify improvements

**Success Criteria**:
- All 5 feedbacks submitted successfully
- LLM extracts relevant categories (not just "other")
- Batch processing completes without errors
- Generated rules are clinically appropriate
- System ready for continuous improvement loop

