/**
 * Événements culturels/religieux prédéfinis par catégorie de culture.
 * Sert de source côté client pour les suggestions d'événements
 * en fonction de la culture du couple.
 */

export interface CulturalEventDefinition {
  slug: string
  label: string
  description: string
  icon: string
  displayOrder: number
}

export interface CultureEventGroup {
  cultureCategoryId: string
  cultureLabel: string
  events: CulturalEventDefinition[]
}

export const CULTURAL_EVENTS_BY_CULTURE: CultureEventGroup[] = [
  {
    cultureCategoryId: 'maghrebin',
    cultureLabel: 'Maghrébin',
    events: [
      { slug: 'henne', label: 'Henné', description: 'Cérémonie traditionnelle de décoration au henné', icon: 'paintbrush', displayOrder: 1 },
      { slug: 'khotba', label: 'Khotba', description: 'Cérémonie de demande en mariage traditionnelle', icon: 'scroll', displayOrder: 2 },
      { slug: 'hammam-mariee', label: 'Hammam de la mariée', description: 'Rituel de purification au hammam avant le mariage', icon: 'sparkles', displayOrder: 3 },
      { slug: 'aaqd', label: 'Aaqd / Fatiha', description: 'Cérémonie religieuse islamique du contrat de mariage', icon: 'book-open', displayOrder: 4 },
      { slug: 'amariya', label: 'Amariya', description: 'Cérémonie du trône / portage de la mariée', icon: 'crown', displayOrder: 5 },
      { slug: 'waada', label: 'Waada', description: 'Rencontre officielle des deux familles', icon: 'users', displayOrder: 6 },
    ],
  },
  {
    cultureCategoryId: 'indien',
    cultureLabel: 'Indien',
    events: [
      { slug: 'sangeet', label: 'Sangeet', description: 'Soirée musicale et dansante pré-mariage', icon: 'music', displayOrder: 1 },
      { slug: 'mehndi', label: 'Mehndi', description: 'Cérémonie de décoration au henné indien', icon: 'paintbrush', displayOrder: 2 },
      { slug: 'haldi', label: 'Haldi', description: 'Cérémonie de pâte de curcuma pour purifier les mariés', icon: 'sun', displayOrder: 3 },
      { slug: 'baraat', label: 'Baraat', description: 'Procession du marié vers le lieu de cérémonie', icon: 'party-popper', displayOrder: 4 },
      { slug: 'mandap', label: 'Mandap / Vivah', description: 'Cérémonie de mariage hindou sous le mandap sacré', icon: 'flame', displayOrder: 5 },
      { slug: 'reception-indienne', label: 'Réception indienne', description: 'Grande réception post-cérémonie', icon: 'utensils-crossed', displayOrder: 6 },
    ],
  },
  {
    cultureCategoryId: 'pakistanais',
    cultureLabel: 'Pakistanais',
    events: [
      { slug: 'dholki', label: 'Dholki', description: 'Soirée musicale pré-mariage avec percussions', icon: 'music', displayOrder: 1 },
      { slug: 'mayun', label: 'Mayun', description: 'Cérémonie de réclusion de la mariée avec pâte de curcuma', icon: 'sparkles', displayOrder: 2 },
      { slug: 'nikah', label: 'Nikah', description: 'Cérémonie de mariage islamique', icon: 'book-open', displayOrder: 3 },
      { slug: 'valima', label: 'Valima', description: 'Réception de mariage offerte par la famille du marié', icon: 'utensils-crossed', displayOrder: 4 },
      { slug: 'rukhsati', label: 'Rukhsati', description: 'Cérémonie de départ de la mariée vers son nouveau foyer', icon: 'heart', displayOrder: 5 },
    ],
  },
  {
    cultureCategoryId: 'turc',
    cultureLabel: 'Turc',
    events: [
      { slug: 'kina-gecesi', label: 'Kına Gecesi', description: 'Nuit du henné turque, cérémonie traditionnelle de la mariée', icon: 'paintbrush', displayOrder: 1 },
      { slug: 'soez-kesme', label: 'Söz Kesme', description: 'Cérémonie officielle de fiançailles turque', icon: 'gem', displayOrder: 2 },
      { slug: 'dugun', label: 'Düğün', description: 'Grande cérémonie de mariage turque', icon: 'party-popper', displayOrder: 3 },
    ],
  },
  {
    cultureCategoryId: 'africain',
    cultureLabel: 'Africain',
    events: [
      { slug: 'dot', label: 'Dot / Bride Price', description: 'Cérémonie de la dot traditionnelle africaine', icon: 'gift', displayOrder: 1 },
      { slug: 'ceremonie-traditionnelle-africaine', label: 'Cérémonie traditionnelle', description: 'Rites coutumiers du mariage africain', icon: 'crown', displayOrder: 2 },
      { slug: 'soiree-griot', label: 'Soirée Griot', description: 'Soirée de célébration avec griot/djeli', icon: 'music', displayOrder: 3 },
      { slug: 'introduction-familiale', label: 'Introduction familiale', description: 'Présentation officielle aux familles', icon: 'users', displayOrder: 4 },
    ],
  },
  {
    cultureCategoryId: 'antillais',
    cultureLabel: 'Antillais',
    events: [
      { slug: 'ti-punch-ceremony', label: 'Cérémonie Ti-Punch', description: 'Cérémonie conviviale antillaise de célébration', icon: 'wine', displayOrder: 1 },
      { slug: 'soiree-zouk', label: 'Soirée Zouk / Kompa', description: 'Soirée dansante antillaise pré-mariage', icon: 'music', displayOrder: 2 },
    ],
  },
  {
    cultureCategoryId: 'asiatique',
    cultureLabel: 'Asiatique',
    events: [
      { slug: 'ceremonie-the', label: 'Cérémonie du thé', description: 'Cérémonie traditionnelle de respect aux aînés', icon: 'coffee', displayOrder: 1 },
      { slug: 'guo-da-li', label: 'Guo Da Li', description: 'Cérémonie chinoise de cadeaux pré-mariage du marié', icon: 'gift', displayOrder: 2 },
      { slug: 'an-hoi', label: 'An Hỏi', description: 'Cérémonie vietnamienne de fiançailles', icon: 'gift', displayOrder: 3 },
    ],
  },
  {
    cultureCategoryId: 'moyen-orient',
    cultureLabel: 'Moyen-Orient',
    events: [
      { slug: 'zaffa', label: 'Zaffa', description: 'Procession musicale traditionnelle vers le mariage', icon: 'music', displayOrder: 1 },
      { slug: 'katb-el-kitab', label: 'Katb El-Kitab', description: 'Signature religieuse du contrat de mariage', icon: 'file-text', displayOrder: 2 },
      { slug: 'henne-oriental', label: 'Henné oriental', description: 'Soirée de henné avant le mariage', icon: 'paintbrush', displayOrder: 3 },
    ],
  },
  {
    cultureCategoryId: 'europeen',
    cultureLabel: 'Européen',
    events: [
      { slug: 'repetition-diner', label: 'Dîner de répétition', description: 'Dîner de répétition la veille du mariage', icon: 'utensils-crossed', displayOrder: 1 },
      { slug: 'evjf-evg', label: 'EVJF / EVG', description: 'Enterrement de vie de jeune fille ou garçon', icon: 'party-popper', displayOrder: 2 },
    ],
  },
  {
    cultureCategoryId: 'amerique-latine',
    cultureLabel: 'Amérique latine',
    events: [
      { slug: 'despedida-de-soltera', label: 'Despedida de Soltera', description: 'Fête de célibataire latino-américaine', icon: 'party-popper', displayOrder: 1 },
      { slug: 'pedida-de-mano', label: 'Pedida de Mano', description: 'Cérémonie de demande en mariage officielle', icon: 'gem', displayOrder: 2 },
    ],
  },
  {
    cultureCategoryId: 'universel',
    cultureLabel: 'Universel',
    events: [
      { slug: 'ceremonie-civile', label: 'Cérémonie civile', description: 'Mariage civil à la mairie', icon: 'building-2', displayOrder: 1 },
      { slug: 'ceremonie-religieuse', label: 'Cérémonie religieuse', description: 'Cérémonie religieuse (église, mosquée, synagogue, temple)', icon: 'church', displayOrder: 2 },
      { slug: 'reception', label: 'Réception / Fête', description: 'Réception principale du mariage', icon: 'party-popper', displayOrder: 3 },
      { slug: 'brunch-lendemain', label: 'Brunch du lendemain', description: 'Brunch post-mariage avec les proches', icon: 'coffee', displayOrder: 4 },
    ],
  },
]

