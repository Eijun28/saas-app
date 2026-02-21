export default function DisponibilitesLoading() {
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

      {/* Bandeau */}
      <div className="h-14 rounded-xl bg-purple-50" />

      {/* Grille */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="h-4 w-40 bg-gray-100 rounded mb-4" />
          <div className="h-64 bg-gray-50 rounded-xl" />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="h-4 w-40 bg-gray-100 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-xl bg-gray-50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
