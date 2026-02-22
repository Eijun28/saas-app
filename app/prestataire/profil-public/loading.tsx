export default function PrestataireProfilPublicLoading() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      {/* Cover + avatar */}
      <div className="relative">
        <div className="h-48 bg-gray-100 rounded-2xl" />
        <div className="absolute -bottom-8 left-6 h-20 w-20 rounded-full bg-gray-200 border-4 border-white" />
      </div>
      <div className="pt-10 space-y-2">
        <div className="h-6 w-48 bg-gray-100 rounded-xl" />
        <div className="h-4 w-32 bg-gray-100 rounded" />
      </div>
      {/* Stats row */}
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-28 bg-white rounded-2xl border border-gray-100" />
        ))}
      </div>
      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-40 bg-white rounded-2xl border border-gray-100" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-48 bg-white rounded-2xl border border-gray-100" />
          <div className="h-32 bg-white rounded-2xl border border-gray-100" />
        </div>
      </div>
    </div>
  )
}
