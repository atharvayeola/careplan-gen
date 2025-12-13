"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        password_confirm: '',
        role: 'technician',
        provider_npi: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate form
        if (formData.password !== formData.password_confirm) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (formData.role === 'pharmacist' && !formData.provider_npi) {
            setError('NPI is required for pharmacist role');
            return;
        }

        setIsLoading(true);

        try {
            await register(formData);
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-lg w-full space-y-8">
                <div>
                    <h1 className="text-center text-3xl font-bold text-zinc-900">
                        Create Account
                    </h1>
                    <p className="mt-2 text-center text-sm text-zinc-500">
                        Register to access the Care Plan Generator
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="bg-white rounded-xl shadow-lg shadow-zinc-200/50 p-8 border border-zinc-100">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="first_name" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                                        First Name
                                    </label>
                                    <input
                                        id="first_name"
                                        name="first_name"
                                        type="text"
                                        required
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-4 py-3 border border-zinc-200 rounded-lg placeholder-zinc-400 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="last_name" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                                        Last Name
                                    </label>
                                    <input
                                        id="last_name"
                                        name="last_name"
                                        type="text"
                                        required
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-4 py-3 border border-zinc-200 rounded-lg placeholder-zinc-400 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="username" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="appearance-none relative block w-full px-4 py-3 border border-zinc-200 rounded-lg placeholder-zinc-400 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="johndoe"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="appearance-none relative block w-full px-4 py-3 border border-zinc-200 rounded-lg placeholder-zinc-400 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="role" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                                    Role
                                </label>
                                <div className="relative">
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-4 py-3 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    >
                                        <option value="technician">Pharmacy Technician</option>
                                        <option value="pharmacist">Pharmacist</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {formData.role === 'pharmacist' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label htmlFor="provider_npi" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                                        NPI (10 digits)
                                    </label>
                                    <input
                                        id="provider_npi"
                                        name="provider_npi"
                                        type="text"
                                        maxLength={10}
                                        value={formData.provider_npi}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-4 py-3 border border-zinc-200 rounded-lg placeholder-zinc-400 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                        placeholder="1234567890"
                                    />
                                </div>
                            )}

                            <div className="h-px bg-zinc-100 my-6" />

                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="appearance-none relative block w-full px-4 py-3 border border-zinc-200 rounded-lg placeholder-zinc-400 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="Min. 8 characters"
                                />
                            </div>

                            <div>
                                <label htmlFor="password_confirm" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                                    Confirm Password
                                </label>
                                <input
                                    id="password_confirm"
                                    name="password_confirm"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={formData.password_confirm}
                                    onChange={handleChange}
                                    className="appearance-none relative block w-full px-4 py-3 border border-zinc-200 rounded-lg placeholder-zinc-400 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="Confirm your password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-8 w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-black hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </div>

                    <p className="text-center text-sm text-zinc-500">
                        Already have an account?{' '}
                        <Link href="/login" className="font-semibold text-black hover:underline">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
