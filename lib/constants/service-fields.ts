// Configuration déclarative des sous-sections métier pour chaque type de prestataire
// Chaque métier a ses propres champs spécifiques qui seront affichés dynamiquement
// dans le profil public et utilisés pour le matching/filtrage côté couple

export type ServiceFieldType = 'multi-select' | 'single-select' | 'number' | 'text' | 'boolean'

export interface ServiceFieldOption {
  value: string
  label: string
}

export interface ServiceFieldConfig {
  key: string
  label: string
  type: ServiceFieldType
  options?: ServiceFieldOption[]
  placeholder?: string
  suffix?: string // ex: "personnes", "heures"
  min?: number
  max?: number
  description?: string // aide contextuelle
}

export interface ServiceFieldGroup {
  title: string
  description?: string
  fields: ServiceFieldConfig[]
}

// Helper pour créer des options rapidement
const opts = (...labels: string[]): ServiceFieldOption[] =>
  labels.map(l => ({ value: l.toLowerCase().replace(/[^a-z0-9]/g, '_'), label: l }))

// ============================================================
// PHOTO & VIDEO
// ============================================================

const PHOTOGRAPHE_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Style & Approche',
    fields: [
      {
        key: 'style_photo',
        label: 'Style de photographie',
        type: 'multi-select',
        options: opts('Reportage', 'Posé / Classique', 'Artistique', 'Photojournalisme', 'Fine Art', 'Dark & Moody', 'Lumineux & Aérien'),
      },
      {
        key: 'type_couverture',
        label: 'Types de couverture',
        type: 'multi-select',
        options: opts('Mariage complet', 'Cérémonie uniquement', 'Réception', 'Préparatifs', 'Séance couple', 'Séance engagement', 'Day after', 'Trash the dress'),
      },
    ],
  },
  {
    title: 'Livrables & Capacité',
    fields: [
      {
        key: 'livrables',
        label: 'Livrables inclus',
        type: 'multi-select',
        options: opts('Galerie en ligne', 'Album photo', 'Tirages', 'Clé USB', 'Photos HD téléchargeables', 'Diaporama vidéo'),
      },
      {
        key: 'duree_max',
        label: 'Durée max de couverture',
        type: 'number',
        suffix: 'heures',
        min: 1,
        max: 24,
      },
      {
        key: 'nb_photos_min',
        label: 'Nombre minimum de photos livrées',
        type: 'number',
        min: 50,
        max: 5000,
        placeholder: 'ex: 300',
      },
      {
        key: 'delai_livraison',
        label: 'Délai de livraison',
        type: 'single-select',
        options: opts('Moins de 2 semaines', '2 à 4 semaines', '1 à 2 mois', '2 à 3 mois', 'Plus de 3 mois'),
      },
    ],
  },
]

const VIDEASTE_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Style & Formats',
    fields: [
      {
        key: 'style_video',
        label: 'Style de vidéo',
        type: 'multi-select',
        options: opts('Cinématographique', 'Documentaire', 'Reportage', 'Court-métrage', 'Clip musical', 'Moderne / Réseaux sociaux'),
      },
      {
        key: 'formats_livres',
        label: 'Formats livrés',
        type: 'multi-select',
        options: opts('Film complet', 'Teaser (1-3 min)', 'Highlight (5-10 min)', 'Version réseaux sociaux', 'Version cérémonie', 'Vidéo same day edit'),
      },
    ],
  },
  {
    title: 'Technique & Capacité',
    fields: [
      {
        key: 'equipement',
        label: 'Équipement',
        type: 'multi-select',
        options: opts('Caméra 4K', 'Caméra 8K', 'Drone', 'Steadicam / Gimbal', 'Éclairage pro', 'Son HQ', 'Multi-caméras'),
      },
      {
        key: 'duree_max',
        label: 'Durée max de couverture',
        type: 'number',
        suffix: 'heures',
        min: 1,
        max: 24,
      },
      {
        key: 'delai_livraison',
        label: 'Délai de livraison',
        type: 'single-select',
        options: opts('Moins de 2 semaines', '2 à 4 semaines', '1 à 3 mois', '3 à 6 mois'),
      },
    ],
  },
]

