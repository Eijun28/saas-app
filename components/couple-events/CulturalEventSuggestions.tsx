'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Sparkles } from 'lucide-react'
import type { EventCategory } from '@/types/cultural-events.types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface EventSuggestion {
  title: string
  description: string
  emoji: string
  category?: EventCategory
}

// ─── Cartographie culture / religion → événements suggérés ───────────────────

const CULTURE_EVENTS: Record<string, EventSuggestion[]> = {
  // Cultures maghrébines
  'Marocaine': [
    {
      title: 'Soirée Henné',
      description: "Soirée traditionnelle de henné pour la mariée, avec musique gnaoua, tenues traditionnelles et offrandes de pâtisseries.",
      emoji: '✋',
      category: 'ceremony-cultural',
    },
    {
      title: 'Hammam de la Mariée',
      description: "Rituel de purification et de beauté traditionnel organisé la veille du mariage.",
      emoji: '🛁',
      category: 'fitting',
    },
    {
      title: 'Lila (Nuit de la Mariée)',
      description: "Présentation de la mariée dans ses différentes tenues traditionnelles lors d'une soirée festive.",
      emoji: '👑',
      category: 'party',
    },
  ],
  'Algérienne': [
    {
      title: 'Soirée Henné',
      description: "Nuit de henné avec musique chaâbi et tenue kabyle ou algérienne traditionnelle.",
      emoji: '✋',
      category: 'ceremony-cultural',
    },
    {
      title: 'El Merniye',
      description: "Cérémonie traditionnelle de préparation et d'habillage de la mariée par ses proches.",
      emoji: '🌸',
      category: 'ceremony-cultural',
    },
  ],
  'Tunisienne': [
    {
      title: 'Soirée Henné',
      description: "Soirée de henné avec musique et danses tunisiennes traditionnelles.",
      emoji: '✋',
      category: 'ceremony-cultural',
    },
    {
      title: 'Jlwa',
      description: "Présentation de la mariée dans ses multiples tenues traditionnelles tunisiennes.",
      emoji: '👗',
      category: 'party',
    },
  ],
  // Cultures africaines subsahariennes
  'Sénégalaise': [
    {
      title: 'Cérémonie de la Dot',
      description: "Remise solennelle de la dot à la famille de la mariée, moment central de la culture sénégalaise.",
      emoji: '🎁',
      category: 'ceremony-cultural',
    },
    {
      title: 'Thiouraye',
      description: "Rituel du parfum et de la bénédiction de la mariée par les femmes de sa famille.",
      emoji: '🌿',
      category: 'ceremony-cultural',
    },
  ],
  'Camerounaise': [
    {
      title: 'Cérémonie des Dots',
      description: "Présentation officielle des dons à la famille de la mariée selon les traditions camerounaises.",
      emoji: '🎁',
      category: 'ceremony-cultural',
    },
    {
      title: 'Cérémonie du Pagne',
      description: "Remise des pagnes traditionnels à la mariée et à sa famille lors d'un rassemblement festif.",
      emoji: '👘',
      category: 'ceremony-cultural',
    },
  ],
  'Ivoirienne': [
    {
      title: 'Cérémonie de Dot',
      description: "Cérémonie traditionnelle de présentation des dons et officialisation de l'union devant les familles.",
      emoji: '🎁',
      category: 'ceremony-cultural',
    },
    {
      title: 'Nuit de la Fiancée',
      description: "Célébration traditionnelle ivoirienne en l'honneur de la future mariée, organisée par sa famille.",
      emoji: '🌙',
      category: 'party',
    },
  ],
  // Cultures asiatiques
  'Indienne': [
    {
      title: 'Mehndi (Henné Indien)',
      description: "Soirée de henné indien pour la mariée avec musique bollywood, danses et décoration florale.",
      emoji: '✋',
      category: 'ceremony-cultural',
    },
    {
      title: 'Sangeet',
      description: "Soirée musicale et dansée réunissant les deux familles avant le mariage, avec performances et chants.",
      emoji: '🎵',
      category: 'party',
    },
    {
      title: 'Haldi',
      description: "Cérémonie du curcuma appliqué sur les mariés pour purifier la peau et apporter la chance.",
      emoji: '💛',
      category: 'ceremony-cultural',
    },
    {
      title: 'Baraat',
      description: "Cortège festif et musical du marié jusqu'au lieu de la cérémonie, souvent en calèche ou à cheval.",
      emoji: '🐘',
      category: 'ceremony-cultural',
    },
  ],
  'Pakistanaise': [
    {
      title: 'Mehndi',
      description: "Soirée traditionnelle de henné avec musique et danses pakistanaises, organisée la veille du nikah.",
      emoji: '✋',
      category: 'ceremony-cultural',
    },
    {
      title: 'Baraat',
      description: "Procession festive du marié et de sa famille jusqu'à la maison de la mariée.",
      emoji: '🎺',
      category: 'ceremony-cultural',
    },
    {
      title: 'Walima',
      description: "Banquet de mariage islamique célébrant l'union après le nikah, offert par la famille du marié.",
      emoji: '🍽️',
      category: 'dinner',
    },
  ],
  // Cultures moyen-orientales
  'Turque': [
    {
      title: 'Kına Gecesi',
      description: "Soirée du henné turque avec chants traditionnels, danses et coutumes spécifiques à chaque région.",
      emoji: '✋',
      category: 'ceremony-cultural',
    },
    {
      title: 'Gelin Alma',
      description: "Cérémonie d'accueil de la mariée chez son futur époux, avec musique et procession.",
      emoji: '🚪',
      category: 'ceremony-cultural',
    },
  ],
  'Libanaise': [
    {
      title: 'Soirée Henné',
      description: "Soirée de henné avec dabké libanaise et musique traditionnelle orientale.",
      emoji: '✋',
      category: 'ceremony-cultural',
    },
    {
      title: 'Zaffe',
      description: "Entrée spectaculaire des mariés avec percussionnistes, danseurs et torches enflammées.",
      emoji: '🥁',
      category: 'party',
    },
  ],
  'Syrienne': [
    {
      title: 'Zaffe',
      description: "Procession festive et musicale d'entrée des mariés avec zurna et derbouka.",
      emoji: '🎺',
      category: 'party',
    },
    {
      title: 'Soirée Henné',
      description: "Soirée de henné traditionnelle syrienne avec musique et pâtisseries orientales.",
      emoji: '✋',
      category: 'ceremony-cultural',
    },
  ],
  // Cultures européennes
  'Italienne': [
    {
      title: 'Pranzo Pre-Nuziale',
      description: "Repas de famille traditionnel la veille du mariage, rassemblant les deux familles.",
      emoji: '🍝',
      category: 'dinner',
    },
    {
      title: 'Serenata',
      description: "Sérénade romantique du marié sous les fenêtres de la mariée la veille de la cérémonie.",
      emoji: '🎸',
      category: 'party',
    },
  ],
  'Portugaise': [
    {
      title: 'Despedida de Solteiro/a',
      description: "EVJF/EVG traditionnel portugais, festif et déguisé, organisé par les amis.",
      emoji: '🎉',
      category: 'party',
    },
  ],
  'Espagnole': [
    {
      title: 'Despedida de Soltero/a',
      description: "Enterrement de vie de célibataire à l'espagnole, animé et festif avec déguisements.",
      emoji: '💃',
      category: 'party',
    },
  ],
  'Française': [
    {
      title: "Vin d'Honneur",
      description: "Cocktail traditionnel après la cérémonie pour accueillir tous les invités dans une ambiance détendue.",
      emoji: '🥂',
      category: 'cocktail',
    },
    {
      title: 'EVJF / EVG',
      description: "Enterrement de vie de célibataire pour les futurs mariés, moment convivial entre amis.",
      emoji: '🎉',
      category: 'party',
    },
  ],
}

