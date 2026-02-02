// Spécialités et sous-catégories par métier pour l'ultra-personnalisation des profils prestataires
// Chaque métier a des groupes de spécialités avec des options prédéfinies

export interface SpecialtyOption {
  value: string
  label: string
}

export interface SpecialtyGroup {
  id: string
  label: string
  description?: string
  multiSelect: boolean // true = peut sélectionner plusieurs, false = choix unique
  options: SpecialtyOption[]
}

export interface ServiceSpecialties {
  serviceType: string
  groups: SpecialtyGroup[]
}

// ============================================================================
// PHOTO & VIDÉO
// ============================================================================

const PHOTOGRAPHE_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'style_photo',
    label: 'Style photographique',
    multiSelect: true,
    options: [
      { value: 'reportage', label: 'Reportage / Photojournalisme' },
      { value: 'pose', label: 'Photos posées / Portraits' },
      { value: 'artistique', label: 'Artistique / Créatif' },
      { value: 'fine_art', label: 'Fine Art' },
      { value: 'lifestyle', label: 'Lifestyle / Naturel' },
      { value: 'moody', label: 'Moody / Sombre' },
      { value: 'lumineux', label: 'Lumineux / Airy' },
      { value: 'vintage', label: 'Vintage / Rétro' },
      { value: 'editorial', label: 'Éditorial / Magazine' },
      { value: 'documentary', label: 'Documentaire' },
    ],
  },
  {
    id: 'techniques_photo',
    label: 'Techniques & Équipements',
    multiSelect: true,
    options: [
      { value: 'drone', label: 'Drone / Aérien' },
      { value: 'argentique', label: 'Argentique / Film' },
      { value: 'instantane', label: 'Instantané / Polaroid' },
      { value: 'noir_blanc', label: 'Noir & Blanc' },
      { value: 'flash_creatif', label: 'Flash créatif' },
      { value: 'low_light', label: 'Spécialiste basse lumière' },
      { value: 'second_shooter', label: 'Travaille avec second photographe' },
    ],
  },
  {
    id: 'livrables_photo',
    label: 'Livrables proposés',
    multiSelect: true,
    options: [
      { value: 'album_luxe', label: 'Album luxe / Fine Art' },
      { value: 'album_standard', label: 'Album standard' },
      { value: 'tirages', label: 'Tirages d\'art' },
      { value: 'galerie_en_ligne', label: 'Galerie en ligne privée' },
      { value: 'cle_usb', label: 'Clé USB personnalisée' },
      { value: 'photos_imprimees', label: 'Photos imprimées' },
      { value: 'livre_parents', label: 'Livre pour les parents' },
    ],
  },
  {
    id: 'couverture_photo',
    label: 'Type de couverture',
    multiSelect: true,
    options: [
      { value: 'journee_complete', label: 'Journée complète' },
      { value: 'demi_journee', label: 'Demi-journée' },
      { value: 'ceremonie_seule', label: 'Cérémonie uniquement' },
      { value: 'cocktail_soiree', label: 'Cocktail & Soirée' },
      { value: 'seance_couple', label: 'Séance couple / Engagement' },
      { value: 'day_after', label: 'Day After / Trash the dress' },
      { value: 'evjf_evg', label: 'EVJF / EVG' },
    ],
  },
]

const VIDEASTE_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'style_video',
    label: 'Style de film',
    multiSelect: true,
    options: [
      { value: 'cinematographique', label: 'Cinématographique' },
      { value: 'documentaire', label: 'Documentaire' },
      { value: 'storytelling', label: 'Storytelling / Narratif' },
      { value: 'clip_musical', label: 'Style clip musical' },
      { value: 'reportage_video', label: 'Reportage classique' },
      { value: 'artistique_video', label: 'Artistique / Expérimental' },
      { value: 'moody_video', label: 'Moody / Atmosphérique' },
      { value: 'lumineux_video', label: 'Lumineux / Joyeux' },
      { value: 'vintage_video', label: 'Vintage / Super 8' },
    ],
  },
  {
    id: 'techniques_video',
    label: 'Techniques & Équipements',
    multiSelect: true,
    options: [
      { value: 'drone_video', label: 'Drone / Prises aériennes' },
      { value: 'steadicam', label: 'Steadicam / Gimbal' },
      { value: 'multicam', label: 'Multi-caméras' },
      { value: 'slow_motion', label: 'Slow motion' },
      { value: 'timelapse', label: 'Timelapse / Hyperlapse' },
      { value: 'son_pro', label: 'Captation son professionnel' },
      { value: 'eclairage_video', label: 'Éclairage cinéma' },
    ],
  },
  {
    id: 'livrables_video',
    label: 'Livrables proposés',
    multiSelect: true,
    options: [
      { value: 'film_long', label: 'Film long (30min+)' },
      { value: 'film_moyen', label: 'Film moyen (10-30min)' },
      { value: 'teaser', label: 'Teaser / Trailer (3-5min)' },
      { value: 'highlights', label: 'Highlights (5-10min)' },
      { value: 'reels_instagram', label: 'Reels Instagram' },
      { value: 'tiktok', label: 'Format TikTok' },
      { value: 'clips_discours', label: 'Clips discours séparés' },
      { value: 'rushes', label: 'Rushes bruts inclus' },
    ],
  },
]

// ============================================================================
// TRAITEUR & PÂTISSERIE
// ============================================================================

const TRAITEUR_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'type_cuisine',
    label: 'Type de cuisine',
    multiSelect: true,
    options: [
      { value: 'gastronomique', label: 'Gastronomique' },
      { value: 'bistronomique', label: 'Bistronomique' },
      { value: 'traditionnel', label: 'Traditionnel / Terroir' },
      { value: 'fusion', label: 'Fusion' },
      { value: 'moderne', label: 'Cuisine moderne / Créative' },
      { value: 'street_food', label: 'Street food / Food truck' },
      { value: 'finger_food', label: 'Finger food' },
      { value: 'world_food', label: 'World food / International' },
    ],
  },
  {
    id: 'origine_culinaire',
    label: 'Spécialités culinaires',
    multiSelect: true,
    options: [
      { value: 'francaise', label: 'Cuisine française' },
      { value: 'mediterraneenne', label: 'Méditerranéenne' },
      { value: 'italienne', label: 'Italienne' },
      { value: 'orientale', label: 'Orientale / Libanaise' },
      { value: 'maghrebine', label: 'Maghrébine' },
      { value: 'africaine', label: 'Africaine' },
      { value: 'asiatique', label: 'Asiatique' },
      { value: 'indienne', label: 'Indienne' },
      { value: 'japonaise', label: 'Japonaise' },
      { value: 'mexicaine', label: 'Mexicaine' },
      { value: 'antillaise', label: 'Antillaise / Créole' },
      { value: 'americaine', label: 'Américaine' },
      { value: 'espagnole', label: 'Espagnole' },
      { value: 'portugaise', label: 'Portugaise' },
      { value: 'grecque', label: 'Grecque' },
      { value: 'turque', label: 'Turque' },
      { value: 'persane', label: 'Persane / Iranienne' },
      { value: 'vietnamienne', label: 'Vietnamienne' },
      { value: 'thai', label: 'Thaïlandaise' },
      { value: 'coreenne', label: 'Coréenne' },
    ],
  },
  {
    id: 'regimes',
    label: 'Régimes alimentaires',
    description: 'Régimes que vous pouvez proposer',
    multiSelect: true,
    options: [
      { value: 'halal', label: 'Halal' },
      { value: 'casher', label: 'Casher' },
      { value: 'vegetarien', label: 'Végétarien' },
      { value: 'vegan', label: 'Végan' },
      { value: 'sans_gluten', label: 'Sans gluten' },
      { value: 'sans_lactose', label: 'Sans lactose' },
      { value: 'sans_porc', label: 'Sans porc' },
      { value: 'sans_alcool', label: 'Sans alcool' },
      { value: 'bio', label: 'Bio' },
      { value: 'locavore', label: 'Locavore / Circuit court' },
      { value: 'allergies', label: 'Gestion des allergies' },
    ],
  },
  {
    id: 'style_service',
    label: 'Style de service',
    multiSelect: true,
    options: [
      { value: 'assiette', label: 'Service à l\'assiette' },
      { value: 'buffet', label: 'Buffet' },
      { value: 'cocktail', label: 'Cocktail dînatoire' },
      { value: 'food_truck', label: 'Food truck' },
      { value: 'stations', label: 'Stations / Îlots' },
      { value: 'family_style', label: 'Family style / À partager' },
      { value: 'brunch', label: 'Brunch' },
      { value: 'barbecue', label: 'Barbecue / Plancha' },
      { value: 'mechoui', label: 'Méchoui' },
      { value: 'show_cooking', label: 'Show cooking / Live cooking' },
    ],
  },
  {
    id: 'services_inclus',
    label: 'Services inclus',
    multiSelect: true,
    options: [
      { value: 'personnel', label: 'Personnel de service' },
      { value: 'vaisselle', label: 'Vaisselle & Verrerie' },
      { value: 'nappage', label: 'Nappage' },
      { value: 'boissons', label: 'Boissons (vin, champagne...)' },
      { value: 'bar', label: 'Bar / Barman' },
      { value: 'wedding_cake', label: 'Wedding cake inclus' },
      { value: 'piece_montee', label: 'Pièce montée incluse' },
      { value: 'vin_honneur', label: 'Vin d\'honneur' },
      { value: 'brunch_lendemain', label: 'Brunch du lendemain' },
    ],
  },
]