const PILOTE_DRONE_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Services & Technique',
    fields: [
      {
        key: 'type_prises',
        label: 'Types de prises de vue',
        type: 'multi-select',
        options: opts('Photo aérienne', 'Vidéo aérienne', 'Vidéo 360°', 'Timelapse aérien', 'Suivi de cortège'),
      },
      {
        key: 'qualite_video',
        label: 'Qualité vidéo',
        type: 'multi-select',
        options: opts('Full HD 1080p', '4K', '6K+'),
      },
      {
        key: 'autorisations',
        label: 'Autorisations',
        type: 'multi-select',
        options: opts('Brevet DGAC', 'Vol en zone urbaine', 'Vol de nuit', 'Assurance spécifique'),
      },
    ],
  },
]

// ============================================================
// TRAITEUR & PATISSERIE
// ============================================================

const TRAITEUR_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Type de service',
    fields: [
      {
        key: 'type_service',
        label: 'Formules proposées',
        type: 'multi-select',
        options: opts('Buffet', 'Service à l\'assiette', 'Cocktail dînatoire', 'Food station', 'Brunch', 'Food truck', 'Menu dégustation'),
      },
      {
        key: 'inclus_service',
        label: 'Inclus dans la prestation',
        type: 'multi-select',
        options: opts('Personnel de service', 'Vaisselle & couverts', 'Nappage', 'Mise en place', 'Nettoyage', 'Boissons', 'Gâteau / pièce montée'),
      },
    ],
  },
  {
    title: 'Cuisine & Régimes',
    fields: [
      {
        key: 'styles_culinaires',
        label: 'Styles culinaires',
        type: 'multi-select',
        options: opts('Français', 'Maghrébin', 'Africain', 'Indien', 'Asiatique', 'Libanais / Oriental', 'Antillais / Créole', 'Fusion', 'Gastronomique', 'Méditerranéen', 'Turc'),
      },
      {
        key: 'regime_alimentaire',
        label: 'Régimes alimentaires gérés',
        type: 'multi-select',
        options: opts('Halal', 'Casher', 'Végétarien', 'Végan', 'Sans gluten', 'Sans lactose', 'Sans porc', 'Bio'),
      },
    ],
  },
  {
    title: 'Capacité',
    fields: [
      {
        key: 'min_personnes',
        label: 'Minimum de convives',
        type: 'number',
        suffix: 'personnes',
        min: 1,
        max: 2000,
        placeholder: 'ex: 30',
      },
      {
        key: 'max_personnes',
        label: 'Maximum de convives',
        type: 'number',
        suffix: 'personnes',
        min: 1,
        max: 2000,
        placeholder: 'ex: 500',
      },
      {
        key: 'menu_degustation',
        label: 'Propose des dégustations avant le jour J',
        type: 'boolean',
      },
    ],
  },
]

const PATISSIER_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Spécialités',
    fields: [
      {
        key: 'types_gateaux',
        label: 'Types de créations',
        type: 'multi-select',
        options: opts('Wedding cake', 'Pièce montée', 'Croquembouche', 'Naked cake', 'Cupcakes', 'Sweet table', 'Macarons', 'Dragées', 'Mignardises', 'Gâteau oriental'),
      },
      {
        key: 'regime_alimentaire',
        label: 'Régimes gérés',
        type: 'multi-select',
        options: opts('Halal', 'Casher', 'Végétarien', 'Végan', 'Sans gluten', 'Sans lactose'),
      },
    ],
  },
  {
    title: 'Capacité & Options',
    fields: [
      {
        key: 'max_parts',
        label: 'Nombre max de parts',
        type: 'number',
        suffix: 'parts',
        min: 10,
        max: 1000,
      },
      {
        key: 'livraison_installation',
        label: 'Livraison et installation sur place',
        type: 'boolean',
      },
      {
        key: 'degustation_prealable',
        label: 'Propose une dégustation préalable',
        type: 'boolean',
      },
    ],
  },
]

