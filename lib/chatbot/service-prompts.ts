// lib/chatbot/service-prompts.ts
// Prompts spécialisés par type de service pour des questions pertinentes

export interface CoupleProfile {
  guest_count?: number;
  wedding_date?: string;
  wedding_city?: string;
  wedding_region?: string;
  wedding_location?: string;
  cultures?: string[];
  budget_min?: number;
  budget_max?: number;
  wedding_style?: string;
  ambiance?: string;
  [key: string]: unknown;
}

export interface ServicePromptConfig {
  serviceType: string;
  questions: string[];
  keyCriteria: string[];
  budgetRange?: { min: number; max: number };
  specificNotes?: string;
}

/**
 * Questions spécialisées par type de service
 */
export const SERVICE_SPECIFIC_QUESTIONS: Record<string, ServicePromptConfig> = {
  // PHOTO & VIDÉO
  photographe: {
    serviceType: 'photographe',
    questions: [
      'Style de photos préféré ? (reportage, posé, artistique, mix)',
      'Nombre de photographes souhaité ? (1 ou 2)',
      'Durée de prestation ? (cérémonie uniquement, journée complète, plusieurs jours)',
      'Livrables souhaités ? (photos numériques, album physique, vidéo courte)',
      'Moments importants à capturer ? (cérémonie traditionnelle, henna, zaffa...)',
    ],
    keyCriteria: ['style', 'durée', 'livrables', 'moments_importants'],
    budgetRange: { min: 1500, max: 5000 },
    specificNotes: 'Pour mariages multiculturels, vérifier connaissance des traditions et moments clés',
  },
  
  videaste: {
    serviceType: 'videaste',
    questions: [
      'Type de vidéo souhaité ? (teaser, film principal, making-of, drone)',
      'Style préféré ? (cinématique, documentaire, dynamique)',
      'Durée de prestation ? (cérémonie, journée complète, plusieurs jours)',
      'Moments à filmer en priorité ? (zaffa, henna, cérémonie, réception)',
      'Musique préférée ? (traditionnelle, moderne, mix)',
    ],
    keyCriteria: ['type_video', 'style', 'durée', 'moments_prioritaires'],
    budgetRange: { min: 2000, max: 6000 },
    specificNotes: 'Important : vérifier capacité à filmer les traditions (zaffa, henna, etc.)',
  },

  // TRAITEUR & PÂTISSERIE
  traiteur: {
    serviceType: 'traiteur',
    questions: [
      'Type de service ? (buffet, assiette, mix)',
      'Nombre de services ? (entrée, plat, dessert)',
      'Régime alimentaire ? (halal, végétarien, sans allergènes spécifiques)',
      'Style culinaire ? (traditionnel maghrébin, fusion, français, autre)',
      'Service boissons inclus ? (softs, thé à la menthe, café)',
      'Service traiteur pour henna/zaffa ? (petites bouchées, thé, pâtisseries)',
    ],
    keyCriteria: ['type_service', 'régime', 'style_culinaire', 'nombre_invités'],
    budgetRange: { min: 30, max: 150 }, // par personne
    specificNotes: 'CRITIQUE : nombre d\'invités nécessaire pour devis précis. Vérifier capacité pour grandes réceptions.',
  },

  patissier: {
    serviceType: 'patissier',
    questions: [
      'Type de gâteau ? (wedding cake classique, gâteaux traditionnels, mix)',
      'Nombre d\'étages souhaité ?',
      'Style décoratif ? (moderne, traditionnel, floral, géométrique)',
      'Saveurs préférées ? (chocolat, vanille, fruits, pâtisseries orientales)',
      'Autres desserts ? (macarons, pâtisseries orientales, mignardises)',
    ],
    keyCriteria: ['type_gateau', 'nombre_etages', 'style_decoratif', 'saveurs'],
    budgetRange: { min: 300, max: 2000 },
    specificNotes: 'Vérifier capacité à faire des gâteaux traditionnels (mille-feuilles oriental, etc.)',
  },

  // MUSIQUE & ANIMATION
  dj: {
    serviceType: 'dj',
    questions: [
      'Style musical préféré ? (oriental, occidental, mix, électro)',
      'Durée de prestation ? (réception uniquement, journée complète)',
      'Équipement fourni ? (sono, éclairage, écran)',
      'Animations souhaitées ? (zaffa, animations de soirée, jeux)',
      'Playlist spécifique ? (chansons obligatoires, à éviter)',
    ],
    keyCriteria: ['style_musical', 'durée', 'équipement', 'animations'],
    budgetRange: { min: 800, max: 3000 },
    specificNotes: 'CRITIQUE : vérifier connaissance musique orientale/maghrébine et capacité zaffa',
  },

  animation: {
    serviceType: 'animation',
    questions: [
      'Type d\'animation ? (photobooth, jeux, magicien, danseurs)',
      'Durée souhaitée ?',
      'Nombre d\'invités approximatif ?',
      'Style ? (moderne, traditionnel, mix)',
      'Moments d\'animation ? (cocktail, réception, soirée)',
    ],
    keyCriteria: ['type_animation', 'durée', 'nombre_invités', 'moments'],
    budgetRange: { min: 500, max: 2500 },
  },

  // BEAUTÉ & STYLE
  coiffure_maquillage: {
    serviceType: 'coiffure_maquillage',
    questions: [
      'Nombre de personnes à coiffer/maquiller ? (mariée, témoins, famille)',
      'Style souhaité ? (moderne, traditionnel, mix)',
      'Essai prévu ? (essai maquillage/coiffure avant le jour J)',
      'Déplacement à domicile ou sur lieu ?',
      'Horaires ? (matinée pour cérémonie, après-midi pour réception)',
    ],
    keyCriteria: ['nombre_personnes', 'style', 'essai', 'déplacement'],
    budgetRange: { min: 200, max: 800 },
    specificNotes: 'Vérifier connaissance maquillage/coiffure pour mariages traditionnels (henna, etc.)',
  },

  robe_mariee: {
    serviceType: 'robe_mariee',
    questions: [
      'Style recherché ? (moderne, traditionnel, fusion)',
      'Type de robe ? (robe occidentale, caftan, les deux)',
      'Budget approximatif ?',
      'Essais nécessaires ?',
      'Accessoires inclus ? (voile, bijoux, chaussures)',
    ],
    keyCriteria: ['style', 'type_robe', 'budget', 'essais'],
    budgetRange: { min: 500, max: 5000 },
  },

  // DÉCORATION & FLEURS
  fleuriste: {
    serviceType: 'fleuriste',
    questions: [
      'Style de décoration ? (moderne, traditionnel, romantique, luxueux)',
      'Couleurs préférées ?',
      'Éléments à décorer ? (salle, entrée, tables, scène, henna)',
      'Fleurs préférées ? (roses, lys, fleurs orientales)',
      'Budget approximatif ?',
    ],
    keyCriteria: ['style', 'couleurs', 'éléments', 'fleurs'],
    budgetRange: { min: 1000, max: 8000 },
    specificNotes: 'Vérifier capacité décoration pour mariages traditionnels (henna, zaffa)',
  },

  // LIEUX & MATÉRIEL
  salle: {
    serviceType: 'salle',
    questions: [
      'Capacité nécessaire ? (nombre d\'invités)',
      'Type de réception ? (intérieur, extérieur, mix)',
      'Services inclus souhaités ? (traiteur, décoration, équipement)',
      'Accessibilité ? (parking, transports)',
      'Style recherché ? (moderne, traditionnel, rustique, luxueux)',
    ],
    keyCriteria: ['capacité', 'type_réception', 'services_inclus', 'style'],
    budgetRange: { min: 2000, max: 15000 },
    specificNotes: 'CRITIQUE : capacité et services inclus déterminent le prix',
  },

  location_materiel: {
    serviceType: 'location_materiel',
    questions: [
      'Type de matériel ? (tentes, tables/chaises, éclairage, décoration)',
      'Quantité approximative ?',
      'Durée de location ?',
      'Installation incluse ?',
      'Style recherché ?',
    ],
    keyCriteria: ['type_matériel', 'quantité', 'durée', 'installation'],
    budgetRange: { min: 500, max: 5000 },
  },

  // SERVICES TRADITIONNELS MAGHRÉBINS
  neggafa: {
    serviceType: 'neggafa',
    questions: [
      'Services souhaités ? (habillage, coiffure traditionnelle, maquillage, conseil)',
      'Nombre de personnes à habiller ?',
      'Style de tenues ? (caftans traditionnels, modernes, mix)',
      'Durée de prestation ? (jour J uniquement, plusieurs jours)',
      'Accessoires inclus ? (bijoux, ceintures, chaussures)',
    ],
    keyCriteria: ['services', 'nombre_personnes', 'style_tenues', 'durée'],
    budgetRange: { min: 800, max: 3000 },
    specificNotes: 'Service traditionnel maghrébin - vérifier expérience et connaissance des traditions',
  },

  zaffa: {
    serviceType: 'zaffa',
    questions: [
      'Type de zaffa ? (traditionnelle, moderne, mix)',
      'Nombre de musiciens souhaité ?',
      'Instruments préférés ? (darbouka, bendir, flûte, autres)',
      'Durée de la procession ?',
      'Lieu de départ et arrivée ?',
    ],
    keyCriteria: ['type_zaffa', 'nombre_musiciens', 'instruments', 'durée'],
    budgetRange: { min: 500, max: 2000 },
    specificNotes: 'Tradition maghrébine - vérifier expérience et authenticité',
  },

  henna_artiste: {
    serviceType: 'henna_artiste',
    questions: [
      'Nombre de personnes à décorer ?',
      'Style de henna ? (traditionnel, moderne, mix)',
      'Emplacements souhaités ? (mains, pieds, bras)',
      'Durée de prestation ?',
      'Événement ? (henna party, jour J)',
    ],
    keyCriteria: ['nombre_personnes', 'style', 'emplacements', 'durée'],
    budgetRange: { min: 200, max: 800 },
  },

  // AUTRES SERVICES
  wedding_planner: {
    serviceType: 'wedding_planner',
    questions: [
      'Niveau d\'intervention ? (coordination jour J, planning complet, conseil)',
      'Budget global du mariage ?',
      'Nombre d\'invités ?',
      'Services déjà réservés ?',
      'Besoins spécifiques ? (traditions, logistique complexe)',
    ],
    keyCriteria: ['niveau_intervention', 'budget_global', 'services_réservés'],
    budgetRange: { min: 2000, max: 10000 },
  },

  faire_part: {
    serviceType: 'faire_part',
    questions: [
      'Style souhaité ? (moderne, traditionnel, élégant)',
      'Quantité approximative ?',
      'Langues ? (français, arabe, bilingue)',
      'Format ? (carte simple, dépliant, boîte)',
      'Impression spéciale ? (dorure, relief, autres)',
    ],
    keyCriteria: ['style', 'quantité', 'langues', 'format'],
    budgetRange: { min: 200, max: 1500 },
  },
};