const PATISSIER_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'type_creation',
    label: 'Types de créations',
    multiSelect: true,
    options: [
      { value: 'wedding_cake', label: 'Wedding cake' },
      { value: 'piece_montee', label: 'Pièce montée' },
      { value: 'naked_cake', label: 'Naked cake' },
      { value: 'drip_cake', label: 'Drip cake' },
      { value: 'gateau_etages', label: 'Gâteau à étages' },
      { value: 'cupcakes', label: 'Cupcakes' },
      { value: 'cake_pops', label: 'Cake pops' },
      { value: 'macarons', label: 'Macarons' },
      { value: 'choux', label: 'Choux / Chouquettes' },
      { value: 'mignardises', label: 'Mignardises / Petits fours' },
      { value: 'candy_bar', label: 'Candy bar' },
      { value: 'dessert_table', label: 'Table de desserts' },
    ],
  },
  {
    id: 'style_patisserie',
    label: 'Style de pâtisserie',
    multiSelect: true,
    options: [
      { value: 'classique', label: 'Classique / Traditionnel' },
      { value: 'moderne', label: 'Moderne / Design' },
      { value: 'boheme', label: 'Bohème / Rustique' },
      { value: 'romantique', label: 'Romantique / Floral' },
      { value: 'minimaliste', label: 'Minimaliste' },
      { value: 'luxe', label: 'Luxe / Haute couture' },
      { value: 'fantaisie', label: 'Fantaisie / Original' },
      { value: 'vintage_patisserie', label: 'Vintage' },
    ],
  },
  {
    id: 'saveurs',
    label: 'Spécialités de saveurs',
    multiSelect: true,
    options: [
      { value: 'chocolat', label: 'Chocolat' },
      { value: 'fruits', label: 'Fruits frais' },
      { value: 'fruits_exotiques', label: 'Fruits exotiques' },
      { value: 'caramel', label: 'Caramel' },
      { value: 'praline', label: 'Praliné' },
      { value: 'cafe', label: 'Café' },
      { value: 'pistache', label: 'Pistache' },
      { value: 'fleur_oranger', label: 'Fleur d\'oranger' },
      { value: 'rose', label: 'Rose' },
      { value: 'matcha', label: 'Matcha' },
      { value: 'epices', label: 'Épices' },
    ],
  },
  {
    id: 'regimes_patisserie',
    label: 'Options alimentaires',
    multiSelect: true,
    options: [
      { value: 'sans_gluten_pat', label: 'Sans gluten' },
      { value: 'vegan_pat', label: 'Végan' },
      { value: 'sans_lactose_pat', label: 'Sans lactose' },
      { value: 'halal_pat', label: 'Halal' },
      { value: 'casher_pat', label: 'Casher' },
      { value: 'sucre_reduit', label: 'Sucre réduit' },
      { value: 'bio_pat', label: 'Bio' },
    ],
  },
  {
    id: 'patisseries_traditionnelles',
    label: 'Pâtisseries traditionnelles',
    multiSelect: true,
    options: [
      { value: 'patisserie_orientale', label: 'Pâtisseries orientales' },
      { value: 'patisserie_maghrebine', label: 'Pâtisseries maghrébines' },
      { value: 'baklava', label: 'Baklava' },
      { value: 'cornes_gazelle', label: 'Cornes de gazelle' },
      { value: 'patisserie_indienne', label: 'Pâtisseries indiennes' },
      { value: 'patisserie_asiatique', label: 'Pâtisseries asiatiques' },
      { value: 'patisserie_africaine', label: 'Pâtisseries africaines' },
      { value: 'patisserie_antillaise', label: 'Pâtisseries antillaises' },
    ],
  },
]

// ============================================================================
// MUSIQUE & ANIMATION
// ============================================================================

const DJ_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'genres_musicaux',
    label: 'Genres musicaux',
    multiSelect: true,
    options: [
      { value: 'variete_francaise', label: 'Variété française' },
      { value: 'variete_internationale', label: 'Variété internationale' },
      { value: 'pop', label: 'Pop' },
      { value: 'rnb', label: 'R&B / Soul' },
      { value: 'hip_hop', label: 'Hip-Hop / Rap' },
      { value: 'electro', label: 'Électro / House' },
      { value: 'disco', label: 'Disco / Funk' },
      { value: 'rock', label: 'Rock' },
      { value: 'annees_80_90', label: 'Années 80-90' },
      { value: 'latino', label: 'Latino (reggaeton, salsa...)' },
      { value: 'oriental', label: 'Oriental / Raï' },
      { value: 'afro', label: 'Afro / Afrobeats' },
      { value: 'antillais', label: 'Antillais (zouk, kompa)' },
      { value: 'bollywood', label: 'Bollywood' },
      { value: 'maghrebin', label: 'Maghrébin (chaabi, gnawa)' },
      { value: 'turc', label: 'Turc' },
      { value: 'portugais', label: 'Portugais' },
      { value: 'jazz', label: 'Jazz / Lounge' },
      { value: 'classique', label: 'Classique' },
    ],
  },
  {
    id: 'type_prestation',
    label: 'Type de prestation',
    multiSelect: true,
    options: [
      { value: 'ceremonie_dj', label: 'Musique cérémonie' },
      { value: 'cocktail_dj', label: 'Ambiance cocktail / Vin d\'honneur' },
      { value: 'repas', label: 'Ambiance repas' },
      { value: 'soiree_dansante', label: 'Soirée dansante' },
      { value: 'after', label: 'After party' },
      { value: 'brunch_dj', label: 'Brunch' },
    ],
  },
  {
    id: 'equipement_dj',
    label: 'Équipement fourni',
    multiSelect: true,
    options: [
      { value: 'sono', label: 'Sonorisation complète' },
      { value: 'eclairage', label: 'Éclairage / Jeux de lumière' },
      { value: 'laser', label: 'Laser' },
      { value: 'fumee', label: 'Machine à fumée' },
      { value: 'confettis', label: 'Machine à confettis' },
      { value: 'micro', label: 'Micro sans fil' },
      { value: 'ecran_led', label: 'Écran LED' },
      { value: 'pupitre_lumineux', label: 'Pupitre DJ lumineux' },
    ],
  },
  {
    id: 'services_dj',
    label: 'Services additionnels',
    multiSelect: true,
    options: [
      { value: 'mc', label: 'MC / Animateur' },
      { value: 'coordination', label: 'Coordination avec Wedding Planner' },
      { value: 'playlist_perso', label: 'Playlist personnalisée' },
      { value: 'reperage', label: 'Repérage du lieu' },
      { value: 'backup', label: 'Équipement de backup' },
    ],
  },
]

