import { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/seo/config'
import LegalPageLayout, { LegalSection, LegalFooterDate } from '@/components/legal/LegalPageLayout'
import { Info, Database, Target, Scale, Share2, Clock, UserCheck, Lock, Cookie, MailX, RefreshCw, Mail } from 'lucide-react'

export const metadata: Metadata = createMetadata({
  title: 'Politique de Confidentialit\u00e9 - NUPLY',
  description: 'Politique de confidentialit\u00e9 et protection des donn\u00e9es personnelles de la plateforme NUPLY. RGPD.',
  keywords: ['politique de confidentialit\u00e9', 'RGPD', 'donn\u00e9es personnelles', 'vie priv\u00e9e'],
  canonical: '/confidentialite',
})

export default function ConfidentialitePage() {
  return (
    <LegalPageLayout title="Politique de Confidentialit&eacute;">
      <LegalSection icon={<Info className="h-4 w-4" />} title="Introduction">
        <p>
          La pr&eacute;sente Politique de Confidentialit&eacute; d&eacute;crit comment <strong>NUPLY</strong> collecte, utilise, stocke et prot&egrave;ge vos donn&eacute;es personnelles conform&eacute;ment au R&egrave;glement G&eacute;n&eacute;ral sur la Protection des Donn&eacute;es (RGPD) et &agrave; la loi Informatique et Libert&eacute;s.
        </p>
        <p>
          <strong>Responsable du traitement :</strong> NUPLY<br />
          <strong>Contact :</strong> <a href="mailto:contact@nuply.fr" className="text-[#823F91] font-medium hover:underline">contact@nuply.fr</a>
        </p>
      </LegalSection>

      <LegalSection icon={<Database className="h-4 w-4" />} title="Donn&eacute;es collect&eacute;es">
        <p>Nous collectons les donn&eacute;es suivantes :</p>

        <p className="font-semibold text-[#2C1810] mt-2">Donn&eacute;es fournies directement</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Inscription :</strong> nom, pr&eacute;nom, adresse email, mot de passe (chiffr&eacute;)</li>
          <li><strong>Profil couple :</strong> date et lieu du mariage, budget, pr&eacute;f&eacute;rences culturelles, services recherch&eacute;s</li>
          <li><strong>Profil prestataire :</strong> nom d&apos;entreprise, type de prestation, zone g&eacute;ographique, tarifs, cultures g&eacute;r&eacute;es, portfolio</li>
          <li><strong>Messages :</strong> contenu des conversations entre utilisateurs</li>
          <li><strong>Devis et factures :</strong> montants, descriptions de prestations</li>
        </ul>

        <p className="font-semibold text-[#2C1810] mt-4">Donn&eacute;es collect&eacute;es automatiquement</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Donn&eacute;es de navigation :</strong> pages visit&eacute;es, dur&eacute;e de visite (via Vercel Analytics, sans cookies)</li>
          <li><strong>Donn&eacute;es techniques :</strong> type de navigateur, appareil, syst&egrave;me d&apos;exploitation</li>
          <li><strong>Cookies de session :</strong> n&eacute;cessaires au fonctionnement de l&apos;authentification</li>
        </ul>
      </LegalSection>

      <LegalSection icon={<Target className="h-4 w-4" />} title="Finalit&eacute;s du traitement">
        <p>Vos donn&eacute;es sont utilis&eacute;es pour :</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>G&eacute;rer votre compte et vous authentifier</li>
          <li>Fournir le service de matching entre couples et prestataires</li>
          <li>Permettre la communication entre utilisateurs via la messagerie</li>
          <li>G&eacute;rer les devis, factures et paiements</li>
          <li>Envoyer des emails transactionnels (confirmations, notifications)</li>
          <li>Envoyer des emails de relance (profil incomplet, inactivit&eacute;)</li>
          <li>Am&eacute;liorer nos services et l&apos;exp&eacute;rience utilisateur</li>
          <li>Assurer la s&eacute;curit&eacute; de la plateforme</li>
        </ul>
      </LegalSection>

      <LegalSection icon={<Scale className="h-4 w-4" />} title="Bases l&eacute;gales du traitement">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Ex&eacute;cution du contrat :</strong> gestion de votre compte, matching, messagerie, devis</li>
          <li><strong>Consentement :</strong> emails marketing et relances</li>
          <li><strong>Int&eacute;r&ecirc;t l&eacute;gitime :</strong> am&eacute;lioration du service, s&eacute;curit&eacute;, analyses statistiques anonymis&eacute;es</li>
          <li><strong>Obligation l&eacute;gale :</strong> conservation des donn&eacute;es de facturation</li>
        </ul>
      </LegalSection>

      <LegalSection icon={<Share2 className="h-4 w-4" />} title="Sous-traitants et destinataires">
        <p>Vos donn&eacute;es peuvent &ecirc;tre partag&eacute;es avec :</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Supabase</strong> (H&eacute;bergement base de donn&eacute;es et authentification) &mdash; UE/US</li>
          <li><strong>Vercel</strong> (H&eacute;bergement de l&apos;application) &mdash; US</li>
          <li><strong>Stripe</strong> (Traitement des paiements) &mdash; US</li>
          <li><strong>Resend</strong> (Envoi d&apos;emails transactionnels) &mdash; US</li>
        </ul>
        <p>
          Tous nos sous-traitants pr&eacute;sentent des garanties suffisantes en mati&egrave;re de protection des donn&eacute;es. Les transferts hors UE sont encadr&eacute;s par des clauses contractuelles types ou le Data Privacy Framework.
        </p>
      </LegalSection>

      <LegalSection icon={<Clock className="h-4 w-4" />} title="Dur&eacute;e de conservation">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Donn&eacute;es de compte :</strong> conserv&eacute;es tant que le compte est actif, puis 3 ans apr&egrave;s suppression</li>
          <li><strong>Messages :</strong> conserv&eacute;s tant que le compte est actif</li>
          <li><strong>Donn&eacute;es de facturation :</strong> 10 ans (obligation l&eacute;gale comptable)</li>
          <li><strong>Logs d&apos;emails :</strong> 1 an</li>
          <li><strong>Donn&eacute;es analytiques :</strong> anonymis&eacute;es, conserv&eacute;es ind&eacute;finiment</li>
        </ul>
      </LegalSection>

      <LegalSection icon={<UserCheck className="h-4 w-4" />} title="Vos droits">
        <p>
          Conform&eacute;ment au RGPD, vous disposez des droits suivants :
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Droit d&apos;acc&egrave;s :</strong> obtenir une copie de vos donn&eacute;es personnelles</li>
          <li><strong>Droit de rectification :</strong> modifier vos donn&eacute;es inexactes ou incompl&egrave;tes</li>
          <li><strong>Droit &agrave; l&apos;effacement :</strong> demander la suppression de vos donn&eacute;es</li>
          <li><strong>Droit &agrave; la portabilit&eacute; :</strong> recevoir vos donn&eacute;es dans un format structur&eacute;</li>
          <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos donn&eacute;es</li>
          <li><strong>Droit &agrave; la limitation :</strong> demander la limitation du traitement</li>
          <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement &agrave; tout moment</li>
        </ul>
        <p>
          Pour exercer vos droits, contactez-nous &agrave; <a href="mailto:contact@nuply.fr" className="text-[#823F91] font-medium hover:underline">contact@nuply.fr</a>. Nous r&eacute;pondrons dans un d&eacute;lai de 30 jours.
        </p>
        <p>
          Vous pouvez &eacute;galement introduire une r&eacute;clamation aupr&egrave;s de la <strong>CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libert&eacute;s) : <a href="https://www.cnil.fr" className="text-[#823F91] font-medium hover:underline" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
        </p>
      </LegalSection>

      <LegalSection icon={<Lock className="h-4 w-4" />} title="S&eacute;curit&eacute;">
        <p>
          Nous mettons en oeuvre des mesures techniques et organisationnelles pour prot&eacute;ger vos donn&eacute;es :
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Chiffrement des donn&eacute;es en transit (HTTPS/TLS)</li>
          <li>Mots de passe hash&eacute;s (bcrypt via Supabase Auth)</li>
          <li>Politiques de s&eacute;curit&eacute; au niveau des lignes (Row Level Security)</li>
          <li>Headers de s&eacute;curit&eacute; HTTP (CSP, HSTS, X-Frame-Options)</li>
          <li>Protection CSRF sur les mutations</li>
          <li>Aucune donn&eacute;e bancaire stock&eacute;e (trait&eacute;e par Stripe)</li>
        </ul>
      </LegalSection>

      <LegalSection icon={<Cookie className="h-4 w-4" />} title="Cookies">
        <p>
          NUPLY utilise uniquement des cookies strictement n&eacute;cessaires au fonctionnement du service (cookies de session d&apos;authentification). Nous n&apos;utilisons pas de cookies publicitaires ni de tra&ccedil;age.
        </p>
        <p>
          Les analyses d&apos;audience sont r&eacute;alis&eacute;es via Vercel Analytics, qui ne d&eacute;pose aucun cookie et respecte la vie priv&eacute;e des utilisateurs.
        </p>
      </LegalSection>

      <LegalSection icon={<MailX className="h-4 w-4" />} title="D&eacute;sinscription des emails">
        <p>
          Vous pouvez vous d&eacute;sinscrire des emails non essentiels (relances, notifications) &agrave; tout moment en cliquant sur le lien de d&eacute;sinscription pr&eacute;sent dans chaque email ou en nous contactant &agrave; <a href="mailto:contact@nuply.fr" className="text-[#823F91] font-medium hover:underline">contact@nuply.fr</a>.
        </p>
      </LegalSection>

      <LegalSection icon={<RefreshCw className="h-4 w-4" />} title="Modifications">
        <p>
          Nous nous r&eacute;servons le droit de modifier cette politique. En cas de modification substantielle, nous vous informerons par email ou via la plateforme.
        </p>
      </LegalSection>

      <LegalSection icon={<Mail className="h-4 w-4" />} title="Contact">
        <p>
          Pour toute question relative &agrave; cette politique de confidentialit&eacute;, contactez-nous via la page <Link href="/contact" className="text-[#823F91] font-medium hover:underline">Contact</Link> ou par email &agrave; <a href="mailto:contact@nuply.fr" className="text-[#823F91] font-medium hover:underline">contact@nuply.fr</a>.
        </p>
      </LegalSection>

      <LegalFooterDate date="8 f&eacute;vrier 2026" />
    </LegalPageLayout>
  )
}