const RELIGION_EVENTS: Record<string, EventSuggestion[]> = {
  'Musulman': [
    {
      title: 'Nikah',
      description: "Cérémonie islamique du mariage avec lecture du Coran, signature du contrat et présence du wali.",
      emoji: '📖',
      category: 'ceremony-religious',
    },
    {
      title: 'Walima',
      description: "Banquet de mariage islamique offert par la famille du marié pour célébrer l'union selon la Sunna.",
      emoji: '🍽️',
      category: 'dinner',
    },
  ],
  'Catholique': [
    {
      title: 'Messe de Mariage',
      description: "Cérémonie religieuse catholique à l'église avec échange des consentements et bénédiction nuptiale.",
      emoji: '⛪',
      category: 'ceremony-religious',
    },
  ],
  'Chrétien': [
    {
      title: 'Cérémonie Religieuse',
      description: "Célébration chrétienne du mariage à l'église avec prières, lectures bibliques et bénédiction des mariés.",
      emoji: '✝️',
      category: 'ceremony-religious',
    },
  ],
  'Protestant': [
    {
      title: 'Culte de Mariage',
      description: "Cérémonie protestante avec sermon, chants, prières et échange des vœux devant la communauté.",
      emoji: '✝️',
      category: 'ceremony-religious',
    },
  ],
  'Orthodoxe': [
    {
      title: 'Couronnement Orthodoxe',
      description: "Rite byzantin du couronnement des époux, symbolisant leur royauté dans le Royaume du Christ.",
      emoji: '👑',
      category: 'ceremony-religious',
    },
  ],
  'Juif': [
    {
      title: 'Huppah',
      description: "Cérémonie sous le dais nuptial avec bénédictions rabbiniques, vin et bris symbolique du verre.",
      emoji: '🕍',
      category: 'ceremony-religious',
    },
    {
      title: 'Bedeken',
      description: "Voilement solennel de la mariée par le marié avant la cérémonie, selon la tradition ashkénaze.",
      emoji: '💍',
      category: 'ceremony-religious',
    },
    {
      title: 'Tisch',
      description: "Réunion festive du marié et de ses proches avec étude de Torah avant la cérémonie.",
      emoji: '📜',
      category: 'party',
    },
  ],
  'Hindou': [
    {
      title: 'Ganesh Puja',
      description: "Prière d'invocation de Ganesh pour un mariage auspicieux et exempt d'obstacles.",
      emoji: '🐘',
      category: 'ceremony-religious',
    },
    {
      title: 'Saptapadi',
      description: "Les 7 pas sacrés autour du feu symbolisant les vœux du couple dans le rite hindou.",
      emoji: '👣',
      category: 'ceremony-religious',
    },
  ],
  'Bouddhiste': [
    {
      title: 'Cérémonie Bouddhiste',
      description: "Bénédiction du couple par des moines avec récitation de sutras et offrandes au temple.",
      emoji: '🙏',
      category: 'ceremony-religious',
    },
  ],
}

