import PatientForm from "@/components/PatientForm";
import ExportButton from "@/components/ExportButton";

export default function Home() {
    return (
        <main className="min-h-screen bg-slate-50 py-12 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto mb-12 text-center">
                    <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight">
                        Specialty Pharmacy <span className="text-sky-500">Care Plan</span>
                    </h1>
                    <p className="mt-4 text-lg text-slate-500">
                        Generate comprehensive care plans with our intelligent intake wizard.
                    </p>
                </div>

                <div className="max-w-3xl mx-auto flex justify-end mb-6">
                    <ExportButton />
                </div>

                <PatientForm />
            </div>
        </main>
    );
}
