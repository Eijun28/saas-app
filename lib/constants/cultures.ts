export const CULTURES = [
  { id: 'maghrebin', label: 'Maghrébin' },
  { id: 'indien', label: 'Indien' },
  { id: 'pakistanais', label: 'Pakistanais' },
  { id: 'antillais', label: 'Antillais' },
  { id: 'africain', label: 'Africain' },
  { id: 'asiatique', label: 'Asiatique' },
  { id: 'europeen', label: 'Européen' },
  { id: 'turc', label: 'Turc' },
  { id: 'libanais', label: 'Libanais' },
  { id: 'mixte', label: 'Mixte/Multiculturel' },
] as const;

export type CultureId = typeof CULTURES[number]['id'];

