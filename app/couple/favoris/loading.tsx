export default function FavorisLoading() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      <div className="h-7 w-40 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100" />
        ))}
      </div>
    </div>
  )
}
