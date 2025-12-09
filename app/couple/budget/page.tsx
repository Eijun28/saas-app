'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { Wallet, Plus, Edit2, Trash2, X, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix'

interface BudgetItem {
  id: string
  title: string
  category: string
  amount: number
  notes: string | null
  created_at: string
}

const categories = [
  'Photographe',
  'Traiteur',
  'Fleuriste',
  'Musique',
  'Location de salle',
  'Robe de mariée',
  'Costume',
  'Décoration',
  'Transport',
  'Cadeaux',
  'Autre',
]

export default function BudgetPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [budgetData, setBudgetData] = useState({
    budget_min: null as number | null,
    budget_max: null as number | null,
  })
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    amount: '',
    notes: '',
  })

  useEffect(() => {
    if (user) {
      loadBudget()
      loadBudgetItems()
    }
  }, [user])

  const loadBudget = async () => {
    if (!user) return

    setLoading(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('couple_profiles')
      .select('budget_min, budget_max')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setBudgetData({
        budget_min: data.budget_min,
        budget_max: data.budget_max,
      })
    }

    setLoading(false)
  }

  const loadBudgetItems = async () => {
    if (!user) return

    const supabase = createClient()

    // Charger les items de budget depuis la table budget_items
    const { data, error } = await supabase
      .from('budget_items')
      .select('*')
      .eq('couple_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur chargement budget_items:', error)
      // Si la table n'existe pas, afficher un message clair
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        console.warn('La table budget_items n\'existe pas encore. Veuillez exécuter le script SQL migrations/create_budget_items.sql dans Supabase.')
      }
      setBudgetItems([])
    } else {
      setBudgetItems(data || [])
    }
  }

  const handleCreateOrUpdate = async () => {
    if (!user || !formData.title || !formData.category || !formData.amount) return

    const supabase = createClient()
    const amount = parseFloat(formData.amount)

    if (isNaN(amount) || amount <= 0) {
      alert('Veuillez entrer un montant valide')
      return
    }

    if (editingItem) {
      // Mettre à jour
      const { error } = await supabase
        .from('budget_items')
        .update({
          title: formData.title,
          category: formData.category,
          amount: amount,
          notes: formData.notes || null,
        })
        .eq('id', editingItem.id)

      if (error) {
        console.error('Erreur mise à jour:', error)
        alert('Erreur lors de la mise à jour')
      } else {
        loadBudgetItems()
        setIsDialogOpen(false)
        resetForm()
      }
    } else {
      // Créer
      const { data, error } = await supabase
        .from('budget_items')
        .insert({
          couple_id: user.id,
          title: formData.title,
          category: formData.category,
          amount: amount,
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Erreur création dépense:', error)
        // Si la table n'existe pas, donner des instructions claires
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          alert(
            'La table budget_items n\'existe pas dans votre base de données Supabase. ' +
            'Veuillez exécuter le script SQL migrations/create_budget_items.sql dans votre projet Supabase pour créer la table.'
          )
        } else {
          alert(`Erreur lors de la création de la dépense: ${error.message}`)
        }
        return
      }

      // Recharger les items depuis Supabase pour avoir les données complètes
      await loadBudgetItems()
      setIsDialogOpen(false)
      resetForm()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return

    const supabase = createClient()
    const { error } = await supabase.from('budget_items').delete().eq('id', id)

    if (error) {
      console.error('Erreur suppression:', error)
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        alert('La table budget_items n\'existe pas. Veuillez exécuter le script SQL migrations/create_budget_items.sql dans Supabase.')
      } else {
        alert(`Erreur lors de la suppression: ${error.message}`)
      }
      return
    }

    // Recharger les items depuis Supabase
    await loadBudgetItems()
  }

  const handleEdit = (item: BudgetItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      category: item.category,
      amount: item.amount.toString(),
      notes: item.notes || '',
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      amount: '',
      notes: '',
    })
    setEditingItem(null)
  }

  const totalSpent = budgetItems.reduce((sum, item) => sum + item.amount, 0)
  const budgetMax = budgetData.budget_max || 0
  const budgetMin = budgetData.budget_min || 0
  const budgetAverage = budgetMax > 0 ? budgetMax : budgetMin
  const remaining = budgetAverage > 0 ? budgetAverage - totalSpent : 0
  const percentageUsed = budgetAverage > 0 ? (totalSpent / budgetAverage) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#4A4A4A]">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-semibold text-[#0D0D0D] mb-2">
                Budget
              </h1>
              <p className="text-[#4A4A4A]">
                Gérez votre budget de mariage et suivez vos dépenses
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm()
                setIsDialogOpen(true)
              }}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter une dépense
            </Button>
          </div>

          {/* Vue d'ensemble du budget */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-[#4A4A4A]">
                  Budget total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#0D0D0D]">
                  {budgetAverage > 0
                    ? `${budgetAverage.toLocaleString('fr-FR')} €`
                    : 'Non défini'}
                </p>
                {budgetData.budget_min && budgetData.budget_max && (
                  <p className="text-sm text-[#6B7280] mt-1">
                    {budgetData.budget_min.toLocaleString('fr-FR')} € -{' '}
                    {budgetData.budget_max.toLocaleString('fr-FR')} €
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-[#4A4A4A]">
                  Total dépensé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#823F91]">
                  {totalSpent.toLocaleString('fr-FR')} €
                </p>
                <p className="text-sm text-[#6B7280] mt-1">
                  {percentageUsed.toFixed(1)}% du budget utilisé
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-[#4A4A4A]">
                  Budget restant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-3xl font-bold ${
                    remaining >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {remaining.toLocaleString('fr-FR')} €
                </p>
                {remaining < 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    Budget dépassé
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Barre de progression */}
          {budgetAverage > 0 && (
            <Card className="border-gray-200 mb-8">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4A4A4A]">Progression du budget</span>
                    <span className="text-[#4A4A4A] font-medium">
                      {percentageUsed.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        percentageUsed > 100
                          ? 'bg-red-500'
                          : percentageUsed > 80
                          ? 'bg-orange-500'
                          : 'bg-[#823F91]'
                      }`}
                      style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste des dépenses */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              {budgetItems.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-[#4A4A4A] mb-2">
                    Aucune dépense enregistrée
                  </p>
                  <p className="text-sm text-[#6B7280]">
                    Cliquez sur "Ajouter une dépense" pour commencer
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgetItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-[#0D0D0D]">
                            {item.title}
                          </h3>
                          <span className="px-2 py-1 text-xs bg-[#E8D4EF] text-[#823F91] rounded-full">
                            {item.category}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-[#6B7280] mb-1">
                            {item.notes}
                          </p>
                        )}
                        <p className="text-xs text-[#9CA3AF]">
                          {new Date(item.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-bold text-[#0D0D0D]">
                          {item.amount.toLocaleString('fr-FR')} €
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {!budgetData.budget_min && !budgetData.budget_max && (
            <Card className="border-gray-200 bg-yellow-50">
              <CardContent className="pt-6">
                <p className="text-sm text-[#4A4A4A]">
                  Vous n'avez pas encore défini votre budget. Vous pouvez le faire dans la section{' '}
                  <a href="/couple/profil" className="text-[#823F91] hover:underline font-medium">
                    Profil
                  </a>
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Dialog de création/édition */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Modifier la dépense' : 'Ajouter une dépense'}
              </DialogTitle>
              <DialogDescription>
                Enregistrez une nouvelle dépense pour votre mariage
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="expense-title">Titre</Label>
                <Input
                  id="expense-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Photographe, Traiteur..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="expense-category">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-amount">Montant (€)</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-notes">Notes (optionnel)</Label>
                <Input
                  id="expense-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ajoutez des détails..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateOrUpdate}
                className="bg-[#823F91] hover:bg-[#6D3478] text-white"
                disabled={!formData.title || !formData.category || !formData.amount}
              >
                {editingItem ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
