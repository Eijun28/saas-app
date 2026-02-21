export default function RechercheLoading() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      {/* Search bar */}
      <div className="h-12 bg-white rounded-2xl border border-gray-100" />
      {/* Filter chips */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 bg-gray-100 rounded-full" />
        ))}
      </div>
      {/* Provider cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100" />
        ))}
      </div>
    </div>
  )
}
