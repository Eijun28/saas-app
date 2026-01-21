'use client'

import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t py-12 px-6" style={{ backgroundColor: 'hsl(var(--beige-100))', borderColor: 'hsl(var(--beige-300))' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[#6B7280] font-medium">
            © 2026 NUPLY. Tous droits réservés.
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link 
              href="/legal" 
              className="text-[#6B7280] hover:text-[#0B0E12] transition-colors duration-200 font-medium cursor-pointer px-2 py-1 rounded hover:bg-white/50"
            >
              Mentions légales
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <Link 
              href="/contact" 
              className="text-[#6B7280] hover:text-[#0B0E12] transition-colors duration-200 font-medium cursor-pointer px-2 py-1 rounded hover:bg-white/50"
            >
              Contact
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <Link 
              href="https://instagram.com/nuply.fr?igsh=MTY2MDF1dW9yd2F2ZQ==" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B7280] hover:text-[#0B0E12] transition-colors duration-200 cursor-pointer p-2 rounded hover:bg-white/50"
              aria-label="Suivez-nous sur Instagram"
            >
              <Instagram className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

