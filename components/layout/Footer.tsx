'use client'

import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-400 font-medium">
            © 2024 NUPLY. Tous droits réservés.
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link 
              href="/legal" 
              className="text-gray-400 hover:text-white transition-colors duration-200 font-medium"
            >
              Mentions légales
            </Link>
            <Separator orientation="vertical" className="h-4 bg-gray-800" />
            <Link 
              href="/contact" 
              className="text-gray-400 hover:text-white transition-colors duration-200 font-medium"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

