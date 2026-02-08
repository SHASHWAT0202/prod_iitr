'use client';

import { useState, useEffect, useCallback, Suspense, lazy, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ErrorBoundary, { InlineError } from '@/components/ErrorBoundary';
import LoadingSpinner, { CardSkeleton, StatCardSkeleton, PageSkeleton } from '@/components/LoadingSpinner';

// Lazy load heavy components
const LeadCard = dynamic(() => import('@/components/LeadCard'), {
  loading: () => <CardSkeleton />,
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
  inference?: {
    industry: string;
    inferred_products: string[];
    reason_codes: string[];
    confidence_score: number;
    urgency_level: string;
    suggested_next_action: string;
  };
}

interface Stats {
  totalLeads: number;
  newLeads: number;
  inProgress: number;
  converted: number;
  rejected: number;
  leadsThisWeek: number;
  avgScore: number;
  highPriorityCount: number;
  conversionRate: number;
  sectorDistribution: Record<string, number>;
  regionDistribution: Record<string, number>;
  topProducts: { name: string; count: number }[];
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

// Stats card component - Modern design with gradients and animations
const StatCard = memo(function StatCard({ title, value, change, icon, color, gradient }: { 
  title: string; 
  value: string | number; 
  change?: string; 
  icon: React.ReactNode; 
  color: string;
  gradient?: string;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      {/* Background gradient accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${gradient || 'bg-gradient-to-br from-blue-500/10 to-purple-500/10'} rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500`} />
      
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change.startsWith('+') || change.includes('high') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
              {(change.startsWith('+') || change.includes('rate') || change.includes('high')) && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              )}
              {change}
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
});

// Sector distribution chart - Modern design with colored bars
const SectorChart = memo(function SectorChart({ distribution }: { distribution: Record<string, number> }) {
  const sectors = Object.entries(distribution || {}).sort((a, b) => b[1] - a[1]);
  const total = sectors.reduce((sum, [_, v]) => sum + v, 0) || 1;
  
  const sectorColors = [
    'from-blue-500 to-cyan-400',
    'from-purple-500 to-pink-400',
    'from-orange-500 to-amber-400',
    'from-emerald-500 to-teal-400',
    'from-rose-500 to-red-400',
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-white">Sector Distribution</h3>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </div>
      </div>
      {sectors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <p className="text-sm">No sector data yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sectors.slice(0, 5).map(([sector, value], index) => (
            <div key={sector}>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">{sector}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {Math.round((value / total) * 100)}%
                </span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(value / total) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`h-full bg-gradient-to-r ${sectorColors[index % sectorColors.length]} rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
});

// Top products section - Modern card design with colored badges
const TopProducts = memo(function TopProducts({ products }: { products: { name: string; count: number }[] }) {
  const productColors = [
    { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
    { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
    { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
    { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-white">Top Products</h3>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
        </div>
      </div>
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          <p className="text-sm">No product data yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.slice(0, 5).map((product, i) => {
            const color = productColors[i % productColors.length];
            return (
              <motion.div 
                key={product.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-xl ${color.bg} border ${color.border} transition-all hover:scale-[1.02]`}
              >
                <div className={`w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center font-bold ${color.text}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                    {product.name}
                  </p>
                </div>
                <span className={`px-3 py-1.5 bg-white dark:bg-slate-800 ${color.text} rounded-lg text-sm font-bold shadow-sm`}>
                  {product.count}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
});

// Empty state component - Modern illustration style
const EmptyState = memo(function EmptyState({ onIngest, loading }: { onIngest: () => void; loading: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full flex flex-col items-center justify-center py-16"
    >
      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Leads Yet</h3>
      <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-8">
        Import market signals from news sources, tenders, and business intelligence to discover B2B opportunities.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onIngest}
        disabled={loading}
        className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-semibold flex items-center gap-3 hover:shadow-xl hover:shadow-orange-500/25 transition-all disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            Processing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import Sample Data
          </>
        )}
      </motion.button>
    </motion.div>
  );
});

// Filter tabs component - Modern pill design
const FilterTabs = memo(function FilterTabs({ 
  activeFilter, 
  setActiveFilter, 
  counts 
}: { 
  activeFilter: string; 
  setActiveFilter: (f: string) => void;
  counts: Record<string, number>;
}) {
  const filters = [
    { id: 'all', label: 'All Leads', color: 'from-slate-500 to-slate-600' },
    { id: 'new', label: 'New', color: 'from-blue-500 to-cyan-500' },
    { id: 'in_progress', label: 'In Progress', color: 'from-amber-500 to-orange-500' },
    { id: 'converted', label: 'Converted', color: 'from-emerald-500 to-green-500' },
    { id: 'rejected', label: 'Rejected', color: 'from-rose-500 to-red-500' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl">
      {filters.map(f => (
        <motion.button
          key={f.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveFilter(f.id)}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2
            ${activeFilter === f.id 
              ? `bg-gradient-to-r ${f.color} text-white shadow-lg` 
              : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
            }`}
        >
          {f.label}
          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
            activeFilter === f.id 
              ? 'bg-white/20' 
              : 'bg-slate-200 dark:bg-slate-700'
          }`}>
            {counts[f.id] || 0}
          </span>
        </motion.button>
      ))}
    </div>
  );
});

// Main dashboard component
function DashboardContent() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [userName, setUserName] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings state
  const [settingsData, setSettingsData] = useState({
    fullName: '',
    email: '',
    phone: '+91 98765 43210',
    region: 'North'
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailLeads: true,
    pushNotifications: true,
    weeklyDigest: false,
    statusUpdates: true,
    whatsappAlerts: false
  });
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('light');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Load saved theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
    const savedNotifications = localStorage.getItem('notificationSettings');
    if (savedNotifications) {
      try {
        setNotificationSettings(JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Error loading notification settings');
      }
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    if (themeMode === 'dark') {
      applyTheme(true);
    } else if (themeMode === 'light') {
      applyTheme(false);
    } else {
      // System preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    
    // Save to localStorage
    localStorage.setItem('theme', themeMode);
  }, [themeMode]);

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userType = localStorage.getItem('userType');
    const userStr = localStorage.getItem('user');
    
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    
    // Check if user is org_admin
    setIsOrgAdmin(userType === 'organization');
    
    // Get user name
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || user.email?.split('@')[0] || 'User');
        setSettingsData(prev => ({
          ...prev,
          fullName: user.name || user.email?.split('@')[0] || 'User',
          email: user.email || 'user@hpcl.in'
        }));
      } catch {
        setUserName('User');
      }
    }
  }, [router]);

  // Handle password change
  const handlePasswordChange = async () => {
    setPasswordError('');
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await fetch('/api/users/' + (user?.id || 'current'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          email: user?.email
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update password');
      }
      
      // Success
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Save settings to localStorage
  const handleSaveSettings = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    localStorage.setItem('theme', themeMode);
    localStorage.setItem('userSettings', JSON.stringify(settingsData));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [leadsRes, statsRes, notifyRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/stats'),
        fetch('/api/notify'),
      ]);

      const leadsData = await leadsRes.json();
      const statsData = await statsRes.json();
      const notifyData = await notifyRes.json();

      if (leadsData.ok) setLeads(leadsData.data || []);
      if (statsData.ok) setStats(statsData.data);
      if (notifyData.ok) setNotifications(notifyData.data || []);
    } catch (err: any) {
      setError('Failed to fetch data. Make sure MongoDB is connected.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Ingest new signals
  const handleIngest = async () => {
    setIngesting(true);
    try {
      const res = await fetch('/api/ingest');
      const data = await res.json();
      if (data.ok) {
        await fetchData();
      } else {
        setError(data.error || 'Failed to ingest signals');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIngesting(false);
    }
  };

  // Handle lead actions
  const handleLeadAction = async (leadId: string, action: string) => {
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, action }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Action error:', err);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userType');
    router.push('/');
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    if (activeFilter === 'all') return true;
    return lead.status === activeFilter;
  });

  // Count leads by status
  const counts = {
    all: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    in_progress: leads.filter(l => l.status === 'in_progress').length,
    converted: leads.filter(l => l.status === 'converted').length,
    rejected: leads.filter(l => l.status === 'rejected').length,
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/dashboard" className="flex items-center gap-3">
              <img 
                src="/images.jpg" 
                alt="HPCL" 
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div className="hidden sm:block">
                <h1 className="font-bold text-slate-900 dark:text-white">LeadSense AI</h1>
                <p className="text-xs text-slate-500">Dashboard</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Ingest button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleIngest}
              disabled={ingesting}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {ingesting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span className="hidden sm:inline">Ingesting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <span className="hidden sm:inline">Import Data</span>
                </>
              )}
            </motion.button>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => { setShowNotifications(false); setShowAllNotifications(false); }}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                        {unreadNotifications > 0 && (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                            {unreadNotifications} new
                          </span>
                        )}
                      </div>
                      <div className={`${showAllNotifications ? 'max-h-[60vh]' : 'max-h-80'} overflow-y-auto`}>
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          (showAllNotifications ? notifications : notifications.slice(0, 5)).map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!notif.read ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  notif.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 
                                  notif.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 
                                  notif.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 
                                  'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                }`}>
                                  {notif.type === 'success' ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  ) : notif.type === 'warning' ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                  ) : notif.type === 'error' ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-slate-900 dark:text-white">{notif.title}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{notif.message}</p>
                                </div>
                                {!notif.read && (
                                  <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2" />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 5 && (
                        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                          <button 
                            onClick={() => setShowAllNotifications(!showAllNotifications)}
                            className="w-full text-center text-sm text-orange-600 dark:text-orange-400 hover:underline"
                          >
                            {showAllNotifications ? 'Show less' : `View all notifications (${notifications.length})`}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Admin Dashboard Button - Only for Org Admins */}
            {isOrgAdmin && (
              <Link
                href="/dashboard/org"
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg font-medium text-sm transition-all shadow-md shadow-purple-500/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="hidden sm:inline">Admin Panel</span>
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              title="Logout"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-16" /> {/* Spacer for header */}
          <nav className="p-4 space-y-1">
            {[
              { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>, label: 'Dashboard', filter: 'all' as const },
              { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>, label: 'New Leads', filter: 'new' as const, count: counts.new },
              { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: 'In Progress', filter: 'in_progress' as const, count: counts.in_progress },
              { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: 'Converted', filter: 'converted' as const, count: counts.converted },
              { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>, label: 'Rejected', filter: 'rejected' as const, count: counts.rejected },
            ].map((item) => {
              const isActive = activeFilter === item.filter && !showAnalytics && !showSettings;
              return (
                <button
                  key={item.label}
                  onClick={() => { setActiveFilter(item.filter); setShowAnalytics(false); setShowSettings(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {item.icon}
                  <span className="flex-1 font-medium text-left">{item.label}</span>
                  {item.count !== undefined && (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
            
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => { setShowAnalytics(true); setShowSettings(false); setActiveFilter('all'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  showAnalytics 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <span className="flex-1 font-medium text-left">Analytics</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </button>
              <button
                onClick={() => { setShowSettings(true); setShowAnalytics(false); setActiveFilter('all'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  showSettings 
                    ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg shadow-slate-500/30' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="flex-1 font-medium text-left">Settings</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              
              {/* Admin Panel - Only visible to org admins */}
              {isOrgAdmin && (
                <Link
                  href="/dashboard/org"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 hover:from-purple-500/20 hover:to-blue-500/20 border border-purple-200 dark:border-purple-800 mt-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <span className="flex-1 font-medium">Admin Panel</span>
                  <span className="px-2 py-1 bg-purple-200 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold">
                    Org
                  </span>
                </Link>
              )}
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {showAnalytics ? 'Analytics Dashboard' : showSettings ? 'Settings' : 'Lead Intelligence Dashboard'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {showAnalytics ? 'Comprehensive insights and performance metrics' : showSettings ? 'Manage your account and preferences' : 'AI-powered B2B lead analysis for HPCL Direct Sales'}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </span>
            </motion.div>
          )}

          {/* Settings View */}
          {showSettings ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Success Toast */}
              {settingsSaved && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Settings saved successfully!
                </motion.div>
              )}

              {/* Password Change Modal */}
              {showPasswordModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                  onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Change Password</h3>
                    {passwordError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm"
                      >
                        {passwordError}
                      </motion.div>
                    )}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Password</label>
                        <input 
                          type="password" 
                          placeholder="Enter current password" 
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                        <input 
                          type="password" 
                          placeholder="Enter new password (min 6 characters)" 
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                        <input 
                          type="password" 
                          placeholder="Confirm new password" 
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" 
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button 
                        onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} 
                        className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handlePasswordChange}
                        disabled={passwordLoading}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {passwordLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            Updating...
                          </>
                        ) : 'Update Password'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Active Sessions Modal */}
              {showSessionsModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                  onClick={() => setShowSessionsModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Active Sessions</h3>
                    <div className="space-y-3">
                      {[
                        { device: 'Windows PC - Chrome', location: 'Mumbai, India', current: true, time: 'Active now' },
                        { device: 'iPhone 14 - Safari', location: 'Mumbai, India', current: false, time: '2 hours ago' },
                        { device: 'MacBook Pro - Firefox', location: 'Delhi, India', current: false, time: '1 day ago' },
                      ].map((session, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.current ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-200 dark:bg-slate-600'}`}>
                              <svg className={`w-5 h-5 ${session.current ? 'text-emerald-600' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <div>
                              <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                {session.device}
                                {session.current && <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-2 py-0.5 rounded-full">Current</span>}
                              </p>
                              <p className="text-sm text-slate-500">{session.location} • {session.time}</p>
                            </div>
                          </div>
                          {!session.current && (
                            <button className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors">
                              Revoke
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setShowSessionsModal(false)} className="w-full mt-4 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl font-medium transition-colors">
                      Close
                    </button>
                  </motion.div>
                </motion.div>
              )}

              {/* Profile Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Profile Settings</h3>
                    <p className="text-sm text-slate-500">Manage your personal information</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={settingsData.fullName} 
                      onChange={(e) => setSettingsData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={settingsData.email} 
                      onChange={(e) => setSettingsData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                    <input 
                      type="tel" 
                      value={settingsData.phone} 
                      onChange={(e) => setSettingsData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Region</label>
                    <select 
                      value={settingsData.region}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, region: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Notification Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notification Preferences</h3>
                    <p className="text-sm text-slate-500">Choose how you want to be notified</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'emailLeads', label: 'Email notifications for new leads', desc: 'Get notified when new high-priority leads are detected' },
                    { key: 'pushNotifications', label: 'Push notifications', desc: 'Receive browser push notifications' },
                    { key: 'weeklyDigest', label: 'Weekly digest', desc: 'Get a weekly summary of lead activity' },
                    { key: 'statusUpdates', label: 'Lead status updates', desc: 'Notify when lead status changes' },
                    { key: 'whatsappAlerts', label: 'WhatsApp alerts', desc: 'Receive alerts via WhatsApp' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">{item.label}</p>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                      </div>
                      <button 
                        onClick={() => setNotificationSettings(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                        className={`relative w-12 h-7 rounded-full transition-colors ${notificationSettings[item.key as keyof typeof notificationSettings] ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <motion.span 
                          layout
                          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                          animate={{ left: notificationSettings[item.key as keyof typeof notificationSettings] ? 24 : 4 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Appearance Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h3>
                    <p className="text-sm text-slate-500">Customize the look and feel</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { mode: 'light' as const, label: 'Light', icon: '☀️' },
                    { mode: 'dark' as const, label: 'Dark', icon: '🌙' },
                    { mode: 'system' as const, label: 'System', icon: '💻' },
                  ].map((item) => (
                    <motion.button 
                      key={item.mode} 
                      onClick={() => setThemeMode(item.mode)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${themeMode === item.mode ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'}`}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className={`font-medium ${themeMode === item.mode ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-300'}`}>{item.label}</span>
                      {themeMode === item.mode && (
                        <motion.svg 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }} 
                          className="w-5 h-5 text-orange-500 ml-auto" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </motion.svg>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Security Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Security</h3>
                    <p className="text-sm text-slate-500">Manage your security settings</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">Change Password</p>
                      <p className="text-sm text-slate-500">Update your password regularly</p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowPasswordModal(true)}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-lg text-sm font-medium transition-colors"
                    >
                      Change
                    </motion.button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">Two-Factor Authentication</p>
                      <p className="text-sm text-slate-500">Add an extra layer of security</p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${twoFactorEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'}`}
                    >
                      {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </motion.button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">Active Sessions</p>
                      <p className="text-sm text-slate-500">Manage your logged-in devices</p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowSessionsModal(true)}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-lg text-sm font-medium transition-colors"
                    >
                      View All
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex justify-end gap-4"
              >
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveSettings}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-medium shadow-lg shadow-orange-500/30 hover:shadow-xl transition-all"
                >
                  Save Changes
                </motion.button>
              </motion.div>
            </motion.div>
          ) : showAnalytics ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Analytics Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Total Revenue Potential', value: '₹2.4Cr', change: '+18%', color: 'from-emerald-500 to-teal-600', icon: '₹' },
                  { title: 'Conversion Rate', value: `${stats?.conversionRate || 17}%`, change: '+5%', color: 'from-blue-500 to-indigo-600', icon: '%' },
                  { title: 'Avg. Lead Score', value: `${stats?.avgScore || 72}`, change: '+8pts', color: 'from-purple-500 to-pink-600', icon: '★' },
                  { title: 'Active Campaigns', value: '12', change: '+3', color: 'from-orange-500 to-red-600', icon: '📊' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden group"
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500`} />
                    <div className="relative">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stat.value}</p>
                      <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        {stat.change}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lead Funnel Chart */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Lead Funnel</h3>
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded-full">This Month</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { stage: 'Total Leads', count: stats?.totalLeads || 6, percent: 100, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
                      { stage: 'Qualified', count: Math.round((stats?.totalLeads || 6) * 0.8), percent: 80, color: 'bg-gradient-to-r from-purple-500 to-purple-600' },
                      { stage: 'In Progress', count: stats?.inProgress || 1, percent: 40, color: 'bg-gradient-to-r from-amber-500 to-orange-500' },
                      { stage: 'Converted', count: stats?.converted || 1, percent: 17, color: 'bg-gradient-to-r from-emerald-500 to-green-600' },
                    ].map((item, i) => (
                      <div key={i} className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.stage}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{item.count}</span>
                        </div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percent}%` }}
                            transition={{ duration: 1, delay: i * 0.2, ease: "easeOut" }}
                            className={`h-full ${item.color} rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Weekly Trend Chart */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Weekly Performance</h3>
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-full">+24%</span>
                  </div>
                  <div className="flex items-end justify-between h-48 gap-3">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                      const heights = [45, 65, 50, 80, 95, 70, 55];
                      return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-2">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heights[i]}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                            className={`w-full rounded-t-lg ${i === 4 ? 'bg-gradient-to-t from-orange-500 to-red-500' : 'bg-gradient-to-t from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500'}`}
                          />
                          <span className="text-xs text-slate-500">{day}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Region Performance */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
                >
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Region Performance</h3>
                  <div className="space-y-4">
                    {[
                      { region: 'North', value: 45, color: 'from-blue-500 to-cyan-500' },
                      { region: 'South', value: 30, color: 'from-emerald-500 to-teal-500' },
                      { region: 'East', value: 15, color: 'from-purple-500 to-pink-500' },
                      { region: 'West', value: 10, color: 'from-orange-500 to-red-500' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{item.region}</span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 1, delay: 0.5 + i * 0.15 }}
                            className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Lead Sources Donut */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
                >
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Lead Sources</h3>
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {[
                          { percent: 40, color: '#3b82f6', offset: 0 },
                          { percent: 25, color: '#8b5cf6', offset: 40 },
                          { percent: 20, color: '#f59e0b', offset: 65 },
                          { percent: 15, color: '#10b981', offset: 85 },
                        ].map((segment, i) => (
                          <motion.circle
                            key={i}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={segment.color}
                            strokeWidth="20"
                            strokeDasharray={`${segment.percent * 2.51} 251`}
                            strokeDashoffset={-segment.offset * 2.51}
                            initial={{ strokeDasharray: '0 251' }}
                            animate={{ strokeDasharray: `${segment.percent * 2.51} 251` }}
                            transition={{ duration: 1, delay: 0.6 + i * 0.2 }}
                          />
                        ))}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.totalLeads || 6}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: 'News', color: 'bg-blue-500', percent: 40 },
                      { label: 'Tenders', color: 'bg-purple-500', percent: 25 },
                      { label: 'Social', color: 'bg-amber-500', percent: 20 },
                      { label: 'Direct', color: 'bg-emerald-500', percent: 15 },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-slate-600 dark:text-slate-400">{item.label} ({item.percent}%)</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Top Performing Products */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
                >
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Top Products</h3>
                  <div className="space-y-3">
                    {(stats?.topProducts || [
                      { name: 'HP Diesel - HSD', count: 4 },
                      { name: 'HP Lube - Industrial', count: 3 },
                      { name: 'HP Bitumen', count: 1 },
                      { name: 'HP LPG - Industrial', count: 1 },
                    ]).slice(0, 4).map((product, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + i * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${
                          i === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                          i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                          i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                          'bg-gradient-to-br from-slate-300 to-slate-400'
                        }`}>
                          {i + 1}
                        </span>
                        <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{product.name}</span>
                        <span className="px-2 py-1 bg-white dark:bg-slate-600 rounded-lg text-sm font-bold text-slate-900 dark:text-white shadow-sm">
                          {product.count}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Activity Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { action: 'New lead from Steel Manufacturing sector', time: '2 hours ago', type: 'new', icon: '🆕' },
                    { action: 'Converted: Tata Motors Fleet Deal', time: '5 hours ago', type: 'success', icon: '✅' },
                    { action: 'High priority lead assigned to North team', time: '1 day ago', type: 'assign', icon: '📋' },
                    { action: 'AI inference completed for 12 leads', time: '1 day ago', type: 'ai', icon: '🤖' },
                    { action: 'Weekly report generated', time: '2 days ago', type: 'report', icon: '📊' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.action}</p>
                        <p className="text-xs text-slate-500">{item.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <>
              {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Leads"
              value={stats?.totalLeads || 0}
              change={stats?.leadsThisWeek ? `+${stats.leadsThisWeek} this week` : undefined}
              icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              gradient="bg-gradient-to-br from-blue-500/20 to-cyan-500/10"
            />
            <StatCard
              title="New Leads"
              value={stats?.newLeads || 0}
              change={stats?.highPriorityCount ? `${stats.highPriorityCount} high priority` : undefined}
              icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              gradient="bg-gradient-to-br from-purple-500/20 to-pink-500/10"
            />
            <StatCard
              title="In Progress"
              value={stats?.inProgress || 0}
              icon={<svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              color="bg-gradient-to-br from-amber-500 to-orange-500"
              gradient="bg-gradient-to-br from-amber-500/20 to-yellow-500/10"
            />
            <StatCard
              title="Converted"
              value={stats?.converted || 0}
              change={stats?.conversionRate ? `${stats.conversionRate}% rate` : undefined}
              icon={<svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              color="bg-gradient-to-br from-emerald-500 to-green-600"
              gradient="bg-gradient-to-br from-emerald-500/20 to-teal-500/10"
            />
          </div>

          {/* Analytics row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <SectorChart distribution={stats?.sectorDistribution || {}} />
            <TopProducts products={stats?.topProducts || []} />
          </div>

          {/* Filter tabs */}
          <FilterTabs 
            activeFilter={activeFilter} 
            setActiveFilter={setActiveFilter}
            counts={counts}
          />

          {/* Lead cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredLeads.length === 0 ? (
                <EmptyState onIngest={handleIngest} loading={ingesting} />
              ) : (
                filteredLeads.map((lead, index) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <LeadCard 
                      lead={lead} 
                      onAction={(action) => handleLeadAction(lead.id, action)}
                    />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
            </>
          )}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

// Export with error boundary wrapper
export default function DashboardPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 text-amber-500">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Dashboard Error
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Something went wrong loading the dashboard. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
            >
              Refresh Page
            </button>
          </div>
        </div>
      }
    >
      <Suspense fallback={<PageSkeleton />}>
        <DashboardContent />
      </Suspense>
    </ErrorBoundary>
  );
}
