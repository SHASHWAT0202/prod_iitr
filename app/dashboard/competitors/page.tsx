'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CompetitorSignal {
  id: string;
  competitor: string;
  activityType: string;
  strategicCategory: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  geo: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  hpclImplication: string;
  createdAt: string;
}

interface Stats {
  competitorBreakdown: Record<string, number>;
  activityBreakdown: Record<string, number>;
  impactBreakdown: Record<string, number>;
  geoBreakdown: Record<string, number>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COMPETITOR_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; gradient: string }> = {
  IOCL: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', gradient: 'from-orange-500 to-amber-500' },
  BPCL: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500', gradient: 'from-yellow-500 to-orange-400' },
  Reliance: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', gradient: 'from-blue-500 to-indigo-500' },
  Shell: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', gradient: 'from-red-500 to-rose-500' },
  Nayara: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-500' },
  Other: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500', gradient: 'from-slate-500 to-gray-500' },
};

const IMPACT_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  critical: { bg: 'bg-red-100', text: 'text-red-700', icon: '🔴' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', icon: '🟠' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🟡' },
  low: { bg: 'bg-green-100', text: 'text-green-700', icon: '🟢' },
};

const ACTIVITY_ICONS: Record<string, string> = {
  ev_charging: '⚡',
  hydrogen: '💧',
  new_plant: '🏭',
  infrastructure_expansion: '🏗️',
  partnership: '🤝',
  govt_contract: '🏛️',
  acquisition: '💰',
  technology: '💻',
  retail_expansion: '⛽',
  green_energy: '🌿',
  supply_chain: '🚛',
  pricing: '💲',
  other: '📋',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CompetitorDashboard() {
  const [signals, setSignals] = useState<CompetitorSignal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [selectedImpact, setSelectedImpact] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('days', String(days));
      if (selectedCompetitor) params.set('competitor', selectedCompetitor);
      if (selectedImpact) params.set('impactLevel', selectedImpact);
      if (selectedActivity) params.set('activityType', selectedActivity);

      const res = await fetch(`/api/competitors?${params}`);
      const json = await res.json();
      if (json.ok) {
        setSignals(json.data.signals);
        setStats(json.data.stats);
        setTotal(json.data.total);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days, selectedCompetitor, selectedImpact, selectedActivity]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleScan = async () => {
    setScanning(true);
    setError('');
    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usePaidApis: true }),
      });
      const json = await res.json();
      if (json.ok) {
        await fetchData();
      } else {
        setError(json.error || 'Scan failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  };

  const clearFilters = () => {
    setSelectedCompetitor(null);
    setSelectedImpact(null);
    setSelectedActivity(null);
  };

  const hasFilters = selectedCompetitor || selectedImpact || selectedActivity;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Loading competitor intelligence...</p>
        </div>
      </div>
    );
  }

  const competitors = ['IOCL', 'BPCL', 'Reliance', 'Shell', 'Nayara'];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </Link>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-lg">Competitor Intelligence</h1>
                <p className="text-xs text-slate-500">Real-time monitoring of IOCL, BPCL, Reliance, Shell & Nayara</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Time range */}
              <select
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>

              {/* Scan button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleScan}
                disabled={scanning}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/25 transition-all"
              >
                {scanning ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Scan Now
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Error banner */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </motion.div>
        )}

        {/* ── Competitor Cards Row ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {competitors.map(comp => {
            const count = stats?.competitorBreakdown[comp] || 0;
            const colors = COMPETITOR_COLORS[comp];
            const isSelected = selectedCompetitor === comp;
            return (
              <motion.button
                key={comp}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedCompetitor(isSelected ? null : comp)}
                className={`relative rounded-xl p-4 border-2 transition-all text-left overflow-hidden ${
                  isSelected
                    ? `${colors.bg} ${colors.border} shadow-lg ring-2 ring-offset-1 ring-blue-400`
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className={`absolute top-0 right-0 w-16 h-16 rounded-full bg-gradient-to-br ${colors.gradient} opacity-10 blur-xl translate-x-4 -translate-y-4`} />
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                  {isSelected && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  )}
                </div>
                <p className="font-bold text-slate-900 text-sm">{comp}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{count}</p>
                <p className="text-xs text-slate-500 mt-0.5">signals</p>
              </motion.button>
            );
          })}
        </div>

        {/* ── Filters Row ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Impact filter */}
          {['critical', 'high', 'medium', 'low'].map(level => (
            <button
              key={level}
              onClick={() => setSelectedImpact(selectedImpact === level ? null : level)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedImpact === level
                  ? `${IMPACT_STYLES[level].bg} ${IMPACT_STYLES[level].text} border-current shadow-sm`
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {IMPACT_STYLES[level].icon} {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
          <span className="w-px h-5 bg-slate-200" />
          {/* Activity type filter */}
          {Object.entries(stats?.activityBreakdown || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type]) => (
            <button
              key={type}
              onClick={() => setSelectedActivity(selectedActivity === type ? null : type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedActivity === type
                  ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {ACTIVITY_ICONS[type] || '📋'} {type.replace(/_/g, ' ')}
            </button>
          ))}
          {hasFilters && (
            <button onClick={clearFilters} className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
              Clear filters ✕
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400">{signals.length} of {total} signals</span>
        </div>

        {/* ── Main Grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Signal Feed */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Activity Feed</h2>
              <span className="text-xs text-slate-400">Latest signals from {days} days</span>
            </div>

            {signals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl border border-slate-200 p-12 text-center"
              >
                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <h3 className="font-semibold text-slate-700 mb-1">No competitor signals yet</h3>
                <p className="text-sm text-slate-500 mb-4">Click &ldquo;Scan Now&rdquo; to fetch the latest competitor activities.</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleScan}
                  disabled={scanning}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                >
                  {scanning ? 'Scanning...' : 'Run First Scan'}
                </motion.button>
              </motion.div>
            ) : (
              <AnimatePresence>
                {signals.map((sig, idx) => {
                  const colors = COMPETITOR_COLORS[sig.competitor] || COMPETITOR_COLORS.Other;
                  const impact = IMPACT_STYLES[sig.impactLevel] || IMPACT_STYLES.low;
                  const isExpanded = expandedSignal === sig.id;
                  return (
                    <motion.div
                      key={sig.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden"
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedSignal(isExpanded ? null : sig.id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Competitor badge */}
                          <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${colors.bg} ${colors.text} ${colors.border} border flex-shrink-0`}>
                            {sig.competitor}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Title */}
                            <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
                              {sig.title}
                            </h3>

                            {/* Meta row */}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${impact.bg} ${impact.text}`}>
                                {impact.icon} {sig.impactLevel}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                {ACTIVITY_ICONS[sig.activityType] || '📋'} {sig.strategicCategory}
                              </span>
                              <span className="text-[11px] text-slate-400">•</span>
                              <span className="text-[11px] text-slate-500">📍 {sig.geo}</span>
                              <span className="text-[11px] text-slate-400">•</span>
                              <span className="text-[11px] text-slate-400">{timeAgo(sig.createdAt)}</span>
                            </div>
                          </div>

                          {/* Expand indicator */}
                          <motion.svg
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </motion.svg>
                        </div>
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-0 space-y-3 border-t border-slate-100">
                              <div className="mt-3">
                                <p className="text-xs font-medium text-slate-500 mb-1">Summary</p>
                                <p className="text-sm text-slate-700 leading-relaxed">{sig.summary}</p>
                              </div>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  HPCL Strategic Implication
                                </p>
                                <p className="text-sm text-blue-800">{sig.hpclImplication}</p>
                              </div>
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Source: {sig.source}</span>
                                {sig.sourceUrl && (
                                  <a
                                    href={sig.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    Read article
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                  </a>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Right sidebar — Charts & stats */}
          <div className="space-y-5">
            {/* Activity Distribution */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Activity Types
              </h3>
              {stats && Object.keys(stats.activityBreakdown).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.activityBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([type, count]) => {
                      const maxCount = Math.max(...Object.values(stats.activityBreakdown));
                      return (
                        <div key={type}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-600 capitalize flex items-center gap-1">
                              {ACTIVITY_ICONS[type] || '📋'} {type.replace(/_/g, ' ')}
                            </span>
                            <span className="font-bold text-slate-900">{count}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(count / maxCount) * 100}%` }}
                              transition={{ duration: 0.6 }}
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No activity data yet</p>
              )}
            </div>

            {/* Impact Distribution */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Threat Level
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {['critical', 'high', 'medium', 'low'].map(level => {
                  const count = stats?.impactBreakdown[level] || 0;
                  const style = IMPACT_STYLES[level];
                  return (
                    <div key={level} className={`rounded-lg p-3 ${style.bg} border ${level === 'critical' ? 'border-red-200' : level === 'high' ? 'border-orange-200' : level === 'medium' ? 'border-yellow-200' : 'border-green-200'}`}>
                      <p className="text-lg font-bold text-slate-900">{count}</p>
                      <p className={`text-xs font-medium ${style.text} capitalize`}>{style.icon} {level}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Geographic Hotspots */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Geographic Hotspots
              </h3>
              {stats && Object.keys(stats.geoBreakdown).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(stats.geoBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([geo, count]) => (
                      <div key={geo} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-700">{geo}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">{count}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No geographic data yet</p>
              )}
            </div>

            {/* Competitor Summary */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                Intelligence Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total signals</span>
                  <span className="font-bold">{total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Competitors tracked</span>
                  <span className="font-bold">{Object.keys(stats?.competitorBreakdown || {}).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">High/Critical alerts</span>
                  <span className="font-bold text-orange-400">
                    {(stats?.impactBreakdown['high'] || 0) + (stats?.impactBreakdown['critical'] || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Regions covered</span>
                  <span className="font-bold">{Object.keys(stats?.geoBreakdown || {}).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Period</span>
                  <span className="font-bold text-blue-400">{days} days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