const ANIMATION_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'type_animation',
    label: 'Types d\'animations',
    multiSelect: true,
    options: [
      { value: 'photobooth', label: 'Photobooth' },
      { value: 'miroir_magique', label: 'Miroir magique / Selfie mirror' },
      { value: 'borne_360', label: 'Borne 360°' },
      { value: 'polaroid', label: 'Polaroid / Instantané' },
      { value: 'karaoke', label: 'Karaoké' },
      { value: 'jeux', label: 'Jeux & Quiz' },
      { value: 'casino', label: 'Soirée casino' },
      { value: 'magicien', label: 'Magie close-up' },
      { value: 'caricaturiste', label: 'Caricaturiste' },
      { value: 'feu_artifice', label: 'Feu d\'artifice' },
      { value: 'lanternes', label: 'Lâcher de lanternes' },
      { value: 'danseurs', label: 'Danseurs / Show' },
      { value: 'flashmob', label: 'Flashmob' },
      { value: 'premiere_danse', label: 'Chorégraphie première danse' },
    ],
  },
  {
    id: 'style_animation',
    label: 'Style d\'animation',
    multiSelect: true,
    options: [
      { value: 'fun', label: 'Fun / Décalé' },
      { value: 'elegant', label: 'Élégant / Chic' },
      { value: 'interactif', label: 'Interactif' },
      { value: 'enfants', label: 'Adapté aux enfants' },
      { value: 'adultes', label: 'Réservé adultes' },
    ],
  },
]

// ============================================================================
// BEAUTÉ & STYLE
// ============================================================================

const COIFFURE_MAQUILLAGE_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'services_beaute',
    label: 'Services proposés',
    multiSelect: true,
    options: [
      { value: 'coiffure', label: 'Coiffure mariée' },
      { value: 'maquillage', label: 'Maquillage mariée' },
      { value: 'coiffure_maquillage', label: 'Forfait coiffure + maquillage' },
      { value: 'essais', label: 'Essais inclus' },
      { value: 'retouches', label: 'Retouches jour J' },
      { value: 'groupe', label: 'Maquillage/Coiffure demoiselles d\'honneur' },
      { value: 'meres', label: 'Maquillage/Coiffure mères' },
      { value: 'marie', label: 'Préparation du marié' },
    ],
  },
  {
    id: 'style_coiffure',
    label: 'Styles de coiffure',
    multiSelect: true,
    options: [
      { value: 'chignon', label: 'Chignon' },
      { value: 'chignon_flou', label: 'Chignon flou / Bohème' },
      { value: 'tresses', label: 'Tresses' },
      { value: 'cheveux_laches', label: 'Cheveux lâchés / Wavy' },
      { value: 'updo', label: 'Updo élaboré' },
      { value: 'vintage_coiffure', label: 'Vintage / Rétro' },
      { value: 'moderne_coiffure', label: 'Moderne / Sleek' },
      { value: 'princesse', label: 'Princesse' },
      { value: 'naturel', label: 'Naturel' },
    ],
  },
  {
    id: 'expertise_cheveux',
    label: 'Expertise cheveux',
    multiSelect: true,
    options: [
      { value: 'cheveux_afro', label: 'Cheveux afro / Crépus' },
      { value: 'cheveux_boucles', label: 'Cheveux bouclés / Frisés' },
      { value: 'cheveux_lisses', label: 'Cheveux lisses' },
      { value: 'cheveux_fins', label: 'Cheveux fins' },
      { value: 'cheveux_epais', label: 'Cheveux épais' },
      { value: 'extensions', label: 'Extensions / Rajouts' },
      { value: 'perruques', label: 'Perruques / Lace front' },
      { value: 'accessoires', label: 'Pose d\'accessoires (voile, bijoux...)' },
    ],
  },
  {
    id: 'style_maquillage',
    label: 'Styles de maquillage',
    multiSelect: true,
    options: [
      { value: 'naturel_maq', label: 'Naturel / No makeup makeup' },
      { value: 'glamour', label: 'Glamour' },
      { value: 'sophistique', label: 'Sophistiqué / Chic' },
      { value: 'boheme_maq', label: 'Bohème' },
      { value: 'vintage_maq', label: 'Vintage / Pin-up' },
      { value: 'smoky', label: 'Smoky eye' },
      { value: 'lumineux_maq', label: 'Lumineux / Glowy' },
      { value: 'dramatique', label: 'Dramatique / Bold' },
    ],
  },
  {
    id: 'expertise_peau',
    label: 'Expertise teints',
    multiSelect: true,
    options: [
      { value: 'peau_claire', label: 'Peaux claires' },
      { value: 'peau_medium', label: 'Peaux medium' },
      { value: 'peau_mate', label: 'Peaux mates' },
      { value: 'peau_foncee', label: 'Peaux foncées' },
      { value: 'peau_noire', label: 'Peaux noires' },
      { value: 'toutes_carnations', label: 'Toutes carnations' },
    ],
  },
  {
    id: 'produits_beaute',
    label: 'Type de produits',
    multiSelect: true,
    options: [
      { value: 'luxe_beaute', label: 'Marques luxe' },
      { value: 'bio_beaute', label: 'Bio / Naturel' },
      { value: 'vegan_beaute', label: 'Végan / Cruelty-free' },
      { value: 'waterproof', label: 'Longue tenue / Waterproof' },
      { value: 'hypoallergenique', label: 'Hypoallergénique' },
    ],
  },
]

const ROBE_MARIEE_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'type_tenues',
    label: 'Types de tenues',
    multiSelect: true,
    options: [
      { value: 'robe_mariee', label: 'Robe de mariée' },
      { value: 'costume_marie', label: 'Costume marié' },
      { value: 'robe_soiree', label: 'Robe de soirée / 2ème robe' },
      { value: 'accessoires_mariee', label: 'Accessoires mariée' },
      { value: 'voile', label: 'Voiles' },
      { value: 'chaussures', label: 'Chaussures de mariée' },
    ],
  },
  {
    id: 'style_robe',
    label: 'Styles de robes',
    multiSelect: true,
    options: [
      { value: 'princesse', label: 'Princesse / Ball gown' },
      { value: 'sirene', label: 'Sirène / Fourreau' },
      { value: 'empire', label: 'Empire' },
      { value: 'boheme_robe', label: 'Bohème' },
      { value: 'minimaliste_robe', label: 'Minimaliste' },
      { value: 'vintage_robe', label: 'Vintage' },
      { value: 'romantique_robe', label: 'Romantique' },
      { value: 'moderne_robe', label: 'Moderne / Épuré' },
      { value: 'glamour_robe', label: 'Glamour' },
      { value: 'rock', label: 'Rock / Edgy' },
    ],
  },
  {
    id: 'service_robe',
    label: 'Services',
    multiSelect: true,
    options: [
      { value: 'sur_mesure', label: 'Sur-mesure' },
      { value: 'retouches', label: 'Retouches incluses' },
      { value: 'location', label: 'Location' },
      { value: 'seconde_main', label: 'Seconde main / Occasion' },
      { value: 'rdv_prive', label: 'RDV privé' },
    ],
  },
  {
    id: 'budget_robe',
    label: 'Gamme de prix',
    multiSelect: false,
    options: [
      { value: 'accessible', label: 'Accessible (< 1500€)' },
      { value: 'moyen', label: 'Moyen (1500-3000€)' },
      { value: 'haut_gamme', label: 'Haut de gamme (3000-6000€)' },
      { value: 'luxe_robe', label: 'Luxe (> 6000€)' },
    ],
  },
]

const BIJOUTIER_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'type_bijoux',
    label: 'Types de créations',
    multiSelect: true,
    options: [
      { value: 'alliance', label: 'Alliances' },
      { value: 'bague_fiancailles', label: 'Bagues de fiançailles' },
      { value: 'parures', label: 'Parures (collier, boucles...)' },
      { value: 'bijoux_tete', label: 'Bijoux de tête / Tiares' },
      { value: 'bijoux_cheveux', label: 'Bijoux de cheveux' },
      { value: 'bijoux_homme', label: 'Bijoux homme' },
    ],
  },
  {
    id: 'style_bijoux',
    label: 'Style',
    multiSelect: true,
    options: [
      { value: 'classique_bijoux', label: 'Classique' },
      { value: 'moderne_bijoux', label: 'Moderne / Design' },
      { value: 'vintage_bijoux', label: 'Vintage' },
      { value: 'boheme_bijoux', label: 'Bohème' },
      { value: 'ethnique', label: 'Ethnique / Traditionnel' },
      { value: 'minimaliste_bijoux', label: 'Minimaliste' },
    ],
  },
  {
    id: 'materiaux',
    label: 'Matériaux',
    multiSelect: true,
    options: [
      { value: 'or_jaune', label: 'Or jaune' },
      { value: 'or_blanc', label: 'Or blanc' },
      { value: 'or_rose', label: 'Or rose' },
      { value: 'platine', label: 'Platine' },
      { value: 'argent', label: 'Argent' },
      { value: 'diamant', label: 'Diamant' },
      { value: 'pierres_precieuses', label: 'Pierres précieuses' },
      { value: 'perles', label: 'Perles' },
    ],
  },
  {
    id: 'service_bijoux',
    label: 'Services',
    multiSelect: true,
    options: [
      { value: 'sur_mesure_bijoux', label: 'Création sur-mesure' },
      { value: 'gravure', label: 'Gravure' },
      { value: 'transformation', label: 'Transformation bijoux famille' },
      { value: 'certificat', label: 'Certificat authenticité' },
    ],
  },
]

