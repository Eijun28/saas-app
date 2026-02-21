import { Skeleton } from '@/components/ui/skeleton'

export default function FacturesLoading() {
  return (
    <div className="w-full space-y-6">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  )
}
