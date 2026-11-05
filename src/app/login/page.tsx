'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import axios from '@/utils/axios';
import { Eye, EyeOff, Lock, Mail, LoaderCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      setError('Too many failed attempts. Please try again later.');
      return;
    }

    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please fill in all fields.');
      return;
    }

    // Slow down repeated guessing in this tab; the server is the real gatekeeper.
    if (attempts >= 5) {
      setIsLocked(true);
      setError('Too many failed attempts. Please wait 30 seconds.');
      setTimeout(() => {
        setIsLocked(false);
        setAttempts(0);
        setError(null);
      }, 30000);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/login', { email: trimmedEmail, password });

      if (response.data.success) {
        const { token } = response.data.data;
        // localStorage feeds the axios auth header; the cookie lets middleware guard routes.
        localStorage.setItem('token', token);
        document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict; Secure`;
        router.push('/');
        router.refresh();
      } else {
        setAttempts((prev) => prev + 1);
        setError(response.data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setAttempts((prev) => prev + 1);
      setError(
        (isAxiosError(err) && err.response?.data?.message) ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border-gray-100 bg-white p-8 sm:border sm:shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5 flex-shrink-0"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-gray-300 py-2.5 pr-3 pl-10 text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-900/50 dark:text-white dark:placeholder-gray-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-gray-300 py-2.5 pr-10 pl-10 text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-900/50 dark:text-white dark:placeholder-gray-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full transform items-center justify-center rounded-xl border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <LoaderCircle className="mr-2 -ml-1 h-5 w-5 animate-spin" />
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
