'use client';

export default function LeadLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
        
        {/* Score section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-4">
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-600 rounded mb-2" />
            <div className="h-8 w-12 bg-slate-200 dark:bg-slate-600 rounded" />
          </div>
          <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-4">
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-600 rounded mb-2" />
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-600 rounded" />
          </div>
          <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-4">
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-600 rounded mb-2" />
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-600 rounded" />
          </div>
        </div>
        
        {/* Details skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-32 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
        
        {/* Actions skeleton */}
        <div className="flex gap-3 mt-6">
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
