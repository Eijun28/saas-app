'use client'

import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

interface UserAvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
}

const statusClasses = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
}

const statusSizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
  xl: 'w-5 h-5',
}

export function UserAvatar({
  src,
  alt,
  fallback,
  size = 'md',
  status,
  className,
}: UserAvatarProps) {
  const statusSize = statusSizeClasses[size]
  const statusColor = status ? statusClasses[status] : ''
  
  const initials = fallback
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={cn('avatar', status && `avatar-${status}`, 'relative inline-block', className)}>
      <div className={cn('rounded-full overflow-hidden bg-[#E5E7EB] text-[#6B7280] flex items-center justify-center', sizeClasses[size])}>
        {src ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : initials ? (
          <span className="font-semibold">{initials}</span>
        ) : (
          <User className="h-1/2 w-1/2" />
        )}
      </div>
      {status && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            statusSize,
            statusColor
          )}
        />
      )}
    </div>
  )
}

