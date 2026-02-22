// lib/chatbot/service-prompts.ts
// Prompts spécialisés par type de service pour des questions pertinentes

export interface ServicePromptConfig {
  serviceType: string;
  questions: string[];
  /** Critères OBLIGATOIRES à extraire avant de valider (matching précis) */
  minRequiredCriteria: string[];
  keyCriteria: string[];
  /** Tags à rechercher dans les réponses pour le matching */
  matchingTags: string[];
  budgetRange?: { min: number; max: number };
  specificNotes?: string;
}

/**
 * Questions spécialisées par type de service
 * Ordre de priorité : impact matching > complétion > style
 */
export const SERVICE_SPECIFIC_QUESTIONS: Record<string, ServicePromptConfig> = {
  // PHOTO & VIDÉO
  photographe: {
    serviceType: 'photographe',
    questions: [
      'Style de photos ? (reportage/spontané, posé/classique, artistique/éditorial, mix)',
      'Durée de prestation ? (cérémonie uniquement ~4h, demi-journée, journée complète, plusieurs jours)',
      'Les traditions culturelles à capturer ? (henna, zaffa, cérémonie religieuse, autre — à préciser)',
      'Nombre de photographes ? (1 seul ou 2 pour couvrir différents angles)',
      'Livrables attendus ? (photos numériques HD, album physique, diaporama, vidéo courte)',
    ],
    minRequiredCriteria: ['style', 'durée'],
    keyCriteria: ['style', 'durée', 'livrables', 'moments_importants', 'nombre_photographes'],
    matchingTags: ['reportage', 'posé', 'artistique', 'henna', 'zaffa', 'album_physique', 'drone'],
    budgetRange: { min: 1500, max: 5000 },
    specificNotes: 'Pour mariages multiculturels : vérifier connaissance des traditions et moments clés (zaffa, henna, cérémonie religieuse)',
  },

  videaste: {
    serviceType: 'videaste',
    questions: [
      'Style de vidéo ? (cinématique/film, documentaire/reportage, dynamique/clip, mix)',
      'Durée de prestation ? (cérémonie uniquement, demi-journée, journée complète)',
      'Format de livraison ? (film principal + teaser, film seul, making-of, drone inclus)',
      'Moments à filmer en priorité ? (zaffa, henna, cérémonie religieuse, réception — préciser)',
      'Musique ? (traditionnelle de la culture, moderne, mix des deux)',
    ],
    minRequiredCriteria: ['style', 'durée'],
    keyCriteria: ['style', 'durée', 'format', 'moments_prioritaires', 'musique'],
    matchingTags: ['cinématique', 'documentaire', 'drone', 'teaser', 'zaffa', 'henna', 'film_complet'],
    budgetRange: { min: 2000, max: 6000 },
    specificNotes: 'Important : vérifier capacité à filmer les traditions (zaffa, henna, cérémonie religieuse)',
  },

  // TRAITEUR & PÂTISSERIE
  traiteur: {
    serviceType: 'traiteur',
    questions: [
      'Régime alimentaire ? (halal certifié, végétarien, mixte, sans restrictions)',
      'Type de service ? (buffet, service à l\'assiette, cocktail dinatoire, mix)',
      'Style culinaire ? (traditionnel maghrébin, oriental, franco-maghrébin fusion, français)',
      'Budget par personne envisagé ? (ex : 40-60€, 60-90€, 90€+)',
      'Services boissons inclus ? (softs uniquement, thé à la menthe/café, bar complet)',
      'Prestation pour henna/zaffa ? (petites bouchées, pâtisseries orientales, thé)',
    ],
    minRequiredCriteria: ['régime_alimentaire', 'type_service', 'budget_par_personne'],
    keyCriteria: ['type_service', 'régime', 'style_culinaire', 'budget_personne', 'nombre_invités'],
    matchingTags: ['halal', 'végétarien', 'buffet', 'assiette', 'maghrébin', 'fusion', 'henna_service', 'boissons'],
    budgetRange: { min: 30, max: 150 }, // par personne
    specificNotes: 'CRITIQUE : régime alimentaire (halal/végétarien) est un critère éliminatoire. Nombre d\'invités nécessaire pour devis précis.',
  },

  patissier: {
    serviceType: 'patissier',
    questions: [
      'Type de gâteau ? (wedding cake occidental, gâteaux traditionnels orientaux, les deux)',
      'Style décoratif ? (moderne/épuré, traditionnel/baroque, floral, géométrique)',
      'Saveurs principales ? (chocolat, vanille, fruits exotiques, pâtisseries orientales comme baklawa/corne de gazelle)',
      'Autres desserts souhaités ? (macarons, mignardises, plateau pâtisseries orientales)',
      'Nombre d\'étages ou nombre de parts approximatif ?',
    ],
    minRequiredCriteria: ['type_gateau', 'style_decoratif'],
    keyCriteria: ['type_gateau', 'style_decoratif', 'saveurs', 'autres_desserts'],
    matchingTags: ['wedding_cake', 'oriental', 'moderne', 'floral', 'macarons', 'baklawa', 'pâtisseries_orientales'],
    budgetRange: { min: 300, max: 2000 },
    specificNotes: 'Vérifier capacité à faire des gâteaux traditionnels (mille-feuilles oriental, etc.)',
  },

  // MUSIQUE & ANIMATION
  dj: {
    serviceType: 'dj',
    questions: [
      'Style musical principal ? (oriental/chaabi, occidental/électro, mix oriental-occidental, rai)',
      'Prestation zaffa ? (oui avec équipement, oui sans équipement, non)',
      'Durée de prestation ? (réception soirée ~5h, journée complète, plusieurs jours)',
      'Équipement fourni ? (sono + éclairage, sono seule, éclairage seul, tout inclus)',
      'Chansons ou artistes à inclure / à éviter absolument ?',
    ],
    minRequiredCriteria: ['style_musical', 'zaffa', 'durée'],
    keyCriteria: ['style_musical', 'zaffa', 'durée', 'équipement', 'playlist_spécifique'],
    matchingTags: ['oriental', 'occidental', 'rai', 'chaabi', 'zaffa', 'éclairage', 'sono', 'mix'],
    budgetRange: { min: 800, max: 3000 },
    specificNotes: 'CRITIQUE : capacité zaffa et connaissance musique orientale/maghrébine sont souvent décisifs',
  },

  animation: {
    serviceType: 'animation',
    questions: [
      'Type d\'animation souhaité ? (photobooth, danseurs/shows, magicien, jeux interactifs, autre)',
      'Moment dans la journée ? (cocktail, réception dîner, soirée, tout)',
      'Durée totale de prestation ?',
      'Ambiance voulue ? (festive/humoristique, élégante/spectacle, familiale)',
    ],
    minRequiredCriteria: ['type_animation', 'moment'],
    keyCriteria: ['type_animation', 'durée', 'moment', 'ambiance'],
    matchingTags: ['photobooth', 'danseurs', 'magicien', 'jeux', 'cocktail', 'soirée', 'show'],
    budgetRange: { min: 500, max: 2500 },
  },

  // BEAUTÉ & STYLE
  coiffure_maquillage: {
    serviceType: 'coiffure_maquillage',
    questions: [
      'Nombre de personnes ? (mariée seule, mariée + témoins, mariée + famille — combien ?)',
      'Style souhaité ? (moderne glamour, naturel/délicat, traditionnel, mix selon les tenues)',
      'Essai avant le jour J ? (oui souhaité, pas nécessaire)',
      'Déplacement sur le lieu ou salon de la coiffeuse ?',
      'Horaires ? (matin pour cérémonie civile, après-midi, matinée complète)',
    ],
    minRequiredCriteria: ['nombre_personnes', 'style'],
    keyCriteria: ['nombre_personnes', 'style', 'essai', 'déplacement', 'horaires'],
    matchingTags: ['moderne', 'naturel', 'traditionnel', 'essai', 'déplacement', 'henna_makeup'],
    budgetRange: { min: 200, max: 800 },
    specificNotes: 'Vérifier connaissance maquillage pour mariages traditionnels (henna, tenues différentes)',
  },

  robe_mariee: {
    serviceType: 'robe_mariee',
    questions: [
      'Type de tenue ? (robe occidentale seule, caftan/takchita seule, les deux pour le jour J)',
      'Style robe occidentale ? (princesse/bouffante, sirène/moulante, A-line/évasée, droite)',
      'Couleurs ? (blanc pur, ivoire/champagne, couleur pour caftan — laquelle ?)',
      'Essais et retouches inclus dans le budget ?',
      'Accessoires ? (voile, bijoux, chaussures — cherche-t-on un prestataire tout-en-un ?)',
    ],
    minRequiredCriteria: ['type_tenue', 'style'],
    keyCriteria: ['style', 'type_tenue', 'couleurs', 'essais', 'accessoires'],
    matchingTags: ['occidentale', 'caftan', 'takchita', 'princesse', 'sirène', 'ivoire', 'accessoires'],
    budgetRange: { min: 500, max: 5000 },
  },

  // DÉCORATION & FLEURS
  fleuriste: {
    serviceType: 'fleuriste',
    questions: [
      'Éléments à décorer ? (tables, arche/scène cérémonie, entrée/couloir, espace henna — préciser)',
      'Style de décoration ? (moderne/épuré, romantique/floral, luxueux/opulent, bohème)',
      'Palette de couleurs ? (couleurs exactes ou ambiance souhaitée)',
      'Fleurs préférées ou à éviter ? (roses, pivoines, lys, fleurs orientales/jasmin)',
      'Budget global pour la décoration florale ?',
    ],
    minRequiredCriteria: ['éléments_à_décorer', 'style', 'couleurs'],
    keyCriteria: ['style', 'couleurs', 'éléments', 'fleurs', 'budget'],
    matchingTags: ['moderne', 'romantique', 'luxueux', 'bohème', 'roses', 'pivoines', 'oriental', 'henna_décoration'],
    budgetRange: { min: 1000, max: 8000 },
    specificNotes: 'Vérifier capacité décoration espace henna et traditions maghrébines',
  },

  // LIEUX & MATÉRIEL
  salle: {
    serviceType: 'salle',
    questions: [
      'Capacité nécessaire ? (nombre d\'invités exact ou estimation)',
      'Type d\'espace ? (intérieur, extérieur/jardin, mix salle + extérieur)',
      'Services inclus souhaités ? (traiteur maison, décoration incluse, sono/DJ, rien — salle nue)',
      'Style de salle ? (moderne/contemporain, classique/élégant, haussmannien, rustique/château)',
      'Accessibilité importante ? (parking grand nombre, accès PMR, proxi transports)',
    ],
    minRequiredCriteria: ['capacité', 'type_espace', 'services_inclus'],
    keyCriteria: ['capacité', 'type_réception', 'services_inclus', 'style', 'accessibilité'],
    matchingTags: ['extérieur', 'intérieur', 'traiteur_inclus', 'moderne', 'classique', 'château', 'parking'],
    budgetRange: { min: 2000, max: 15000 },
    specificNotes: 'CRITIQUE : capacité et services inclus déterminent le prix. Clarifier si salle nue ou prestation complète.',
  },

  location_materiel: {
    serviceType: 'location_materiel',
    questions: [
      'Type de matériel principal ? (tentes/chapiteaux, tables + chaises, éclairage/LED, décoration, sono)',
      'Quantité approximative ? (pour combien d\'invités)',
      'Installation + démontage inclus souhaité ? (oui/non)',
      'Durée de location ? (journée, week-end, plusieurs jours)',
      'Style recherché ? (moderne, oriental, champêtre)',
    ],
    minRequiredCriteria: ['type_matériel', 'quantité'],
    keyCriteria: ['type_matériel', 'quantité', 'durée', 'installation', 'style'],
    matchingTags: ['tente', 'tables', 'éclairage', 'décoration', 'installation', 'oriental', 'champêtre'],
    budgetRange: { min: 500, max: 5000 },
  },

  // SERVICES TRADITIONNELS MAGHRÉBINS
  neggafa: {
    serviceType: 'neggafa',
    questions: [
      'Services souhaités ? (habillage tenues traditionnelles, coiffure traditionnelle, maquillage, conseil — tout ou partie ?)',
      'Nombre de personnes à habiller ? (mariée seule, mariée + famille proche — combien ?)',
      'Nombre de tenues/changements ? (combien de caftans/takchitas pour la mariée)',
      'Durée de prestation ? (jour J uniquement, henna + jour J, plusieurs jours)',
      'Région/origine des tenues ? (algérienne, marocaine, tunisienne — tradition spécifique ?)',
    ],
    minRequiredCriteria: ['services_souhaités', 'nombre_tenues'],
    keyCriteria: ['services', 'nombre_personnes', 'nombre_tenues', 'durée', 'origine_tradition'],
    matchingTags: ['habillage', 'coiffure_traditionnelle', 'maquillage', 'caftan', 'algérienne', 'marocaine', 'tunisienne', 'henna'],
    budgetRange: { min: 800, max: 3000 },
    specificNotes: 'Service traditionnel maghrébin — vérifier expérience et connaissance des traditions régionales (algérienne vs marocaine vs tunisienne)',
  },

  zaffa: {
    serviceType: 'zaffa',
    questions: [
      'Style de zaffa ? (traditionnelle authentique, moderne/revisitée, mix)',
      'Instruments souhaités ? (darbouka + bendir + flûte traditionnelle, hautbois/mizmar, ululation — liste à préciser)',
      'Nombre de musiciens ? (trio 3, quintette 5, grand groupe 8+)',
      'Durée de la procession souhaitée ?',
      'Lieu : intérieur (couloir/salon) ou extérieur ? Distance à parcourir ?',
    ],
    minRequiredCriteria: ['style_zaffa', 'instruments', 'nombre_musiciens'],
    keyCriteria: ['type_zaffa', 'instruments', 'nombre_musiciens', 'durée', 'lieu'],
    matchingTags: ['traditionnelle', 'moderne', 'darbouka', 'bendir', 'mizmar', 'flûte', 'ululation', 'intérieur', 'extérieur'],
    budgetRange: { min: 500, max: 2000 },
    specificNotes: 'Tradition maghrébine — vérifier expérience, authenticité et instruments maîtrisés',
  },

  henna_artiste: {
    serviceType: 'henna_artiste',
    questions: [
      'Nombre de personnes à décorer ? (mariée seule, mariée + invitées — combien ?)',
      'Style de henna ? (traditionnel maghrébin/arabe, moderne/géométrique, indien, mix)',
      'Emplacements ? (mains + pieds pour la mariée, mains uniquement pour invitées)',
      'Format de l\'événement ? (henna party la veille, henna le jour J, les deux)',
      'Durée de prestation estimée ?',
    ],
    minRequiredCriteria: ['nombre_personnes', 'style', 'format_événement'],
    keyCriteria: ['nombre_personnes', 'style', 'emplacements', 'format', 'durée'],
    matchingTags: ['traditionnel', 'moderne', 'géométrique', 'mains', 'pieds', 'henna_party', 'indien'],
    budgetRange: { min: 200, max: 800 },
  },

  // AUTRES SERVICES
  wedding_planner: {
    serviceType: 'wedding_planner',
    questions: [
      'Niveau d\'intervention souhaité ? (coordination jour J uniquement, semi-complet quelques mois avant, planning complet dès maintenant)',
      'Budget global du mariage ? (fourchette approximative)',
      'Services déjà réservés ? (liste ce qui est déjà fait)',
      'Difficultés ou besoins spécifiques ? (mariage multiculturel, coordination plusieurs familles, logistique complexe)',
      'Date du mariage et délai avant le jour J ?',
    ],
    minRequiredCriteria: ['niveau_intervention', 'budget_global'],
    keyCriteria: ['niveau_intervention', 'budget_global', 'services_réservés', 'besoins_spécifiques'],
    matchingTags: ['coordination_JJ', 'semi_complet', 'complet', 'multiculturel', 'logistique'],
    budgetRange: { min: 2000, max: 10000 },
  },

  faire_part: {
    serviceType: 'faire_part',
    questions: [
      'Style souhaité ? (moderne/minimaliste, traditionnel/oriental, luxueux/doré, mix)',
      'Langues ? (français seul, bilingue franco-arabe, autre)',
      'Format ? (carte simple, dépliant, boîte/coffret)',
      'Quantité approximative ?',
      'Finitions spéciales ? (dorure, relief/gaufrage, calligraphie arabe)',
    ],
    minRequiredCriteria: ['style', 'langues', 'format'],
    keyCriteria: ['style', 'quantité', 'langues', 'format', 'finitions'],
    matchingTags: ['moderne', 'oriental', 'luxueux', 'bilingue', 'arabe', 'dorure', 'calligraphie', 'coffret'],
    budgetRange: { min: 200, max: 1500 },
  },
};

