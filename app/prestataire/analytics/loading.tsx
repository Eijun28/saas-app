export default function PrestataireAnalyticsLoading() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-gray-100 rounded-xl" />
          <div className="h-4 w-56 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-gray-100 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="h-4 w-36 bg-gray-100 rounded mb-4" />
          <div className="h-48 bg-gray-50 rounded-xl" />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="h-4 w-36 bg-gray-100 rounded mb-4" />
          <div className="h-48 bg-gray-50 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
