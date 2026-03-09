'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.ok) {
        setSent(true);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex relative">
      {/* Left Panel - Branding */}
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
                Account Recovery
              </h1>
              <p className="text-lg text-white/80">
                Don&apos;t worry — it happens to everyone. We&apos;ll help you get back into your account securely.
              </p>
            </motion.div>

            <div className="space-y-4">
              {[
                { icon: '🔒', text: 'Secure token-based reset' },
                { icon: '⏱️', text: 'Link expires in 1 hour' },
                { icon: '📧', text: 'Check your registered email' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-white/90">{item.text}</span>
                </motion.div>
              ))}
            </div>
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
            {!sent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Link
                  href="/login"
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Login
                </Link>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-2xl">
                    🔑
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Forgot Password?</h2>
                    <p className="text-slate-500">We&apos;ll send you a reset link</p>
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
                    <label className="block text-sm font-medium mb-2 text-slate-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-slate-800"
                      placeholder="you@hpcl.in"
                    />
                    <p className="mt-2 text-sm text-slate-400">
                      Enter the email address associated with your account
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-700 hover:bg-blue-800 rounded-xl font-semibold text-lg text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </>
                    )}
                  </motion.button>
                </form>

                <p className="text-center text-sm text-slate-500">
                  Remember your password?{' '}
                  <Link href="/login" className="text-blue-700 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </motion.div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Check Your Email</h2>
                  <p className="text-slate-500">
                    We&apos;ve sent a password reset link to
                  </p>
                  <p className="text-blue-700 font-medium mt-1">{email}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 text-left space-y-3 border border-slate-200">
                  <p className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    The link will expire in 1 hour
                  </p>
                  <p className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    Check your spam/junk folder if you don&apos;t see it
                  </p>
                  <p className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    Only click links from leadsense.ai or hpcl.in
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => { setSent(false); setEmail(''); }}
                    className="text-blue-700 hover:underline text-sm font-medium"
                  >
                    Didn&apos;t receive it? Try again
                  </button>
                  <div>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Login
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
