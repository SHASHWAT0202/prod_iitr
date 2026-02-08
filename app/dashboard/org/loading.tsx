export default function OrgDashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-9 w-28 bg-white/10 rounded-lg animate-pulse" />
              <div className="h-9 w-24 bg-white/10 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Title Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                  <div className="h-8 w-12 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Actions Bar Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 h-12 bg-white/10 rounded-xl animate-pulse" />
          <div className="flex gap-3">
            <div className="h-12 w-32 bg-white/10 rounded-xl animate-pulse" />
            <div className="h-12 w-32 bg-white/10 rounded-xl animate-pulse" />
          </div>
          <div className="h-12 w-32 bg-white/10 rounded-xl animate-pulse" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {['User', 'Role', 'Region', 'Performance', 'Status', 'Actions'].map((header, i) => (
                    <th key={i} className="px-6 py-4 text-left">
                      <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[1, 2, 3, 4, 5].map((row) => (
                  <tr key={row}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
                          <div className="h-3 w-36 bg-white/10 rounded animate-pulse" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-16 bg-white/10 rounded-full animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-16 bg-white/10 rounded-full animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse" />
                        <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
