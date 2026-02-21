export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="w-full space-y-5 animate-pulse">
      {/* Page title */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-100 rounded-xl" />
        <div className="h-4 w-72 bg-gray-100 rounded-lg" />
      </div>
      {/* Content rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-32 bg-white rounded-2xl border border-gray-100"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  )
}
