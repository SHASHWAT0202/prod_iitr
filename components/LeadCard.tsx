'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface LeadCardProps {
  lead: any;
  onUpdate?: () => void;
  onAction?: (action: string) => void;
}

// Helper functions
const getStatusClass = (status: string) => {
  switch (status) {
    case 'new': return 'badge-primary';
    case 'in_progress': return 'badge-warning';
    case 'converted': return 'badge-success';
    case 'rejected': return 'badge-danger';
    default: return 'badge-secondary';
  }
};

const getUrgencyClass = (urgency: string) => {
  switch (urgency) {
    case 'high': return 'badge-danger';
    case 'medium': return 'badge-warning';
    case 'low': return 'badge-success';
    default: return 'badge-secondary';
  }
};

const getScoreColor = (score: number | undefined) => {
  if (!score) return 'text-slate-400';
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-blue-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-500';
};

const formatDate = (timestamp: number | undefined) => {
  if (!timestamp) return 'Unknown date';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function LeadCard({ lead, onUpdate, onAction }: LeadCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      if (onAction) {
        onAction(action);
      } else {
        await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: lead.id, action }),
        });
        if (onUpdate) onUpdate();
      }
    } catch (e) {
      console.error('Action failed:', e);
    }
    setLoading(null);
  };

  const handleEmailSend = async () => {
    setEmailSending(true);
    try {
      const res = await fetch('/api/email-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000); // Reset after 3s
      } else {
        console.error('Email send failed:', data.error);
        alert('Failed to send email: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Email send error:', e);
      alert('Failed to send email');
    }
    setEmailSending(false);
  };

  const urgency = lead.inference?.urgency_level || 'medium';
  const isUrgent = urgency === 'high' && lead.status === 'new';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`card card-hover p-5 ${isUrgent ? 'ring-2 ring-red-400 urgent-pulse' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link href={`/leads/${lead.id}`}>
            <h3 className="font-semibold text-slate-900 dark:text-white truncate hover:text-blue-600 transition-colors">
              {lead.company_name}
            </h3>
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {lead.inference?.industry || lead.industry || 'Unknown Industry'}
          </p>
        </div>

        {/* Score circle */}
        <div className={`flex flex-col items-center ${getScoreColor(lead.score)}`}>
          <div className="w-12 h-12 rounded-full border-4 border-current flex items-center justify-center">
            <span className="text-sm font-bold">{lead.score || '—'}</span>
          </div>
          <span className="text-[10px] mt-1 text-slate-500">Score</span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mt-3">
        <span className={`badge ${getStatusClass(lead.status)}`}>
          {lead.status === 'in_progress' ? 'In Progress' : lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
        </span>
        <span className={`badge ${getUrgencyClass(urgency)} flex items-center gap-1`}>
          {urgency === 'high' && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
          )} {urgency.charAt(0).toUpperCase() + urgency.slice(1)} Priority
        </span>
      </div>

      {/* Source info */}
      <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {lead.source || 'Unknown source'} • {formatDate(lead.timestamp)}
      </div>

      {/* Inferred products */}
      {lead.inference?.inferred_products && (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            Recommended Products
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lead.inference.inferred_products.slice(0, 3).map((product: string, i: number) => (
              <span
                key={i}
                className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded"
              >
                {product}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confidence bar */}
      {lead.inference?.confidence_score && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>AI Confidence</span>
            <span>{Math.round(lead.inference.confidence_score * 100)}%</span>
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${lead.inference.confidence_score * 100}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      {lead.status === 'new' && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction('accept')}
              disabled={loading !== null}
              className="flex-1 py-2 px-3 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading === 'accept' ? '...' : '✓ Accept'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction('reject')}
              disabled={loading !== null}
              className="flex-1 py-2 px-3 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading === 'reject' ? '...' : '✗ Reject'}
            </motion.button>
            <Link href={`/leads/${lead.id}`}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="py-2 px-3 text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                View
              </motion.button>
            </Link>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleEmailSend}
            disabled={emailSending}
            className={`w-full mt-2 py-2 px-3 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${emailSent ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {emailSending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : emailSent ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email Sent!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Team
              </span>
            )}
          </motion.button>
        </div>
      )}

      {lead.status === 'in_progress' && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction('convert')}
              disabled={loading !== null}
              className="flex-1 py-2 px-3 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading === 'convert' ? '...' : (
                <span className="flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Convert
                </span>
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction('reject')}
              disabled={loading !== null}
              className="flex-1 py-2 px-3 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading === 'reject' ? '...' : '✗ Reject'}
            </motion.button>
            <Link href={`/leads/${lead.id}`}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="py-2 px-3 text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                View
              </motion.button>
            </Link>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleEmailSend}
            disabled={emailSending}
            className={`w-full mt-2 py-2 px-3 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${emailSent ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {emailSending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : emailSent ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email Sent!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Team
              </span>
            )}
          </motion.button>
        </div>
      )}

      {(lead.status === 'converted' || lead.status === 'rejected') && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction('reopen')}
              disabled={loading !== null}
              className="flex-1 py-2 px-3 text-sm font-medium bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading === 'reopen' ? '...' : (
                <span className="flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reopen
                </span>
              )}
            </motion.button>
            <Link href={`/leads/${lead.id}`}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="py-2 px-3 text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                View
              </motion.button>
            </Link>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleEmailSend}
            disabled={emailSending}
            className={`w-full mt-2 py-2 px-3 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${emailSent ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {emailSending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : emailSent ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email Sent!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Team
              </span>
            )}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
