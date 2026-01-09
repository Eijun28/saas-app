import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EarlyAdopterBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'compact' | 'full'
  className?: string
  trialEndDate?: string
}

export function EarlyAdopterBadge({ 
  size = 'md', 
  variant = 'compact',
  className,
  trialEndDate 
}: EarlyAdopterBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }
  
  const daysLeft = trialEndDate 
    ? Math.ceil((new Date(trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className={cn(
      'inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold',
      sizeClasses[size],
      className
    )}>
      <Sparkles className="w-4 h-4" />
      {variant === 'full' && (
        <span>
          Early Adopter {daysLeft && daysLeft > 0 && `• ${daysLeft}j restants`}
        </span>
      )}
      {variant === 'compact' && <span>⭐ Founding Member</span>}
    </div>
  )
}
