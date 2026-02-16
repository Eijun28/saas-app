import { Metadata } from 'next'
import Link from 'next/link'
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/config'
import LegalPageLayout, { LegalSection, LegalFooterDate } from '@/components/legal/LegalPageLayout'
import { Building2, UserCheck, Server, Copyright, ShieldCheck, Cookie, AlertTriangle, Mail } from 'lucide-react'

export const metadata: Metadata = generateSeoMetadata('legal')

export default function LegalPage() {
  return (
    <LegalPageLayout title="Mentions l&eacute;gales">
      <LegalSection icon={<Building2 className="h-4 w-4" />} title="&Eacute;diteur du site">
        <p>
          Le site <strong>nuply.fr</strong> est &eacute;dit&eacute; par la soci&eacute;t&eacute; <strong>NUPLY</strong>.
        </p>
        <p>
          <strong>Informations l&eacute;gales :</strong> En cours d&apos;enregistrement
        </p>
      </LegalSection>

      <LegalSection icon={<UserCheck className="h-4 w-4" />} title="Directeur de publication">
        <p>
          Le directeur de publication est le repr&eacute;sentant l&eacute;gal de la soci&eacute;t&eacute; NUPLY.
        </p>
      </LegalSection>

      <LegalSection icon={<Server className="h-4 w-4" />} title="H&eacute;bergement">
        <p>
          Le site est h&eacute;berg&eacute; par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, &Eacute;tats-Unis.
        </p>
      </LegalSection>

      <LegalSection icon={<Copyright className="h-4 w-4" />} title="Propri&eacute;t&eacute; intellectuelle">
        <p>
          L&apos;ensemble du contenu du site (textes, images, vid&eacute;os, logos, etc.) est la propri&eacute;t&eacute; exclusive de NUPLY, sauf mention contraire. Toute reproduction, m&ecirc;me partielle, est interdite sans autorisation pr&eacute;alable.
        </p>
      </LegalSection>

      <LegalSection icon={<ShieldCheck className="h-4 w-4" />} title="Protection des donn&eacute;es personnelles">
        <p>
          NUPLY s&apos;engage &agrave; prot&eacute;ger la confidentialit&eacute; des donn&eacute;es personnelles collect&eacute;es sur le site. Les donn&eacute;es sont trait&eacute;es conform&eacute;ment &agrave; la r&eacute;glementation en vigueur sur la protection des donn&eacute;es personnelles (RGPD).
        </p>
        <p>
          Consultez notre <Link href="/confidentialite" className="text-[#823F91] font-medium hover:underline">Politique de confidentialit&eacute;</Link> et nos <Link href="/cgu" className="text-[#823F91] font-medium hover:underline">Conditions G&eacute;n&eacute;rales d&apos;Utilisation</Link> pour en savoir plus.
        </p>
        <p>
          Pour toute question concernant le traitement de vos donn&eacute;es personnelles, vous pouvez nous contacter via la page <Link href="/contact" className="text-[#823F91] font-medium hover:underline">Contact</Link>.
        </p>
      </LegalSection>

      <LegalSection icon={<Cookie className="h-4 w-4" />} title="Cookies">
        <p>
          Le site utilise des cookies pour am&eacute;liorer l&apos;exp&eacute;rience utilisateur. En continuant &agrave; naviguer sur le site, vous acceptez l&apos;utilisation de cookies.
        </p>
      </LegalSection>

      <LegalSection icon={<AlertTriangle className="h-4 w-4" />} title="Limitation de responsabilit&eacute;">
        <p>
          NUPLY ne peut &ecirc;tre tenu responsable des dommages directs ou indirects r&eacute;sultant de l&apos;utilisation du site ou de l&apos;impossibilit&eacute; d&apos;y acc&eacute;der.
        </p>
      </LegalSection>

      <LegalSection icon={<Mail className="h-4 w-4" />} title="Contact">
        <p>
          Pour toute question concernant ces mentions l&eacute;gales, vous pouvez nous contacter via la page <Link href="/contact" className="text-[#823F91] font-medium hover:underline">Contact</Link>.
        </p>
      </LegalSection>

      <LegalFooterDate date="16 f&eacute;vrier 2026" />
    </LegalPageLayout>
  )
}