// ============================================================================
// DÉCORATION & FLEURS
// ============================================================================

const FLEURISTE_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'type_prestation_fleur',
    label: 'Types de prestations',
    multiSelect: true,
    options: [
      { value: 'bouquet_mariee', label: 'Bouquet de mariée' },
      { value: 'boutonniere', label: 'Boutonnières' },
      { value: 'centres_table', label: 'Centres de table' },
      { value: 'arche', label: 'Arche florale' },
      { value: 'ceremonie_fleurs', label: 'Décoration cérémonie' },
      { value: 'salle_fleurs', label: 'Décoration salle' },
      { value: 'voiture', label: 'Décoration voiture' },
      { value: 'couronne_fleurs', label: 'Couronnes de fleurs' },
      { value: 'mur_fleurs', label: 'Mur de fleurs' },
      { value: 'suspension', label: 'Suspensions florales' },
    ],
  },
  {
    id: 'style_floral',
    label: 'Style floral',
    multiSelect: true,
    options: [
      { value: 'champetre', label: 'Champêtre / Sauvage' },
      { value: 'romantique_fleur', label: 'Romantique' },
      { value: 'moderne_fleur', label: 'Moderne / Épuré' },
      { value: 'boheme_fleur', label: 'Bohème' },
      { value: 'luxueux', label: 'Luxueux / Opulent' },
      { value: 'minimaliste_fleur', label: 'Minimaliste' },
      { value: 'tropical', label: 'Tropical / Exotique' },
      { value: 'classique_fleur', label: 'Classique' },
      { value: 'vintage_fleur', label: 'Vintage' },
      { value: 'industriel', label: 'Industriel / Urban' },
    ],
  },
  {
    id: 'type_fleurs',
    label: 'Types de fleurs',
    multiSelect: true,
    options: [
      { value: 'fleurs_fraiches', label: 'Fleurs fraîches' },
      { value: 'fleurs_sechees', label: 'Fleurs séchées' },
      { value: 'fleurs_artificielles', label: 'Fleurs artificielles haut de gamme' },
      { value: 'fleurs_saison', label: 'Fleurs de saison' },
      { value: 'fleurs_locales', label: 'Fleurs locales / Éco-responsable' },
      { value: 'fleurs_importees', label: 'Fleurs importées / Rares' },
    ],
  },
  {
    id: 'deco_complementaire',
    label: 'Décoration complémentaire',
    multiSelect: true,
    options: [
      { value: 'bougies', label: 'Bougies / Photophores' },
      { value: 'nappage', label: 'Nappage / Linge de table' },
      { value: 'vaisselle_deco', label: 'Vaisselle décorative' },
      { value: 'mobilier', label: 'Mobilier (chaises, tables...)' },
      { value: 'signalitique', label: 'Signalétique (plan de table, panneaux...)' },
      { value: 'papeterie_deco', label: 'Papeterie de table' },
    ],
  },
]

// ============================================================================
// LIEUX & MATÉRIEL
// ============================================================================

const SALLE_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'type_lieu',
    label: 'Type de lieu',
    multiSelect: true,
    options: [
      { value: 'chateau', label: 'Château' },
      { value: 'domaine', label: 'Domaine' },
      { value: 'manoir', label: 'Manoir' },
      { value: 'ferme', label: 'Ferme / Grange' },
      { value: 'mas', label: 'Mas provençal' },
      { value: 'villa', label: 'Villa' },
      { value: 'hotel', label: 'Hôtel' },
      { value: 'restaurant', label: 'Restaurant' },
      { value: 'salle_reception', label: 'Salle de réception' },
      { value: 'loft', label: 'Loft / Espace atypique' },
      { value: 'peniche', label: 'Péniche / Bateau' },
      { value: 'plage', label: 'Plage / Bord de mer' },
      { value: 'montagne', label: 'Montagne / Chalet' },
      { value: 'jardin', label: 'Jardin / Parc' },
      { value: 'rooftop', label: 'Rooftop' },
      { value: 'abbaye', label: 'Abbaye / Lieu religieux' },
    ],
  },
  {
    id: 'capacite',
    label: 'Capacité',
    multiSelect: false,
    options: [
      { value: 'intime', label: 'Intime (< 50 personnes)' },
      { value: 'moyen_lieu', label: 'Moyen (50-100 personnes)' },
      { value: 'grand', label: 'Grand (100-200 personnes)' },
      { value: 'tres_grand', label: 'Très grand (200-400 personnes)' },
      { value: 'xxl', label: 'XXL (> 400 personnes)' },
    ],
  },
  {
    id: 'services_lieu',
    label: 'Services inclus',
    multiSelect: true,
    options: [
      { value: 'hebergement', label: 'Hébergement sur place' },
      { value: 'traiteur_impose', label: 'Traiteur imposé' },
      { value: 'traiteur_libre', label: 'Traiteur libre' },
      { value: 'cuisine_equipee', label: 'Cuisine équipée' },
      { value: 'mobilier_inclus', label: 'Mobilier inclus' },
      { value: 'sono_incluse', label: 'Sono incluse' },
      { value: 'parking', label: 'Parking' },
      { value: 'acces_pmr', label: 'Accès PMR' },
      { value: 'coordinateur', label: 'Coordinateur sur place' },
    ],
  },
  {
    id: 'espaces',
    label: 'Espaces disponibles',
    multiSelect: true,
    options: [
      { value: 'ceremonie_laique', label: 'Espace cérémonie laïque' },
      { value: 'cocktail_exterieur', label: 'Espace cocktail extérieur' },
      { value: 'salle_interieur', label: 'Salle intérieure' },
      { value: 'terrasse', label: 'Terrasse' },
      { value: 'piscine', label: 'Piscine' },
      { value: 'brunch_lieu', label: 'Espace brunch lendemain' },
      { value: 'suite_nuptiale', label: 'Suite nuptiale' },
    ],
  },
  {
    id: 'style_lieu',
    label: 'Style / Ambiance',
    multiSelect: true,
    options: [
      { value: 'champetre_lieu', label: 'Champêtre' },
      { value: 'romantique_lieu', label: 'Romantique' },
      { value: 'luxe_lieu', label: 'Luxe' },
      { value: 'boheme_lieu', label: 'Bohème' },
      { value: 'moderne_lieu', label: 'Moderne' },
      { value: 'historique', label: 'Historique' },
      { value: 'industriel_lieu', label: 'Industriel' },
      { value: 'nature', label: 'Nature / Éco' },
    ],
  },
]

const LOCATION_MATERIEL_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'type_materiel',
    label: 'Types de matériel',
    multiSelect: true,
    options: [
      { value: 'tentes', label: 'Tentes / Chapiteaux' },
      { value: 'barnums', label: 'Barnums' },
      { value: 'mobilier_loc', label: 'Mobilier (tables, chaises...)' },
      { value: 'vaisselle', label: 'Vaisselle / Verrerie' },
      { value: 'nappage_loc', label: 'Nappage / Linge' },
      { value: 'sono_loc', label: 'Sonorisation' },
      { value: 'eclairage_loc', label: 'Éclairage' },
      { value: 'piste_danse', label: 'Piste de danse' },
      { value: 'arche_loc', label: 'Arches / Structures' },
      { value: 'photobooth_loc', label: 'Photobooth' },
      { value: 'chauffage', label: 'Chauffage / Climatisation' },
      { value: 'groupe_electro', label: 'Groupe électrogène' },
    ],
  },
  {
    id: 'style_materiel',
    label: 'Style de mobilier',
    multiSelect: true,
    options: [
      { value: 'classique_mob', label: 'Classique' },
      { value: 'champetre_mob', label: 'Champêtre / Rustique' },
      { value: 'moderne_mob', label: 'Moderne / Design' },
      { value: 'vintage_mob', label: 'Vintage' },
      { value: 'boheme_mob', label: 'Bohème' },
      { value: 'luxe_mob', label: 'Luxe' },
      { value: 'industriel_mob', label: 'Industriel' },
    ],
  },
  {
    id: 'services_materiel',
    label: 'Services inclus',
    multiSelect: true,
    options: [
      { value: 'livraison', label: 'Livraison' },
      { value: 'installation', label: 'Installation' },
      { value: 'reprise', label: 'Reprise' },
      { value: 'montage', label: 'Montage / Démontage' },
    ],
  },
]

