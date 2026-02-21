export default function BudgetLoading() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      {/* Budget overview card */}
      <div className="h-40 bg-white rounded-2xl border border-gray-100" />
      {/* Category rows */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100" />
      ))}
    </div>
  )
}
