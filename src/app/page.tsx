import PatientForm from "@/components/PatientForm";
import ExportButton from "@/components/ExportButton";

export default function Home() {
    return (
        <main className="min-h-screen bg-zinc-50 py-12 sm:py-20 font-sans">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                                <span className="text-white font-bold text-sm">LH</span>
                            </div>
                            <span className="text-sm font-semibold text-zinc-500 tracking-wide uppercase">Lamar Health</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                            Specialty Pharmacy Care Plan
                        </h1>
                    </div>
                </div>

                {/* Form Section */}
                <PatientForm />
            </div>
        </main>
    );
}