const LOCATION_VEHICULES_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'type_vehicule',
    label: 'Types de véhicules',
    multiSelect: true,
    options: [
      { value: 'voiture_collection', label: 'Voiture de collection' },
      { value: 'voiture_luxe', label: 'Voiture de luxe' },
      { value: 'limousine', label: 'Limousine' },
      { value: 'cabriolet', label: 'Cabriolet' },
      { value: 'rolls_royce', label: 'Rolls Royce' },
      { value: 'mercedes', label: 'Mercedes' },
      { value: 'bentley', label: 'Bentley' },
      { value: 'jaguar', label: 'Jaguar' },
      { value: 'coccinelle', label: 'Coccinelle / Combi VW' },
      { value: '2cv', label: '2CV / Méhari' },
      { value: 'americaine', label: 'Américaine vintage' },
      { value: 'moto', label: 'Moto / Side-car' },
      { value: 'bus', label: 'Bus / Van' },
      { value: 'bateau', label: 'Bateau' },
      { value: 'helicoptere', label: 'Hélicoptère' },
      { value: 'caleche', label: 'Calèche / Attelage' },
    ],
  },
  {
    id: 'services_vehicule',
    label: 'Services',
    multiSelect: true,
    options: [
      { value: 'avec_chauffeur', label: 'Avec chauffeur' },
      { value: 'decoration_vehicule', label: 'Décoration du véhicule' },
      { value: 'champagne', label: 'Champagne inclus' },
      { value: 'plusieurs_trajets', label: 'Plusieurs trajets' },
      { value: 'photo_vehicule', label: 'Session photo avec véhicule' },
    ],
  },
]

// ============================================================================
// TRADITIONS MAGHREB & ORIENT
// ============================================================================

const NEGGAFA_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'origine_neggafa',
    label: 'Tradition / Origine',
    multiSelect: true,
    options: [
      { value: 'marocaine', label: 'Marocaine' },
      { value: 'algerienne', label: 'Algérienne' },
      { value: 'tunisienne', label: 'Tunisienne' },
      { value: 'egyptienne', label: 'Égyptienne' },
      { value: 'libanaise', label: 'Libanaise' },
      { value: 'multi_traditions', label: 'Multi-traditions' },
    ],
  },
  {
    id: 'services_neggafa',
    label: 'Services inclus',
    multiSelect: true,
    options: [
      { value: 'tenues_incluses', label: 'Tenues traditionnelles incluses' },
      { value: 'accessoires_inclus', label: 'Accessoires inclus' },
      { value: 'maquillage_neggafa', label: 'Maquillage inclus' },
      { value: 'coiffure_neggafa', label: 'Coiffure incluse' },
      { value: 'henne_neggafa', label: 'Henné inclus' },
      { value: 'coordination_neggafa', label: 'Coordination cérémonie' },
      { value: 'conseil_protocole', label: 'Conseil en protocole' },
      { value: 'amariya', label: 'Amariya / Trône' },
      { value: 'porteurs', label: 'Porteurs' },
    ],
  },
  {
    id: 'nombre_tenues',
    label: 'Nombre de tenues',
    multiSelect: false,
    options: [
      { value: '1_3_tenues', label: '1-3 tenues' },
      { value: '4_6_tenues', label: '4-6 tenues' },
      { value: '7_plus_tenues', label: '7+ tenues' },
    ],
  },
  {
    id: 'style_neggafa',
    label: 'Style',
    multiSelect: true,
    options: [
      { value: 'traditionnel_neggafa', label: 'Traditionnel authentique' },
      { value: 'moderne_neggafa', label: 'Moderne / Réinterprété' },
      { value: 'luxe_neggafa', label: 'Luxe / Haute couture' },
      { value: 'simple_neggafa', label: 'Simple / Épuré' },
    ],
  },
]

const HENNA_ARTISTE_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'style_henne',
    label: 'Styles de henné',
    multiSelect: true,
    options: [
      { value: 'marocain_henne', label: 'Marocain / Fassi' },
      { value: 'indien_henne', label: 'Indien / Mehndi' },
      { value: 'arabe_henne', label: 'Arabe / Khaliji' },
      { value: 'africain_henne', label: 'Africain' },
      { value: 'soudanais_henne', label: 'Soudanais' },
      { value: 'moderne_henne', label: 'Moderne / Fusion' },
      { value: 'minimaliste_henne', label: 'Minimaliste' },
    ],
  },
  {
    id: 'type_henne',
    label: 'Type de henné',
    multiSelect: true,
    options: [
      { value: 'henne_naturel', label: 'Henné 100% naturel' },
      { value: 'henne_noir', label: 'Henné noir (jagua)' },
      { value: 'henne_blanc', label: 'Henné blanc (body paint)' },
      { value: 'paillettes', label: 'Avec paillettes / Strass' },
    ],
  },
  {
    id: 'zones_henne',
    label: 'Zones de travail',
    multiSelect: true,
    options: [
      { value: 'mains', label: 'Mains' },
      { value: 'pieds', label: 'Pieds' },
      { value: 'bras', label: 'Bras / Avant-bras' },
      { value: 'dos', label: 'Dos / Épaules' },
      { value: 'ventre', label: 'Ventre' },
    ],
  },
  {
    id: 'services_henne',
    label: 'Services',
    multiSelect: true,
    options: [
      { value: 'soiree_henne', label: 'Animation soirée henné' },
      { value: 'groupe_henne', label: 'Henné invitées' },
      { value: 'domicile_henne', label: 'Déplacement à domicile' },
    ],
  },
]

const ZAFFA_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'style_zaffa',
    label: 'Style de Zaffa',
    multiSelect: true,
    options: [
      { value: 'egyptienne_zaffa', label: 'Égyptienne' },
      { value: 'libanaise_zaffa', label: 'Libanaise' },
      { value: 'palestinienne_zaffa', label: 'Palestinienne' },
      { value: 'syrienne_zaffa', label: 'Syrienne' },
      { value: 'marocaine_zaffa', label: 'Marocaine' },
      { value: 'moderne_zaffa', label: 'Moderne / Fusion' },
    ],
  },
  {
    id: 'composition_zaffa',
    label: 'Composition',
    multiSelect: true,
    options: [
      { value: 'percussions', label: 'Percussions (tabla, darbouka)' },
      { value: 'mezmar', label: 'Mezmar / Instruments à vent' },
      { value: 'chanteurs', label: 'Chanteurs' },
      { value: 'danseurs_zaffa', label: 'Danseurs' },
      { value: 'danseuses_zaffa', label: 'Danseuses' },
      { value: 'porteurs_zaffa', label: 'Porteurs avec bougies' },
      { value: 'feu', label: 'Spectacle de feu' },
    ],
  },
  {
    id: 'taille_groupe',
    label: 'Taille du groupe',
    multiSelect: false,
    options: [
      { value: 'petit_groupe', label: 'Petit (3-5 personnes)' },
      { value: 'moyen_groupe', label: 'Moyen (6-10 personnes)' },
      { value: 'grand_groupe', label: 'Grand (10+ personnes)' },
    ],
  },
]

