'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface HeaderProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export default function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const [isIngesting, setIsIngesting] = useState(false);
  const [user, setUser] = useState<'sales' | 'manager'>('sales');

  const handleIngest = async () => {
    setIsIngesting(true);
    try {
      const res = await fetch('/api/ingest');
      const data = await res.json();
      if (data.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error('Ingest failed:', e);
    }
    setIsIngesting(false);
  };

  const toggleRole = () => {
    setUser(u => (u === 'sales' ? 'manager' : 'sales'));
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-4">
        {/* Menu toggle for mobile */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            HPCL Lead Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            AI-powered B2B Sales Assistant
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Ingest button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleIngest}
          disabled={isIngesting}
          className="btn btn-primary text-sm"
        >
          {isIngesting ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Ingesting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Ingest Signals
            </>
          )}
        </motion.button>

        {/* Notifications bell */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User avatar with role toggle */}
        <button
          onClick={toggleRole}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${user === 'manager' ? 'bg-purple-600' : 'bg-blue-600'}`}>
            {user === 'manager' ? 'PS' : 'RK'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              {user === 'manager' ? 'Priya Sharma' : 'Rajesh Kumar'}
            </div>
            <div className="text-xs text-slate-500 capitalize">{user === 'manager' ? 'Manager' : 'Sales Officer'}</div>
          </div>
        </button>
      </div>
    </header>
  );
}
