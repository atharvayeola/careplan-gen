import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

export async function generateCarePlan(patientData: any, orderData: any) {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("No OpenAI API Key found. Returning mock care plan.");
        return `MOCK CARE PLAN for ${patientData.firstName} ${patientData.lastName}\n\nProblem List: ...\nGoals: ...\nPlan: ...`;
    }

    const prompt = `
    You are an expert clinical pharmacist. Generate a comprehensive Pharmacist Care Plan based on the following patient data.

    PATIENT DEMOGRAPHICS:
    Name: ${patientData.firstName} ${patientData.lastName}
    MRN: ${patientData.mrn}
    DOB: ${patientData.dob}
    Sex: ${patientData.sex}
    Weight: ${patientData.weight} kg
    Allergies: ${patientData.allergies}
    Primary Diagnosis: ${patientData.primaryDiagnosis}
    Additional Diagnoses: ${patientData.additionalDiagnoses?.join(', ')}
    Medication History: ${patientData.medicationHistory?.join(', ')}

    CURRENT ORDER:
    Medication: ${orderData.medication}
    Notes: ${orderData.notes}

    REQUIRED OUTPUT FORMAT:
    1. Problem list / Drug therapy problems (DTPs)
    2. Goals (SMART) - Primary, Safety, Process
    3. Pharmacist interventions / plan (Dosing, Premedication, Infusion rates, Hydration, Monitoring, Adverse events)
    4. Monitoring plan & lab schedule

    Ensure the plan is clinically accurate, specific to the medication and diagnosis, and professional.
  `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: prompt }],
            model: "gpt-4o",
        });

        return completion.choices[0].message.content || "Failed to generate plan.";
    } catch (error) {
        console.error("OpenAI API Error:", error);
        throw new Error("Failed to generate care plan via LLM.");
    }
}