const MUSICIEN_TRADITIONNEL_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'instruments',
    label: 'Instruments',
    multiSelect: true,
    options: [
      { value: 'oud', label: 'Oud' },
      { value: 'darbouka', label: 'Darbouka' },
      { value: 'bendir', label: 'Bendir' },
      { value: 'qanun', label: 'Qanun' },
      { value: 'violon_oriental', label: 'Violon oriental' },
      { value: 'ney', label: 'Ney (flûte)' },
      { value: 'tabla', label: 'Tabla' },
      { value: 'guitare_orientale', label: 'Guitare orientale' },
      { value: 'accordeon', label: 'Accordéon' },
      { value: 'saxophone', label: 'Saxophone' },
    ],
  },
  {
    id: 'repertoire',
    label: 'Répertoire',
    multiSelect: true,
    options: [
      { value: 'classique_arabe', label: 'Classique arabe' },
      { value: 'chaabi', label: 'Chaabi' },
      { value: 'rai', label: 'Raï' },
      { value: 'andalou', label: 'Andalou' },
      { value: 'gnawa', label: 'Gnawa' },
      { value: 'malouf', label: 'Malouf' },
      { value: 'tarab', label: 'Tarab' },
      { value: 'moderne_oriental', label: 'Moderne oriental' },
      { value: 'turc', label: 'Turc' },
      { value: 'persan', label: 'Persan' },
    ],
  },
  {
    id: 'formule_musique',
    label: 'Formule',
    multiSelect: true,
    options: [
      { value: 'solo', label: 'Solo' },
      { value: 'duo', label: 'Duo' },
      { value: 'trio', label: 'Trio' },
      { value: 'orchestre', label: 'Orchestre complet' },
    ],
  },
]

// ============================================================================
// TRADITIONS AFRIQUE
// ============================================================================

const GRIOT_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'origine_griot',
    label: 'Origine / Tradition',
    multiSelect: true,
    options: [
      { value: 'senegalais', label: 'Sénégalais' },
      { value: 'malien', label: 'Malien' },
      { value: 'guineen', label: 'Guinéen' },
      { value: 'ivoirien', label: 'Ivoirien' },
      { value: 'burkinabe', label: 'Burkinabé' },
      { value: 'gambien', label: 'Gambien' },
      { value: 'multi_afrique', label: 'Multi-traditions africaines' },
    ],
  },
  {
    id: 'services_griot',
    label: 'Prestations',
    multiSelect: true,
    options: [
      { value: 'chants', label: 'Chants traditionnels' },
      { value: 'louanges', label: 'Louanges / Généalogie' },
      { value: 'kora', label: 'Kora' },
      { value: 'balafon', label: 'Balafon' },
      { value: 'djembe', label: 'Djembé' },
      { value: 'animation_griot', label: 'Animation cérémonie' },
      { value: 'benedictions', label: 'Bénédictions traditionnelles' },
    ],
  },
]

const COUTURIER_AFRICAIN_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'style_africain',
    label: 'Styles',
    multiSelect: true,
    options: [
      { value: 'wax', label: 'Wax / Ankara' },
      { value: 'kente', label: 'Kente' },
      { value: 'bogolan', label: 'Bogolan' },
      { value: 'bazin', label: 'Bazin' },
      { value: 'dashiki', label: 'Dashiki' },
      { value: 'agbada', label: 'Agbada' },
      { value: 'boubou', label: 'Boubou' },
      { value: 'aso_oke', label: 'Aso Oke' },
      { value: 'fusion_africain', label: 'Fusion / Moderne' },
    ],
  },
  {
    id: 'type_tenues_africain',
    label: 'Types de tenues',
    multiSelect: true,
    options: [
      { value: 'mariee_africain', label: 'Tenue mariée' },
      { value: 'marie_africain', label: 'Tenue marié' },
      { value: 'couple_assorti', label: 'Tenues couple assorties' },
      { value: 'famille_africain', label: 'Tenues famille' },
      { value: 'cortege', label: 'Cortège / Demoiselles d\'honneur' },
    ],
  },
  {
    id: 'service_africain',
    label: 'Services',
    multiSelect: true,
    options: [
      { value: 'sur_mesure_africain', label: 'Sur-mesure' },
      { value: 'location_africain', label: 'Location' },
      { value: 'accessoires_africain', label: 'Accessoires (gele, bijoux...)' },
    ],
  },
]

const DANSEURS_AFRICAINS_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'style_danse_africaine',
    label: 'Styles de danse',
    multiSelect: true,
    options: [
      { value: 'sabar', label: 'Sabar' },
      { value: 'coupé_decalé', label: 'Coupé-décalé' },
      { value: 'afrohouse', label: 'Afrohouse' },
      { value: 'ndombolo', label: 'Ndombolo' },
      { value: 'azonto', label: 'Azonto' },
      { value: 'makossa', label: 'Makossa' },
      { value: 'traditionnelle_africaine', label: 'Danses traditionnelles' },
      { value: 'afrobeat', label: 'Afrobeat' },
      { value: 'kizomba', label: 'Kizomba' },
    ],
  },
  {
    id: 'type_spectacle',
    label: 'Type de spectacle',
    multiSelect: true,
    options: [
      { value: 'entree_maries', label: 'Entrée des mariés' },
      { value: 'show', label: 'Show / Performance' },
      { value: 'initiation_danse', label: 'Initiation invités' },
      { value: 'flashmob_africain', label: 'Flashmob' },
    ],
  },
]

// ============================================================================
// TRADITIONS ASIE & INDE
// ============================================================================

const PANDIT_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'type_ceremonie_hindou',
    label: 'Types de cérémonies',
    multiSelect: true,
    options: [
      { value: 'vivah', label: 'Vivah (mariage hindou)' },
      { value: 'sangeet', label: 'Sangeet' },
      { value: 'mehndi_ceremony', label: 'Cérémonie Mehndi' },
      { value: 'haldi', label: 'Haldi' },
      { value: 'baraat', label: 'Baraat' },
      { value: 'vidaai', label: 'Vidaai' },
      { value: 'ganesh_puja', label: 'Ganesh Puja' },
    ],
  },
  {
    id: 'tradition_hindou',
    label: 'Traditions régionales',
    multiSelect: true,
    options: [
      { value: 'nord_indien', label: 'Nord Indien' },
      { value: 'sud_indien', label: 'Sud Indien' },
      { value: 'gujarati', label: 'Gujarati' },
      { value: 'punjabi', label: 'Punjabi' },
      { value: 'bengali', label: 'Bengali' },
      { value: 'tamoul', label: 'Tamoul' },
      { value: 'marathi', label: 'Marathi' },
    ],
  },
  {
    id: 'langues_pandit',
    label: 'Langues',
    multiSelect: true,
    options: [
      { value: 'sanskrit', label: 'Sanskrit' },
      { value: 'hindi', label: 'Hindi' },
      { value: 'francais_pandit', label: 'Français (explications)' },
      { value: 'anglais_pandit', label: 'Anglais (explications)' },
    ],
  },
]

const DANSEURS_BOLLYWOOD_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'style_bollywood',
    label: 'Styles',
    multiSelect: true,
    options: [
      { value: 'bollywood_classique', label: 'Bollywood classique' },
      { value: 'bollywood_moderne', label: 'Bollywood moderne' },
      { value: 'bhangra', label: 'Bhangra' },
      { value: 'garba', label: 'Garba / Dandiya' },
      { value: 'classical_indian', label: 'Danses classiques indiennes' },
      { value: 'fusion_indien', label: 'Fusion' },
    ],
  },
  {
    id: 'services_bollywood',
    label: 'Services',
    multiSelect: true,
    options: [
      { value: 'spectacle_bollywood', label: 'Spectacle' },
      { value: 'choregraphie_maries', label: 'Chorégraphie mariés' },
      { value: 'initiation_bollywood', label: 'Initiation invités' },
      { value: 'sangeet_performance', label: 'Performance Sangeet' },
    ],
  },
]

const TRAITEUR_INDIEN_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'cuisine_indienne',
    label: 'Spécialités culinaires',
    multiSelect: true,
    options: [
      { value: 'nord_indien_cuisine', label: 'Nord Indien' },
      { value: 'sud_indien_cuisine', label: 'Sud Indien' },
      { value: 'gujarati_cuisine', label: 'Gujarati' },
      { value: 'punjabi_cuisine', label: 'Punjabi' },
      { value: 'bengali_cuisine', label: 'Bengali' },
      { value: 'indo_chinois', label: 'Indo-chinois' },
      { value: 'streetfood_indien', label: 'Street food indien' },
    ],
  },
  {
    id: 'regimes_indien',
    label: 'Régimes',
    multiSelect: true,
    options: [
      { value: 'vegetarien_indien', label: 'Végétarien' },
      { value: 'vegan_indien', label: 'Végan' },
      { value: 'jain', label: 'Jain (sans oignon/ail)' },
      { value: 'halal_indien', label: 'Halal' },
    ],
  },
  {
    id: 'service_indien',
    label: 'Style de service',
    multiSelect: true,
    options: [
      { value: 'thali', label: 'Service Thali' },
      { value: 'buffet_indien', label: 'Buffet' },
      { value: 'live_stations', label: 'Live stations (chaat, dosa...)' },
      { value: 'service_traditionnel', label: 'Service traditionnel' },
    ],
  },
]

