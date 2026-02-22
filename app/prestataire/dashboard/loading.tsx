export default function PrestataireDashboardLoading() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      {/* Hero card */}
      <div className="h-28 bg-white rounded-2xl border border-gray-100" />
      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 bg-white rounded-2xl border border-gray-100" />
        ))}
      </div>
      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-56 bg-white rounded-2xl border border-gray-100" />
        <div className="h-56 bg-white rounded-2xl border border-gray-100" />
      </div>
    </div>
  )
}
