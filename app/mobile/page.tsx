'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Lead {
  id: string;
  company_name: string;
  industry: string;
  geo: string;
  score: number;
  source_text: string;
  createdAt: string;
  inference?: {
    inferred_products?: string[];
    reason_codes?: string[];
    confidence_score?: number;
    urgency_level?: string;
    suggested_next_action?: string;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  leadId: string;
  read: boolean;
  createdAt: string;
}

// DS Region mapping
const dsRegionMapping: Record<string, string> = {
  'Delhi NCR': 'Delhi DS Region',
  'Maharashtra': 'Mumbai DS Region',
  'Karnataka': 'Bangalore DS Region',
  'Tamil Nadu': 'Chennai DS Region',
  'Telangana': 'Hyderabad DS Region',
  'West Bengal': 'Kolkata DS Region',
  'Gujarat': 'Ahmedabad DS Region',
  'Rajasthan': 'Jaipur DS Region',
  'Odisha': 'Bhubaneswar DS Region',
  'Kerala': 'Kochi DS Region',
  'Punjab': 'Chandigarh DS Region',
  'Uttar Pradesh': 'Lucknow DS Region',
  'Pan India': 'Corporate DS',
  'Chhattisgarh': 'Raipur DS Region',
};

function getDSRegion(geo: string): string {
  return dsRegionMapping[geo] || `${geo} DS Region`;
}

export default function MobileNotificationsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [leadsRes, notifRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/notify'),
      ]);
      
      const leadsData = await leadsRes.json();
      const notifData = await notifRes.json();
      
      if (leadsData.ok) {
        // Get high priority leads only (score >= 80), sorted by newest
        const highPriorityLeads = leadsData.data
          .filter((l: Lead) => l.score >= 80)
          .sort((a: Lead, b: Lead) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLeads(highPriorityLeads);
      }
      
      if (notifData.ok) {
        setNotifications(notifData.data || []);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchData, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchData]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-red-600 to-red-800 shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/images.jpg" alt="HPCL" width={40} height={40} className="rounded-lg" />
            <div>
              <h1 className="font-bold text-lg">HPCL Leads</h1>
              <p className="text-xs text-red-200">Mobile Alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchData}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              🔄
            </button>
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-full transition ${autoRefresh ? 'bg-green-500/30' : 'bg-white/10'}`}
            >
              {autoRefresh ? '⏱️' : '⏸️'}
            </button>
          </div>
        </div>
        <div className="px-4 pb-2 text-xs text-red-200">
          Last updated: {lastUpdate.toLocaleTimeString()} • {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-gray-800 px-4 py-3 flex gap-4 overflow-x-auto">
        <div className="bg-red-500/20 rounded-lg px-4 py-2 flex-shrink-0">
          <p className="text-2xl font-bold text-red-400">{leads.length}</p>
          <p className="text-xs text-gray-400">High Priority</p>
        </div>
        <div className="bg-orange-500/20 rounded-lg px-4 py-2 flex-shrink-0">
          <p className="text-2xl font-bold text-orange-400">{notifications.filter(n => !n.read).length}</p>
          <p className="text-xs text-gray-400">Unread</p>
        </div>
        <div className="bg-green-500/20 rounded-lg px-4 py-2 flex-shrink-0">
          <p className="text-2xl font-bold text-green-400">{leads.filter(l => l.score >= 100).length}</p>
          <p className="text-xs text-gray-400">Score 100+</p>
        </div>
      </div>

      {/* Lead Cards */}
      <main className="p-4 space-y-4 pb-20">
        {leads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-gray-400">No high-priority leads yet</p>
            <p className="text-sm text-gray-500 mt-2">New leads will appear here automatically</p>
          </div>
        ) : (
          leads.map((lead) => (
            <div 
              key={lead.id}
              onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
              className={`bg-gray-800 rounded-xl overflow-hidden border transition cursor-pointer ${
                lead.score >= 100 ? 'border-red-500/50' : 'border-gray-700'
              }`}
            >
              {/* Card Header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {lead.score >= 100 && <span className="text-red-500">🔥</span>}
                      <h3 className="font-bold text-lg">{lead.company_name}</h3>
                    </div>
                    <p className="text-gray-400 text-sm">{lead.industry} • {lead.geo}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${lead.score >= 100 ? 'text-red-400' : 'text-orange-400'}`}>
                      {lead.score}
                    </div>
                    <p className="text-xs text-gray-500">{formatTime(lead.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {selectedLead?.id === lead.id && (
                <div className="border-t border-gray-700 bg-gray-900/50">
                  <div className="p-4 font-mono text-sm">
                    <pre className="text-green-400 whitespace-pre-wrap overflow-x-auto">
{`===== LEAD DETAILS =====

company_name: ${lead.company_name}
industry: ${lead.industry}
state: ${lead.geo}
activity: ${lead.source_text?.substring(0, 150)}...
products: [${lead.inference?.inferred_products?.map(p => `'${p}'`).join(', ') || ''}]
reasons: [${lead.inference?.reason_codes?.map(r => `'${r}'`).join(', ') || ''}]
confidence: ${Math.round((lead.inference?.confidence_score || 0) * 100)}
score: ${lead.score}
urgency: ${lead.inference?.urgency_level || 'High'}
assigned_region: ${getDSRegion(lead.geo)}
next_action: ${lead.inference?.suggested_next_action || 'Contact procurement'}

========================`}
                    </pre>
                  </div>
                  <div className="p-4 pt-0 flex gap-2">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg text-center font-semibold transition"
                    >
                      🔍 View Full Details
                    </Link>
                    <Link
                      href="/dashboard"
                      className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg text-center transition"
                    >
                      📊
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-2 flex justify-around">
        <Link href="/mobile" className="flex flex-col items-center text-orange-400">
          <span className="text-xl">🔔</span>
          <span className="text-xs">Alerts</span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center text-gray-400 hover:text-white">
          <span className="text-xl">📊</span>
          <span className="text-xs">Dashboard</span>
        </Link>
        <button 
          onClick={fetchData}
          className="flex flex-col items-center text-gray-400 hover:text-white"
        >
          <span className="text-xl">🔄</span>
          <span className="text-xs">Refresh</span>
        </button>
      </nav>
    </div>
  );
}
