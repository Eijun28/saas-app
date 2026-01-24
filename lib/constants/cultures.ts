// Structure hiérarchique des cultures avec catégories et sous-catégories
export interface CultureCategory {
  id: string;
  label: string;
  subcategories?: CultureSubcategory[];
}

export interface CultureSubcategory {
  id: string;
  label: string;
}

export const CULTURE_CATEGORIES: CultureCategory[] = [
  {
    id: 'maghrebin',
    label: 'Maghrébin',
    subcategories: [
      { id: 'marocain', label: 'Marocain' },
      { id: 'algerien', label: 'Algérien' },
      { id: 'tunisien', label: 'Tunisien' },
      { id: 'libyen', label: 'Libyen' },
      { id: 'mauritanien', label: 'Mauritanien' },
    ],
  },
  {
    id: 'africain',
    label: 'Africain',
    subcategories: [
      { id: 'senegalais', label: 'Sénégalais' },
      { id: 'camerounais', label: 'Camerounais' },
      { id: 'ivoirien', label: 'Ivoirien' },
      { id: 'malien', label: 'Malien' },
      { id: 'burkinabe', label: 'Burkinabé' },
      { id: 'nigerien', label: 'Nigérien' },
      { id: 'togolais', label: 'Togolais' },
      { id: 'beninois', label: 'Béninois' },
      { id: 'guineen', label: 'Guinéen' },
      { id: 'congolais', label: 'Congolais' },
      { id: 'gabonais', label: 'Gabonais' },
      { id: 'tchadien', label: 'Tchadien' },
      { id: 'centrafricain', label: 'Centrafricain' },
      { id: 'rwandais', label: 'Rwandais' },
      { id: 'burundais', label: 'Burundais' },
      { id: 'kenyan', label: 'Kényan' },
      { id: 'tanzanien', label: 'Tanzanien' },
      { id: 'ougandais', label: 'Ougandais' },
      { id: 'ethiopien', label: 'Éthiopien' },
      { id: 'eritreen', label: 'Érythréen' },
      { id: 'sud-africain', label: 'Sud-Africain' },
      { id: 'angola', label: 'Angolais' },
      { id: 'mozambicain', label: 'Mozambicain' },
      { id: 'zimbabween', label: 'Zimbabwéen' },
      { id: 'ghaneen', label: 'Ghanéen' },
      { id: 'nigeria', label: 'Nigérian' },
    ],
  },
  {
    id: 'antillais',
    label: 'Antillais',
    subcategories: [
      { id: 'martiniquais', label: 'Martiniquais' },
      { id: 'guadeloupeen', label: 'Guadeloupéen' },
      { id: 'guyanais', label: 'Guyanais' },
      { id: 'reunionnais', label: 'Réunionnais' },
      { id: 'haitien', label: 'Haïtien' },
      { id: 'dominicain', label: 'Dominicain' },
      { id: 'cubain', label: 'Cubain' },
      { id: 'jamaicain', label: 'Jamaïcain' },
      { id: 'trinidadien', label: 'Trinidadien' },
    ],
  },
  {
    id: 'asiatique',
    label: 'Asiatique',
    subcategories: [
      { id: 'chinois', label: 'Chinois' },
      { id: 'vietnamien', label: 'Vietnamien' },
      { id: 'thailandais', label: 'Thaïlandais' },
      { id: 'cambodgien', label: 'Cambodgien' },
      { id: 'laotien', label: 'Laotien' },
      { id: 'birman', label: 'Birman' },
      { id: 'malaisien', label: 'Malaisien' },
      { id: 'singapourien', label: 'Singapourien' },
      { id: 'indonesien', label: 'Indonésien' },
      { id: 'philippin', label: 'Philippin' },
      { id: 'japonais', label: 'Japonais' },
      { id: 'coreen', label: 'Coréen' },
      { id: 'mongol', label: 'Mongol' },
    ],
  },
  {
    id: 'indien',
    label: 'Indien',
    subcategories: [
      { id: 'indien-nord', label: 'Indien (Nord)' },
      { id: 'indien-sud', label: 'Indien (Sud)' },
      { id: 'indien-est', label: 'Indien (Est)' },
      { id: 'indien-ouest', label: 'Indien (Ouest)' },
      { id: 'indien-penjab', label: 'Pendjabi' },
      { id: 'indien-gujarati', label: 'Gujarati' },
      { id: 'indien-bengali', label: 'Bengali' },
      { id: 'indien-tamil', label: 'Tamoul' },
      { id: 'indien-telugu', label: 'Télougou' },
      { id: 'indien-marathi', label: 'Marathi' },
    ],
  },
  {
    id: 'pakistanais',
    label: 'Pakistanais',
    subcategories: [
      { id: 'pakistanais-penjab', label: 'Pendjabi' },
      { id: 'pakistanais-sindhi', label: 'Sindhi' },
      { id: 'pakistanais-pashtun', label: 'Pachtoune' },
      { id: 'pakistanais-balochi', label: 'Baloutche' },
    ],
  },
  {
    id: 'europeen',
    label: 'Européen',
    subcategories: [
      { id: 'francais', label: 'Français' },
      { id: 'italien', label: 'Italien' },
      { id: 'espagnol', label: 'Espagnol' },
      { id: 'portugais', label: 'Portugais' },
      { id: 'allemand', label: 'Allemand' },
      { id: 'britannique', label: 'Britannique' },
      { id: 'irlandais', label: 'Irlandais' },
      { id: 'neerlandais', label: 'Néerlandais' },
      { id: 'belge', label: 'Belge' },
      { id: 'suisse', label: 'Suisse' },
      { id: 'autrichien', label: 'Autrichien' },
      { id: 'polonais', label: 'Polonais' },
      { id: 'tcheque', label: 'Tchèque' },
      { id: 'hongrois', label: 'Hongrois' },
      { id: 'roumain', label: 'Roumain' },
      { id: 'bulgare', label: 'Bulgare' },
      { id: 'grec', label: 'Grec' },
      { id: 'russe', label: 'Russe' },
      { id: 'ukrainien', label: 'Ukrainien' },
      { id: 'scandinave', label: 'Scandinave' },
      { id: 'nordique', label: 'Nordique' },
    ],
  },
  {
    id: 'moyen-orient',
    label: 'Moyen-Orient',
    subcategories: [
      { id: 'libanais', label: 'Libanais' },
      { id: 'syrien', label: 'Syrien' },
      { id: 'jordanien', label: 'Jordanien' },
      { id: 'palestinien', label: 'Palestinien' },
      { id: 'israelien', label: 'Israélien' },
      { id: 'irakien', label: 'Irakien' },
      { id: 'iranien', label: 'Iranien' },
      { id: 'saoudien', label: 'Saoudien' },
      { id: 'emirati', label: 'Émirati' },
      { id: 'qatari', label: 'Qatari' },
      { id: 'kuwaitien', label: 'Koweïtien' },
      { id: 'bahreini', label: 'Bahreïnien' },
      { id: 'omanais', label: 'Omanais' },
      { id: 'yemenite', label: 'Yéménite' },
    ],
  },
  {
    id: 'turc',
    label: 'Turc',
    subcategories: [
      { id: 'turc-anatolie', label: 'Turc (Anatolie)' },
      { id: 'turc-istanbul', label: 'Turc (Istanbul)' },
      { id: 'kurde', label: 'Kurde' },
    ],
  },
  {
    id: 'amerique-latine',
    label: 'Amérique latine',
    subcategories: [
      { id: 'mexicain', label: 'Mexicain' },
      { id: 'bresilien', label: 'Brésilien' },
      { id: 'argentin', label: 'Argentin' },
      { id: 'chilien', label: 'Chilien' },
      { id: 'colombien', label: 'Colombien' },
      { id: 'peruvien', label: 'Péruvien' },
      { id: 'venezuelien', label: 'Vénézuélien' },
      { id: 'equatorien', label: 'Équatorien' },
      { id: 'bolivien', label: 'Bolivien' },
      { id: 'paraguayen', label: 'Paraguayen' },
      { id: 'uruguayen', label: 'Uruguayen' },
    ],
  },
  {
    id: 'amerique-nord',
    label: 'Amérique du Nord',
    subcategories: [
      { id: 'americain', label: 'Américain' },
      { id: 'canadien', label: 'Canadien' },
      { id: 'amerique-latine-us', label: 'Amérique latine (USA)' },
    ],
  },
  {
    id: 'oceanie',
    label: 'Océanie',
    subcategories: [
      { id: 'australien', label: 'Australien' },
      { id: 'neo-zelandais', label: 'Néo-Zélandais' },
      { id: 'polynesien', label: 'Polynésien' },
      { id: 'melanesien', label: 'Mélanésien' },
    ],
  },
  {
    id: 'mixte',
    label: 'Mixte/Multiculturel',
    subcategories: [
      { id: 'mixte-afro-europeen', label: 'Afro-Européen' },
      { id: 'mixte-afro-asiatique', label: 'Afro-Asiatique' },
      { id: 'mixte-euro-asiatique', label: 'Euro-Asiatique' },
      { id: 'mixte-maghreb-europe', label: 'Maghrébin-Européen' },
      { id: 'mixte-autre', label: 'Autre combinaison' },
    ],
  },
];

