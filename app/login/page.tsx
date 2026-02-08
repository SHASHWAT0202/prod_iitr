'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type LoginType = 'organization' | 'sales_manager' | null;

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<LoginType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    orgCode: '',
    rememberMe: false,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          orgCode: formData.orgCode,
          loginType
        })
      });
      
      const data = await res.json();
      
      if (data.ok) {
        // Store user info in localStorage
        localStorage.setItem('userType', loginType || 'sales_manager');
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Redirect based on role
        if (loginType === 'organization' || data.data.user.role === 'org_admin') {
          router.push('/dashboard/org');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex relative">
      {/* Floating Error Toast Notification */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -100, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -100, x: '-50%' }}
            className="fixed top-6 left-1/2 z-50 max-w-md w-full mx-4"
          >
            <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-red-500/30 flex items-center gap-4 border border-red-400/30">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Login Failed</p>
                <p className="text-white/90 text-sm">{error}</p>
              </div>
              <button 
                onClick={() => setError('')}
                className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900" />
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
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

        {/* Content */}
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
              <h1 className="text-4xl font-bold mb-4">
                Transform Market Signals Into Opportunities
              </h1>
              <p className="text-lg text-white/80">
                AI-powered B2B lead intelligence platform that helps HPCL sales teams discover, qualify, and convert high-value opportunities.
              </p>
            </motion.div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '85%', label: 'Accuracy' },
                { value: '5K+', label: 'Leads' },
                { value: '24/7', label: 'Monitoring' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
                >
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/50">
            © 2026 HPCL. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
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
            {!loginType ? (
              /* Role Selection */
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2 text-slate-800">Welcome Back</h2>
                  <p className="text-slate-500">Choose how you want to sign in</p>
                </div>

                <div className="space-y-4">
                  {/* Organization Login */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLoginType('organization')}
                    className="w-full p-6 bg-white border border-slate-200 rounded-2xl text-left group hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl">
                        🏢
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1 text-slate-800 group-hover:text-blue-700 transition-colors">
                          Organization Admin
                        </h3>
                        <p className="text-sm text-slate-500">
                          Access full dashboard, manage teams, view analytics, and configure settings.
                        </p>
                      </div>
                      <svg className="w-6 h-6 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.button>

                  {/* Sales Manager Login */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLoginType('sales_manager')}
                    className="w-full p-6 bg-white border border-slate-200 rounded-2xl text-left group hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-2xl">
                        👔
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1 text-slate-800 group-hover:text-blue-700 transition-colors">
                          Sales Manager
                        </h3>
                        <p className="text-sm text-slate-500">
                          View assigned leads, update status, track progress, and receive notifications.
                        </p>
                      </div>
                      <svg className="w-6 h-6 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.button>
                </div>

                <p className="text-center text-slate-500 text-sm">
                  New to LeadSense AI?{' '}
                  <Link href="/#contact" className="text-blue-700 hover:underline">
                    Contact us for access
                  </Link>
                </p>
              </motion.div>
            ) : (
              /* Login Form */
              <motion.div
                key="login-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <button
                  onClick={() => setLoginType(null)}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                    loginType === 'organization' 
                      ? 'bg-gradient-to-br from-purple-500 to-blue-600' 
                      : 'bg-gradient-to-br from-blue-600 to-blue-800'
                  }`}>
                    {loginType === 'organization' ? '🏢' : '👔'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      {loginType === 'organization' ? 'Organization Login' : 'Sales Manager Login'}
                    </h2>
                    <p className="text-slate-500">Enter your credentials to continue</p>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Error Message - Inline */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-red-500/20 border-2 border-red-500/50 rounded-xl text-red-300 flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-red-500/30 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-red-200">Authentication Error</p>
                            <p className="text-sm text-red-300/90">{error}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {loginType === 'organization' && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-700">Organization Code</label>
                      <input
                        type="text"
                        value={formData.orgCode}
                        onChange={(e) => setFormData({ ...formData, orgCode: e.target.value })}
                        className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-slate-800"
                        placeholder="Enter organization code"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-slate-800"
                      placeholder="you@hpcl.in"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">Password</label>
                      <Link href="/forgot-password" className="text-sm text-blue-700 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-slate-800"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="remember" className="text-sm text-slate-500">
                      Remember me for 30 days
                    </label>
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
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </motion.button>
                </form>

                {/* Notification preferences */}
                <div className="pt-6 border-t border-white/10">
                  <h4 className="text-sm font-medium mb-3">Notification Preferences</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500" />
                      <span className="text-sm text-gray-400">📧 Email notifications for high-priority leads</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500" />
                      <span className="text-sm text-gray-400">🔔 Browser push notifications</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500" />
                      <span className="text-sm text-gray-400">📱 WhatsApp alerts (optional)</span>
                    </label>
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
