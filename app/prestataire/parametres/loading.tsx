export default function PrestataireParametresLoading() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-44 bg-gray-100 rounded-xl" />
        <div className="h-4 w-56 bg-gray-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sidebar nav */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-50 rounded-xl" />
          ))}
        </div>
        {/* Main content */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
          <div className="h-5 w-36 bg-gray-100 rounded" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-50 rounded-xl" />
            </div>
          ))}
          <div className="h-10 w-32 bg-purple-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
