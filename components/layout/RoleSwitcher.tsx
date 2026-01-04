'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Users, Store } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function RoleSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const [currentRole, setCurrentRole] = useState<'couple' | 'prestataire'>('couple')

  useEffect(() => {
    if (pathname.startsWith('/prestataire')) {
      setCurrentRole('prestataire')
    } else if (pathname.startsWith('/couple')) {
      setCurrentRole('couple')
    }
  }, [pathname])

  const switchRole = (role: 'couple' | 'prestataire') => {
    setCurrentRole(role)
    localStorage.setItem('nuply-role', role)
    router.push(`/${role}/dashboard`)
  }

  return (
    <div className="flex items-center gap-2 p-1 bg-[#E8D4EF] rounded-lg border border-[#E5E7EB]">
      <button
        onClick={() => switchRole('couple')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm
          ${currentRole === 'couple'
            ? 'bg-[#6D3478] text-white shadow-sm'
            : 'text-[#374151] hover:bg-white/50'
          }
        `}
      >
        <Users className="h-4 w-4" />
        <span>Couple</span>
      </button>
      <button
        onClick={() => switchRole('prestataire')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm
          ${currentRole === 'prestataire'
            ? 'bg-[#6D3478] text-white shadow-sm'
            : 'text-[#374151] hover:bg-white/50'
          }
        `}
      >
        <Store className="h-4 w-4" />
        <span>Prestataire</span>
      </button>
    </div>
  )
}