/**
 * Génère le prompt spécialisé pour un type de service
 */
export function getServiceSpecificPrompt(serviceType: string, coupleProfile?: Record<string, unknown>): string {
  const config = SERVICE_SPECIFIC_QUESTIONS[serviceType];

  if (!config) {
    return '';
  }

  let prompt = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTIONS SPÉCIFIQUES POUR ${serviceType.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions à poser (par ordre de priorité pour le matching) :
${config.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

🔴 CRITÈRES MINIMUM OBLIGATOIRES avant validation :
${config.minRequiredCriteria.map(c => `   - ${c}`).join('\n')}
→ Tu NE PEUX PAS valider sans avoir ces informations. Continue à poser des questions ciblées.

Critères complémentaires à extraire si possible : ${config.keyCriteria.join(', ')}

Tags matching à identifier dans les réponses : ${config.matchingTags.join(', ')}

Budget moyen pour ce service : ${config.budgetRange?.min}€ - ${config.budgetRange?.max}€${serviceType === 'traiteur' ? ' (par personne)' : ''}

${config.specificNotes ? `⚠️ IMPORTANT : ${config.specificNotes}` : ''}
`;

  // Notes spécifiques selon les données du couple
  if (coupleProfile) {
    if (coupleProfile.guest_count && (serviceType === 'traiteur' || serviceType === 'salle' || serviceType === 'animation')) {
      prompt += `\n💡 Le couple a ${coupleProfile.guest_count} invités — utilise cette info, NE PAS redemander.`;
    }

    if (Array.isArray(coupleProfile.cultures) && coupleProfile.cultures.length > 0) {
      const cultures = coupleProfile.cultures.join(', ');
      if (['photographe', 'videaste', 'dj', 'fleuriste', 'traiteur'].includes(serviceType)) {
        prompt += `\n💡 Culture(s) ${cultures} — vérifier connaissance des traditions correspondantes (zaffa, henna, etc.).`;
      }
    }

    if (coupleProfile.wedding_date && serviceType === 'wedding_planner') {
      prompt += `\n💡 Mariage le ${coupleProfile.wedding_date} — calculer le délai et adapter le niveau d'intervention possible.`;
    }
  }

  return prompt;
}

/**
 * Retourne les critères minimum requis pour un service donné
 */
export function getMinRequiredCriteria(serviceType: string): string[] {
  return SERVICE_SPECIFIC_QUESTIONS[serviceType]?.minRequiredCriteria ?? [];
}

/**
 * Vérifie si une question doit être posée selon les données du couple
 */
export function shouldAskQuestion(questionKey: string, coupleProfile?: Record<string, unknown>): boolean {
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
