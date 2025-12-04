import { z } from 'zod';

export const providerSchema = z.object({
    npi: z.string().length(10, "NPI must be exactly 10 digits").regex(/^\d+$/, "NPI must contain only numbers"),
    name: z.string().min(1, "Provider name is required").regex(/^[^0-9]*$/, "Provider name cannot contain numbers"),
});

export const patientSchema = z.object({
    firstName: z.string().min(1, "First name is required").regex(/^[^0-9]*$/, "First name cannot contain numbers"),
    lastName: z.string().min(1, "Last name is required").regex(/^[^0-9]*$/, "Last name cannot contain numbers"),
    mrn: z.string().length(6, "MRN must be exactly 6 digits").regex(/^\d+$/, "MRN must contain only numbers"),
    dob: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format",
    }),
    sex: z.enum(["Male", "Female", "Other"]),
    weight: z.number().positive("Weight must be positive").optional().nullable(),
    primaryDiagnosis: z.string().min(1, "Primary diagnosis is required"),
    // These are strings in the form (textarea) but will be transformed to arrays before sending to backend
    additionalDiagnoses: z.string().optional(),
    allergies: z.string().optional(),
    medicationHistory: z.string().optional(),
});

export const orderSchema = z.object({
    medication: z.string().min(1, "Medication name is required"),
    notes: z.string().optional(),
});

export const formSchema = z.object({
    provider: providerSchema,
    patient: patientSchema,
    order: orderSchema,
});

export type FormData = z.infer<typeof formSchema>;
