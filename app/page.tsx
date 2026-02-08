'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect, memo, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: true });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: true });

// Memoized animated background particles with reduced count for performance
const ParticleField = memo(function ParticleField() {
  return null; // Removed for professional government look
});

// Memoized animated stats counter
const AnimatedCounter = memo(function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{count.toLocaleString()}{suffix}</span>;
});

// Memoized feature card component
const FeatureCard = memo(function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className="relative group"
    >
      <div className="bg-white border border-slate-200 rounded-xl p-8 h-full shadow-sm hover:shadow-md transition-shadow">
        <div className="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center mb-5">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
});

export default function LandingPage() {
  const features = [
    {
      icon: <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
      title: 'AI-Powered Intelligence',
      description: 'Advanced GPT-4 powered analysis identifies high-potential B2B opportunities from market signals.',
    },
    {
      icon: <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      title: 'Real-Time Ingestion',
      description: 'Automatically captures leads from tenders, news, and social media in real-time.',
    },
    {
      icon: <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      title: 'Smart Scoring',
      description: 'Proprietary scoring algorithm ranks leads by conversion probability and urgency.',
    },
    {
      icon: <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
      title: 'Instant Alerts',
      description: 'Get notified via WhatsApp and email for high-priority opportunities.',
    },
    {
      icon: <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights into lead performance, conversion rates, and team metrics.',
    },
    {
      icon: <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      title: 'Product Matching',
      description: 'AI automatically maps leads to relevant HPCL products based on context.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800 overflow-x-hidden">
      <ParticleField />
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-orange-50" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-100/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-orange-100/40 rounded-full blur-[100px]" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Logo and badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="flex items-center justify-center gap-4 mb-8"
            >
              <img 
                src="/images.jpg" 
                alt="HPCL Logo" 
                className="h-20 w-auto object-contain"
              />
              <div className="text-left border-l-2 border-blue-700 pl-4">
                <h2 className="text-2xl font-bold text-blue-800">
                  HPCL
                </h2>
                <p className="text-sm text-slate-600">Hindustan Petroleum Corporation Limited</p>
              </div>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-5xl md:text-7xl font-black mb-6 leading-tight"
            >
              <span className="text-slate-800">
                LeadSense
              </span>
              <br />
              <span className="text-blue-700">
                AI
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto"
            >
              Intelligent B2B Lead Discovery Platform for HPCL Direct Sales.
              Transform market signals into high-value opportunities.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-blue-700 hover:bg-blue-800 rounded-full font-semibold text-lg text-white shadow-lg transition-colors"
                >
                  Get Started Free →
                </motion.button>
              </Link>
              <Link href="#features">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white border-2 border-slate-300 rounded-full font-semibold text-lg text-slate-700 hover:border-blue-700 hover:text-blue-700 transition-colors"
                >
                  Learn More
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-10 border-t border-slate-200"
            >
              {[
                { value: 5000, suffix: '+', label: 'Leads Generated' },
                { value: 85, suffix: '%', label: 'Accuracy Rate' },
                { value: 150, suffix: '+', label: 'Active Users' },
                { value: 24, suffix: '/7', label: 'Signal Monitoring' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-blue-700">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-slate-500 mt-2">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-slate-300 rounded-full flex items-start justify-center p-2"
          >
            <motion.div className="w-1.5 h-1.5 bg-blue-700 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative bg-slate-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="px-4 py-2 bg-blue-100 border border-blue-200 rounded-full text-blue-700 text-sm font-medium">
              FEATURES
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-6 mb-4 text-slate-800">
              Powerful Capabilities
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Everything you need to discover, qualify, and convert B2B leads efficiently.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="about" className="py-32 relative bg-white">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="px-4 py-2 bg-blue-100 border border-blue-200 rounded-full text-blue-700 text-sm font-medium">
              HOW IT WORKS
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-6 mb-4 text-slate-800">
              Simple 4-Step Process
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Signal Capture', desc: 'AI monitors news, tenders, and social media 24/7', icon: '📡' },
              { step: '02', title: 'Smart Analysis', desc: 'GPT-4 extracts company intent and product needs', icon: '🧠' },
              { step: '03', title: 'Lead Scoring', desc: 'Proprietary algorithm ranks by conversion potential', icon: '⭐' },
              { step: '04', title: 'Action & Convert', desc: 'Sales team receives prioritized, actionable leads', icon: '🎯' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                {i < 3 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-300 to-transparent" />
                )}
                <div className="relative z-10">
                  <div className="w-24 h-24 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center text-4xl mb-4 border border-blue-200">
                    {item.icon}
                  </div>
                  <span className="text-blue-700 font-bold">{item.step}</span>
                  <h3 className="text-xl font-bold mt-2 mb-2 text-slate-800">{item.title}</h3>
                  <p className="text-slate-500 text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative bg-slate-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-blue-700 p-12 md:p-20"
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative z-10 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Ready to Transform Your Sales?
              </h2>
              <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                Join HPCL sales teams already using LeadSense AI to discover and convert high-value B2B opportunities.
              </p>
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 bg-white text-blue-700 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
                >
                  Start Free Trial →
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 relative bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="px-4 py-2 bg-blue-100 border border-blue-200 rounded-full text-blue-700 text-sm font-medium">
                CONTACT US
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mt-6 mb-4 text-slate-800">
                Get In Touch
              </h2>
              <p className="text-slate-600 text-lg mb-8">
                Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    📧
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Email</p>
                    <p className="font-medium text-slate-800">leadsense@hpcl.in</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    📍
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Address</p>
                    <p className="font-medium text-slate-800">HPCL Bhavan, Mumbai 400001</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-8"
            >
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-slate-800"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-slate-800"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors resize-none text-slate-800"
                    placeholder="Your message..."
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold transition-colors"
                >
                  Send Message
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
