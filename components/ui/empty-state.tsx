import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center", className)}>
      <div className="h-16 w-16 rounded-full bg-[#E8D4EF] flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-[#6D3478]" />
      </div>
      <h3 className="text-lg font-semibold text-[#0B0E12] mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[#374151] max-w-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

