'use client'

import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

export default function Footer() {
  return (
    <footer className="border-t border-[#d4a8e0] py-12 px-6" style={{ backgroundColor: '#e8c4f0' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[#6B7280] font-medium">
            © 2024 NUPLY. Tous droits réservés.
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link 
              href="/legal" 
              className="text-[#6B7280] hover:text-[#0B0E12] transition-colors duration-200 font-medium"
            >
              Mentions légales
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <Link 
              href="/contact" 
              className="text-[#6B7280] hover:text-[#0B0E12] transition-colors duration-200 font-medium"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

