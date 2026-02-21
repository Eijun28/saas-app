export default function JourJLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Titre */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-60 bg-gray-100 rounded-xl" />
          <div className="h-4 w-72 bg-gray-100 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-10 bg-gray-100 rounded-xl" />
          <div className="h-10 w-40 bg-gray-100 rounded-xl" />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {[80, 64, 96, 64, 80].map((h, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div className="hidden sm:block h-10 w-20 bg-gray-100 rounded-lg flex-shrink-0" />
            <div className="hidden sm:block h-3 w-3 rounded-full bg-gray-100 mt-3.5 flex-shrink-0" />
            <div className="flex-1 rounded-2xl border border-gray-100 bg-white" style={{ height: `${h}px` }} />
          </div>
        ))}
      </div>
    </div>
  )
}