const BARMAN_COCKTAILS_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Services',
    fields: [
      {
        key: 'type_bar',
        label: 'Types de bar',
        type: 'multi-select',
        options: opts('Bar à cocktails', 'Bar à champagne', 'Bar à mocktails (sans alcool)', 'Bar à vins', 'Flair bartending', 'Molecular mixology', 'Bar mobile'),
      },
      {
        key: 'inclus',
        label: 'Inclus dans la prestation',
        type: 'multi-select',
        options: opts('Barman(s)', 'Verrerie', 'Ingrédients', 'Glace', 'Décoration du bar', 'Menu personnalisé'),
      },
    ],
  },
  {
    title: 'Options',
    fields: [
      {
        key: 'sans_alcool',
        label: 'Propose des options sans alcool',
        type: 'boolean',
      },
      {
        key: 'halal_friendly',
        label: 'Options halal-friendly (100% sans alcool possible)',
        type: 'boolean',
      },
    ],
  },
]

const FOOD_TRUCK_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Cuisine & Options',
    fields: [
      {
        key: 'type_cuisine',
        label: 'Type de cuisine',
        type: 'multi-select',
        options: opts('Burgers', 'Pizza', 'Tacos / Tex-Mex', 'Crêpes', 'Oriental', 'Asiatique', 'Africain', 'BBQ', 'Fruits de mer', 'Végétarien', 'Glaces'),
      },
      {
        key: 'regime_alimentaire',
        label: 'Régimes gérés',
        type: 'multi-select',
        options: opts('Halal', 'Casher', 'Végétarien', 'Végan', 'Sans gluten'),
      },
      {
        key: 'max_personnes',
        label: 'Capacité max de service',
        type: 'number',
        suffix: 'personnes',
        min: 10,
        max: 1000,
      },
    ],
  },
]

// ============================================================
// MUSIQUE & ANIMATION
// ============================================================

const DJ_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Style & Répertoire',
    fields: [
      {
        key: 'styles_musicaux',
        label: 'Styles musicaux maîtrisés',
        type: 'multi-select',
        options: opts('Oriental / Raï', 'Afrobeat / Afro', 'Bollywood', 'Zouk / Kompa', 'RnB / Hip-Hop', 'Pop / Dance', 'Électro / House', 'Reggaeton / Latino', 'Variété française', 'Classique / Jazz', 'Klezmer', 'Chaabi', 'Gnawa'),
      },
      {
        key: 'animations',
        label: 'Animations proposées',
        type: 'multi-select',
        options: opts('MC / Animation micro', 'Karaoké', 'Jeux interactifs', 'Mapping vidéo', 'Effets lumière', 'Machine à fumée', 'Confettis / CO2'),
      },
    ],
  },
  {
    title: 'Équipement & Logistique',
    fields: [
      {
        key: 'equipement',
        label: 'Équipement fourni',
        type: 'multi-select',
        options: opts('Sonorisation complète', 'Éclairage scénique', 'Écran LED', 'Micro sans fil', 'Table de mixage pro'),
      },
      {
        key: 'duree_max',
        label: 'Durée max de prestation',
        type: 'number',
        suffix: 'heures',
        min: 1,
        max: 15,
      },
    ],
  },
]

