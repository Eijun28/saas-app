'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BudgetOverview } from '@/components/budget/BudgetOverview'
import { BudgetForm } from '@/components/budget/BudgetForm'
import { BudgetCategories } from '@/components/budget/BudgetCategories'
import { BudgetCategoriesSection } from '@/components/budget/BudgetCategoriesSection'
import { BudgetProviders } from '@/components/budget/BudgetProviders'
import { getBudgetData, type BudgetData } from '@/lib/actions/budget'
import { initializeDefaultCategories } from '@/lib/actions/budget-categories'
import { useUser } from '@/hooks/use-user'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function BudgetPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBudgetData = async () => {
    setLoading(true)
    const data = await getBudgetData()
    
    // Si pas de catégories et budget défini, initialiser les catégories par défaut
    if (data && data.budget && (!data.categories || data.categories.length === 0)) {
      await initializeDefaultCategories()
      // Recharger les données
      const updatedData = await getBudgetData()
      setBudgetData(updatedData)
    } else {
      setBudgetData(data)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/sign-in')
        return
      }
      fetchBudgetData()
    }
  }, [user, userLoading, router])

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#823F91]" />
          <p className="text-[#6B7280]">Chargement du budget...</p>
        </div>
      </div>
    )
  }

  if (!budgetData) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-[#6B7280] mb-4">Erreur lors du chargement des données</p>
            <button
              onClick={fetchBudgetData}
              className="px-4 py-2 bg-[#823F91] text-white rounded-lg hover:bg-[#6D3478]"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  const budgetMax = budgetData.budget?.budget_max || 0
  const budgetMin = budgetData.budget?.budget_min || 0

  return (
    <div className="p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-[#111827] mb-2">Gestion du budget</h1>
            <p className="text-[#6B7280]">
              Gérez votre budget de mariage et suivez vos dépenses
            </p>
          </div>
        </motion.div>

        {/* Formulaire de budget (si pas encore défini) */}
        {!budgetData.budget && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <BudgetForm />
          </motion.div>
        )}

        {/* Vue d'ensemble (si budget défini) */}
        {budgetData.budget && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <BudgetOverview
                budgetMax={budgetMax}
                totalDepense={budgetData.totalDepense}
                budgetRestant={budgetData.budgetRestant}
                pourcentageUtilise={budgetData.pourcentageUtilise}
              />
            </motion.div>

            {/* Formulaire de modification du budget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <BudgetForm initialBudgetMin={budgetMin} initialBudgetMax={budgetMax} />
            </motion.div>

            {/* Répartition par catégories */}
            {budgetMax > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <BudgetCategoriesSection
                  categories={budgetData.categories}
                  totalBudget={budgetMax}
                  onUpdate={fetchBudgetData}
                />
              </motion.div>
            )}

            {/* Catégories (ancien composant pour compatibilité) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <BudgetCategories
                categories={budgetData.categories}
                onUpdate={fetchBudgetData}
              />
            </motion.div>

            {/* Prestataires */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <BudgetProviders
                providers={budgetData.providers}
                categories={budgetData.categories.map((c) => c.category_name)}
                onUpdate={fetchBudgetData}
              />
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