// ============================================================================
// AUTRES TRADITIONS
// ============================================================================

const GROUPE_ZOUK_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'style_antillais',
    label: 'Styles musicaux',
    multiSelect: true,
    options: [
      { value: 'zouk', label: 'Zouk' },
      { value: 'kompa', label: 'Kompa' },
      { value: 'gwoka', label: 'Gwo Ka' },
      { value: 'biguine', label: 'Biguine' },
      { value: 'salsa_antillaise', label: 'Salsa' },
      { value: 'reggae_antillais', label: 'Reggae / Dancehall' },
      { value: 'soca', label: 'Soca' },
      { value: 'calypso', label: 'Calypso' },
    ],
  },
  {
    id: 'formule_antillais',
    label: 'Formule',
    multiSelect: true,
    options: [
      { value: 'groupe_complet', label: 'Groupe complet' },
      { value: 'duo_antillais', label: 'Duo' },
      { value: 'dj_live', label: 'DJ + chanteur live' },
      { value: 'orchestre_antillais', label: 'Orchestre' },
    ],
  },
]

const TRAITEUR_ANTILLAIS_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'cuisine_antillaise',
    label: 'Spécialités',
    multiSelect: true,
    options: [
      { value: 'creole', label: 'Créole' },
      { value: 'guadeloupeenne', label: 'Guadeloupéenne' },
      { value: 'martiniquaise', label: 'Martiniquaise' },
      { value: 'haitienne', label: 'Haïtienne' },
      { value: 'guyannaise', label: 'Guyanaise' },
      { value: 'reunionnaise', label: 'Réunionnaise' },
    ],
  },
  {
    id: 'plats_antillais',
    label: 'Plats signatures',
    multiSelect: true,
    options: [
      { value: 'colombo', label: 'Colombo' },
      { value: 'boudin_antillais', label: 'Boudin créole' },
      { value: 'accras', label: 'Accras' },
      { value: 'grillades', label: 'Grillades / Barbecue' },
      { value: 'court_bouillon', label: 'Court-bouillon' },
      { value: 'fricassee', label: 'Fricassée' },
    ],
  },
]

const MARIACHI_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'repertoire_mariachi',
    label: 'Répertoire',
    multiSelect: true,
    options: [
      { value: 'traditionnel_mexicain', label: 'Traditionnel mexicain' },
      { value: 'ranchera', label: 'Ranchera' },
      { value: 'bolero', label: 'Bolero' },
      { value: 'cumbia', label: 'Cumbia' },
      { value: 'son_jaliciense', label: 'Son jalisciense' },
      { value: 'moderne_latino', label: 'Moderne latino' },
    ],
  },
  {
    id: 'taille_mariachi',
    label: 'Taille du groupe',
    multiSelect: false,
    options: [
      { value: 'trio_mariachi', label: 'Trio' },
      { value: 'quintette', label: 'Quintette' },
      { value: 'groupe_complet_mariachi', label: 'Groupe complet (7+)' },
    ],
  },
]

// ============================================================================
// SERVICES
// ============================================================================

const WEDDING_PLANNER_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'type_accompagnement',
    label: 'Type d\'accompagnement',
    multiSelect: true,
    options: [
      { value: 'organisation_complete', label: 'Organisation complète' },
      { value: 'coordination_jour_j', label: 'Coordination jour J' },
      { value: 'accompagnement_partiel', label: 'Accompagnement partiel' },
      { value: 'conseil', label: 'Conseil / Coaching' },
      { value: 'decoration_wp', label: 'Décoration' },
    ],
  },
  {
    id: 'specialites_wp',
    label: 'Spécialités',
    multiSelect: true,
    options: [
      { value: 'mariage_multiculturel', label: 'Mariages multiculturels' },
      { value: 'mariage_destination', label: 'Destination wedding' },
      { value: 'mariage_luxe', label: 'Mariages luxe' },
      { value: 'mariage_intime', label: 'Mariages intimes / Elopement' },
      { value: 'mariage_eco', label: 'Mariages éco-responsables' },
      { value: 'mariage_lgbtq', label: 'Mariages LGBTQ+' },
      { value: 'ceremonies_religieuses', label: 'Cérémonies religieuses' },
      { value: 'ceremonies_laiques', label: 'Cérémonies laïques' },
    ],
  },
  {
    id: 'cultures_wp',
    label: 'Expertise culturelle',
    multiSelect: true,
    options: [
      { value: 'mariage_oriental', label: 'Mariages orientaux' },
      { value: 'mariage_africain', label: 'Mariages africains' },
      { value: 'mariage_indien', label: 'Mariages indiens' },
      { value: 'mariage_asiatique', label: 'Mariages asiatiques' },
      { value: 'mariage_antillais', label: 'Mariages antillais' },
      { value: 'mariage_juif', label: 'Mariages juifs' },
      { value: 'mariage_chretien', label: 'Mariages chrétiens' },
    ],
  },
  {
    id: 'langues_wp',
    label: 'Langues parlées',
    multiSelect: true,
    options: [
      { value: 'francais', label: 'Français' },
      { value: 'anglais', label: 'Anglais' },
      { value: 'arabe', label: 'Arabe' },
      { value: 'espagnol', label: 'Espagnol' },
      { value: 'portugais_wp', label: 'Portugais' },
      { value: 'italien', label: 'Italien' },
    ],
  },
]

const OFFICIANT_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'type_ceremonie',
    label: 'Types de cérémonies',
    multiSelect: true,
    options: [
      { value: 'laique', label: 'Cérémonie laïque' },
      { value: 'symbolique', label: 'Cérémonie symbolique' },
      { value: 'bilingue', label: 'Cérémonie bilingue' },
      { value: 'multiculturelle', label: 'Cérémonie multiculturelle' },
      { value: 'renouvellement', label: 'Renouvellement de vœux' },
      { value: 'lgbtq', label: 'Cérémonie LGBTQ+' },
    ],
  },
  {
    id: 'style_ceremonie',
    label: 'Style',
    multiSelect: true,
    options: [
      { value: 'emotionnelle', label: 'Émotionnelle' },
      { value: 'humoristique', label: 'Humoristique' },
      { value: 'spirituelle', label: 'Spirituelle' },
      { value: 'poetique', label: 'Poétique' },
      { value: 'moderne_ceremonie', label: 'Moderne' },
      { value: 'traditionnelle_ceremonie', label: 'Traditionnelle' },
    ],
  },
  {
    id: 'services_officiant',
    label: 'Services',
    multiSelect: true,
    options: [
      { value: 'ecriture_textes', label: 'Écriture personnalisée' },
      { value: 'rituels', label: 'Rituels symboliques' },
      { value: 'reperage', label: 'Repérage du lieu' },
      { value: 'repetition', label: 'Répétition avec les mariés' },
      { value: 'coordination_ceremonie', label: 'Coordination cérémonie' },
    ],
  },
  {
    id: 'langues_officiant',
    label: 'Langues',
    multiSelect: true,
    options: [
      { value: 'francais_off', label: 'Français' },
      { value: 'anglais_off', label: 'Anglais' },
      { value: 'espagnol_off', label: 'Espagnol' },
      { value: 'arabe_off', label: 'Arabe' },
      { value: 'italien_off', label: 'Italien' },
    ],
  },
]