const CHANTEUR_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Répertoire & Style',
    fields: [
      {
        key: 'styles_musicaux',
        label: 'Répertoire musical',
        type: 'multi-select',
        options: opts('Oriental / Arabe', 'Raï', 'Chaabi', 'Gnawa', 'Afrobeat', 'Gospel', 'Jazz / Soul', 'Pop / Variété', 'Classique / Opéra', 'RnB', 'Reggae', 'Bollywood', 'Celtique / Folk'),
      },
      {
        key: 'type_prestation',
        label: 'Type de prestation',
        type: 'multi-select',
        options: opts('Cérémonie (acoustique)', 'Cocktail / Ambiance', 'Soirée dansante', 'Entrée des mariés', 'Première danse'),
      },
    ],
  },
  {
    title: 'Formation',
    fields: [
      {
        key: 'formation',
        label: 'Formation',
        type: 'single-select',
        options: opts('Solo', 'Duo', 'Trio', 'Groupe (4+)', 'Avec musiciens', 'Sur bande'),
      },
      {
        key: 'instruments',
        label: 'Instruments',
        type: 'multi-select',
        options: opts('Guitare', 'Piano / Clavier', 'Oud', 'Darbouka', 'Violon', 'Saxophone', 'Batterie', 'Derbouka', 'Bendir'),
      },
    ],
  },
]

// ============================================================
// BEAUTÉ & STYLE
// ============================================================

const COIFFURE_MAQUILLAGE_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Services',
    fields: [
      {
        key: 'prestations',
        label: 'Prestations proposées',
        type: 'multi-select',
        options: opts('Maquillage mariée', 'Coiffure mariée', 'Maquillage invitées', 'Coiffure invitées', 'Essai maquillage', 'Essai coiffure', 'Pose de faux cils', 'Extensions capillaires', 'Maquillage marié'),
      },
      {
        key: 'styles',
        label: 'Styles maîtrisés',
        type: 'multi-select',
        options: opts('Naturel / No makeup', 'Glamour', 'Oriental / Libanais', 'Africain / Bold', 'Bollywood', 'Classique / Chic', 'Bohème', 'Vintage'),
      },
    ],
  },
  {
    title: 'Types de peaux & cheveux',
    fields: [
      {
        key: 'types_peau',
        label: 'Expertise teint',
        type: 'multi-select',
        options: opts('Peaux claires', 'Peaux mates', 'Peaux noires', 'Peaux asiatiques', 'Tous types de peaux'),
      },
      {
        key: 'types_cheveux',
        label: 'Expertise cheveux',
        type: 'multi-select',
        options: opts('Cheveux lisses', 'Cheveux bouclés', 'Cheveux crépus / afro', 'Cheveux avec voile / hijab', 'Tous types'),
      },
      {
        key: 'deplacement',
        label: 'Se déplace sur le lieu de préparation',
        type: 'boolean',
      },
    ],
  },
]

const ROBE_MARIEE_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Collections & Styles',
    fields: [
      {
        key: 'type_service',
        label: 'Type de service',
        type: 'multi-select',
        options: opts('Sur mesure', 'Prêt-à-porter', 'Location', 'Retouches', 'Accessoires'),
      },
      {
        key: 'styles',
        label: 'Styles proposés',
        type: 'multi-select',
        options: opts('Princesse', 'Bohème', 'Sirène', 'Minimaliste', 'Vintage', 'Oriental / Caftan', 'Moderne', 'Grande taille'),
      },
    ],
  },
  {
    title: 'Options',
    fields: [
      {
        key: 'essayage',
        label: 'Nombre d\'essayages inclus',
        type: 'number',
        min: 1,
        max: 10,
        suffix: 'essayages',
      },
      {
        key: 'tenues_tradition',
        label: 'Tenues traditionnelles proposées',
        type: 'multi-select',
        options: opts('Caftan', 'Takchita', 'Karakou', 'Lehenga / Sari', 'Robe africaine', 'Robe antillaise'),
      },
    ],
  },
]

// ============================================================
// DECORATION & FLEURS
// ============================================================

