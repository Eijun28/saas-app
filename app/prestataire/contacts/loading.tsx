export default function ContactsLoading() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-52 bg-gray-100 rounded-xl" />
        <div className="h-4 w-64 bg-gray-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100" />
        ))}
      </div>
      <div className="h-10 w-full bg-gray-100 rounded-lg" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100" />
        ))}
      </div>
    </div>
  )
}
