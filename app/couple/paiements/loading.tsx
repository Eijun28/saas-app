export default function PaiementsLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Titre */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-gray-100 rounded-xl" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-10 w-44 bg-gray-100 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 h-24" />
        ))}
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white h-14" />

      {/* Liste */}
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden">
            <div className="h-14 bg-gray-50" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-48 bg-gray-100 rounded" />
              <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
