"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema, FormData } from "@/lib/validation";
import { useState, useEffect } from "react";

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
                "patient.weight",
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
                const response = await fetch("http://localhost:8000/api/provider/validate/", {
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
                const response = await fetch("http://localhost:8000/api/patient/validate/", {
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
        window.scrollTo(0, 0);
    };

    const handleGenerateCarePlan = async () => {
        if (!orderId) return;

        setIsGenerating(true);
        try {
            const response = await fetch("http://localhost:8000/api/generate-care-plan/", {
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
        } catch (error) {
            console.error(error);
            alert("Failed to generate care plan");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadCarePlan = () => {
        if (!carePlan) return;

        const blob = new Blob([carePlan], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "care-plan.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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

            const response = await fetch('http://localhost:8000/api/submit/', {
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
            <p
                className="text-red-600 text-xs font-mono font-semibold not-italic mt-1.5"
                style={{
                    color: '#dc2626', // ensure red even if utility classes fail
                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontStyle: 'normal'
                }}
            >
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

    const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5";
    const inputClass = "w-full rounded-lg bg-slate-50 border-slate-200 shadow-sm focus:bg-white focus:border-sky-500 focus:ring-sky-500 py-3 px-4 border transition-all placeholder:text-slate-400";

    return (
        <div className="max-w-3xl mx-auto">
            {/* Stepper */}
            <div className="mb-10">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-10" />
                    {STEPS.map((step, index) => {
                        const isCompleted = currentStep > index;
                        const isCurrent = currentStep === index;

                        return (
                            <div key={step.id} className="flex flex-col items-center bg-slate-50 px-2 relative">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 
                                    ${isCompleted ? 'bg-sky-500 text-white' : isCurrent ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'}`}
                                >
                                    {index + 1}
                                </div>
                                <span className={`text-[10px] uppercase tracking-wider mt-2 font-bold transition-all ${isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                                    {step.name}
                                </span>
                                {isCurrent && (
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-sky-500 rounded-full" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                onKeyDown={handleKeyDown}
                className="bg-white shadow-xl shadow-slate-200/50 rounded-2xl p-8 border border-slate-100"
            >

                {/* Step 1: Provider Information */}
                {currentStep === 0 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="border-b border-slate-100 pb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Provider Details</h2>
                            <p className="text-slate-500 text-sm mt-1">Please enter your provider information.</p>
                        </div>

                        <div className="grid gap-6">
                            <div>
                                <label className={labelClass}>Provider Name</label>
                                <input
                                    {...register("provider.name")}
                                    className={inputClass}
                                    placeholder="e.g., Dr. John Smith"
                                />
                                <ErrorMessage message={errors.provider?.name?.message} />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    NPI <span className="text-slate-400 font-normal normal-case ml-1">(10 digits)</span>
                                </label>
                                <input
                                    {...register("provider.npi")}
                                    className={inputClass}
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
                        <div className="border-b border-slate-100 pb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Patient Demographics</h2>
                            <p className="text-slate-500 text-sm mt-1">Enter the patient's personal details.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>First Name</label>
                                <input
                                    {...register("patient.firstName")}
                                    className={inputClass}
                                />
                                <ErrorMessage message={errors.patient?.firstName?.message} />
                            </div>
                            <div>
                                <label className={labelClass}>Last Name</label>
                                <input
                                    {...register("patient.lastName")}
                                    className={inputClass}
                                />
                                <ErrorMessage message={errors.patient?.lastName?.message} />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    MRN <span className="text-slate-400 font-normal normal-case ml-1">(6 digits)</span>
                                </label>
                                <input
                                    {...register("patient.mrn")}
                                    className={inputClass}
                                    placeholder="123456"
                                    maxLength={6}
                                />
                                <ErrorMessage message={errors.patient?.mrn?.message} />
                            </div>
                            <div>
                                <label className={labelClass}>Date of Birth</label>
                                <input
                                    type="date"
                                    {...register("patient.dob")}
                                    className={inputClass}
                                />
                                <ErrorMessage message={errors.patient?.dob?.message} />
                            </div>
                            <div>
                                <label className={labelClass}>Sex</label>
                                <select
                                    {...register("patient.sex")}
                                    className={inputClass}
                                >
                                    <option value="">Select...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                <ErrorMessage message={errors.patient?.sex?.message} />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    Weight (kg) <span className="text-slate-400 font-normal normal-case ml-1">(optional)</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    {...register("patient.weight", { valueAsNumber: true })}
                                    className={inputClass}
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
                        <div className="border-b border-slate-100 pb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Clinical & Order Details</h2>
                            <p className="text-slate-500 text-sm mt-1">Provide medical history and order details.</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className={labelClass}>Primary Diagnosis</label>
                                <input
                                    {...register("patient.primaryDiagnosis")}
                                    className={inputClass}
                                />
                                <ErrorMessage message={errors.patient?.primaryDiagnosis?.message} />
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Additional Diagnoses <span className="text-slate-400 font-normal normal-case ml-1">(optional, one per line)</span>
                                </label>
                                <textarea
                                    {...register("patient.additionalDiagnoses")}
                                    className={inputClass}
                                    rows={3}
                                    placeholder="e.g., Hypertension&#10;GERD"
                                />
                                <ErrorMessage message={errors.patient?.additionalDiagnoses?.message} />
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Allergies <span className="text-slate-400 font-normal normal-case ml-1">(optional)</span>
                                </label>
                                <textarea
                                    {...register("patient.allergies")}
                                    className={inputClass}
                                    rows={2}
                                    placeholder="e.g., Penicillin, NKDA"
                                />
                                <ErrorMessage message={errors.patient?.allergies?.message} />
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Current Medications <span className="text-slate-400 font-normal normal-case ml-1">(optional, one per line)</span>
                                </label>
                                <textarea
                                    {...register("patient.medicationHistory")}
                                    className={inputClass}
                                    rows={3}
                                    placeholder="e.g., Lisinopril 10mg daily"
                                />
                                <ErrorMessage message={errors.patient?.medicationHistory?.message} />
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <h3 className="text-lg font-bold text-slate-900 mb-6">Order Information</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className={labelClass}>Medication to Order</label>
                                        <input
                                            {...register("order.medication")}
                                            className={inputClass}
                                        />
                                        <ErrorMessage message={errors.order?.medication?.message} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Notes</label>
                                        <textarea
                                            {...register("order.notes")}
                                            className={inputClass}
                                            rows={2}
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
                        <div className="border-b border-slate-100 pb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Review & Submit</h2>
                            <p className="text-slate-500 text-sm mt-1">Please review the information before submitting.</p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 space-y-8">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-200 pb-2">Provider</h4>
                                <div className="space-y-3">
                                    <div className="flex items-baseline gap-3 py-2 border-b border-slate-100">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 w-24 flex-shrink-0">Name: </span>
                                        <span className="text-base font-semibold text-slate-900">{formData.provider?.name}</span>
                                    </div>
                                    <div className="flex items-baseline gap-3 py-2 border-b border-slate-100">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 w-24 flex-shrink-0">NPI: </span>
                                        <span className="text-base font-semibold text-slate-900">{formData.provider?.npi}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-200 pb-2">Patient</h4>
                                <div className="space-y-3">
                                    <div className="flex items-baseline gap-3 py-2 border-b border-slate-100">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 w-24 flex-shrink-0">Name: </span>
                                        <span className="text-base font-semibold text-slate-900">{formData.patient?.firstName} {formData.patient?.lastName}</span>
                                    </div>
                                    <div className="flex items-baseline gap-3 py-2 border-b border-slate-100">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 w-24 flex-shrink-0">MRN: </span>
                                        <span className="text-base font-semibold text-slate-900">{formData.patient?.mrn}</span>
                                    </div>
                                    <div className="flex items-baseline gap-3 py-2 border-b border-slate-100">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 w-24 flex-shrink-0">DOB: </span>
                                        <span className="text-base font-semibold text-slate-900">{formData.patient?.dob}</span>
                                    </div>
                                    <div className="flex items-baseline gap-3 py-2 border-b border-slate-100">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 w-24 flex-shrink-0">Sex: </span>
                                        <span className="text-base font-semibold text-slate-900">{formData.patient?.sex}</span>
                                    </div>
                                    <div className="flex items-baseline gap-3 py-2 border-b border-slate-100">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 w-24 flex-shrink-0">Weight: </span>
                                        <span className="text-base font-semibold text-slate-900">{formData.patient?.weight ? `${formData.patient.weight} kg` : '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-200 pb-2">Clinical</h4>
                                <div className="space-y-3">
                                    <div className="flex items-baseline gap-3 py-2 border-b border-slate-100">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 w-24 flex-shrink-0">Diagnosis: </span>
                                        <span className="text-base font-semibold text-slate-900">{formData.patient?.primaryDiagnosis}</span>
                                    </div>
                                    <div className="flex items-baseline gap-3 py-2 border-b border-slate-100">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 w-24 flex-shrink-0">Order: </span>
                                        <span className="text-base font-semibold text-slate-900">{formData.order?.medication}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

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
                            <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm">
                                <p className="font-medium">Order submitted successfully!</p>
                            </div>
                        )}

                        {warnings.length > 0 && (
                            <div
                                className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm not-italic"
                                style={{
                                    color: '#b91c1c',
                                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                    fontStyle: 'normal'
                                }}
                            >
                                <strong className="block mb-1 font-bold">Warnings</strong>
                                <ul className="list-disc pl-4 space-y-1">
                                    {warnings.map((w, i) => (
                                        <li key={i} className="font-medium">{w}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {success && orderId && !carePlan && (
                            <button
                                type="button"
                                onClick={handleGenerateCarePlan}
                                disabled={isGenerating}
                                className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 disabled:opacity-50 font-bold shadow-md shadow-green-200 transition-all hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <span className="animate-pulse">{progressMessage || "Generating Care Plan..."}</span>
                                ) : (
                                    "Generate Care Plan"
                                )}
                            </button>
                        )}

                        {carePlan && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        Generated Care Plan
                                    </h3>
                                    <pre className="whitespace-pre-wrap text-sm text-slate-600 font-mono bg-white p-4 rounded-lg border border-slate-100 shadow-sm">{carePlan}</pre>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDownloadCarePlan}
                                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 font-bold shadow-md shadow-indigo-200 transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                                >
                                    Download Care Plan
                                </button>

                                <div className="pt-6 border-t border-slate-100">
                                    <h4 className="text-center text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Start New Order</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => handleStartNewOrder(true)}
                                            className="bg-white text-slate-700 border border-slate-200 py-3 px-4 rounded-xl hover:bg-slate-50 hover:border-slate-300 font-bold shadow-sm transition-all"
                                        >
                                            Same Provider
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleStartNewOrder(false)}
                                            className="bg-white text-slate-700 border border-slate-200 py-3 px-4 rounded-xl hover:bg-slate-50 hover:border-slate-300 font-bold shadow-sm transition-all"
                                        >
                                            New Provider
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-10 flex justify-between pt-8 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={currentStep === 0 || success}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-colors
                            ${currentStep === 0 || success
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        Back
                    </button>

                    {currentStep < STEPS.length - 1 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="bg-slate-900 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Next
                        </button>
                    ) : (
                        !success && (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-sky-500 text-white px-10 py-3 rounded-xl text-sm font-bold hover:bg-sky-600 shadow-lg shadow-sky-200 transition-all hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Order"}
                            </button>
                        )
                    )}
                </div>
            </form>
        </div>
    );
}