/**
 * Génère le prompt spécialisé pour un type de service
 */
export function getServiceSpecificPrompt(serviceType: string, coupleProfile?: CoupleProfile): string {
  const config = SERVICE_SPECIFIC_QUESTIONS[serviceType];
  
  if (!config) {
    return '';
  }

  let prompt = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTIONS SPÉCIFIQUES POUR ${serviceType.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions pertinentes à poser (dans cet ordre de priorité) :
${config.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Critères clés à extraire : ${config.keyCriteria.join(', ')}

Budget moyen pour ce service : ${config.budgetRange?.min}€ - ${config.budgetRange?.max}€
${config.budgetRange && serviceType === 'traiteur' ? '(par personne)' : ''}

${config.specificNotes ? `⚠️ IMPORTANT : ${config.specificNotes}` : ''}
`;

  // Ajouter des notes spécifiques selon les données du couple
  if (coupleProfile) {
    if (coupleProfile.guest_count && (serviceType === 'traiteur' || serviceType === 'salle')) {
      prompt += `\n💡 Le couple a ${coupleProfile.guest_count} invités - utilise cette info pour les questions de capacité.`;
    }
    
    if (coupleProfile.cultures && coupleProfile.cultures.length > 0) {
      const cultures = coupleProfile.cultures.join(', ');
      if (serviceType === 'photographe' || serviceType === 'videaste' || serviceType === 'dj') {
        prompt += `\n💡 Le couple a une culture ${cultures} - vérifie connaissance des traditions (henna, zaffa, etc.).`;
      }
    }
  }

  return prompt;
}

/**
 * Vérifie si une question doit être posée selon les données du couple
 */
export function shouldAskQuestion(questionKey: string, coupleProfile?: CoupleProfile): boolean {
  if (!coupleProfile) return true;

  // Ne pas redemander des infos déjà connues
  const skipMap: Record<string, string[]> = {
    'nombre_invités': ['guest_count'],
    'date': ['wedding_date'],
    'lieu': ['wedding_city', 'wedding_region'],
    'culture': ['cultures'],
    'budget_global': ['budget_min', 'budget_max'],
  };

  const skipKeys = skipMap[questionKey];
  if (skipKeys) {
    return !skipKeys.some(key => {
      const value = coupleProfile[key];
      return value !== null && value !== undefined && value !== '';
    });
  }

  return true;
}
