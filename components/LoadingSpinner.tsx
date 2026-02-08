'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        className={`${sizes[size]} border-4 border-orange-200 border-t-orange-500 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-slate-600 dark:text-slate-400 text-sm"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

// Skeleton components for lazy loading
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 animate-pulse">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="flex gap-4">
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        </div>
        
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        
        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <div className="space-y-4">
            <TableSkeleton rows={5} />
          </div>
        </div>
      </div>
    </div>
  );
}
