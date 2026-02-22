export default function PrestataireAgendaLoading() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-100 rounded-xl" />
          <div className="h-4 w-56 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-10 w-40 bg-gray-100 rounded-xl" />
      </div>
      <div className="h-14 rounded-xl bg-purple-50" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5">
          <div className="h-4 w-32 bg-gray-100 rounded mb-4" />
          <div className="h-96 bg-gray-50 rounded-xl" />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
          <div className="h-4 w-32 bg-gray-100 rounded" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-50" />
          ))}
        </div>
      </div>
    </div>
  )
}
