'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Icon components for team section
const TeamIcon = ({ type }: { type: 'building' | 'brain' | 'chart' }) => {
  if (type === 'building') return (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
  if (type === 'brain') return (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
  return (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
};

// Icon components for values section
const ValueIcon = ({ type }: { type: 'target' | 'bolt' | 'lock' | 'bulb' }) => {
  if (type === 'target') return (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
  if (type === 'bolt') return (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
  if (type === 'lock') return (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
  return (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
};

const team = [
  {
    name: 'HPCL Direct Sales',
    role: 'Enterprise Partner',
    description: 'Hindustan Petroleum Corporation Limited - powering India\'s energy future',
    iconType: 'building' as const
  },
  {
    name: 'AI Intelligence',
    role: 'Core Technology',
    description: 'Powered by advanced OpenAI models for accurate lead scoring',
    iconType: 'brain' as const
  },
  {
    name: 'Real-time Analytics',
    role: 'Data Platform',
    description: 'Process thousands of signals daily from diverse sources',
    iconType: 'chart' as const
  }
];

const milestones = [
  { year: '2024', event: 'LeadSense AI Launch', description: 'Revolutionary B2B lead intelligence for HPCL' },
  { year: 'Q1', event: 'Multi-source Integration', description: 'News, tenders, and market signals' },
  { year: 'Q2', event: 'AI Scoring Engine', description: 'Intelligent lead prioritization' },
  { year: 'Q3', event: 'Enterprise Ready', description: 'Scalable for national deployment' },
];

const values = [
  {
    iconType: 'target' as const,
    title: 'Precision',
    description: 'Every lead is analyzed with AI precision to maximize conversion potential'
  },
  {
    iconType: 'bolt' as const,
    title: 'Speed',
    description: 'Real-time signal processing ensures you never miss an opportunity'
  },
  {
    iconType: 'lock' as const,
    title: 'Trust',
    description: 'Enterprise-grade security with full data privacy compliance'
  },
  {
    iconType: 'bulb' as const,
    title: 'Innovation',
    description: 'Continuously evolving with the latest AI advancements'
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              About <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">LeadSense AI</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Transforming B2B lead generation for HPCL Direct Sales with cutting-edge 
              artificial intelligence and real-time market intelligence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                At LeadSense AI, we believe that the future of B2B sales lies in intelligent automation. 
                Our mission is to empower HPCL's direct sales team with AI-driven insights that transform 
                raw market signals into actionable business opportunities.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed">
                By combining advanced natural language processing with deep industry knowledge, we help 
                sales teams focus on what matters most - building relationships and closing deals.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-3xl blur-3xl" />
              <div className="relative bg-slate-900/50 border border-slate-700 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-4xl font-bold text-orange-500 mb-2">95%</div>
                    <div className="text-slate-400">Accuracy Rate</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-orange-500 mb-2">10x</div>
                    <div className="text-slate-400">Faster Processing</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-orange-500 mb-2">500+</div>
                    <div className="text-slate-400">Daily Signals</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-orange-500 mb-2">24/7</div>
                    <div className="text-slate-400">Monitoring</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Our Core Values</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              The principles that guide everything we build
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center hover:border-orange-500/50 transition-colors group"
              >
                <div className="mb-4 text-orange-500 flex justify-center group-hover:scale-110 transition-transform">
                  <ValueIcon type={value.iconType} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-slate-400 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Our Journey</h2>
            <p className="text-slate-400">Building the future of B2B sales intelligence</p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-orange-500 to-red-600" />
            {milestones.map((milestone, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex items-center mb-8 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`w-5/12 ${i % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                  <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                    <div className="text-orange-500 font-bold mb-1">{milestone.year}</div>
                    <div className="text-white font-semibold">{milestone.event}</div>
                    <div className="text-slate-400 text-sm">{milestone.description}</div>
                  </div>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-orange-500 rounded-full border-4 border-slate-900" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team/Technology Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Our Technology Stack</h2>
            <p className="text-slate-400">Powered by industry-leading technologies</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center group hover:border-orange-500/50 transition-all"
              >
                <div className="mb-4 text-orange-500 flex justify-center group-hover:scale-110 transition-transform">
                  <TeamIcon type={member.iconType} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">{member.name}</h3>
                <p className="text-orange-500 text-sm mb-3">{member.role}</p>
                <p className="text-slate-400 text-sm">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-r from-orange-500/10 to-red-600/10 rounded-3xl p-12 border border-orange-500/20"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Sales?
          </h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Join HPCL's digital transformation journey with LeadSense AI.
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all"
          >
            Get Started Today
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

