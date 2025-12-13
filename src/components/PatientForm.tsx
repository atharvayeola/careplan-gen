"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema, FormData } from "@/lib/validation";
import { useState, useEffect } from "react";
import { authenticatedFetch } from "@/lib/auth";

const STEPS = [
    { id: 0, name: "Provider Details" },
    { id: 1, name: "Patient Demographics" },
    { id: 2, name: "Clinical & Order" },
    { id: 3, name: "Review & Submit" },
];

const GENERATION_STEPS = [
    "Analyzing patient demographics...",
    "Reviewing clinical history and medications...",
    "Identifying drug therapy problems...",
    "Formulating care plan goals...",
    "Finalizing recommendations...",
    "Generating document..."
];

export default function PatientForm() {
    const [currentStep, setCurrentStep] = useState(0);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [submitErrors, setSubmitErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [carePlan, setCarePlan] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progressMessage, setProgressMessage] = useState("");
    const [providerValidationError, setProviderValidationError] = useState<string | null>(null);
    const [patientValidationError, setPatientValidationError] = useState<string | null>(null);

    // Feedback system state
    const [carePlanId, setCarePlanId] = useState<string | null>(null);
    const [originalCarePlan, setOriginalCarePlan] = useState<string>("");
    const [editedCarePlan, setEditedCarePlan] = useState<string>("");
    const [isEditingCarePlan, setIsEditingCarePlan] = useState(false);
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [extractedCategories, setExtractedCategories] = useState<string[]>([]);
    const [isSavingCarePlan, setIsSavingCarePlan] = useState(false);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [feedbackError, setFeedbackError] = useState<string | null>(null);
    const [showNewOrderMenu, setShowNewOrderMenu] = useState(false);

    const {
        register,
        handleSubmit,
        trigger,
        watch,
        reset,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        mode: "onBlur",
    });

    // Watch all fields for the review step
    const formData = watch();

    // Feedback placeholder text
    const FEEDBACK_PLACEHOLDER = `Please describe the issues you found and your suggestions:

Format example:
Issue: Missing renal dose adjustment for CrCl <30
Suggestion: Add renal dosing table in administration section

Issue: No hepatitis B screening mentioned
Suggestion: Include HBsAg/HBcAb in pre-treatment labs

You can also provide general feedback in your own words.`;

    // Progress simulation effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isGenerating) {
            let stepIndex = 0;
            setProgressMessage(GENERATION_STEPS[0]);
            interval = setInterval(() => {
                stepIndex = (stepIndex + 1) % GENERATION_STEPS.length;
                setProgressMessage(GENERATION_STEPS[stepIndex]);
            }, 2500); // Change message every 2.5 seconds
        } else {
            setProgressMessage("");
        }
        return () => clearInterval(interval);
    }, [isGenerating]);

    const handleNext = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent any default form submission
        let fieldsToValidate: (keyof FormData | string)[] = [];

        if (currentStep === 0) {
            fieldsToValidate = ["provider.name", "provider.npi"];
        } else if (currentStep === 1) {
            fieldsToValidate = [
                "patient.firstName",
                "patient.lastName",
                "patient.mrn",
                "patient.dob",
                "patient.sex",
                // weight is optional, so not included in validation
            ];
        } else if (currentStep === 2) {
            fieldsToValidate = [
                "patient.primaryDiagnosis",
                "patient.allergies",
                "patient.additionalDiagnoses",
                "patient.medicationHistory",
                "order.medication",
                "order.notes",
            ];
        }

        const isValid = await trigger(fieldsToValidate as any);
        if (!isValid) return;

        if (currentStep === 0) {
            setProviderValidationError(null);
            const providerData = getValues("provider");
            try {
                const response = await authenticatedFetch("http://localhost:8000/api/provider/validate/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(providerData),
                });
                const result = await response.json();

                if (!response.ok) {
                    setProviderValidationError(result.error || "Provider credentials do not match our records.");
                    return;
                }
            } catch (error) {
                console.error(error);
                setProviderValidationError("Unable to validate provider at this time. Please try again.");
                return;
            }
        }

        if (currentStep === 1) {
            setPatientValidationError(null);
            const patientData = getValues("patient");
            try {
                const response = await authenticatedFetch("http://localhost:8000/api/patient/validate/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(patientData),
                });
                const result = await response.json();

                if (!response.ok) {
                    const firstFieldError = typeof result === "object" && result
                        ? Object.values(result as Record<string, any>)[0]?.[0]
                        : null;
                    setPatientValidationError(
                        result.error || firstFieldError || "Patient credentials do not match our records."
                    );
                    return;
                }
            } catch (error) {
                console.error(error);
                setPatientValidationError("Unable to validate patient at this time. Please try again.");
                return;
            }
        }

        setCurrentStep((prev) => prev + 1);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        if (success) return; // Prevent going back after submission
        setCurrentStep((prev) => prev - 1);
        window.scrollTo(0, 0);
    };

    const handleStartNewOrder = (keepProvider: boolean) => {
        if (keepProvider) {
            const providerData = getValues("provider");
            reset({
                provider: providerData,
                patient: {
                    firstName: "",
                    lastName: "",
                    mrn: "",
                    dob: "",
                    sex: "", // Default or empty, need to match schema enum or be empty string if allowed
                    primaryDiagnosis: "",
                    allergies: "",
                    additionalDiagnoses: "",
                    medicationHistory: "",
                    weight: undefined,
                },
                order: {
                    medication: "",
                    notes: "",
                }
            } as any); // Type assertion needed for partial reset if schema is strict
        } else {
            reset();
        }

        setSuccess(false);
        setOrderId(null);
        setCarePlan(null);
        setWarnings([]);
        setSubmitErrors([]);
        setProviderValidationError(null);
        setPatientValidationError(null);
        setCurrentStep(0);
        setShowNewOrderMenu(false);
        // Reset feedback state
        setCarePlanId(null);
        setOriginalCarePlan("");
        setEditedCarePlan("");
        setIsEditingCarePlan(false);
        setShowFeedbackForm(false);
        setFeedbackText("");
        setExtractedCategories([]);
        setFeedbackSubmitted(false);
        setFeedbackError(null);
        window.scrollTo(0, 0);
    };

    const handleGenerateCarePlan = async () => {
        if (!orderId) return;

        setIsGenerating(true);
        try {
            const response = await authenticatedFetch("http://localhost:8000/api/generate-care-plan/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });

            const result = await response.json();

            if (!response.ok) {
                alert("Error generating care plan");
                return;
            }

            setCarePlan(result.carePlan.content);
            setOriginalCarePlan(result.carePlan.content);  // Store original for diff
            setCarePlanId(result.carePlan.id);  // Store ID for updates
            setEditedCarePlan(result.carePlan.content);  // Initialize edited version
        } catch (error) {
            console.error(error);
            alert("Failed to generate care plan");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadCarePlan = () => {
        if (!carePlan) return;

        const blob = new Blob([editedCarePlan || carePlan], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "care-plan.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSaveCarePlanEdits = async () => {
        if (!carePlanId || !editedCarePlan) return;

        setIsSavingCarePlan(true);
        try {
            const response = await authenticatedFetch('http://localhost:8000/api/care-plan/update/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    carePlanId: carePlanId,
                    editedContent: editedCarePlan
                })
            });

            if (response.ok) {
                setCarePlan(editedCarePlan);
                setIsEditingCarePlan(false);
                alert('Care plan updated successfully!');
            } else {
                alert('Failed to save care plan. Please try again.');
            }
        } catch (error) {
            console.error(error);
            alert('Error saving care plan');
        } finally {
            setIsSavingCarePlan(false);
        }
    };

    const handleSubmitFeedback = async () => {
        if (!carePlanId || feedbackText.length < 10) return;

        setIsSubmittingFeedback(true);
        setFeedbackError(null);
        try {
            const response = await authenticatedFetch('http://localhost:8000/api/feedback/submit/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    carePlanId: carePlanId,
                    originalContent: originalCarePlan,
                    editedContent: editedCarePlan || carePlan,
                    feedbackText: feedbackText
                })
            });

            const result = await response.json();
            console.log('Feedback response:', result);

            if (response.ok) {
                // Show extracted categories
                setExtractedCategories(result.extractedCategories || []);
                setFeedbackSubmitted(true);

                // Log batch info
                if (result.batchTriggered) {
                    console.log('🎯 Batch processing triggered!');
                }
                console.log('Severity:', result.severity);
                console.log('Unprocessed count:', result.unprocessedCount);
            } else {
                setFeedbackError(result.error || 'Failed to submit feedback. Please try again.');
                console.error('Feedback submission failed:', result);
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            setFeedbackError('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const onSubmit = async (data: FormData) => {
        setWarnings([]);
        setSubmitErrors([]);
        setSuccess(false);
        try {
            const transformedData = {
                ...data,
                patient: {
                    ...data.patient,
                    additionalDiagnoses: data.patient.additionalDiagnoses
                        ? data.patient.additionalDiagnoses.split('\n').filter(line => line.trim())
                        : [],
                    medicationHistory: data.patient.medicationHistory
                        ? data.patient.medicationHistory.split('\n').filter(line => line.trim())
                        : [],
                }
            };

            const response = await authenticatedFetch('http://localhost:8000/api/submit/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transformedData),
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    setSubmitErrors([result.error || 'This patient already exists in the system. Please verify the MRN.']);
                } else if (response.status === 400) {
                    const errorMessages = [];
                    if (result.provider) {
                        if (result.provider.npi) errorMessages.push(`Provider NPI: ${result.provider.npi}`);
                        if (result.provider.name) errorMessages.push(`Provider Name: ${result.provider.name}`);
                    }
                    if (result.patient) {
                        Object.keys(result.patient).forEach(field => {
                            errorMessages.push(`Patient ${field}: ${result.patient[field]}`);
                        });
                    }
                    if (result.order) {
                        Object.keys(result.order).forEach(field => {
                            errorMessages.push(`Order ${field}: ${result.order[field]}`);
                        });
                    }
                    setSubmitErrors(errorMessages.length > 0 ? errorMessages : ['Validation failed. Please check your inputs.']);
                } else {
                    setSubmitErrors([result.error || 'An unexpected error occurred. Please try again.']);
                }
                return;
            }

            if (result.warnings && result.warnings.length > 0) {
                setWarnings(result.warnings);
            }
            if (result.data?.orderId) {
                setOrderId(result.data.orderId);
            }
            setSuccess(true);
        } catch (error) {
            console.error(error);
            setSubmitErrors(['Unable to connect to the server. Please check your connection and try again.']);
        }
    };

    // Helper for error messages
    const ErrorMessage = ({ message }: { message?: string }) => {
        if (!message) return null;
        return (
            <p className="text-red-600 text-xs mt-1.5 font-medium">
                {message}
            </p>
        );
    };

    // Prevent enter key submission on non-final steps
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && currentStep < STEPS.length - 1) {
            e.preventDefault();
        }
    };

    return (
        <div className="w-full">
            {/* Stepper */}
            <div className="mb-12 border-b border-zinc-200 pb-8">
                <nav aria-label="Progress">
                    <ol role="list" className="flex items-center justify-between w-full max-w-2xl mx-auto">
                        {STEPS.map((step, stepIdx) => {
                            const isCompleted = currentStep > stepIdx;
                            const isCurrent = currentStep === stepIdx;

                            return (
                                <li key={step.name} className="relative">
                                    {isCompleted ? (
                                        <div className="group flex flex-col items-center">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black hover:bg-zinc-800 transition-colors">
                                                <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                            <span className="mt-2 text-xs font-semibold text-black uppercase tracking-wide">{step.name}</span>
                                        </div>
                                    ) : isCurrent ? (
                                        <div className="flex flex-col items-center" aria-current="step">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-white">
                                                <span className="h-2.5 w-2.5 rounded-full bg-black" />
                                            </span>
                                            <span className="mt-2 text-xs font-bold text-black uppercase tracking-wide">{step.name}</span>
                                        </div>
                                    ) : (
                                        <div className="group flex flex-col items-center">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-300 bg-white group-hover:border-zinc-400 transition-colors">
                                                <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-zinc-300 transition-colors" />
                                            </span>
                                            <span className="mt-2 text-xs font-semibold text-zinc-400 uppercase tracking-wide group-hover:text-zinc-500 transition-colors">{step.name}</span>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </nav>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                onKeyDown={handleKeyDown}
                className="bg-white shadow-xl shadow-zinc-200/50 rounded-2xl p-8 sm:p-12 border border-zinc-100 max-w-4xl mx-auto"
            >

                {/* Step 1: Provider Information */}
                {currentStep === 0 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Provider Details</h2>
                            <p className="text-zinc-500 mt-2">Please enter your provider information to verify your identity.</p>
                        </div>

                        <div className="h-px bg-zinc-100 w-full" />

                        <div className="grid gap-8">
                            <div>
                                <label className="label-text">Provider Name</label>
                                <input
                                    {...register("provider.name")}
                                    className="input-field"
                                    placeholder="e.g., Dr. John Smith"
                                />
                                <ErrorMessage message={errors.provider?.name?.message} />
                            </div>
                            <div>
                                <label className="label-text">
                                    NPI (10 digits)
                                </label>
                                <input
                                    {...register("provider.npi")}
                                    className="input-field"
                                    placeholder="1234567890"
                                    maxLength={10}
                                />
                                <ErrorMessage message={errors.provider?.npi?.message} />
                                <ErrorMessage message={providerValidationError || undefined} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Patient Information */}
                {currentStep === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Patient Demographics</h2>
                            <p className="text-zinc-500 mt-2">Enter the patient's personal details correctly.</p>
                        </div>

                        <div className="h-px bg-zinc-100 w-full" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="label-text">First Name</label>
                                <input
                                    {...register("patient.firstName")}
                                    className="input-field"
                                />
                                <ErrorMessage message={errors.patient?.firstName?.message} />
                            </div>
                            <div>
                                <label className="label-text">Last Name</label>
                                <input
                                    {...register("patient.lastName")}
                                    className="input-field"
                                />
                                <ErrorMessage message={errors.patient?.lastName?.message} />
                            </div>
                            <div>
                                <label className="label-text">MRN (6 digits)</label>
                                <input
                                    {...register("patient.mrn")}
                                    className="input-field"
                                    placeholder="123456"
                                    maxLength={6}
                                />
                                <ErrorMessage message={errors.patient?.mrn?.message} />
                            </div>
                            <div>
                                <label className="label-text">Date of Birth</label>
                                <input
                                    type="date"
                                    {...register("patient.dob")}
                                    className="input-field"
                                />
                                <ErrorMessage message={errors.patient?.dob?.message} />
                            </div>
                            <div>
                                <label className="label-text">Sex</label>
                                <div className="relative">
                                    <select
                                        {...register("patient.sex")}
                                        className="input-field appearance-none"
                                    >
                                        <option value="">Select...</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                        </svg>
                                    </div>
                                </div>
                                <ErrorMessage message={errors.patient?.sex?.message} />
                            </div>
                            <div>
                                <label className="label-text">Weight (kg) <span className="text-zinc-400 font-normal ml-1">(optional)</span></label>
                                <input
                                    type="number"
                                    step="0.1"
                                    {...register("patient.weight", {
                                        setValueAs: v => v === '' || v === null ? undefined : parseFloat(v)
                                    })}
                                    className="input-field"
                                    placeholder="e.g., 72.5"
                                />
                                <ErrorMessage message={errors.patient?.weight?.message} />
                            </div>
                        </div>

                        <ErrorMessage message={patientValidationError || undefined} />
                    </div>
                )}

                {/* Step 3: Clinical & Order Info */}
                {currentStep === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Clinical & Order Details</h2>
                            <p className="text-zinc-500 mt-2">Provide medical history and medication order details.</p>
                        </div>

                        <div className="h-px bg-zinc-100 w-full" />

                        <div className="space-y-8">
                            <div>
                                <label className="label-text">Primary Diagnosis</label>
                                <input
                                    {...register("patient.primaryDiagnosis")}
                                    className="input-field"
                                />
                                <ErrorMessage message={errors.patient?.primaryDiagnosis?.message} />
                            </div>

                            <div>
                                <label className="label-text">Additional Diagnoses <span className="text-zinc-400 font-normal ml-1">(optional, one per line)</span></label>
                                <textarea
                                    {...register("patient.additionalDiagnoses")}
                                    className="input-field min-h-[100px]"
                                    placeholder="e.g., Hypertension&#10;GERD"
                                />
                                <ErrorMessage message={errors.patient?.additionalDiagnoses?.message} />
                            </div>

                            <div>
                                <label className="label-text">Allergies <span className="text-zinc-400 font-normal ml-1">(optional)</span></label>
                                <textarea
                                    {...register("patient.allergies")}
                                    className="input-field min-h-[80px]"
                                    placeholder="e.g., Penicillin, NKDA"
                                />
                                <ErrorMessage message={errors.patient?.allergies?.message} />
                            </div>

                            <div>
                                <label className="label-text">Current Medications <span className="text-zinc-400 font-normal ml-1">(optional, one per line)</span></label>
                                <textarea
                                    {...register("patient.medicationHistory")}
                                    className="input-field min-h-[100px]"
                                    placeholder="e.g., Lisinopril 10mg daily"
                                />
                                <ErrorMessage message={errors.patient?.medicationHistory?.message} />
                            </div>

                            <div className="pt-8 border-t border-zinc-100">
                                <h3 className="text-lg font-bold text-zinc-900 mb-6 tracking-tight">Order Information</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="label-text">Medication to Order</label>
                                        <input
                                            {...register("order.medication")}
                                            className="input-field"
                                        />
                                        <ErrorMessage message={errors.order?.medication?.message} />
                                    </div>
                                    <div>
                                        <label className="label-text">Notes</label>
                                        <textarea
                                            {...register("order.notes")}
                                            className="input-field min-h-[80px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Review & Submit */}
                {currentStep === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Review & Submit</h2>
                            <p className="text-zinc-500 mt-2">Please verify all information before submitting the order.</p>
                        </div>

                        <div className="h-px bg-zinc-100 w-full" />

                        {/* Review Sections */}
                        <div className="space-y-12">
                            {/* Provider Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-zinc-900">Provider Details</h3>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(0)}
                                        className="text-xs font-medium text-zinc-500 hover:text-black underline"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Provider Name</span>
                                        <span className="text-zinc-900 font-medium">{formData.provider?.name}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">NPI</span>
                                        <span className="text-zinc-900 font-medium">{formData.provider?.npi}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Patient Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-zinc-900">Patient Demographics</h3>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(1)}
                                        className="text-xs font-medium text-zinc-500 hover:text-black underline"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-100 grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div>
                                        <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Name</span>
                                        <span className="text-zinc-900 font-medium">{formData.patient?.firstName} {formData.patient?.lastName}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">MRN</span>
                                        <span className="text-zinc-900 font-medium">{formData.patient?.mrn}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">DOB</span>
                                        <span className="text-zinc-900 font-medium">{formData.patient?.dob}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Sex</span>
                                        <span className="text-zinc-900 font-medium">{formData.patient?.sex}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Weight</span>
                                        <span className="text-zinc-900 font-medium">{formData.patient?.weight ? `${formData.patient.weight} kg` : '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Clinical Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-zinc-900">Clinical & Order</h3>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(2)}
                                        className="text-xs font-medium text-zinc-500 hover:text-black underline"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-100 space-y-6">
                                    <div>
                                        <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Primary Diagnosis</span>
                                        <span className="text-zinc-900 font-medium">{formData.patient?.primaryDiagnosis}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Medication Order</span>
                                        <span className="text-zinc-900 font-medium">{formData.order?.medication}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error & Success States */}
                        {submitErrors.length > 0 && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
                                <strong className="block mb-1 font-bold">Submission Failed</strong>
                                <ul className="list-disc pl-4 space-y-1">
                                    {submitErrors.map((error, i) => (
                                        <li key={i}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-zinc-50 text-zinc-900 rounded-lg border border-zinc-200 text-sm shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="font-medium">Order submitted successfully!</p>
                                </div>
                            </div>
                        )}

                        {warnings.length > 0 && (
                            <div className="p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-100 text-sm">
                                <strong className="block mb-1 font-bold">Warnings</strong>
                                <ul className="list-disc pl-4 space-y-1">
                                    {warnings.map((w, i) => (
                                        <li key={i}>{w}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Order Action Buttons */}
                        {success && orderId && !carePlan && (
                            <button
                                type="button"
                                onClick={handleGenerateCarePlan}
                                disabled={isGenerating}
                                className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
                            >
                                {isGenerating ? (
                                    <span className="animate-pulse">{progressMessage || "Generating Care Plan..."}</span>
                                ) : (
                                    "Generate Care Plan"
                                )}
                            </button>
                        )}

                        {/* Generated Care Plan Display */}
                        {carePlan && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 mt-8 pt-8 border-t border-zinc-100">
                                <div className="p-0 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                                    <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50">
                                        <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-black"></span>
                                            Generated Care Plan
                                            {isEditingCarePlan && <span className="text-xs text-zinc-500 font-normal ml-2">(Editing Mode)</span>}
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingCarePlan(!isEditingCarePlan)}
                                                className={`text-xs px-3 py-1.5 rounded border font-medium transition-colors ${isEditingCarePlan
                                                    ? 'bg-black text-white border-black hover:bg-zinc-800'
                                                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-black'
                                                    }`}
                                            >
                                                {isEditingCarePlan ? 'View Only' : 'Edit Plan'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-0">
                                        {isEditingCarePlan ? (
                                            <textarea
                                                value={editedCarePlan}
                                                onChange={(e) => setEditedCarePlan(e.target.value)}
                                                className="w-full h-96 p-6 font-mono text-sm leading-relaxed focus:outline-none resize-y"
                                            />
                                        ) : (
                                            <div className="w-full h-96 p-6 overflow-auto bg-white font-mono text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
                                                {editedCarePlan || carePlan}
                                            </div>
                                        )}
                                    </div>

                                    {isEditingCarePlan && (
                                        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={handleSaveCarePlanEdits}
                                                disabled={isSavingCarePlan}
                                                className="btn-primary py-2 text-xs"
                                            >
                                                {isSavingCarePlan ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={handleDownloadCarePlan}
                                        className="btn-secondary flex-1 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                                        className="btn-secondary flex-1 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                        Provide Feedback
                                    </button>
                                </div>

                                {showFeedbackForm && (
                                    <div className="mt-6 p-6 bg-zinc-50 rounded-xl border border-zinc-200 animate-in fade-in slide-in-from-top-2">
                                        <h4 className="font-bold text-zinc-900 mb-2">Feedback & Suggestions</h4>
                                        <p className="text-sm text-zinc-500 mb-4">Help us improve the care plan generation by describing what was missing or incorrect.</p>

                                        <div className="relative">
                                            <textarea
                                                value={feedbackText}
                                                onChange={(e) => setFeedbackText(e.target.value)}
                                                placeholder={FEEDBACK_PLACEHOLDER}
                                                className="w-full min-h-[150px] p-4 rounded-lg border border-zinc-300 focus:border-black focus:ring-1 focus:ring-black text-sm"
                                            />
                                        </div>

                                        {feedbackError && (
                                            <div className="mt-3 text-red-600 text-xs font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                                                {feedbackError}
                                            </div>
                                        )}

                                        {feedbackSubmitted && (
                                            <div className="mt-3 p-4 bg-zinc-900 text-white rounded-lg text-sm shadow-lg">
                                                <strong className="block mb-2 text-zinc-100">Thank you for your feedback!</strong>
                                                <p className="text-zinc-400 text-xs mb-3">We've recorded your suggestions and will use them to improve our system.</p>

                                                {extractedCategories.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {extractedCategories.map((cat, i) => (
                                                            <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-800 text-xs text-zinc-300 border border-zinc-700">
                                                                {cat}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-3 mt-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowFeedbackForm(false)}
                                                className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-black transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSubmitFeedback}
                                                disabled={isSubmittingFeedback || feedbackText.length < 10}
                                                className="btn-primary text-sm py-2"
                                            >
                                                {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                )}

                <div className="flex justify-between pt-8 mt-4 border-t border-zinc-100">
                    {currentStep > 0 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="btn-secondary"
                        >
                            Back
                        </button>
                    )}

                    {currentStep === 0 && <div />} {/* Spacer */}

                    {currentStep < STEPS.length - 1 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="btn-primary ml-auto"
                        >
                            Next Step
                        </button>
                    ) : (
                        !success && (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn-primary ml-auto"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Order"}
                            </button>
                        )
                    )}

                    {success && (
                        <div className="relative ml-auto">
                            <button
                                type="button"
                                onClick={() => setShowNewOrderMenu(!showNewOrderMenu)}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                New Order
                                <svg className={`w-4 h-4 transition-transform ${showNewOrderMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showNewOrderMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button
                                        type="button"
                                        onClick={() => handleStartNewOrder(true)}
                                        className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-50 transition-colors flex items-start gap-3"
                                    >
                                        <svg className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <div>
                                            <span className="font-medium text-zinc-900 block">Same Provider</span>
                                            <span className="text-xs text-zinc-500">Keep provider, new patient/order</span>
                                        </div>
                                    </button>
                                    <div className="h-px bg-zinc-100 mx-3" />
                                    <button
                                        type="button"
                                        onClick={() => handleStartNewOrder(false)}
                                        className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-50 transition-colors flex items-start gap-3"
                                    >
                                        <svg className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <div>
                                            <span className="font-medium text-zinc-900 block">Fresh Start</span>
                                            <span className="text-xs text-zinc-500">Clear everything, start over</span>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </form>
        </div>
    );
}
