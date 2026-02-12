/**
 * Checklist générique de préparatifs de mariage.
 * months_before_wedding : nombre de mois avant la date de mariage (0 = mois du mariage).
 * Les tâches sont triées par ordre chronologique (du plus lointain au plus proche).
 */

export interface DefaultWeddingTask {
  title: string
  description?: string
  category: WeddingTaskCategory
  priority: 'high' | 'medium' | 'low'
  months_before_wedding: number
  href?: string
}

export type WeddingTaskCategory =
  | 'lieu'
  | 'traiteur'
  | 'tenue'
  | 'photo_video'
  | 'musique'
  | 'decoration'
  | 'administratif'
  | 'invitations'
  | 'beaute'
  | 'logistique'
  | 'general'

export const TASK_CATEGORY_LABELS: Record<WeddingTaskCategory, string> = {
  lieu: 'Lieu & Salle',
  traiteur: 'Traiteur & Restauration',
  tenue: 'Tenue & Accessoires',
  photo_video: 'Photo & Video',
  musique: 'Musique & Animation',
  decoration: 'Decoration & Fleurs',
  administratif: 'Administratif',
  invitations: 'Invitations & Communication',
  beaute: 'Beaute & Bien-etre',
  logistique: 'Logistique & Organisation',
  general: 'General',
}

