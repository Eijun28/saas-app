import { Metadata } from 'next'
import Link from 'next/link'
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/config'

export const metadata: Metadata = generateSeoMetadata('legal')

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Retour à l'accueil
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">Mentions légales</h1>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Éditeur du site</h2>
            <p className="text-muted-foreground">
              Le site <strong>nuply.fr</strong> est édité par la société <strong>NUPLY</strong>.
            </p>
            <p className="text-muted-foreground">
              <strong>Informations légales :</strong> En cours d'enregistrement
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Directeur de publication</h2>
            <p className="text-muted-foreground">
              Le directeur de publication est le représentant légal de la société NUPLY.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Hébergement</h2>
            <p className="text-muted-foreground">
              Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Propriété intellectuelle</h2>
            <p className="text-muted-foreground">
              L'ensemble du contenu du site (textes, images, vidéos, logos, etc.) est la propriété exclusive de NUPLY, sauf mention contraire. Toute reproduction, même partielle, est interdite sans autorisation préalable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Protection des données personnelles</h2>
            <p className="text-muted-foreground">
              NUPLY s'engage à protéger la confidentialité des données personnelles collectées sur le site. Les données sont traitées conformément à la réglementation en vigueur sur la protection des données personnelles (RGPD).
            </p>
            <p className="text-muted-foreground">
              Pour toute question concernant le traitement de vos données personnelles, vous pouvez nous contacter via la page <Link href="/contact" className="text-primary hover:underline">Contact</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Cookies</h2>
            <p className="text-muted-foreground">
              Le site utilise des cookies pour améliorer l'expérience utilisateur. En continuant à naviguer sur le site, vous acceptez l'utilisation de cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Limitation de responsabilité</h2>
            <p className="text-muted-foreground">
              NUPLY ne peut être tenu responsable des dommages directs ou indirects résultant de l'utilisation du site ou de l'impossibilité d'y accéder.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question concernant ces mentions légales, vous pouvez nous contacter via la page <Link href="/contact" className="text-primary hover:underline">Contact</Link>.
            </p>
          </section>

          <section className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
