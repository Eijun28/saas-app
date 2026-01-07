export type Continent = 
  | 'afrique'
  | 'asie'
  | 'europe'
  | 'amerique'
  | 'oceanie'
  | 'moyen-orient'

export type Country = string

export type ReligionChoice = 'oui' | 'non' | 'autre'

export interface CommunitySelection {
  continent: Continent | null
  country: Country | null
  religion: ReligionChoice | null
  religionOther?: string | null
}

export type PrestataireType = 
  | 'Traiteur'
  | 'Photographe'
  | 'Vidéaste'
  | 'DJ / Musicien'
  | 'Salle de réception'
  | 'Décorateur / Fleuriste'
  | 'Coiffeur / Maquilleur'
  | 'Pâtissier (Wedding cake)'
  | 'Robe de mariée / Costume'
  | 'Bijoutier'
  | 'Faire-part / Papeterie'
  | 'Animation (photobooth, jeux...)'
  | 'Wedding planner'
  | 'Officiant de cérémonie'
  | 'Location de véhicules'
  | 'Autre'

export interface CoupleCommunities {
  epoux1: CommunitySelection | null
  epoux2: CommunitySelection | null
}

export interface QuizAnswers {
  communities: CoupleCommunities | null
  prestataire: PrestataireType | null
  budget: number | null
}

export interface PrestataireMatch {
  id: string
  name: string
  category: string
  location: string
  score: number
  image: string
  rating: number
  reviewCount: number
}

export type QuizStep = 'intro' | 'q1' | 'q2' | 'q3' | 'loading' | 'results'
