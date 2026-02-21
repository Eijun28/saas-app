export default function ProfilLoading() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      {/* Profile header */}
      <div className="h-32 bg-white rounded-2xl border border-gray-100" />
      {/* Form sections */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 bg-white rounded-2xl border border-gray-100" />
      ))}
    </div>
  )
}
