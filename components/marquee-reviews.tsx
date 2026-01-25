"use client";

import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";

interface ReviewProps {
  name: string;
  initials: string;
  culture: string;
  body: string;
}

const reviews: ReviewProps[] = [
  {
    name: "Sofia & Amine",
    initials: "SA",
    culture: "Marocain",
    body: "Notre mariage fusion marocain-français était un défi. NUPLY nous a aidés à trouver des prestataires spécialisés dans les traditions berbères et la cuisine marocaine authentique. Le Nuply Matching a vraiment compris notre vision multiculturelle.",
  },
  {
    name: "Priya & Lucas",
    initials: "PL",
    culture: "Indien",
    body: "En tant que couple indien-belge, trouver un photographe qui comprenait les rituels hindous et un traiteur capable de préparer un vrai dîner indien semblait impossible. La plateforme nous a connectés avec des experts en 48h.",
  },
  {
    name: "Layla & Thomas",
    initials: "LT",
    culture: "Libanais",
    body: "Le mariage libanais nécessite une attention particulière aux détails culturels. NUPLY a simplifié notre recherche avec des prestataires vérifiés qui maîtrisent les traditions libanaises. Notre zaaffe était parfaite grâce à leurs recommandations.",
  },
  {
    name: "Minh & Élise",
    initials: "MÉ",
    culture: "Vietnamien",
    body: "Organiser une cérémonie du thé vietnamienne en France était notre priorité. L'algorithme de matching nous a proposé des prestataires qui connaissaient non seulement la tradition, mais aussi l'étiquette culturelle. Service exceptionnel.",
  },
  {
    name: "Khadija & Mehdi",
    initials: "KM",
    culture: "Algérien",
    body: "Pour notre henné algérien traditionnel, nous avions besoin de prestataires qui comprenaient l'importance culturelle de chaque étape. NUPLY nous a mis en relation avec une équipe qui a honoré nos traditions avec respect et professionnalisme.",
  },
  {
    name: "Awa & Alexandre",
    initials: "AA",
    culture: "Sénégalais",
    body: "Notre mariage sénégalais-français devait refléter les deux cultures. La qualité du matching nous a permis de trouver un coordinateur spécialisé dans les mariages ouest-africains et un traiteur qui maîtrise la cuisine sénégalaise authentique. Inoubliable.",
  },
];

const ReviewCard = ({
  name,
  culture,
  body,
  initials,
}: {
  name: string;
  culture: string;
  body: string;
  initials: string;
}) => {
  return (
    <figure
      className={cn(
        "relative w-80 h-48 cursor-pointer overflow-hidden rounded-xl border p-4",
        "border-gray-200 bg-white hover:bg-gray-50",
        "flex flex-col"
      )}
    >
      <div className="flex flex-row items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white text-sm font-bold shrink-0">
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <figcaption className="text-sm font-semibold truncate">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-purple-600 truncate">
            {culture}
          </p>
        </div>
      </div>
      <blockquote className="text-sm text-gray-600 leading-relaxed line-clamp-5 flex-1">
        {body}
      </blockquote>
    </figure>
  );
};

export function MarqueeReviews() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Ce qu'ils en disent
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez les témoignages de couples qui ont célébré leur union multiculturelle avec NUPLY
          </p>
        </div>
        
        <div className="relative">
          <Marquee pauseOnHover className="[--duration:40s]">
            {reviews.map((review, idx) => (
              <ReviewCard key={idx} {...review} />
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="[--duration:40s] mt-8">
            {reviews.map((review, idx) => (
              <ReviewCard key={idx} {...review} />
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}

