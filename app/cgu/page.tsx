import { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/seo/config'
import LegalPageLayout, { LegalSection, LegalFooterDate } from '@/components/legal/LegalPageLayout'
import { Target, Layers, UserPlus, Users, Briefcase, CreditCard, Copyright, AlertTriangle, XCircle, RefreshCw, Scale, Mail } from 'lucide-react'

export const metadata: Metadata = createMetadata({
  title: "Conditions G\u00e9n\u00e9rales d'Utilisation - NUPLY",
  description: "Conditions g\u00e9n\u00e9rales d'utilisation de la plateforme NUPLY.",
  keywords: ["CGU", "conditions g\u00e9n\u00e9rales", "conditions d'utilisation"],
  canonical: '/cgu',
})

export default function CGUPage() {
  return (
    <LegalPageLayout title="Conditions G&eacute;n&eacute;rales d&apos;Utilisation">
      <LegalSection icon={<Target className="h-4 w-4" />} title="Objet">
        <p>
          Les pr&eacute;sentes Conditions G&eacute;n&eacute;rales d&apos;Utilisation (ci-apr&egrave;s &laquo; CGU &raquo;) ont pour objet de d&eacute;finir les modalit&eacute;s et conditions d&apos;utilisation de la plateforme <strong>NUPLY</strong> (accessible &agrave; l&apos;adresse <strong>nuply.fr</strong>), ainsi que les droits et obligations des utilisateurs.
        </p>
        <p>
          En acc&eacute;dant et en utilisant la plateforme, l&apos;utilisateur accepte sans r&eacute;serve les pr&eacute;sentes CGU.
        </p>
      </LegalSection>

      <LegalSection icon={<Layers className="h-4 w-4" />} title="Description des services">
        <p>
          NUPLY est une plateforme de mise en relation entre des couples planifiant leur mariage et des prestataires de services de mariage. Elle propose notamment :
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Un syst&egrave;me de matching intelligent entre couples et prestataires</li>
          <li>Un outil de gestion de budget de mariage</li>
          <li>Une messagerie int&eacute;gr&eacute;e entre couples et prestataires</li>
          <li>Un syst&egrave;me de gestion de devis et factures</li>
          <li>Un outil de planification (timeline)</li>
          <li>Un syst&egrave;me de collaboration entre les membres du projet de mariage</li>
        </ul>
      </LegalSection>

      <LegalSection icon={<UserPlus className="h-4 w-4" />} title="Inscription et compte utilisateur">
        <p>
          L&apos;acc&egrave;s &agrave; certains services n&eacute;cessite la cr&eacute;ation d&apos;un compte utilisateur. L&apos;utilisateur s&apos;engage &agrave; fournir des informations exactes et &agrave; les maintenir &agrave; jour.
        </p>
        <p>
          Chaque utilisateur est responsable de la confidentialit&eacute; de ses identifiants de connexion. Toute utilisation du compte est r&eacute;put&eacute;e faite par le titulaire du compte.
        </p>
        <p>
          Deux types de comptes existent : <strong>Couple</strong> (pour les futurs mari&eacute;s) et <strong>Prestataire</strong> (pour les professionnels du mariage).
        </p>
      </LegalSection>

      <LegalSection icon={<Users className="h-4 w-4" />} title="Obligations des utilisateurs">
        <p>L&apos;utilisateur s&apos;engage &agrave; :</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Utiliser la plateforme conform&eacute;ment &agrave; sa destination</li>
          <li>Ne pas publier de contenu illicite, diffamatoire, ou portant atteinte aux droits de tiers</li>
          <li>Ne pas tenter d&apos;acc&eacute;der de mani&egrave;re non autoris&eacute;e aux syst&egrave;mes de NUPLY</li>
          <li>Respecter les droits de propri&eacute;t&eacute; intellectuelle</li>
          <li>Ne pas utiliser la plateforme &agrave; des fins commerciales non autoris&eacute;es</li>
        </ul>
      </LegalSection>

      <LegalSection icon={<Briefcase className="h-4 w-4" />} title="Obligations des prestataires">
        <p>
          Les prestataires inscrits sur la plateforme s&apos;engagent &agrave; fournir des informations exactes sur leurs services, tarifs et disponibilit&eacute;s. Ils sont responsables du contenu publi&eacute; sur leur profil et des engagements pris envers les couples via la plateforme.
        </p>
      </LegalSection>

      <LegalSection icon={<CreditCard className="h-4 w-4" />} title="Tarification et paiement">
        <p>
          Certains services de la plateforme sont gratuits, d&apos;autres sont soumis &agrave; un abonnement payant. Les tarifs en vigueur sont consultables sur la page <Link href="/tarifs" className="text-[#823F91] font-medium hover:underline">Tarifs</Link>.
        </p>
        <p>
          Les paiements sont trait&eacute;s de mani&egrave;re s&eacute;curis&eacute;e par notre prestataire de paiement Stripe. NUPLY ne stocke aucune donn&eacute;e bancaire.
        </p>
      </LegalSection>

      <LegalSection icon={<Copyright className="h-4 w-4" />} title="Propri&eacute;t&eacute; intellectuelle">
        <p>
          L&apos;ensemble des &eacute;l&eacute;ments composant la plateforme (textes, images, logos, logiciels, etc.) est prot&eacute;g&eacute; par le droit de la propri&eacute;t&eacute; intellectuelle et appartient &agrave; NUPLY ou &agrave; ses partenaires.
        </p>
      </LegalSection>

      <LegalSection icon={<AlertTriangle className="h-4 w-4" />} title="Responsabilit&eacute;">
        <p>
          NUPLY agit en qualit&eacute; d&apos;interm&eacute;diaire et ne saurait &ecirc;tre tenue responsable des relations contractuelles entre couples et prestataires. NUPLY ne garantit pas la disponibilit&eacute;, la qualit&eacute; ou la conformit&eacute; des prestations propos&eacute;es par les prestataires.
        </p>
        <p>
          NUPLY s&apos;efforce d&apos;assurer la disponibilit&eacute; de la plateforme mais ne peut garantir une accessibilit&eacute; permanente.
        </p>
      </LegalSection>

      <LegalSection icon={<XCircle className="h-4 w-4" />} title="R&eacute;siliation">
        <p>
          L&apos;utilisateur peut &agrave; tout moment supprimer son compte en contactant le support. NUPLY se r&eacute;serve le droit de suspendre ou supprimer un compte en cas de violation des pr&eacute;sentes CGU.
        </p>
      </LegalSection>

      <LegalSection icon={<RefreshCw className="h-4 w-4" />} title="Modification des CGU">
        <p>
          NUPLY se r&eacute;serve le droit de modifier les pr&eacute;sentes CGU &agrave; tout moment. Les utilisateurs seront inform&eacute;s des modifications par email ou via la plateforme.
        </p>
      </LegalSection>

      <LegalSection icon={<Scale className="h-4 w-4" />} title="Droit applicable">
        <p>
          Les pr&eacute;sentes CGU sont r&eacute;gies par le droit fran&ccedil;ais. En cas de litige, les parties s&apos;efforceront de trouver une solution amiable. &Agrave; d&eacute;faut, les tribunaux comp&eacute;tents seront ceux du si&egrave;ge social de NUPLY.
        </p>
      </LegalSection>

      <LegalSection icon={<Mail className="h-4 w-4" />} title="Contact">
        <p>
          Pour toute question relative aux pr&eacute;sentes CGU, contactez-nous via la page <Link href="/contact" className="text-[#823F91] font-medium hover:underline">Contact</Link> ou par email &agrave; <a href="mailto:contact@nuply.fr" className="text-[#823F91] font-medium hover:underline">contact@nuply.fr</a>.
        </p>
      </LegalSection>

      <LegalFooterDate date="8 f&eacute;vrier 2026" />
    </LegalPageLayout>
  )
}
