"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import PatientForm from "@/components/PatientForm";
import ExportButton from "@/components/ExportButton";

export default function Home() {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
                    <p className="text-zinc-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <main className="min-h-screen bg-zinc-50 py-12 sm:py-20 font-sans">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-12 gap-6">
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

                    {/* User Info & Actions */}
                    <div className="flex items-center gap-4">
                        <ExportButton />
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-zinc-200 shadow-sm">
                            <div className="text-right">
                                <p className="text-sm font-medium text-zinc-900">
                                    {user?.first_name} {user?.last_name}
                                </p>
                                <p className="text-xs text-zinc-500">
                                    {user?.role_display}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                                <span className="text-zinc-600 font-semibold text-xs">
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <PatientForm />
            </div>
        </main>
    );
}
