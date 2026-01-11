'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/utils/axios';
import { Eye, EyeOff, Lock, Mail, Loader2, LayoutDashboard } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);

    // Basic SQL Injection patterns to check against (Client-side defense depth)
    const containsSQLInjection = (input: string) => {
        const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)|(')|(--)|(#)/i;
        return sqlPattern.test(input);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLocked) {
            setError("Too many failed attempts. Please try again later.");
            return;
        }

        setError(null);

        // Client-side Input Validation & Sanitization
        const sanitizedEmail = email.trim();

        if (!sanitizedEmail || !password) {
            setError("Please fill in all fields.");
            return;
        }

        // Basic SQLi Prevention Check
        if (containsSQLInjection(sanitizedEmail) || containsSQLInjection(password)) {
            setError("Invalid characters detected in input.");
            return;
        }

        // Rate Limiting Check (Client-side)
        if (attempts >= 5) {
            setIsLocked(true);
            setError("Too many failed attempts. Please wait 30 seconds.");
            setTimeout(() => {
                setIsLocked(false);
                setAttempts(0);
                setError(null);
            }, 30000);
            return;
        }

        setLoading(true);

        try {
            // API call to login
            const response = await axios.post('/login', {
                email: sanitizedEmail,
                password,
            });

            if (response.data.success) {
                const { token } = response.data.data;

                // Store token in LocalStorage for axios interceptor
                localStorage.setItem('token', token);

                // Store token in Cookie for Middleware
                // Added 'Secure' flag for HTTPS protection
                document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict; Secure`;

                // Redirect to dashboard
                router.push('/');
                router.refresh();
            } else {
                setAttempts(prev => prev + 1);
                setError(response.data.message || 'Login failed. Please check your credentials.');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setAttempts(prev => prev + 1);
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 dark:bg-gray-900">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl sm:shadow-xl sm:border border-gray-100 p-8 dark:bg-gray-800 dark:border-gray-700">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Error Alert */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:bg-gray-900/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-500"
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:bg-gray-900/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-500"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99] h-11 items-center"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}