const FLEURISTE_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Services',
    fields: [
      {
        key: 'prestations',
        label: 'Prestations proposées',
        type: 'multi-select',
        options: opts('Bouquet de mariée', 'Décoration cérémonie', 'Décoration réception', 'Centres de table', 'Arche florale', 'Boutonnières', 'Décoration voiture', 'Guirlandes / Suspensions', 'Mur de fleurs'),
      },
      {
        key: 'style_decoration',
        label: 'Styles de décoration',
        type: 'multi-select',
        options: opts('Romantique', 'Bohème / Champêtre', 'Moderne / Minimaliste', 'Luxe / Opulent', 'Oriental', 'Africain', 'Tropical', 'Vintage'),
      },
    ],
  },
  {
    title: 'Options',
    fields: [
      {
        key: 'types_fleurs',
        label: 'Types de fleurs',
        type: 'multi-select',
        options: opts('Fleurs fraîches', 'Fleurs séchées', 'Fleurs artificielles haut de gamme', 'Mix fraîches & séchées'),
      },
      {
        key: 'installation_demontage',
        label: 'Installation et démontage inclus',
        type: 'boolean',
      },
    ],
  },
]

// ============================================================
// LIEUX & MATERIEL
// ============================================================

const SALLE_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Caractéristiques',
    fields: [
      {
        key: 'type_lieu',
        label: 'Type de lieu',
        type: 'multi-select',
        options: opts('Salle de réception', 'Château', 'Domaine', 'Restaurant', 'Hôtel', 'Rooftop', 'Jardin / Extérieur', 'Salle modulable', 'Loft', 'Péniche'),
      },
      {
        key: 'capacite_assise',
        label: 'Capacité assise max',
        type: 'number',
        suffix: 'personnes',
        min: 10,
        max: 5000,
      },
      {
        key: 'capacite_debout',
        label: 'Capacité debout max',
        type: 'number',
        suffix: 'personnes',
        min: 10,
        max: 5000,
      },
    ],
  },
  {
    title: 'Espaces & Services',
    fields: [
      {
        key: 'espaces',
        label: 'Espaces disponibles',
        type: 'multi-select',
        options: opts('Espace cérémonie', 'Espace cocktail', 'Salle de danse', 'Espace extérieur', 'Suite nuptiale', 'Hébergement invités', 'Parking privé', 'Cuisine équipée'),
      },
      {
        key: 'options_incluses',
        label: 'Inclus dans la location',
        type: 'multi-select',
        options: opts('Tables & chaises', 'Sonorisation', 'Éclairage', 'Traiteur imposé', 'Traiteur libre', 'Coordination jour J', 'Ménage'),
      },
      {
        key: 'ceremonies_possibles',
        label: 'Cérémonies possibles',
        type: 'multi-select',
        options: opts('Cérémonie laïque', 'Cérémonie religieuse', 'Houppa', 'Cérémonie hindoue', 'Nikah', 'Henné'),
      },
    ],
  },
]

const LOCATION_MATERIEL_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Matériel disponible',
    fields: [
      {
        key: 'types_materiel',
        label: 'Types de matériel',
        type: 'multi-select',
        options: opts('Mobilier (tables, chaises)', 'Vaisselle & verrerie', 'Nappage & linge', 'Tentes & chapiteaux', 'Sonorisation', 'Éclairage', 'Photobooth', 'Décoration', 'Amariya / Trône', 'Dais / Houppa'),
      },
      {
        key: 'livraison_installation',
        label: 'Livraison et installation incluses',
        type: 'boolean',
      },
    ],
  },
]

const LOCATION_VEHICULES_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Véhicules',
    fields: [
      {
        key: 'types_vehicules',
        label: 'Types de véhicules',
        type: 'multi-select',
        options: opts('Berline de luxe', 'Voiture vintage / Oldtimer', 'Limousine', 'SUV / 4x4', 'Cabriolet', 'Rolls Royce / Bentley', 'Calèche', 'Moto / Side-car', 'Bus / Minivan'),
      },
      {
        key: 'services_inclus',
        label: 'Services inclus',
        type: 'multi-select',
        options: opts('Chauffeur', 'Décoration véhicule', 'Champagne à bord', 'Tapis rouge'),
      },
    ],
  },
]

// ============================================================
// TRADITIONS
// ============================================================

