"use client";

export default function ExportButton() {
    const handleExport = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/export/");

            if (!response.ok) {
                alert("Export failed");
                return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "pharma-report.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert("Export failed");
        }
    };

    return (
        <button
            onClick={handleExport}
            className="bg-white text-slate-700 border border-slate-200 py-2 px-4 rounded-lg hover:border-sky-500 hover:text-sky-600 shadow-sm transition-all text-sm font-medium flex items-center gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Report (CSV)
        </button>
    );
}
