import { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/seo/config'

export const metadata: Metadata = createMetadata({
  title: "Conditions G\u00e9n\u00e9rales d'Utilisation - NUPLY",
  description: "Conditions g\u00e9n\u00e9rales d'utilisation de la plateforme NUPLY.",
  keywords: ["CGU", "conditions g\u00e9n\u00e9rales", "conditions d'utilisation"],
  canonical: '/cgu',
})

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Retour \u00e0 l&apos;accueil
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">Conditions G\u00e9n\u00e9rales d&apos;Utilisation</h1>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Objet</h2>
            <p className="text-muted-foreground">
              Les pr\u00e9sentes Conditions G\u00e9n\u00e9rales d&apos;Utilisation (ci-apr\u00e8s &laquo; CGU &raquo;) ont pour objet de d\u00e9finir les modalit\u00e9s et conditions d&apos;utilisation de la plateforme <strong>NUPLY</strong> (accessible \u00e0 l&apos;adresse <strong>nuply.fr</strong>), ainsi que les droits et obligations des utilisateurs.
            </p>
            <p className="text-muted-foreground">
              En acc\u00e9dant et en utilisant la plateforme, l&apos;utilisateur accepte sans r\u00e9serve les pr\u00e9sentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description des services</h2>
            <p className="text-muted-foreground">
              NUPLY est une plateforme de mise en relation entre des couples planifiant leur mariage et des prestataires de services de mariage. Elle propose notamment :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Un syst\u00e8me de matching intelligent entre couples et prestataires</li>
              <li>Un outil de gestion de budget de mariage</li>
              <li>Une messagerie int\u00e9gr\u00e9e entre couples et prestataires</li>
              <li>Un syst\u00e8me de gestion de devis et factures</li>
              <li>Un outil de planification (timeline)</li>
              <li>Un syst\u00e8me de collaboration entre les membres du projet de mariage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Inscription et compte utilisateur</h2>
            <p className="text-muted-foreground">
              L&apos;acc\u00e8s \u00e0 certains services n\u00e9cessite la cr\u00e9ation d&apos;un compte utilisateur. L&apos;utilisateur s&apos;engage \u00e0 fournir des informations exactes et \u00e0 les maintenir \u00e0 jour.
            </p>
            <p className="text-muted-foreground">
              Chaque utilisateur est responsable de la confidentialit\u00e9 de ses identifiants de connexion. Toute utilisation du compte est r\u00e9put\u00e9e faite par le titulaire du compte.
            </p>
            <p className="text-muted-foreground">
              Deux types de comptes existent : <strong>Couple</strong> (pour les futurs mari\u00e9s) et <strong>Prestataire</strong> (pour les professionnels du mariage).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Obligations des utilisateurs</h2>
            <p className="text-muted-foreground">L&apos;utilisateur s&apos;engage \u00e0 :</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Utiliser la plateforme conform\u00e9ment \u00e0 sa destination</li>
              <li>Ne pas publier de contenu illicite, diffamatoire, ou portant atteinte aux droits de tiers</li>
              <li>Ne pas tenter d&apos;acc\u00e9der de mani\u00e8re non autoris\u00e9e aux syst\u00e8mes de NUPLY</li>
              <li>Respecter les droits de propri\u00e9t\u00e9 intellectuelle</li>
              <li>Ne pas utiliser la plateforme \u00e0 des fins commerciales non autoris\u00e9es</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Obligations des prestataires</h2>
            <p className="text-muted-foreground">
              Les prestataires inscrits sur la plateforme s&apos;engagent \u00e0 fournir des informations exactes sur leurs services, tarifs et disponibilit\u00e9s. Ils sont responsables du contenu publi\u00e9 sur leur profil et des engagements pris envers les couples via la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Tarification et paiement</h2>
            <p className="text-muted-foreground">
              Certains services de la plateforme sont gratuits, d&apos;autres sont soumis \u00e0 un abonnement payant. Les tarifs en vigueur sont consultables sur la page <Link href="/tarifs" className="text-primary hover:underline">Tarifs</Link>.
            </p>
            <p className="text-muted-foreground">
              Les paiements sont trait\u00e9s de mani\u00e8re s\u00e9curis\u00e9e par notre prestataire de paiement Stripe. NUPLY ne stocke aucune donn\u00e9e bancaire.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Propri\u00e9t\u00e9 intellectuelle</h2>
            <p className="text-muted-foreground">
              L&apos;ensemble des \u00e9l\u00e9ments composant la plateforme (textes, images, logos, logiciels, etc.) est prot\u00e9g\u00e9 par le droit de la propri\u00e9t\u00e9 intellectuelle et appartient \u00e0 NUPLY ou \u00e0 ses partenaires.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Responsabilit\u00e9</h2>
            <p className="text-muted-foreground">
              NUPLY agit en qualit\u00e9 d&apos;interm\u00e9diaire et ne saurait \u00eatre tenue responsable des relations contractuelles entre couples et prestataires. NUPLY ne garantit pas la disponibilit\u00e9, la qualit\u00e9 ou la conformit\u00e9 des prestations propos\u00e9es par les prestataires.
            </p>
            <p className="text-muted-foreground">
              NUPLY s&apos;efforce d&apos;assurer la disponibilit\u00e9 de la plateforme mais ne peut garantir une accessibilit\u00e9 permanente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. R\u00e9siliation</h2>
            <p className="text-muted-foreground">
              L&apos;utilisateur peut \u00e0 tout moment supprimer son compte en contactant le support. NUPLY se r\u00e9serve le droit de suspendre ou supprimer un compte en cas de violation des pr\u00e9sentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Modification des CGU</h2>
            <p className="text-muted-foreground">
              NUPLY se r\u00e9serve le droit de modifier les pr\u00e9sentes CGU \u00e0 tout moment. Les utilisateurs seront inform\u00e9s des modifications par email ou via la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Droit applicable</h2>
            <p className="text-muted-foreground">
              Les pr\u00e9sentes CGU sont r\u00e9gies par le droit fran\u00e7ais. En cas de litige, les parties s&apos;efforceront de trouver une solution amiable. \u00c0 d\u00e9faut, les tribunaux comp\u00e9tents seront ceux du si\u00e8ge social de NUPLY.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question relative aux pr\u00e9sentes CGU, contactez-nous via la page <Link href="/contact" className="text-primary hover:underline">Contact</Link> ou par email \u00e0 <a href="mailto:contact@nuply.fr" className="text-primary hover:underline">contact@nuply.fr</a>.
            </p>
          </section>

          <section className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Derni\u00e8re mise \u00e0 jour : 8 f\u00e9vrier 2026
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
