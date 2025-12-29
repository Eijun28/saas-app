"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import Link from "next/link";

const faqData = [
  {
    question: "L'IA comprend-elle vraiment ma culture spécifique ?",
    answer:
      "Oui, absolument ! Nuply est entraîné sur des centaines de traditions de mariage : hindou, maghrébin, africain, asiatique, juif, antillais, et toutes leurs variations. Notre algorithme prend en compte les rituels religieux, la langue, les préférences culinaires, les codes vestimentaires et même les petits détails qui comptent vraiment (comme l'importance du henné, du thé, ou de la cérémonie du Nikah). Si vous mélangez plusieurs cultures, c'est encore mieux : c'est notre spécialité.",
  },
  {
    question: "Combien coûte Nuply pour les couples ?",
    answer:
      "Nuply est 100% gratuit pour les couples. Pas de frais cachés, pas d'abonnement surprise. Vous créez votre profil, recevez vos matchs personnalisés, contactez autant de prestataires que vous voulez, et utilisez tous nos outils de planification... gratuitement. Pour toujours. Ce sont les prestataires qui paient un abonnement pour accéder à notre plateforme et rencontrer des couples comme vous.",
  },
  {
    question: "Les prestataires sont-ils vraiment vérifiés ?",
    answer:
      "Absolument. Chaque prestataire passe par notre processus de vérification en 4 étapes : (1) documents professionnels (SIRET, assurance, certifications), (2) portfolio et book photos/vidéos, (3) minimum 3 références clients vérifiées, (4) entretien vidéo pour valider leur expérience avec votre type de cérémonie. On refuse environ 40% des candidatures. Résultat : vous ne voyez que les meilleurs.",
  },
  {
    question: "Combien de temps faut-il pour trouver mes prestataires ?",
    answer:
      "Vous recevez vos premiers matchs en moins de 5 minutes après avoir rempli le questionnaire (qui prend 3 minutes). La plupart de nos couples finalisent leur liste complète de prestataires (photographe, traiteur, DJ, etc.) en moins d'une semaine. À comparer aux 2-3 mois de recherche manuelle en moyenne. Vous gagnez littéralement des semaines.",
  },
  {
    question: "Puis-je utiliser Nuply si je mélange plusieurs cultures ?",
    answer:
      "C'est exactement notre spécialité ! Les mariages fusion sont notre terrain de jeu préféré. Vous voulez un Nikah suivi d'une cérémonie laïque ? Un mariage hindou avec un cocktail français ? Une soirée qui mélange musique africaine et DJ électro ? Dites-nous quelles traditions vous voulez intégrer, et nous trouvons des prestataires qui maîtrisent les deux (ou trois, ou quatre). Beaucoup de nos prestataires sont eux-mêmes multiculturels.",
  },
  {
    question: "Que se passe-t-il si je ne suis pas satisfait d'un match ?",
    answer:
      "Aucun problème. Vous pouvez refuser n'importe quel match en un clic et demander des alternatives. Notre IA apprend de vos préférences à chaque refus et s'améliore. Plus vous swipez, meilleures sont les suggestions. Vous restez 100% en contrôle : on propose, vous disposez. Et vous pouvez contacter autant de prestataires que vous voulez pour comparer.",
  },
  {
    question: "Nuply remplace-t-il un wedding planner ?",
    answer:
      "Non, Nuply est complémentaire à un wedding planner. Nous vous aidons à TROUVER vos prestataires grâce à l'IA et à GÉRER la communication et le budget en ligne, mais nous ne coordonnons pas la logistique le jour J (placement des invités, timing, gestion des imprévus, etc.). Si vous voulez aussi un wedding planner, bonne nouvelle : on peut en matcher un pour vous ! Beaucoup de couples utilisent Nuply + wedding planner.",
  },
  {
    question: "Mes données personnelles sont-elles protégées ?",
    answer:
      "Totalement. Nous sommes conformes RGPD (le règlement européen le plus strict), vos données sont chiffrées de bout en bout, et nous ne vendons ni ne partageons JAMAIS vos informations avec qui que ce soit sans votre consentement explicite. Les prestataires ne voient que ce que vous choisissez de partager. Vous pouvez télécharger ou supprimer toutes vos données à tout moment depuis les paramètres.",
  },
];

export default function FAQ() {
  return (
    <section className="py-20 md:py-28 lg:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0B0E12] mb-4">
            Questions fréquentes
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            On répond à vos questions (avant même que vous les posiez)
          </p>
        </div>

        {/* Accordion FAQ */}
        <Accordion
          type="single"
          collapsible
          defaultValue="item-0"
          className="w-full space-y-4"
        >
          {faqData.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-gray-200 rounded-lg px-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <AccordionTrigger className="text-left font-semibold text-lg text-[#0B0E12] py-6 hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-[#6B7280] text-base leading-relaxed pb-6">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* CTA Post-FAQ */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl md:text-3xl font-semibold text-[#0B0E12] mb-3">
            Vous avez une autre question ?
          </h3>
          <p className="text-lg text-[#6B7280] mb-6">
            Notre équipe répond en moins de 2 heures, même le week-end
          </p>
          <Link href="mailto:support@nuply.com">
            <Button
              size="lg"
              className="bg-[#823F91] hover:bg-[#6D3478] text-white border-0"
            >
              <Mail className="mr-2 h-4 w-4" />
              Contactez notre équipe →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

