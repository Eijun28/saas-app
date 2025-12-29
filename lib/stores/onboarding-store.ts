import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'couple' | 'prestataire'
export type PrestataireType =
  | 'photographe'
  | 'videaste'
  | 'traiteur'
  | 'dj'
  | 'fleuriste'
  | 'wedding_planner'
  | 'salle'
  | 'coiffure_maquillage'
  | 'patissier'
  | 'location_materiel'
  | 'autre'

interface OnboardingStore {
  currentStep: number
  role: UserRole | null
  prenom: string
  nom: string
  email: string

  // Couple data
  villeMarriage: string
  dateMarriage: Date | null
  budgetMin: number
  budgetMax: number
  culture: string
  prestatairesRecherches: PrestataireType[]

  // Prestataire data
  nomEntreprise: string
  typePrestation: PrestataireType | null
  villeExercice: string
  tarifMin: number
  tarifMax: number
  culturesGerees: string[]

  // Actions
  setStep: (step: number) => void
  setRole: (role: UserRole) => void
  setPersonalInfo: (prenom: string, nom: string) => void
  setEmail: (email: string) => void
  setCoupleData: (data: Partial<CoupleData>) => void
  setPrestataireData: (data: Partial<PrestataireData>) => void
  reset: () => void
}

interface CoupleData {
  villeMarriage: string
  dateMarriage: Date | null
  budgetMin: number
  budgetMax: number
  culture: string
  prestatairesRecherches: PrestataireType[]
}

interface PrestataireData {
  nomEntreprise: string
  typePrestation: PrestataireType | null
  villeExercice: string
  tarifMin: number
  tarifMax: number
  culturesGerees: string[]
}

const initialState = {
  currentStep: 1,
  role: null as UserRole | null,
  prenom: '',
  nom: '',
  email: '',
  villeMarriage: '',
  dateMarriage: null as Date | null,
  budgetMin: 5000,
  budgetMax: 50000,
  culture: '',
  prestatairesRecherches: [] as PrestataireType[],
  nomEntreprise: '',
  typePrestation: null as PrestataireType | null,
  villeExercice: '',
  tarifMin: 500,
  tarifMax: 10000,
  culturesGerees: [] as string[],
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      setRole: (role) => set({ role }),

      setPersonalInfo: (prenom, nom) => set({ prenom, nom }),

      setEmail: (email) => set({ email }),

      setCoupleData: (data) =>
        set((state) => ({
          villeMarriage: data.villeMarriage ?? state.villeMarriage,
          dateMarriage: data.dateMarriage ?? state.dateMarriage,
          budgetMin: data.budgetMin ?? state.budgetMin,
          budgetMax: data.budgetMax ?? state.budgetMax,
          culture: data.culture ?? state.culture,
          prestatairesRecherches:
            data.prestatairesRecherches ?? state.prestatairesRecherches,
        })),

      setPrestataireData: (data) =>
        set((state) => ({
          nomEntreprise: data.nomEntreprise ?? state.nomEntreprise,
          typePrestation: data.typePrestation ?? state.typePrestation,
          villeExercice: data.villeExercice ?? state.villeExercice,
          tarifMin: data.tarifMin ?? state.tarifMin,
          tarifMax: data.tarifMax ?? state.tarifMax,
          culturesGerees: data.culturesGerees ?? state.culturesGerees,
        })),

      reset: () => set(initialState),
    }),
    { name: 'nuply-onboarding' }
  )
)

