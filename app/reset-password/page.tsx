'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordChecks = [
    { label: 'At least 8 characters', test: password.length >= 8 },
    { label: 'Contains a number', test: /\d/.test(password) },
    { label: 'Contains uppercase letter', test: /[A-Z]/.test(password) },
    { label: 'Passwords match', test: password.length > 0 && password === confirmPassword },
  ];

  const allChecksPassed = passwordChecks.every((c) => c.test);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecksPassed) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (data.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto border-2 border-red-200">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Invalid Reset Link</h2>
            <p className="text-slate-500">This password reset link is invalid or has expired.</p>
          </div>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-xl font-medium hover:bg-blue-800 transition-colors"
          >
            Request a New Link
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex relative">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900" />
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-64 h-64 bg-white/5 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.05, 0.1, 0.05],
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center overflow-hidden">
              <img src="/images.jpg" alt="HPCL" className="h-10 w-auto object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">LeadSense AI</h2>
              <p className="text-sm text-white/70">Hindustan Petroleum</p>
            </div>
          </Link>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-bold mb-4 text-white">
                Set New Password
              </h1>
              <p className="text-lg text-white/80">
                Choose a strong password to secure your account. Make sure it&apos;s something you can remember.
              </p>
            </motion.div>
          </div>

          <p className="text-sm text-white/50">
            © 2026 HPCL. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src="/images.jpg" alt="HPCL" className="h-12 w-auto object-contain" />
            <span className="text-xl font-bold text-slate-800">
              LeadSense<span className="text-blue-700">AI</span>
            </span>
          </Link>

          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-2xl">
                    🔐
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
                    <p className="text-slate-500">Create your new password</p>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-slate-800 pr-12"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">Confirm Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-slate-800"
                      placeholder="Confirm new password"
                    />
                  </div>

                  {/* Password strength indicators */}
                  <div className="space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-200">
                    {passwordChecks.map((check, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${check.test ? 'bg-emerald-500' : 'bg-slate-300'} transition-colors`}>
                          {check.test && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={check.test ? 'text-emerald-700' : 'text-slate-500'}>{check.label}</span>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || !allChecksPassed}
                    className="w-full py-4 bg-blue-700 hover:bg-blue-800 rounded-xl font-semibold text-lg text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              /* Success State */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200"
                >
                  <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Password Reset!</h2>
                  <p className="text-slate-500">
                    Your password has been successfully updated. Redirecting to login...
                  </p>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                    className="h-full bg-blue-600 rounded-full"
                  />
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-blue-700 hover:underline font-medium"
                >
                  Go to Login Now
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
