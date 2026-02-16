'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, FileText, Shield, ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'

const legalPages = [
  { href: '/legal', label: 'Mentions l\u00e9gales', icon: FileText },
  { href: '/cgu', label: 'CGU', icon: ScrollText },
  { href: '/confidentialite', label: 'Confidentialit\u00e9', icon: Shield },
]

interface LegalPageLayoutProps {
  title: string
  children: React.ReactNode
}

export default function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#FBF8F3]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Retour */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#8B7866] hover:text-[#823F91] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour \u00e0 l&apos;accueil
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#823F91] mb-2">
            {title}
          </h1>
        </div>

        {/* Navigation entre pages l\u00e9gales */}
        <div className="flex flex-wrap gap-2 mb-10">
          {legalPages.map((page) => {
            const Icon = page.icon
            const isActive = pathname === page.href
            return (
              <Link
                key={page.href}
                href={page.href}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[#823F91] text-white shadow-md'
                    : 'bg-white text-[#6B7280] hover:bg-[#823F91]/10 hover:text-[#823F91] border border-[#EBE4DA]'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {page.label}
              </Link>
            )
          })}
        </div>

        {/* Contenu */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  )
}

interface LegalSectionProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

export function LegalSection({ icon, title, children }: LegalSectionProps) {
  return (
    <section className="bg-white rounded-2xl border border-[#EBE4DA] shadow-sm p-6 sm:p-8">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#823F91]/10 flex items-center justify-center text-[#823F91]">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-[#2C1810] pt-0.5">{title}</h2>
      </div>
      <div className="text-[#4A3A2E] text-sm sm:text-base leading-relaxed space-y-3 pl-11">
        {children}
      </div>
    </section>
  )
}

export function LegalFooterDate({ date }: { date: string }) {
  return (
    <div className="text-center pt-4">
      <p className="text-xs text-[#8B7866]">
        Derni\u00e8re mise \u00e0 jour : {date}
      </p>
    </div>
  )
}
