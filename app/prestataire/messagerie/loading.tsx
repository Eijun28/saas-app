export default function PrestataireMessagerieLoading() {
  return (
    <div className="w-full h-[calc(100vh-120px)] flex gap-4 animate-pulse">
      {/* Sidebar conversations */}
      <div className="w-80 flex-shrink-0 rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
        <div className="h-9 bg-gray-100 rounded-xl" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 p-2">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-3/4 bg-gray-100 rounded" />
              <div className="h-3 w-full bg-gray-50 rounded" />
            </div>
          </div>
        ))}
      </div>
      {/* Main chat area */}
      <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-5 flex flex-col justify-end space-y-3">
        <div className="flex-1 bg-gray-50 rounded-xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
      </div>
    </div>
  )
}