const NEGGAFA_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Services & Traditions',
    fields: [
      {
        key: 'traditions_maitrisees',
        label: 'Traditions maîtrisées',
        type: 'multi-select',
        options: opts('Marocaine', 'Algérienne', 'Tunisienne', 'Turque', 'Libanaise', 'Égyptienne'),
      },
      {
        key: 'prestations',
        label: 'Prestations incluses',
        type: 'multi-select',
        options: opts('Habillage de la mariée', 'Changements de tenues', 'Amariya / Portage', 'Animation henné', 'Maquillage', 'Coiffure', 'Gestion de la cérémonie', 'Coordination des traditions'),
      },
    ],
  },
  {
    title: 'Tenues & Options',
    fields: [
      {
        key: 'tenues_fournies',
        label: 'Tenues fournies',
        type: 'multi-select',
        options: opts('Caftans', 'Takchita', 'Karakou', 'Keswa', 'Bindalli', 'Jabador marié', 'Bijoux traditionnels'),
      },
      {
        key: 'nb_tenues',
        label: 'Nombre de tenues incluses',
        type: 'number',
        min: 1,
        max: 15,
        suffix: 'tenues',
      },
    ],
  },
]

const HENNA_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Styles & Techniques',
    fields: [
      {
        key: 'styles_henne',
        label: 'Styles de henné',
        type: 'multi-select',
        options: opts('Marocain / Fassi', 'Indien / Mehndi', 'Soudanais', 'Moderne / Fusion', 'Arabesque', 'Minimaliste', 'Blanc (henné blanc)'),
      },
      {
        key: 'zones_application',
        label: 'Zones d\'application',
        type: 'multi-select',
        options: opts('Mains', 'Pieds', 'Bras complets', 'Avant-bras', 'Dos', 'Personnalisé'),
      },
    ],
  },
  {
    title: 'Options',
    fields: [
      {
        key: 'produit_naturel',
        label: 'Utilise uniquement du henné 100% naturel',
        type: 'boolean',
      },
      {
        key: 'soiree_henne',
        label: 'Propose l\'organisation de la soirée henné complète',
        type: 'boolean',
      },
    ],
  },
]

const MUSICIEN_TRADITIONNEL_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Répertoire & Instruments',
    fields: [
      {
        key: 'traditions_musicales',
        label: 'Traditions musicales',
        type: 'multi-select',
        options: opts('Arabo-andalou', 'Chaabi algérien', 'Chaabi marocain', 'Malouf', 'Gnawa', 'Raï', 'Musique turque', 'Musique libanaise', 'Musique égyptienne'),
      },
      {
        key: 'instruments',
        label: 'Instruments',
        type: 'multi-select',
        options: opts('Oud', 'Darbouka', 'Bendir', 'Qanûn', 'Ney / Flûte', 'Violon oriental', 'Guembri', 'Synthé / Clavier'),
      },
      {
        key: 'formation',
        label: 'Formation',
        type: 'single-select',
        options: opts('Solo', 'Duo', 'Trio', 'Orchestre (4+)'),
      },
    ],
  },
]

// ============================================================
// SPECTACLE & EFFETS SPECIAUX
// ============================================================

const ARTIFICIER_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Spectacles proposés',
    fields: [
      {
        key: 'types_spectacles',
        label: 'Types de spectacles',
        type: 'multi-select',
        options: opts('Feu d\'artifice classique', 'Feu d\'artifice intérieur (cold sparks)', 'Fontaines à étincelles', 'Gerbes d\'étincelles', 'Spectacle pyromusical', 'Feux de Bengale', 'Cascades pyrotechniques'),
      },
      {
        key: 'duree_spectacle',
        label: 'Durée du spectacle',
        type: 'single-select',
        options: opts('3-5 minutes', '5-10 minutes', '10-15 minutes', '15-20 minutes', 'Personnalisé'),
      },
      {
        key: 'interieur_possible',
        label: 'Possible en intérieur (cold sparks)',
        type: 'boolean',
      },
    ],
  },
]