// Liste plate de toutes les cultures (pour compatibilité avec l'ancien code)
// Inclut les catégories principales ET toutes les sous-catégories
// Utilise un Map pour éviter les doublons par ID
const culturesMap = new Map<string, { id: string; label: string }>()

// Ajouter les catégories principales (pour compatibilité)
const mainCategories = [
  { id: 'maghrebin', label: 'Maghrébin' },
  { id: 'indien', label: 'Indien' },
  { id: 'pakistanais', label: 'Pakistanais' },
  { id: 'antillais', label: 'Antillais' },
  { id: 'africain', label: 'Africain' },
  { id: 'asiatique', label: 'Asiatique' },
  { id: 'europeen', label: 'Européen' },
  { id: 'turc', label: 'Turc' },
  { id: 'mixte', label: 'Mixte/Multiculturel' },
]

mainCategories.forEach(cat => {
  culturesMap.set(cat.id, cat)
})

// Ajouter toutes les sous-catégories (les sous-catégories écrasent les catégories principales si même ID)
CULTURE_CATEGORIES.forEach(cat => {
  cat.subcategories?.forEach(sub => {
    culturesMap.set(sub.id, sub)
  })
})

export const CULTURES = Array.from(culturesMap.values());

export type CultureId = typeof CULTURES[number]['id'];

// Fonction utilitaire pour obtenir toutes les cultures (catégories + sous-catégories)
export function getAllCultures(): Array<{ id: string; label: string }> {
  return CULTURES;
}

// Fonction utilitaire pour obtenir une culture par son ID
export function getCultureById(id: string): { id: string; label: string } | undefined {
  return CULTURES.find(c => c.id === id);
}

// Fonction utilitaire pour obtenir les sous-catégories d'une catégorie
export function getSubcategories(categoryId: string): CultureSubcategory[] {
  const category = CULTURE_CATEGORIES.find(cat => cat.id === categoryId);
  return category?.subcategories || [];
}
