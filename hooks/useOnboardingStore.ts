import { create } from 'zustand'

export type OnboardingType = 'couple' | 'prestataire' | null

interface CoupleData {
  prenom: string
  dateMariage: string
  villeMariage: string
  budget: string
  cultures: string[]
  styleMariage: string
  motivation: string
}

interface PrestataireData {
  prenom: string
  nom: string
  nomEntreprise: string
  typePrestation: string
  villeZone: string
  tarifMin: string
  tarifMax: string
  cultures: string[]
  motivation: string
}

interface OnboardingStore {
  type: OnboardingType
  coupleData: CoupleData
  prestataireData: PrestataireData
  
  setType: (type: OnboardingType) => void
  updateCoupleData: (data: Partial<CoupleData>) => void
  updatePrestataireData: (data: Partial<PrestataireData>) => void
  reset: () => void
}

const initialCoupleData: CoupleData = {
  prenom: '',
  dateMariage: '',
  villeMariage: '',
  budget: '',
  cultures: [],
  styleMariage: '',
  motivation: '',
}

const initialPrestataireData: PrestataireData = {
  prenom: '',
  nom: '',
  nomEntreprise: '',
  typePrestation: '',
  villeZone: '',
  tarifMin: '',
  tarifMax: '',
  cultures: [],
  motivation: '',
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  type: null,
  coupleData: initialCoupleData,
  prestataireData: initialPrestataireData,
  
  setType: (type) => set({ type }),
  
  updateCoupleData: (data) =>
    set((state) => ({
      coupleData: { ...state.coupleData, ...data },
    })),
  
  updatePrestataireData: (data) =>
    set((state) => ({
      prestataireData: { ...state.prestataireData, ...data },
    })),
  
  reset: () =>
    set({
      type: null,
      coupleData: initialCoupleData,
      prestataireData: initialPrestataireData,
    }),
}))

