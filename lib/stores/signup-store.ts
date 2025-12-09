import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ProfileType = 'couple' | 'prestataire' | null

interface CoupleData {
  prenom: string
  nom: string
  dateMariage: string | null // Stocké comme ISO string pour localStorage
  budget: number
  lieu: string
  typeCeremonie: string
  infosCulturelles: string
}

interface PrestataireData {
  nomEntreprise: string
  typePrestation: string
  typePrestationCustom: string
  zoneIntervention: string
  anneesExperience: number
  prixMin: number
  prixMax: number
  cvPortfolio: string
}

interface Credentials {
  email: string
  password: string
  confirmPassword: string
}

interface SignUpStore {
  // Étape 0 : Choix du profil
  profileType: ProfileType
  
  // Données communes
  credentials: Credentials
  
  // Données spécifiques
  coupleData: CoupleData
  prestataireData: PrestataireData
  
  // Navigation
  currentStep: number
  
  // Actions
  setProfileType: (type: ProfileType) => void
  updateCoupleData: (data: Partial<CoupleData>) => void
  updatePrestataireData: (data: Partial<PrestataireData>) => void
  updateCredentials: (data: Partial<Credentials>) => void
  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  reset: () => void
}

const initialCoupleData: CoupleData = {
  prenom: '',
  nom: '',
  dateMariage: null,
  budget: 0,
  lieu: '',
  typeCeremonie: '',
  infosCulturelles: '',
}

const initialPrestataireData: PrestataireData = {
  nomEntreprise: '',
  typePrestation: '',
  typePrestationCustom: '',
  zoneIntervention: '',
  anneesExperience: 0,
  prixMin: 0,
  prixMax: 0,
  cvPortfolio: '',
}

const initialCredentials: Credentials = {
  email: '',
  password: '',
  confirmPassword: '',
}

export const useSignUpStore = create<SignUpStore>()(
  persist(
    (set, get) => ({
      profileType: null,
      credentials: initialCredentials,
      coupleData: initialCoupleData,
      prestataireData: initialPrestataireData,
      currentStep: 0,
      
      setProfileType: (type) => set({ profileType: type, currentStep: 1 }),
      
      updateCoupleData: (data) =>
        set((state) => ({
          coupleData: { ...state.coupleData, ...data },
        })),
      
      updatePrestataireData: (data) =>
        set((state) => ({
          prestataireData: { ...state.prestataireData, ...data },
        })),
      
      updateCredentials: (data) => {
        set((state) => {
          // Éviter les mises à jour inutiles si les valeurs sont identiques
          const newCredentials = { ...state.credentials, ...data }
          const hasChanged = 
            newCredentials.email !== state.credentials.email ||
            newCredentials.password !== state.credentials.password ||
            newCredentials.confirmPassword !== state.credentials.confirmPassword
          
          if (!hasChanged) return state
          
          return {
            credentials: newCredentials,
          }
        })
      },
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      nextStep: () => {
        const { currentStep } = get()
        const totalSteps = get().profileType === 'couple' ? 8 : 8 // À ajuster selon le flow
        if (currentStep < totalSteps) {
          set({ currentStep: currentStep + 1 })
        }
      },
      
      prevStep: () => {
        const { currentStep } = get()
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 })
        }
      },
      
      reset: () =>
        set({
          profileType: null,
          credentials: initialCredentials,
          coupleData: initialCoupleData,
          prestataireData: initialPrestataireData,
          currentStep: 0,
        }),
    }),
    {
      name: 'signup-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

