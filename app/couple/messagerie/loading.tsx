export default function MessagerieLoading() {
  return (
    <div className="w-full h-[calc(100vh-12rem)] flex gap-4 animate-pulse">
      {/* Conversations list */}
      <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-100 flex flex-col gap-2 p-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-50 rounded-xl" />
        ))}
      </div>
      {/* Chat area */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100" />
    </div>
  )
}
