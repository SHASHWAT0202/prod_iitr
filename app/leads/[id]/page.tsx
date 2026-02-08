'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';

// Lazy load heavy component
const LeadDossier = dynamic(() => import('@/components/LeadDossier'), {
  loading: () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 animate-pulse">
      <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  ),
  ssr: false,
});

interface Lead {
  id: string;
  company_name: string;
  industry?: string;
  source: string;
  source_type: string;
  source_text: string;
  timestamp: number;
  trust: number;
  geo: string;
  status: 'new' | 'in_progress' | 'converted' | 'rejected';
  score?: number;
  scoreBreakdown?: Record<string, number>;
  scoreExplanation?: string[];
  inference?: any;
}

function LeadPageContent({ params }: { params: { id: string } }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await fetch(`/api/leads?id=${params.id}`);
        const data = await res.json();
        
        if (data.ok && data.data?.length > 0) {
          // Find the specific lead
          const foundLead = data.data.find((l: Lead) => l.id === params.id);
          setLead(foundLead || null);
        } else if (data.ok && Array.isArray(data.data)) {
          // API might return all leads, filter for this one
          const foundLead = data.data.find((l: Lead) => l.id === params.id);
          setLead(foundLead || null);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [params.id]);

  const handleAction = async (action: string) => {
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, action }),
      });
      const data = await res.json();
      if (data.ok) {
        setLead(data.data);
        // If rejected or converted, could redirect
        if (action === 'reject' || action === 'convert') {
          // Stay on page to show the result
        }
      }
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Lead Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            The lead you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/dashboard" className="text-slate-500 hover:text-blue-600 transition-colors">
          Dashboard
        </Link>
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-900 dark:text-white font-medium">{lead.company_name}</span>
      </nav>

      {/* Lead Dossier */}
      <LeadDossier lead={lead} onAction={handleAction} />
    </div>
  );
}

// Export with error boundary wrapper
export default function LeadPage({ params }: { params: { id: string } }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-amber-500">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Error Loading Lead
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Something went wrong while loading this lead.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      }
    >
      <LeadPageContent params={params} />
    </ErrorBoundary>
  );
}