/**
 * Récupère les événements suggérés pour une ou plusieurs catégories culturelles.
 * Inclut toujours les événements universels.
 */
export function getSuggestedEvents(cultureCategoryIds: string[]): CulturalEventDefinition[] {
  const events: CulturalEventDefinition[] = []
  const seen = new Set<string>()

  const allIds = [...cultureCategoryIds, 'universel']

  for (const group of CULTURAL_EVENTS_BY_CULTURE) {
    if (allIds.includes(group.cultureCategoryId)) {
      for (const event of group.events) {
        if (!seen.has(event.slug)) {
          seen.add(event.slug)
          events.push(event)
        }
      }
    }
  }

  return events
}

/** Récupère tous les groupes d'événements culturels */
export function getAllCulturalEventGroups(): CultureEventGroup[] {
  return CULTURAL_EVENTS_BY_CULTURE
}

/** Trouve la définition d'un événement par son slug */
export function getCulturalEventBySlug(slug: string): CulturalEventDefinition | undefined {
  for (const group of CULTURAL_EVENTS_BY_CULTURE) {
    const found = group.events.find(e => e.slug === slug)
    if (found) return found
  }
  return undefined
}

/** Récupère le groupe culturel pour un slug d'événement donné */
export function getCultureGroupForEvent(eventSlug: string): CultureEventGroup | undefined {
  return CULTURAL_EVENTS_BY_CULTURE.find(group =>
    group.events.some(e => e.slug === eventSlug)
  )
}
