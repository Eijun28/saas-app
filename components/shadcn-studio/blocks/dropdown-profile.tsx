'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useState } from 'react'

import {
  UserIcon,
  SettingsIcon,
  LogOutIcon
} from 'lucide-react'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useIsMobile } from '@/hooks/use-mobile'

type Props = {
  trigger: ReactNode
  defaultOpen?: boolean
  align?: 'start' | 'center' | 'end'
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
  onLogout?: () => void
}

const ProfileDropdown = ({ trigger, defaultOpen, align = 'end', user, onLogout }: Props) => {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(defaultOpen || false)
  
  const displayName = user?.name || 'Utilisateur'
  const displayEmail = user?.email || ''
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      window.location.href = '/'
    }
    setOpen(false)
  }

  const ProfileContent = () => (
    <>
      <div className='flex items-center gap-4 px-4 py-2.5 font-normal'>
        <div className='relative'>
          <Avatar className='size-10'>
            <AvatarImage src={user?.avatar} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className='ring-card absolute right-0 bottom-0 block size-2 rounded-full bg-green-600 ring-2' />
        </div>
        <div className='flex flex-1 flex-col items-start'>
          <span className='text-foreground text-lg font-semibold'>{displayName}</span>
          <span className='text-muted-foreground text-base'>{displayEmail}</span>
        </div>
      </div>

      <div className='border-t my-2' />

      <div className='space-y-1'>
        <Link 
          href='/prestataire/profil-public' 
          className='flex items-center gap-3 px-4 py-2.5 text-base cursor-pointer rounded-sm hover:bg-accent transition-colors'
          onClick={() => setOpen(false)}
        >
          <UserIcon className='text-foreground size-5' />
          <span>Profil</span>
        </Link>
        <div className='flex items-center gap-3 px-4 py-2.5 text-base cursor-not-allowed opacity-50'>
          <SettingsIcon className='text-foreground size-5' />
          <span>Options</span>
        </div>
      </div>

      <div className='border-t my-2' />

      <button
        onClick={handleLogout}
        className='flex items-center gap-3 px-4 py-2.5 text-base cursor-pointer rounded-sm hover:bg-destructive/10 text-destructive transition-colors w-full text-left'
      >
        <LogOutIcon className='size-5' />
        <span>Déconnexion</span>
      </button>
    </>
  )

  // Mobile : Dialog centré
  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Mon profil</DialogTitle>
          </DialogHeader>
          <ProfileContent />
        </DialogContent>
      </Dialog>
    )
  }

  // Desktop : DropdownMenu
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent 
        className='w-80' 
        align={align || 'end'}
        sideOffset={8}
        alignOffset={-8}
      >
        <DropdownMenuLabel className='p-0'>
          <ProfileContent />
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ProfileDropdown

