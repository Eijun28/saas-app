import type { ReactNode } from 'react'
import Link from 'next/link'

import {
  UserIcon,
  SettingsIcon,
  LogOutIcon
} from 'lucide-react'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

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
  }

  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent 
        className='w-80' 
        align={align || 'end'}
        sideOffset={8}
        alignOffset={-8}
      >
        <DropdownMenuLabel className='flex items-center gap-4 px-4 py-2.5 font-normal'>
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
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild className='px-4 py-2.5 text-base cursor-pointer'>
            <Link href='/prestataire/profil-public' className='flex items-center gap-3 w-full'>
              <UserIcon className='text-foreground size-5' />
              <span>Profil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className='px-4 py-2.5 text-base cursor-pointer' disabled>
            <SettingsIcon className='text-foreground size-5' />
            <span>Options</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          variant='destructive' 
          className='px-4 py-2.5 text-base cursor-pointer'
          onClick={handleLogout}
        >
          <LogOutIcon className='size-5' />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ProfileDropdown

