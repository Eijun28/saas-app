// Liste complète des 101 départements français (96 métropolitains + 5 DOM-TOM)
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
  { id: '03', label: 'Allier (03)', region: 'Auvergne-Rhône-Alpes' },
  { id: '07', label: 'Ardèche (07)', region: 'Auvergne-Rhône-Alpes' },
  { id: '15', label: 'Cantal (15)', region: 'Auvergne-Rhône-Alpes' },
  { id: '26', label: 'Drôme (26)', region: 'Auvergne-Rhône-Alpes' },
  { id: '38', label: 'Isère (38)', region: 'Auvergne-Rhône-Alpes' },
  { id: '42', label: 'Loire (42)', region: 'Auvergne-Rhône-Alpes' },
  { id: '43', label: 'Haute-Loire (43)', region: 'Auvergne-Rhône-Alpes' },
  { id: '63', label: 'Puy-de-Dôme (63)', region: 'Auvergne-Rhône-Alpes' },
  { id: '69', label: 'Rhône (69)', region: 'Auvergne-Rhône-Alpes' },
  { id: '73', label: 'Savoie (73)', region: 'Auvergne-Rhône-Alpes' },
  { id: '74', label: 'Haute-Savoie (74)', region: 'Auvergne-Rhône-Alpes' },

  // Provence-Alpes-Côte d'Azur
  { id: '04', label: 'Alpes-de-Haute-Provence (04)', region: 'Provence-Alpes-Côte d\'Azur' },
  { id: '05', label: 'Hautes-Alpes (05)', region: 'Provence-Alpes-Côte d\'Azur' },
  { id: '06', label: 'Alpes-Maritimes (06)', region: 'Provence-Alpes-Côte d\'Azur' },
  { id: '13', label: 'Bouches-du-Rhône (13)', region: 'Provence-Alpes-Côte d\'Azur' },
  { id: '83', label: 'Var (83)', region: 'Provence-Alpes-Côte d\'Azur' },
  { id: '84', label: 'Vaucluse (84)', region: 'Provence-Alpes-Côte d\'Azur' },

  // Occitanie
  { id: '09', label: 'Ariège (09)', region: 'Occitanie' },
  { id: '11', label: 'Aude (11)', region: 'Occitanie' },
  { id: '12', label: 'Aveyron (12)', region: 'Occitanie' },
  { id: '30', label: 'Gard (30)', region: 'Occitanie' },
  { id: '31', label: 'Haute-Garonne (31)', region: 'Occitanie' },
  { id: '32', label: 'Gers (32)', region: 'Occitanie' },
  { id: '34', label: 'Hérault (34)', region: 'Occitanie' },
  { id: '46', label: 'Lot (46)', region: 'Occitanie' },
  { id: '48', label: 'Lozère (48)', region: 'Occitanie' },
  { id: '65', label: 'Hautes-Pyrénées (65)', region: 'Occitanie' },
  { id: '66', label: 'Pyrénées-Orientales (66)', region: 'Occitanie' },
  { id: '81', label: 'Tarn (81)', region: 'Occitanie' },
  { id: '82', label: 'Tarn-et-Garonne (82)', region: 'Occitanie' },

  // Nouvelle-Aquitaine
  { id: '16', label: 'Charente (16)', region: 'Nouvelle-Aquitaine' },
  { id: '17', label: 'Charente-Maritime (17)', region: 'Nouvelle-Aquitaine' },
  { id: '19', label: 'Corrèze (19)', region: 'Nouvelle-Aquitaine' },
  { id: '23', label: 'Creuse (23)', region: 'Nouvelle-Aquitaine' },
  { id: '24', label: 'Dordogne (24)', region: 'Nouvelle-Aquitaine' },
  { id: '33', label: 'Gironde (33)', region: 'Nouvelle-Aquitaine' },
  { id: '40', label: 'Landes (40)', region: 'Nouvelle-Aquitaine' },
  { id: '47', label: 'Lot-et-Garonne (47)', region: 'Nouvelle-Aquitaine' },
  { id: '64', label: 'Pyrénées-Atlantiques (64)', region: 'Nouvelle-Aquitaine' },
  { id: '79', label: 'Deux-Sèvres (79)', region: 'Nouvelle-Aquitaine' },
  { id: '86', label: 'Vienne (86)', region: 'Nouvelle-Aquitaine' },
  { id: '87', label: 'Haute-Vienne (87)', region: 'Nouvelle-Aquitaine' },

  // Hauts-de-France
  { id: '02', label: 'Aisne (02)', region: 'Hauts-de-France' },
  { id: '59', label: 'Nord (59)', region: 'Hauts-de-France' },
  { id: '60', label: 'Oise (60)', region: 'Hauts-de-France' },
  { id: '62', label: 'Pas-de-Calais (62)', region: 'Hauts-de-France' },
  { id: '80', label: 'Somme (80)', region: 'Hauts-de-France' },

  // Grand Est
  { id: '08', label: 'Ardennes (08)', region: 'Grand Est' },
  { id: '10', label: 'Aube (10)', region: 'Grand Est' },
  { id: '51', label: 'Marne (51)', region: 'Grand Est' },
  { id: '52', label: 'Haute-Marne (52)', region: 'Grand Est' },
  { id: '54', label: 'Meurthe-et-Moselle (54)', region: 'Grand Est' },
  { id: '55', label: 'Meuse (55)', region: 'Grand Est' },
  { id: '57', label: 'Moselle (57)', region: 'Grand Est' },
  { id: '67', label: 'Bas-Rhin (67)', region: 'Grand Est' },
  { id: '68', label: 'Haut-Rhin (68)', region: 'Grand Est' },
  { id: '88', label: 'Vosges (88)', region: 'Grand Est' },

  // Normandie
  { id: '14', label: 'Calvados (14)', region: 'Normandie' },
  { id: '27', label: 'Eure (27)', region: 'Normandie' },
  { id: '50', label: 'Manche (50)', region: 'Normandie' },
  { id: '61', label: 'Orne (61)', region: 'Normandie' },
  { id: '76', label: 'Seine-Maritime (76)', region: 'Normandie' },

  // Pays de la Loire
  { id: '44', label: 'Loire-Atlantique (44)', region: 'Pays de la Loire' },
  { id: '49', label: 'Maine-et-Loire (49)', region: 'Pays de la Loire' },
  { id: '53', label: 'Mayenne (53)', region: 'Pays de la Loire' },
  { id: '72', label: 'Sarthe (72)', region: 'Pays de la Loire' },
  { id: '85', label: 'Vendée (85)', region: 'Pays de la Loire' },

  // Bretagne
  { id: '22', label: 'Côtes-d\'Armor (22)', region: 'Bretagne' },
  { id: '29', label: 'Finistère (29)', region: 'Bretagne' },
  { id: '35', label: 'Ille-et-Vilaine (35)', region: 'Bretagne' },
  { id: '56', label: 'Morbihan (56)', region: 'Bretagne' },

  // Centre-Val de Loire
  { id: '18', label: 'Cher (18)', region: 'Centre-Val de Loire' },
  { id: '28', label: 'Eure-et-Loir (28)', region: 'Centre-Val de Loire' },
  { id: '36', label: 'Indre (36)', region: 'Centre-Val de Loire' },
  { id: '37', label: 'Indre-et-Loire (37)', region: 'Centre-Val de Loire' },
  { id: '41', label: 'Loir-et-Cher (41)', region: 'Centre-Val de Loire' },
  { id: '45', label: 'Loiret (45)', region: 'Centre-Val de Loire' },

  // Bourgogne-Franche-Comté
  { id: '21', label: 'Côte-d\'Or (21)', region: 'Bourgogne-Franche-Comté' },
  { id: '25', label: 'Doubs (25)', region: 'Bourgogne-Franche-Comté' },
  { id: '39', label: 'Jura (39)', region: 'Bourgogne-Franche-Comté' },
  { id: '58', label: 'Nièvre (58)', region: 'Bourgogne-Franche-Comté' },
  { id: '70', label: 'Haute-Saône (70)', region: 'Bourgogne-Franche-Comté' },
  { id: '71', label: 'Saône-et-Loire (71)', region: 'Bourgogne-Franche-Comté' },
  { id: '89', label: 'Yonne (89)', region: 'Bourgogne-Franche-Comté' },
  { id: '90', label: 'Territoire de Belfort (90)', region: 'Bourgogne-Franche-Comté' },

  // Corse
  { id: '2A', label: 'Corse-du-Sud (2A)', region: 'Corse' },
  { id: '2B', label: 'Haute-Corse (2B)', region: 'Corse' },

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
}, {} as Record<string, Array<typeof DEPARTEMENTS[number]>>);
