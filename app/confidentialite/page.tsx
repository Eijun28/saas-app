import { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/seo/config'

export const metadata: Metadata = createMetadata({
  title: 'Politique de Confidentialit\u00e9 - NUPLY',
  description: 'Politique de confidentialit\u00e9 et protection des donn\u00e9es personnelles de la plateforme NUPLY. RGPD.',
  keywords: ['politique de confidentialit\u00e9', 'RGPD', 'donn\u00e9es personnelles', 'vie priv\u00e9e'],
  canonical: '/confidentialite',
})

export default function ConfidentialitePage() {
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

        <h1 className="text-4xl font-bold mb-8">Politique de Confidentialit\u00e9</h1>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              La pr\u00e9sente Politique de Confidentialit\u00e9 d\u00e9crit comment <strong>NUPLY</strong> collecte, utilise, stocke et prot\u00e8ge vos donn\u00e9es personnelles conform\u00e9ment au R\u00e8glement G\u00e9n\u00e9ral sur la Protection des Donn\u00e9es (RGPD) et \u00e0 la loi Informatique et Libert\u00e9s.
            </p>
            <p className="text-muted-foreground">
              <strong>Responsable du traitement :</strong> NUPLY<br />
              <strong>Contact :</strong> <a href="mailto:contact@nuply.fr" className="text-primary hover:underline">contact@nuply.fr</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Donn\u00e9es collect\u00e9es</h2>
            <p className="text-muted-foreground">Nous collectons les donn\u00e9es suivantes :</p>

            <h3 className="text-xl font-medium mt-4 mb-2">Donn\u00e9es fournies directement</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Inscription :</strong> nom, pr\u00e9nom, adresse email, mot de passe (chiffr\u00e9)</li>
              <li><strong>Profil couple :</strong> date et lieu du mariage, budget, pr\u00e9f\u00e9rences culturelles, services recherch\u00e9s</li>
              <li><strong>Profil prestataire :</strong> nom d&apos;entreprise, type de prestation, zone g\u00e9ographique, tarifs, cultures g\u00e9r\u00e9es, portfolio</li>
              <li><strong>Messages :</strong> contenu des conversations entre utilisateurs</li>
              <li><strong>Devis et factures :</strong> montants, descriptions de prestations</li>
            </ul>

            <h3 className="text-xl font-medium mt-4 mb-2">Donn\u00e9es collect\u00e9es automatiquement</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Donn\u00e9es de navigation :</strong> pages visit\u00e9es, dur\u00e9e de visite (via Vercel Analytics, sans cookies)</li>
              <li><strong>Donn\u00e9es techniques :</strong> type de navigateur, appareil, syst\u00e8me d&apos;exploitation</li>
              <li><strong>Cookies de session :</strong> n\u00e9cessaires au fonctionnement de l&apos;authentification</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Finalit\u00e9s du traitement</h2>
            <p className="text-muted-foreground">Vos donn\u00e9es sont utilis\u00e9es pour :</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>G\u00e9rer votre compte et vous authentifier</li>
              <li>Fournir le service de matching entre couples et prestataires</li>
              <li>Permettre la communication entre utilisateurs via la messagerie</li>
              <li>G\u00e9rer les devis, factures et paiements</li>
              <li>Envoyer des emails transactionnels (confirmations, notifications)</li>
              <li>Envoyer des emails de relance (profil incomplet, inactivit\u00e9)</li>
              <li>Am\u00e9liorer nos services et l&apos;exp\u00e9rience utilisateur</li>
              <li>Assurer la s\u00e9curit\u00e9 de la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Bases l\u00e9gales du traitement</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Ex\u00e9cution du contrat :</strong> gestion de votre compte, matching, messagerie, devis</li>
              <li><strong>Consentement :</strong> emails marketing et relances</li>
              <li><strong>Int\u00e9r\u00eat l\u00e9gitime :</strong> am\u00e9lioration du service, s\u00e9curit\u00e9, analyses statistiques anonymis\u00e9es</li>
              <li><strong>Obligation l\u00e9gale :</strong> conservation des donn\u00e9es de facturation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Sous-traitants et destinataires</h2>
            <p className="text-muted-foreground">Vos donn\u00e9es peuvent \u00eatre partag\u00e9es avec :</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Supabase</strong> (H\u00e9bergement base de donn\u00e9es et authentification) &mdash; UE/US</li>
              <li><strong>Vercel</strong> (H\u00e9bergement de l&apos;application) &mdash; US</li>
              <li><strong>Stripe</strong> (Traitement des paiements) &mdash; US</li>
              <li><strong>Resend</strong> (Envoi d&apos;emails transactionnels) &mdash; US</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Tous nos sous-traitants pr\u00e9sentent des garanties suffisantes en mati\u00e8re de protection des donn\u00e9es. Les transferts hors UE sont encadr\u00e9s par des clauses contractuelles types ou le Data Privacy Framework.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Dur\u00e9e de conservation</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Donn\u00e9es de compte :</strong> conserv\u00e9es tant que le compte est actif, puis 3 ans apr\u00e8s suppression</li>
              <li><strong>Messages :</strong> conserv\u00e9s tant que le compte est actif</li>
              <li><strong>Donn\u00e9es de facturation :</strong> 10 ans (obligation l\u00e9gale comptable)</li>
              <li><strong>Logs d&apos;emails :</strong> 1 an</li>
              <li><strong>Donn\u00e9es analytiques :</strong> anonymis\u00e9es, conserv\u00e9es ind\u00e9finiment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Vos droits</h2>
            <p className="text-muted-foreground">
              Conform\u00e9ment au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Droit d&apos;acc\u00e8s :</strong> obtenir une copie de vos donn\u00e9es personnelles</li>
              <li><strong>Droit de rectification :</strong> modifier vos donn\u00e9es inexactes ou incompl\u00e8tes</li>
              <li><strong>Droit \u00e0 l&apos;effacement :</strong> demander la suppression de vos donn\u00e9es</li>
              <li><strong>Droit \u00e0 la portabilit\u00e9 :</strong> recevoir vos donn\u00e9es dans un format structur\u00e9</li>
              <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos donn\u00e9es</li>
              <li><strong>Droit \u00e0 la limitation :</strong> demander la limitation du traitement</li>
              <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement \u00e0 tout moment</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Pour exercer vos droits, contactez-nous \u00e0 <a href="mailto:contact@nuply.fr" className="text-primary hover:underline">contact@nuply.fr</a>. Nous r\u00e9pondrons dans un d\u00e9lai de 30 jours.
            </p>
            <p className="text-muted-foreground mt-2">
              Vous pouvez \u00e9galement introduire une r\u00e9clamation aupr\u00e8s de la <strong>CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libert\u00e9s) : <a href="https://www.cnil.fr" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. S\u00e9curit\u00e9</h2>
            <p className="text-muted-foreground">
              Nous mettons en \u0153uvre des mesures techniques et organisationnelles pour prot\u00e9ger vos donn\u00e9es :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Chiffrement des donn\u00e9es en transit (HTTPS/TLS)</li>
              <li>Mots de passe hash\u00e9s (bcrypt via Supabase Auth)</li>
              <li>Politiques de s\u00e9curit\u00e9 au niveau des lignes (Row Level Security)</li>
              <li>Headers de s\u00e9curit\u00e9 HTTP (CSP, HSTS, X-Frame-Options)</li>
              <li>Protection CSRF sur les mutations</li>
              <li>Aucune donn\u00e9e bancaire stock\u00e9e (trait\u00e9e par Stripe)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Cookies</h2>
            <p className="text-muted-foreground">
              NUPLY utilise uniquement des cookies strictement n\u00e9cessaires au fonctionnement du service (cookies de session d&apos;authentification). Nous n&apos;utilisons pas de cookies publicitaires ni de tra\u00e7age.
            </p>
            <p className="text-muted-foreground">
              Les analyses d&apos;audience sont r\u00e9alis\u00e9es via Vercel Analytics, qui ne d\u00e9pose aucun cookie et respecte la vie priv\u00e9e des utilisateurs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. D\u00e9sinscription des emails</h2>
            <p className="text-muted-foreground">
              Vous pouvez vous d\u00e9sinscrire des emails non essentiels (relances, notifications) \u00e0 tout moment en cliquant sur le lien de d\u00e9sinscription pr\u00e9sent dans chaque email ou en nous contactant \u00e0 <a href="mailto:contact@nuply.fr" className="text-primary hover:underline">contact@nuply.fr</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Modifications</h2>
            <p className="text-muted-foreground">
              Nous nous r\u00e9servons le droit de modifier cette politique. En cas de modification substantielle, nous vous informerons par email ou via la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question relative \u00e0 cette politique de confidentialit\u00e9, contactez-nous via la page <Link href="/contact" className="text-primary hover:underline">Contact</Link> ou par email \u00e0 <a href="mailto:contact@nuply.fr" className="text-primary hover:underline">contact@nuply.fr</a>.
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