const FAIRE_PART_SPECIALTIES: SpecialtyGroup[] = [
  {
    id: 'type_papeterie',
    label: 'Types de créations',
    multiSelect: true,
    options: [
      { value: 'faire_part_mariage', label: 'Faire-part mariage' },
      { value: 'save_the_date', label: 'Save the date' },
      { value: 'menu', label: 'Menus' },
      { value: 'plan_table', label: 'Plan de table' },
      { value: 'marque_place', label: 'Marque-places' },
      { value: 'livre_or', label: 'Livre d\'or' },
      { value: 'remerciements', label: 'Cartes de remerciements' },
      { value: 'programme', label: 'Programme de cérémonie' },
      { value: 'etiquettes', label: 'Étiquettes cadeaux' },
    ],
  },
  {
    id: 'style_papeterie',
    label: 'Style',
    multiSelect: true,
    options: [
      { value: 'moderne_pap', label: 'Moderne / Minimaliste' },
      { value: 'romantique_pap', label: 'Romantique' },
      { value: 'boheme_pap', label: 'Bohème' },
      { value: 'luxe_pap', label: 'Luxe / Prestige' },
      { value: 'vintage_pap', label: 'Vintage' },
      { value: 'champetre_pap', label: 'Champêtre' },
      { value: 'oriental_pap', label: 'Oriental' },
      { value: 'tropical_pap', label: 'Tropical' },
      { value: 'illustre', label: 'Illustré / Aquarelle' },
    ],
  },
  {
    id: 'techniques_papeterie',
    label: 'Techniques',
    multiSelect: true,
    options: [
      { value: 'letterpress', label: 'Letterpress' },
      { value: 'dorure', label: 'Dorure à chaud' },
      { value: 'embossage', label: 'Embossage / Gaufrage' },
      { value: 'decoupe_laser', label: 'Découpe laser' },
      { value: 'calligraphie', label: 'Calligraphie' },
      { value: 'serigraphie', label: 'Sérigraphie' },
      { value: 'numerique', label: 'Impression numérique' },
    ],
  },
  {
    id: 'options_papeterie',
    label: 'Options',
    multiSelect: true,
    options: [
      { value: 'sur_mesure_pap', label: 'Création sur-mesure' },
      { value: 'kit_complet', label: 'Kit complet' },
      { value: 'eco_responsable', label: 'Papier éco-responsable' },
      { value: 'bilingue_pap', label: 'Bilingue / Multilingue' },
    ],
  },
]

// ============================================================================
// MAPPING COMPLET SERVICE -> SPÉCIALITÉS
// ============================================================================

export const SERVICE_SPECIALTIES_MAP: Record<string, SpecialtyGroup[]> = {
  // Photo & Vidéo
  photographe: PHOTOGRAPHE_SPECIALTIES,
  videaste: VIDEASTE_SPECIALTIES,

  // Traiteur & Pâtisserie
  traiteur: TRAITEUR_SPECIALTIES,
  patissier: PATISSIER_SPECIALTIES,

  // Musique & Animation
  dj: DJ_SPECIALTIES,
  animation: ANIMATION_SPECIALTIES,

  // Beauté & Style
  coiffure_maquillage: COIFFURE_MAQUILLAGE_SPECIALTIES,
  robe_mariee: ROBE_MARIEE_SPECIALTIES,
  bijoutier: BIJOUTIER_SPECIALTIES,

  // Décoration & Fleurs
  fleuriste: FLEURISTE_SPECIALTIES,

  // Lieux & Matériel
  salle: SALLE_SPECIALTIES,
  location_materiel: LOCATION_MATERIEL_SPECIALTIES,
  location_vehicules: LOCATION_VEHICULES_SPECIALTIES,

  // Traditions Maghreb & Orient
  neggafa: NEGGAFA_SPECIALTIES,
  negafa_algerienne: NEGGAFA_SPECIALTIES,
  negafa_marocaine: NEGGAFA_SPECIALTIES,
  negafa_tunisienne: NEGGAFA_SPECIALTIES,
  henna_artiste: HENNA_ARTISTE_SPECIALTIES,
  henna_marocain: HENNA_ARTISTE_SPECIALTIES,
  henna_indien: HENNA_ARTISTE_SPECIALTIES,
  henna_soudanais: HENNA_ARTISTE_SPECIALTIES,
  zaffa: ZAFFA_SPECIALTIES,
  musicien_traditionnel: MUSICIEN_TRADITIONNEL_SPECIALTIES,
  groupe_chaabi: MUSICIEN_TRADITIONNEL_SPECIALTIES,
  groupe_andalou: MUSICIEN_TRADITIONNEL_SPECIALTIES,
  groupe_gnawa: MUSICIEN_TRADITIONNEL_SPECIALTIES,
  danseuse_orientale: ZAFFA_SPECIALTIES,
  troupe_folklorique: ZAFFA_SPECIALTIES,
  decorateur_maghrebin: FLEURISTE_SPECIALTIES,
  location_amariya: NEGGAFA_SPECIALTIES,
  calligraphe: FAIRE_PART_SPECIALTIES,
  organisateur_ceremonie: WEDDING_PLANNER_SPECIALTIES,
  caftan: ROBE_MARIEE_SPECIALTIES,
  takchita: ROBE_MARIEE_SPECIALTIES,
  karakou: ROBE_MARIEE_SPECIALTIES,
  keswa: ROBE_MARIEE_SPECIALTIES,
  bindalli: ROBE_MARIEE_SPECIALTIES,
  jabador: ROBE_MARIEE_SPECIALTIES,
  burnous: ROBE_MARIEE_SPECIALTIES,
  location_tenues_traditionnelles: ROBE_MARIEE_SPECIALTIES,
  hammam: COIFFURE_MAQUILLAGE_SPECIALTIES,

  // Traditions Afrique
  griot: GRIOT_SPECIALTIES,
  couturier_africain: COUTURIER_AFRICAIN_SPECIALTIES,
  styliste_wax: COUTURIER_AFRICAIN_SPECIALTIES,
  coiffure_africaine: COIFFURE_MAQUILLAGE_SPECIALTIES,
  danseurs_africains: DANSEURS_AFRICAINS_SPECIALTIES,
  percussionnistes: GRIOT_SPECIALTIES,
  decorateur_africain: FLEURISTE_SPECIALTIES,
  traiteur_africain: TRAITEUR_SPECIALTIES,

  // Traditions Asie & Inde
  pandit: PANDIT_SPECIALTIES,
  mehndi_artist: HENNA_ARTISTE_SPECIALTIES,
  sangeet_dj: DJ_SPECIALTIES,
  danseurs_bollywood: DANSEURS_BOLLYWOOD_SPECIALTIES,
  styliste_sari: ROBE_MARIEE_SPECIALTIES,
  decorateur_indien: FLEURISTE_SPECIALTIES,
  traiteur_indien: TRAITEUR_INDIEN_SPECIALTIES,
  ceremonie_the: OFFICIANT_SPECIALTIES,
  calligraphe_asiatique: FAIRE_PART_SPECIALTIES,
  musicien_asiatique: MUSICIEN_TRADITIONNEL_SPECIALTIES,
  traiteur_asiatique: TRAITEUR_SPECIALTIES,

  // Autres traditions
  groupe_zouk: GROUPE_ZOUK_SPECIALTIES,
  styliste_antillais: COUTURIER_AFRICAIN_SPECIALTIES,
  traiteur_antillais: TRAITEUR_ANTILLAIS_SPECIALTIES,
  musicien_klezmer: MUSICIEN_TRADITIONNEL_SPECIALTIES,
  musicien_slave: MUSICIEN_TRADITIONNEL_SPECIALTIES,
  mariachi: MARIACHI_SPECIALTIES,
  danseurs_latino: DANSEURS_BOLLYWOOD_SPECIALTIES,
  couturier_traditionnel: ROBE_MARIEE_SPECIALTIES,
  musicien_folk: MUSICIEN_TRADITIONNEL_SPECIALTIES,

  // Services
  wedding_planner: WEDDING_PLANNER_SPECIALTIES,
  faire_part: FAIRE_PART_SPECIALTIES,
  officiant: OFFICIANT_SPECIALTIES,
}

// Fonction helper pour obtenir les spécialités d'un service
export function getSpecialtiesForService(serviceType: string): SpecialtyGroup[] {
  return SERVICE_SPECIALTIES_MAP[serviceType] || []
}

// Fonction helper pour obtenir toutes les options d'un groupe
export function getAllOptionsFromGroup(group: SpecialtyGroup): SpecialtyOption[] {
  return group.options
}

// Fonction helper pour obtenir le label d'une option
export function getSpecialtyOptionLabel(groupId: string, optionValue: string, serviceType: string): string {
  const groups = getSpecialtiesForService(serviceType)
  const group = groups.find(g => g.id === groupId)
  if (!group) return optionValue
  const option = group.options.find(o => o.value === optionValue)
  return option?.label || optionValue
}
