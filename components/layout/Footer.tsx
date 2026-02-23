'use client'

import Link from 'next/link'
import { Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t py-12 sm:py-16 px-6" style={{ backgroundColor: 'hsl(var(--beige-100))', borderColor: 'hsl(var(--beige-300))' }}>
      <div className="max-w-6xl mx-auto">
        {/* Colonnes principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-10">
          {/* Colonne 1 : Marque */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-extrabold tracking-tight" style={{ color: '#823F91' }}>
              NUPLY
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
              La plateforme premium de planification de mariage multiculturel. Trouvez les prestataires parfaits pour votre jour J.
            </p>
            <Link
              href="https://www.instagram.com/nuply.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-[#6B7280] hover:text-[#823F91] transition-colors duration-200"
              aria-label="Suivez-nous sur Instagram"
            >
              <Instagram className="w-4 h-4" />
              <span>@nuply.fr</span>
            </Link>
          </div>

          {/* Colonne 2 : Plateforme */}
          <div>
            <h3 className="text-sm font-semibold text-[#2C1810] mb-4">Plateforme</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/organisation-mariage" className="text-sm text-[#6B7280] hover:text-[#823F91] transition-colors duration-200">
                  Organisation mariage
                </Link>
              </li>
              <li>
                <Link href="/prestataires-mariage" className="text-sm text-[#6B7280] hover:text-[#823F91] transition-colors duration-200">
                  Prestataires mariage
                </Link>
              </li>
              <li>
                <Link href="/photographe-mariage" className="text-sm text-[#6B7280] hover:text-[#823F91] transition-colors duration-200">
                  Photographe mariage
                </Link>
              </li>
              <li>
                <Link href="/tarifs" className="text-sm text-[#6B7280] hover:text-[#823F91] transition-colors duration-200">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="text-sm text-[#6B7280] hover:text-[#823F91] transition-colors duration-200">
                  Cr&eacute;er un compte
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Ressources */}
          <div>
            <h3 className="text-sm font-semibold text-[#2C1810] mb-4">Ressources</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/blog" className="text-sm text-[#6B7280] hover:text-[#823F91] transition-colors duration-200">
                  Blog mariage
                </Link>
              </li>
              <li>
                <Link href="/blog/guide-preparation-mariage-couples" className="text-sm text-[#6B7280] hover:text-[#823F91] transition-colors duration-200">
                  Guide organisation
                </Link>
              </li>
              <li>
                <Link href="/blog/budget-mariage-comment-economiser" className="text-sm text-[#6B7280] hover:text-[#823F91] transition-colors duration-200">
                  Budget mariage
                </Link>
              </li>
              <li>
                <Link href="/notre-vision" className="text-sm text-[#6B7280] hover:text-[#823F91] transition-colors duration-200">
                  Notre vision
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-[#6B7280] hover:text-[#823F91] transition-colors duration-200">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 4 : L\u00e9gal */}
          <div>
            <h3 className="text-sm font-semibold text-[#2C1810] mb-4">L&eacute;gal</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/legal" className="text-sm text-[#6B7280] hover:text-[#823F91] transition-colors duration-200">
                  Mentions l&eacute;gales
                </Link>
              </li>
              <li>
                <Link href="/cgu" className="text-sm text-[#6B7280] hover:text-[#823F91] transition-colors duration-200">
                  CGU
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-sm text-[#6B7280] hover:text-[#823F91] transition-colors duration-200">
                  Confidentialit&eacute;
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Barre du bas */}
        <div className="border-t pt-6" style={{ borderColor: 'hsl(var(--beige-300))' }}>
          <p className="text-xs text-center text-[#6B7280]">
            &copy; {new Date().getFullYear()} NUPLY. Tous droits r&eacute;serv&eacute;s.
          </p>
        </div>
      </div>
    </footer>
  )
}
