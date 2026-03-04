export default function ServicesLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-56 bg-gray-100 rounded-xl" />
        <div className="h-4 w-80 bg-gray-100 rounded-lg" />
      </div>
      <div className="h-10 w-40 bg-gray-100 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-44 bg-white rounded-2xl border border-gray-100" />
        ))}
      </div>
    </div>
  )
}
