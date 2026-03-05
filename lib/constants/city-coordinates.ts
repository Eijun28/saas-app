/** Coordinates for major French cities [lat, lng] */
export const CITY_COORDINATES: Record<string, [number, number]> = {
  // Île-de-France
  'paris': [48.8566, 2.3522],
  'boulogne-billancourt': [48.8352, 2.2419],
  'saint-denis': [48.9362, 2.3574],
  'montreuil': [48.8638, 2.4486],
  'nanterre': [48.8924, 2.2071],
  'versailles': [48.8014, 2.1301],
  'creteil': [48.7905, 2.4551],
  'evry': [48.6244, 2.4400],

  // Major cities
  'marseille': [43.2965, 5.3698],
  'lyon': [45.7640, 4.8357],
  'toulouse': [43.6047, 1.4442],
  'nice': [43.7102, 7.2620],
  'nantes': [47.2184, -1.5536],
  'montpellier': [43.6108, 3.8767],
  'strasbourg': [48.5734, 7.7521],
  'bordeaux': [44.8378, -0.5792],
  'lille': [50.6292, 3.0573],
  'rennes': [48.1173, -1.6778],
  'reims': [49.2583, 3.6361],
  'toulon': [43.1242, 5.9280],
  'saint-etienne': [45.4397, 4.3872],
  'le havre': [49.4944, 0.1079],
  'grenoble': [45.1885, 5.7245],
  'dijon': [47.3220, 5.0415],
  'angers': [47.4784, -0.5632],
  'nimes': [43.8367, 4.3601],
  'clermont-ferrand': [45.7772, 3.0870],
  'tours': [47.3941, 0.6848],
  'amiens': [49.8941, 2.3024],
  'limoges': [45.8336, 1.2611],
  'metz': [49.1193, 6.1757],
  'perpignan': [42.6986, 2.8956],
  'besancon': [47.2378, 6.0241],
  'orleans': [47.9029, 1.9039],
  'rouen': [49.4432, 1.0993],
  'mulhouse': [47.7508, 7.3359],
  'caen': [49.1829, -0.3707],
  'nancy': [48.6921, 6.1844],
  'brest': [48.3904, -4.4861],
  'argenteuil': [48.9472, 2.2467],
  'avignon': [43.9493, 4.8055],
  'cannes': [43.5528, 7.0174],
  'pau': [43.2951, -0.3708],
  'la rochelle': [46.1603, -1.1511],
  'ajaccio': [41.9192, 8.7386],
  'bastia': [42.6970, 9.4503],
  'poitiers': [46.5802, 0.3404],
  'troyes': [48.2973, 4.0744],
  'aix-en-provence': [43.5297, 5.4474],

  // DOM-TOM
  'fort-de-france': [14.6161, -61.0588],
  'pointe-a-pitre': [16.2411, -61.5331],
  'saint-denis reunion': [-20.8823, 55.4504],
  'cayenne': [4.9372, -52.3260],
  'noumea': [-22.2758, 166.4580],
  'papeete': [-17.5353, -149.5695],
}

/** Normalize city name for lookup */
function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
}

/** Get coordinates for a city name (fuzzy match) */
export function getCityCoordinates(city: string): [number, number] | null {
  const normalized = normalizeCity(city)

  // Exact match
  if (CITY_COORDINATES[normalized]) return CITY_COORDINATES[normalized]

  // Partial match (city contains or is contained)
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) return coords
  }

  return null
}

/** Default center of France */
export const FRANCE_CENTER: [number, number] = [46.603354, 1.888334]
export const FRANCE_ZOOM = 6
