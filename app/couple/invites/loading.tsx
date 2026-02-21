export default function InvitesLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Titre */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 bg-gray-100 rounded-xl" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-gray-100 rounded-xl" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>

      {/* Barre de recherche */}
      <div className="h-10 w-80 bg-gray-100 rounded-xl" />

      {/* Tableau */}
      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        <div className="h-12 bg-gray-50 border-b border-gray-100" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-white border-b border-gray-50 last:border-0" />
        ))}
      </div>
    </div>
  )
}