export const DEFAULT_WEDDING_TASKS: DefaultWeddingTask[] = [
  // 12+ mois avant
  {
    title: 'Definir le budget global du mariage',
    description: 'Etablir une enveloppe budgetaire avec une marge de 10-15% pour les imprevus.',
    category: 'general',
    priority: 'high',
    months_before_wedding: 12,
    href: '/couple/budget',
  },
  {
    title: 'Choisir la date du mariage',
    description: 'Verifier la disponibilite des proches et les periodes de haute saison.',
    category: 'general',
    priority: 'high',
    months_before_wedding: 12,
    href: '/couple/profil',
  },
  {
    title: 'Definir le style et le theme du mariage',
    description: 'Moderne, traditionnel, boheme, champetre, fusion culturelle...',
    category: 'general',
    priority: 'medium',
    months_before_wedding: 12,
  },
  {
    title: 'Etablir la liste des invites',
    description: 'Lister les personnes a inviter et estimer le nombre total.',
    category: 'invitations',
    priority: 'high',
    months_before_wedding: 12,
  },
  {
    title: 'Chercher et reserver le lieu de reception',
    description: 'Visiter les salles, comparer les offres et reserver.',
    category: 'lieu',
    priority: 'high',
    months_before_wedding: 12,
    href: '/couple/recherche',
  },

  // 9-10 mois avant
  {
    title: 'Chercher un traiteur',
    description: 'Degustation, menu, options alimentaires (halal, vegetarien...).',
    category: 'traiteur',
    priority: 'high',
    months_before_wedding: 10,
    href: '/couple/recherche',
  },
  {
    title: 'Reserver photographe et/ou videaste',
    description: 'Regarder les portfolios et reserver le prestataire.',
    category: 'photo_video',
    priority: 'high',
    months_before_wedding: 10,
    href: '/couple/recherche',
  },
  {
    title: 'Reserver DJ ou musiciens',
    description: 'Definir l\'ambiance musicale souhaitee.',
    category: 'musique',
    priority: 'medium',
    months_before_wedding: 9,
    href: '/couple/recherche',
  },
  {
    title: 'Chercher la robe / le costume',
    description: 'Prendre rendez-vous pour les essayages.',
    category: 'tenue',
    priority: 'high',
    months_before_wedding: 9,
  },
  {
    title: 'Choisir un officiant ou imam/rabbin/pretre',
    description: 'Contacter l\'officiant pour la ceremonie religieuse ou laique.',
    category: 'administratif',
    priority: 'medium',
    months_before_wedding: 9,
  },

  // 6-8 mois avant
  {
    title: 'Commander les faire-part',
    description: 'Choisir le design et lancer la production.',
    category: 'invitations',
    priority: 'medium',
    months_before_wedding: 7,
  },
  {
    title: 'Reserver le fleuriste',
    description: 'Bouquet, centre de table, arche florale...',
    category: 'decoration',
    priority: 'medium',
    months_before_wedding: 7,
    href: '/couple/recherche',
  },
  {
    title: 'Organiser les animations',
    description: 'Photobooth, jeux, spectacle, traditions culturelles...',
    category: 'musique',
    priority: 'low',
    months_before_wedding: 6,
  },
  {
    title: 'Choisir le patissier / gateau de mariage',
    description: 'Degustation et choix du design du gateau.',
    category: 'traiteur',
    priority: 'medium',
    months_before_wedding: 6,
    href: '/couple/recherche',
  },
  {
    title: 'Reserver le coiffeur et maquilleur',
    description: 'Essai coiffure et maquillage.',
    category: 'beaute',
    priority: 'medium',
    months_before_wedding: 6,
    href: '/couple/recherche',
  },

  // 4-5 mois avant
  {
    title: 'Envoyer les faire-part',
    description: 'Envoyer les invitations et gerer les retours RSVP.',
    category: 'invitations',
    priority: 'high',
    months_before_wedding: 4,
  },
  {
    title: 'Choisir les alliances',
    description: 'Visiter les bijouteries et commander les alliances.',
    category: 'tenue',
    priority: 'medium',
    months_before_wedding: 4,
  },
  {
    title: 'Planifier la decoration de salle',
    description: 'Centres de table, plan de salle, eclairage...',
    category: 'decoration',
    priority: 'medium',
    months_before_wedding: 4,
  },
  {
    title: 'Organiser le transport des invites',
    description: 'Navettes, parking, hebergement pour les invites de loin.',
    category: 'logistique',
    priority: 'low',
    months_before_wedding: 4,
  },

  // 2-3 mois avant
  {
    title: 'Confirmer tous les prestataires',
    description: 'Verifier les contrats, horaires et details logistiques.',
    category: 'logistique',
    priority: 'high',
    months_before_wedding: 2,
  },
  {
    title: 'Essayage final de la tenue',
    description: 'Dernier essayage avec retouches si necessaire.',
    category: 'tenue',
    priority: 'high',
    months_before_wedding: 2,
  },
  {
    title: 'Finaliser le plan de table',
    description: 'Organiser les places en fonction des RSVP recus.',
    category: 'logistique',
    priority: 'medium',
    months_before_wedding: 2,
  },
  {
    title: 'Preparer les documents administratifs',
    description: 'Dossier mairie, documents religieux si applicable.',
    category: 'administratif',
    priority: 'high',
    months_before_wedding: 2,
  },

  // 1 mois avant
  {
    title: 'Confirmer le nombre final d\'invites',
    description: 'Communiquer le nombre exact au traiteur et a la salle.',
    category: 'logistique',
    priority: 'high',
    months_before_wedding: 1,
  },
  {
    title: 'Essai coiffure et maquillage',
    description: 'Tester le look final avec le coiffeur/maquilleur.',
    category: 'beaute',
    priority: 'medium',
    months_before_wedding: 1,
  },
  {
    title: 'Preparer les voeux (si ceremonie laique)',
    description: 'Ecrire les voeux personnels ou preparer la ceremonie.',
    category: 'general',
    priority: 'medium',
    months_before_wedding: 1,
  },

  // Semaine du mariage
  {
    title: 'Briefer le coordinateur / temoin',
    description: 'Partager le planning detaille de la journee.',
    category: 'logistique',
    priority: 'high',
    months_before_wedding: 0,
  },
  {
    title: 'Preparer la valise lune de miel',
    description: 'Si depart en voyage de noces juste apres le mariage.',
    category: 'general',
    priority: 'low',
    months_before_wedding: 0,
  },
]

/**
 * Calcule la due_date relative à la date de mariage.
 * Retourne la date X mois avant le mariage.
 */
export function calculateDueDate(weddingDate: string, monthsBefore: number): string {
  const date = new Date(weddingDate)
  date.setMonth(date.getMonth() - monthsBefore)
  return date.toISOString().split('T')[0]
}

/**
 * Retourne un label lisible pour la due_date relative.
 */
export function getRelativeDueDateLabel(monthsBefore: number): string {
  if (monthsBefore === 0) return 'Semaine du mariage'
  if (monthsBefore === 1) return '1 mois avant'
  return `${monthsBefore} mois avant`
}