// ============================================================
// SERVICES
// ============================================================

const WEDDING_PLANNER_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Formules',
    fields: [
      {
        key: 'formules',
        label: 'Formules proposées',
        type: 'multi-select',
        options: opts('Organisation complète', 'Organisation partielle', 'Coordination jour J', 'Consulting / Coaching', 'Destination wedding'),
      },
      {
        key: 'traditions_gerees',
        label: 'Traditions de mariage gérées',
        type: 'multi-select',
        options: opts('Mariage français / Civil', 'Mariage maghrébin', 'Mariage africain', 'Mariage indien', 'Mariage juif', 'Mariage antillais', 'Mariage mixte / Multiculturel'),
      },
    ],
  },
  {
    title: 'Capacité',
    fields: [
      {
        key: 'max_invites',
        label: 'Capacité max gérée',
        type: 'number',
        suffix: 'invités',
        min: 20,
        max: 2000,
      },
      {
        key: 'nb_mariages_simultanes',
        label: 'Mariages gérés simultanément (max)',
        type: 'number',
        min: 1,
        max: 20,
      },
    ],
  },
]

const OFFICIANT_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Cérémonies',
    fields: [
      {
        key: 'types_ceremonies',
        label: 'Types de cérémonies',
        type: 'multi-select',
        options: opts('Cérémonie laïque', 'Cérémonie symbolique', 'Cérémonie multiculturelle', 'Renouvellement de vœux', 'Cérémonie bilingue', 'Cérémonie spirituelle non religieuse'),
      },
      {
        key: 'langues',
        label: 'Langues parlées',
        type: 'multi-select',
        options: opts('Français', 'Anglais', 'Arabe', 'Espagnol', 'Italien', 'Portugais', 'Turc', 'Hindi'),
      },
    ],
  },
]

const COACH_BAL_FIELDS: ServiceFieldGroup[] = [
  {
    title: 'Danses & Formules',
    fields: [
      {
        key: 'styles_danse',
        label: 'Styles de danse proposés',
        type: 'multi-select',
        options: opts('Valse', 'Tango', 'Salsa / Bachata', 'Rock', 'Danse contemporaine', 'Chorégraphie personnalisée', 'Mix / Medley', 'Flash mob'),
      },
      {
        key: 'formule',
        label: 'Formules',
        type: 'multi-select',
        options: opts('Cours individuel couple', 'Cours collectif (flash mob)', 'Chorégraphie sur mesure', 'Cours en visio', 'Présence jour J'),
      },
      {
        key: 'nb_seances',
        label: 'Nombre de séances recommandé',
        type: 'number',
        min: 1,
        max: 20,
        suffix: 'séances',
      },
    ],
  },
]

// ============================================================
// MAPPING PRINCIPAL : service_type → fields config
// ============================================================

