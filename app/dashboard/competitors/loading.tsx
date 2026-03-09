export default function CompetitorsLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-64 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-32 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-9 w-28 bg-slate-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="h-3 w-16 bg-slate-200 rounded animate-pulse mb-3" />
              <div className="h-8 w-12 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 h-64 animate-pulse" />
            <div className="bg-white rounded-xl p-6 border border-slate-200 h-48 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
