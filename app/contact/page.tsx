'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: true });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: true });

// Contact icon component
const ContactIcon = ({ type }: { type: 'location' | 'phone' | 'email' }) => {
  if (type === 'location') return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  if (type === 'phone') return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
};

const contactInfo = [
  {
    iconType: 'location' as const,
    title: 'Visit Us',
    details: ['HPCL Corporate Office', 'Petroleum House, 17 Jamshedji Tata Road', 'Mumbai - 400020, Maharashtra']
  },
  {
    iconType: 'phone' as const,
    title: 'Call Us',
    details: ['Sales: 1800-2333-555', 'Support: +91-22-2286-2000', 'Mon - Sat: 9AM - 6PM IST']
  },
  {
    iconType: 'email' as const,
    title: 'Email Us',
    details: ['sales@leadsense.ai', 'support@leadsense.ai', 'enterprise@leadsense.ai']
  }
];

const faqs = [
  {
    question: 'How does LeadSense AI work?',
    answer: 'LeadSense AI continuously monitors multiple data sources including news articles, government tenders, industry reports, and market signals. Our AI analyzes these signals to identify potential B2B opportunities for HPCL products.'
  },
  {
    question: 'What industries does it cover?',
    answer: 'We cover all major industries relevant to HPCL including Mining, Construction, Transport, Manufacturing, Agriculture, Power & Energy, and Marine sectors.'
  },
  {
    question: 'How accurate is the lead scoring?',
    answer: 'Our AI-powered scoring system achieves 95%+ accuracy in lead qualification, combining multiple factors like industry relevance, company size, timing, and historical conversion patterns.'
  },
  {
    question: 'Can I integrate with my existing CRM?',
    answer: 'Yes! LeadSense AI offers REST APIs for seamless integration with popular CRM systems including Salesforce, HubSpot, and custom enterprise solutions.'
  }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', company: '', phone: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
              Get in <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Touch</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto px-2">
              Have questions about LeadSense AI? Our team is here to help you 
              transform your B2B sales pipeline.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {contactInfo.map((info, i) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:border-blue-500/50 transition-colors group shadow-sm"
              >
                <div className="mb-4 text-blue-600 flex justify-center group-hover:scale-110 transition-transform">
                  <ContactIcon type={info.iconType} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{info.title}</h3>
                {info.details.map((detail, j) => (
                  <p key={j} className="text-slate-500 text-sm">{detail}</p>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h2>
              
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg"
                >
                  ✅ Thank you! We&apos;ll get back to you within 24 hours.
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                      placeholder="Your Company"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subject *</label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  >
                    <option value="">Select a topic</option>
                    <option value="demo">Request a Demo</option>
                    <option value="sales">Sales Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Message *</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
                >
                  Send Message
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </motion.button>
              </form>
            </motion.div>

            {/* Map/Office Visual */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Office</h2>
              
              {/* Map Placeholder */}
              <div className="relative h-64 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-blue-600 mb-2">
                      <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <p className="text-slate-500">Mumbai, Maharashtra</p>
                  </div>
                </div>
                {/* Grid overlay for visual effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-blue-700/5" />
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href="tel:18002333555"
                  className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500/50 transition-colors shadow-sm"
                >
                  <span className="text-2xl">📞</span>
                  <div>
                    <p className="text-slate-900 font-medium">Call Now</p>
                    <p className="text-slate-500 text-sm">Toll Free</p>
                  </div>
                </a>
                <a
                  href="mailto:sales@leadsense.ai"
                  className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500/50 transition-colors shadow-sm"
                >
                  <span className="text-2xl">📧</span>
                  <div>
                    <p className="text-slate-900 font-medium">Email</p>
                    <p className="text-slate-500 text-sm">Quick Response</p>
                  </div>
                </a>
              </div>

              {/* Business Hours */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span>🕐</span> Business Hours
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Monday - Friday</span>
                    <span className="text-slate-900">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Saturday</span>
                    <span className="text-slate-900">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Sunday</span>
                    <span className="text-blue-600">Closed</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500">Quick answers to common questions</p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-slate-900">{faq.question}</span>
                  <motion.span
                    animate={{ rotate: expandedFaq === i ? 180 : 0 }}
                    className="text-blue-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.span>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: expandedFaq === i ? 'auto' : 0, opacity: expandedFaq === i ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-slate-600">{faq.answer}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