export const SERVICE_FIELD_GROUPS: Record<string, ServiceFieldGroup[]> = {
  // Photo & Vidéo
  photographe: PHOTOGRAPHE_FIELDS,
  videaste: VIDEASTE_FIELDS,
  pilote_drone: PILOTE_DRONE_FIELDS,

  // Traiteur & Pâtisserie
  traiteur: TRAITEUR_FIELDS,
  patissier: PATISSIER_FIELDS,
  barman_cocktails: BARMAN_COCKTAILS_FIELDS,
  food_truck: FOOD_TRUCK_FIELDS,
  candy_bar: FOOD_TRUCK_FIELDS, // même structure simplifiée
  glacier: FOOD_TRUCK_FIELDS,

  // Musique & Animation
  dj: DJ_FIELDS,
  chanteur: CHANTEUR_FIELDS,
  gospel_chorale: CHANTEUR_FIELDS,

  // Beauté & Style
  coiffure_maquillage: COIFFURE_MAQUILLAGE_FIELDS,
  robe_mariee: ROBE_MARIEE_FIELDS,
  bijoutier: ROBE_MARIEE_FIELDS,

  // Décoration & Fleurs
  fleuriste: FLEURISTE_FIELDS,

  // Lieux & Matériel
  salle: SALLE_FIELDS,
  location_materiel: LOCATION_MATERIEL_FIELDS,
  location_vehicules: LOCATION_VEHICULES_FIELDS,

  // Traditions Maghreb & Orient
  neggafa: NEGGAFA_FIELDS,
  negafa_algerienne: NEGGAFA_FIELDS,
  negafa_marocaine: NEGGAFA_FIELDS,
  negafa_tunisienne: NEGGAFA_FIELDS,
  henna_artiste: HENNA_FIELDS,
  henna_marocain: HENNA_FIELDS,
  henna_indien: HENNA_FIELDS,
  henna_soudanais: HENNA_FIELDS,
  zaffa: MUSICIEN_TRADITIONNEL_FIELDS,
  musicien_traditionnel: MUSICIEN_TRADITIONNEL_FIELDS,
  groupe_chaabi: MUSICIEN_TRADITIONNEL_FIELDS,
  groupe_andalou: MUSICIEN_TRADITIONNEL_FIELDS,
  groupe_gnawa: MUSICIEN_TRADITIONNEL_FIELDS,
  danseuse_orientale: CHANTEUR_FIELDS,
  troupe_folklorique: CHANTEUR_FIELDS,

  // Traditions Afrique
  griot: MUSICIEN_TRADITIONNEL_FIELDS,
  percussionnistes: MUSICIEN_TRADITIONNEL_FIELDS,
  danseurs_africains: CHANTEUR_FIELDS,
  traiteur_africain: TRAITEUR_FIELDS,

  // Traditions Asie & Inde
  sangeet_dj: DJ_FIELDS,
  danseurs_bollywood: CHANTEUR_FIELDS,
  traiteur_indien: TRAITEUR_FIELDS,
  traiteur_asiatique: TRAITEUR_FIELDS,

  // Autres traditions
  groupe_zouk: CHANTEUR_FIELDS,
  musicien_klezmer: MUSICIEN_TRADITIONNEL_FIELDS,
  musicien_slave: MUSICIEN_TRADITIONNEL_FIELDS,
  mariachi: MUSICIEN_TRADITIONNEL_FIELDS,
  danseurs_latino: CHANTEUR_FIELDS,
  traiteur_antillais: TRAITEUR_FIELDS,

  // Spectacle & Effets
  artificier: ARTIFICIER_FIELDS,
  fontaine_etincelles: ARTIFICIER_FIELDS,
  fumigenes: ARTIFICIER_FIELDS,
  spectacle_feu: ARTIFICIER_FIELDS,
  laser_show: ARTIFICIER_FIELDS,

  // Services
  wedding_planner: WEDDING_PLANNER_FIELDS,
  officiant: OFFICIANT_FIELDS,
  coach_ouverture_bal: COACH_BAL_FIELDS,
}

// Helper: vérifier si un service_type a des champs spécifiques
export function hasServiceFields(serviceType: string): boolean {
  return serviceType in SERVICE_FIELD_GROUPS
}

// Helper: obtenir les groupes de champs pour un service_type
export function getServiceFieldGroups(serviceType: string): ServiceFieldGroup[] {
  return SERVICE_FIELD_GROUPS[serviceType] || []
}

// Helper: obtenir tous les champs (flat) pour un service_type
export function getServiceFields(serviceType: string): ServiceFieldConfig[] {
  return getServiceFieldGroups(serviceType).flatMap(g => g.fields)
}

// Helper: compter les champs remplis pour le score de complétion
export function getServiceDetailsCompletion(serviceType: string, details: Record<string, unknown>): { filled: number; total: number } {
  const fields = getServiceFields(serviceType)
  if (fields.length === 0) return { filled: 0, total: 0 }

  let filled = 0
  for (const field of fields) {
    const value = details[field.key]
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value) && value.length === 0) continue
    filled++
  }

  return { filled, total: fields.length }
}