// Suggestions universelles
const UNIVERSAL_EVENTS: EventSuggestion[] = [
  {
    title: 'Cérémonie Civile',
    description: "Mariage officiel à la mairie avec échange des consentements devant l'officier d'état civil.",
    emoji: '🏛️',
    category: 'ceremony-civil',
  },
  {
    title: 'Cocktail de Bienvenue',
    description: "Moment convivial entre la cérémonie et le dîner pour accueillir et réunir tous les invités.",
    emoji: '🥂',
    category: 'cocktail',
  },
  {
    title: 'Grand Dîner de Mariage',
    description: "Réception principale avec repas, animations, discours et soirée dansante.",
    emoji: '🍽️',
    category: 'dinner',
  },
  {
    title: 'Brunch du Lendemain',
    description: "Repas décontracté organisé le lendemain du mariage pour prolonger la célébration.",
    emoji: '☕',
    category: 'dinner',
  },
]

// ─── Composant ────────────────────────────────────────────────────────────────

interface CulturalEventSuggestionsProps {
  cultures:  string[]
  religions: string[]
  onSelect:  (title: string, description: string, category?: EventCategory) => void
}

export function CulturalEventSuggestions({ cultures, religions, onSelect }: CulturalEventSuggestionsProps) {
  const suggestions = useMemo(() => {
    const seen   = new Set<string>()
    const result: EventSuggestion[] = []

    // 1. Événements spécifiques aux cultures
    for (const culture of cultures) {
      for (const event of CULTURE_EVENTS[culture] ?? []) {
        if (!seen.has(event.title)) {
          seen.add(event.title)
          result.push(event)
        }
      }
    }

    // 2. Événements spécifiques aux religions
    for (const religion of religions) {
      for (const event of RELIGION_EVENTS[religion] ?? []) {
        if (!seen.has(event.title)) {
          seen.add(event.title)
          result.push(event)
        }
      }
    }

    // 3. Universels
    if (result.length === 0) {
      for (const event of UNIVERSAL_EVENTS) {
        if (!seen.has(event.title)) {
          seen.add(event.title)
          result.push(event)
        }
      }
    } else {
      const cocktail = UNIVERSAL_EVENTS.find(e => e.title === 'Cocktail de Bienvenue')
      if (cocktail && !seen.has(cocktail.title)) result.push(cocktail)
    }

    return result
  }, [cultures, religions])

  if (suggestions.length === 0) return null

  const hasCultures = cultures.length > 0 || religions.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-[#823F91]" />
        <h3 className="text-sm font-semibold text-gray-700">
          {hasCultures
            ? `Événements suggérés pour votre mariage · ${[...cultures, ...religions].join(', ')}`
            : 'Événements classiques pour votre mariage'}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((event, i) => (
          <motion.button
            key={event.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            onClick={() => onSelect(event.title, event.description, event.category)}
            className="group text-left p-4 rounded-xl border border-purple-100/80 bg-gradient-to-br from-purple-50/60 to-pink-50/40 hover:from-purple-100/60 hover:to-pink-100/40 hover:border-purple-200 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#823F91]/30"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{event.emoji}</span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gray-800 group-hover:text-[#823F91] transition-colors leading-snug">
                  {event.title}
                </p>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-1 text-[11px] text-[#823F91] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus className="h-3 w-3" />
              Ajouter cet événement
            </div>
          </motion.button>
        ))}
      </div>

      <p className="mt-2 text-[11px] text-gray-400">
        Cliquez sur une suggestion pour pré-remplir le formulaire. Vous pouvez modifier tous les détails.
      </p>
    </motion.div>
  )
}
