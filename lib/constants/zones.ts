// Liste des départements français (focus sur les principaux)
export const DEPARTEMENTS = [
  // Île-de-France
  { id: '75', label: 'Paris (75)', region: 'Île-de-France' },
  { id: '77', label: 'Seine-et-Marne (77)', region: 'Île-de-France' },
  { id: '78', label: 'Yvelines (78)', region: 'Île-de-France' },
  { id: '91', label: 'Essonne (91)', region: 'Île-de-France' },
  { id: '92', label: 'Hauts-de-Seine (92)', region: 'Île-de-France' },
  { id: '93', label: 'Seine-Saint-Denis (93)', region: 'Île-de-France' },
  { id: '94', label: 'Val-de-Marne (94)', region: 'Île-de-France' },
  { id: '95', label: 'Val-d\'Oise (95)', region: 'Île-de-France' },
  
  // Auvergne-Rhône-Alpes
  { id: '01', label: 'Ain (01)', region: 'Auvergne-Rhône-Alpes' },
  { id: '38', label: 'Isère (38)', region: 'Auvergne-Rhône-Alpes' },
  { id: '69', label: 'Rhône (69)', region: 'Auvergne-Rhône-Alpes' },
  { id: '73', label: 'Savoie (73)', region: 'Auvergne-Rhône-Alpes' },
  { id: '74', label: 'Haute-Savoie (74)', region: 'Auvergne-Rhône-Alpes' },
  
  // Provence-Alpes-Côte d'Azur
  { id: '04', label: 'Alpes-de-Haute-Provence (04)', region: 'PACA' },
  { id: '06', label: 'Alpes-Maritimes (06)', region: 'PACA' },
  { id: '13', label: 'Bouches-du-Rhône (13)', region: 'PACA' },
  { id: '83', label: 'Var (83)', region: 'PACA' },
  { id: '84', label: 'Vaucluse (84)', region: 'PACA' },
  
  // Occitanie
  { id: '11', label: 'Aude (11)', region: 'Occitanie' },
  { id: '30', label: 'Gard (30)', region: 'Occitanie' },
  { id: '31', label: 'Haute-Garonne (31)', region: 'Occitanie' },
  { id: '34', label: 'Hérault (34)', region: 'Occitanie' },
  { id: '66', label: 'Pyrénées-Orientales (66)', region: 'Occitanie' },
  
  // Nouvelle-Aquitaine
  { id: '33', label: 'Gironde (33)', region: 'Nouvelle-Aquitaine' },
  { id: '40', label: 'Landes (40)', region: 'Nouvelle-Aquitaine' },
  { id: '64', label: 'Pyrénées-Atlantiques (64)', region: 'Nouvelle-Aquitaine' },
  
  // Hauts-de-France
  { id: '59', label: 'Nord (59)', region: 'Hauts-de-France' },
  { id: '62', label: 'Pas-de-Calais (62)', region: 'Hauts-de-France' },
  
  // Grand Est
  { id: '54', label: 'Meurthe-et-Moselle (54)', region: 'Grand Est' },
  { id: '57', label: 'Moselle (57)', region: 'Grand Est' },
  { id: '67', label: 'Bas-Rhin (67)', region: 'Grand Est' },
  { id: '68', label: 'Haut-Rhin (68)', region: 'Grand Est' },
  
  // Pays de la Loire
  { id: '44', label: 'Loire-Atlantique (44)', region: 'Pays de la Loire' },
  { id: '49', label: 'Maine-et-Loire (49)', region: 'Pays de la Loire' },
  
  // Bretagne
  { id: '29', label: 'Finistère (29)', region: 'Bretagne' },
  { id: '35', label: 'Ille-et-Vilaine (35)', region: 'Bretagne' },
  { id: '56', label: 'Morbihan (56)', region: 'Bretagne' },
  
  // DOM-TOM
  { id: '971', label: 'Guadeloupe (971)', region: 'DOM-TOM' },
  { id: '972', label: 'Martinique (972)', region: 'DOM-TOM' },
  { id: '973', label: 'Guyane (973)', region: 'DOM-TOM' },
  { id: '974', label: 'La Réunion (974)', region: 'DOM-TOM' },
  { id: '976', label: 'Mayotte (976)', region: 'DOM-TOM' },
] as const;

export type ZoneId = typeof DEPARTEMENTS[number]['id'];

// Helper pour regrouper par région
export const DEPARTEMENTS_BY_REGION = DEPARTEMENTS.reduce((acc, dept) => {
  if (!acc[dept.region]) {
    acc[dept.region] = [];
  }
  acc[dept.region].push(dept);
  return acc;
}, {} as Record<string, typeof DEPARTEMENTS>);

