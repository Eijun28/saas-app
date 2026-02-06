'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Wallet, Plus, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
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
import { PageTitle } from '@/components/couple/shared/PageTitle'

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

const CHART_COLORS: Record<string, string> = {
  'Photographe': '#823F91',
  'Traiteur': '#9D5FA8',
  'Fleuriste': '#B87FC0',
  'Musique': '#D49FFD',
  'Location de salle': '#6D3478',
  'Robe de mariée': '#E8C4F5',
  'Costume': '#A855F7',
  'Décoration': '#C084FC',
  'Transport': '#DDA0DD',
  'Cadeaux': '#E9D5F5',
  'Autre': '#9CA3AF',
}

const DEFAULT_COLORS = ['#823F91', '#9D5FA8', '#B87FC0', '#D49FFD', '#E8C4F5', '#6D3478', '#A855F7', '#C084FC']

const getColor = (category: string, index: number) => {
  return CHART_COLORS[category] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
}

export default function BudgetPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [budgetData, setBudgetData] = useState({
    budget_min: null as number | null,
    budget_max: null as number | null,
    budget_total: null as number | null,
  })
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    amount: '',
    notes: '',
    customCategory: '',
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
      .from('couples')
      .select('budget_min, budget_max, budget_total')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setBudgetData({
        budget_min: data.budget_min,
        budget_max: data.budget_max,
        budget_total: data.budget_total,
      })
    }

    setLoading(false)
  }

  const loadBudgetItems = async () => {
    if (!user) return

    const supabase = createClient()

    const { data, error } = await supabase
      .from('budget_items')
      .select('*')
      .eq('couple_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur chargement budget_items:', error)
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        console.warn('La table budget_items n\'existe pas encore.')
      }
      setBudgetItems([])
    } else {
      setBudgetItems(data || [])
    }
  }

  const handleCreateOrUpdate = async () => {
    if (!user || !formData.title || !formData.category || !formData.amount) return
    if (formData.category === 'Autre' && !formData.customCategory) {
      toast.error('Veuillez préciser la catégorie')
      return
    }

    const supabase = createClient()
    const amount = parseFloat(formData.amount)

    if (isNaN(amount) || amount <= 0) {
      toast.error('Veuillez entrer un montant valide')
      return
    }

    const categoryToSave = formData.category === 'Autre' ? formData.customCategory : formData.category

    if (editingItem) {
      const { error } = await supabase
        .from('budget_items')
        .update({
          title: formData.title,
          category: categoryToSave,
          amount: amount,
          notes: formData.notes || null,
        })
        .eq('id', editingItem.id)

      if (error) {
        console.error('Erreur mise à jour:', error)
        toast.error('Erreur lors de la mise à jour')
      } else {
        loadBudgetItems()
        setIsDialogOpen(false)
        resetForm()
      }
    } else {
      const { error } = await supabase
        .from('budget_items')
        .insert({
          couple_id: user.id,
          title: formData.title,
          category: categoryToSave,
          amount: amount,
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Erreur création dépense:', error)
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          toast.error('La table budget_items n\'existe pas. Exécutez le script SQL migrations/create_budget_items.sql.')
        } else {
          toast.error(`Erreur: ${error.message}`)
        }
        return
      }

      await loadBudgetItems()
      setIsDialogOpen(false)
      resetForm()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette dépense ?')) return

    const supabase = createClient()
    const { error } = await supabase.from('budget_items').delete().eq('id', id)

    if (error) {
      console.error('Erreur suppression:', error)
      toast.error(`Erreur: ${error.message}`)
      return
    }

    await loadBudgetItems()
  }

  const handleEdit = (item: BudgetItem) => {
    setEditingItem(item)
    const isCustomCategory = !categories.includes(item.category)
    setFormData({
      title: item.title,
      category: isCustomCategory ? 'Autre' : item.category,
      amount: item.amount.toString(),
      notes: item.notes || '',
      customCategory: isCustomCategory ? item.category : '',
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({ title: '', category: '', amount: '', notes: '', customCategory: '' })
    setEditingItem(null)
  }

  const totalSpent = budgetItems.reduce((sum, item) => sum + item.amount, 0)
  const budgetTotal = budgetData.budget_total || budgetData.budget_max || budgetData.budget_min || 0
  const budgetMax = budgetData.budget_max || 0
  const budgetMin = budgetData.budget_min || 0
  const budgetAverage = budgetTotal > 0 ? budgetTotal : (budgetMax > 0 ? budgetMax : budgetMin)
  const remaining = budgetAverage > 0 ? budgetAverage - totalSpent : 0
  const percentageUsed = budgetAverage > 0 ? (totalSpent / budgetAverage) * 100 : 0

  // Group items by category for listing
  const itemsByCategory = budgetItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, BudgetItem[]>)

  const sortedCategoryKeys = Object.keys(itemsByCategory).sort((a, b) => {
    const totalA = itemsByCategory[a].reduce((s, i) => s + i.amount, 0)
    const totalB = itemsByCategory[b].reduce((s, i) => s + i.amount, 0)
    return totalB - totalA
  })

  // Chart data
  const chartData = budgetItems.reduce((acc, item) => {
    const existing = acc.find(d => d.name === item.category)
    if (existing) {
      existing.value += item.amount
    } else {
      acc.push({ name: item.category, value: item.amount })
    }
    return acc
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value)

  if (loading) {
    return (
      <div className="w-full">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <PageTitle
            title="Budget"
            description="Suivez vos dépenses et gardez le contrôle"
            className="pb-0"
          />
          <Button
            onClick={() => { resetForm(); setIsDialogOpen(true) }}
            className="bg-[#823F91] hover:bg-[#6D3478] text-white gap-2 rounded-xl w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Ajouter une dépense
          </Button>
        </div>

        {/* Budget summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <p className="text-xs font-medium text-gray-500 mb-1">Budget total</p>
            <p className="text-2xl font-bold text-gray-900">
              {budgetAverage > 0
                ? `${budgetAverage.toLocaleString('fr-FR')} €`
                : 'Non défini'}
            </p>
            {budgetData.budget_min && budgetData.budget_max && !budgetData.budget_total && (
              <p className="text-xs text-gray-400 mt-1">
                {budgetData.budget_min.toLocaleString('fr-FR')} - {budgetData.budget_max.toLocaleString('fr-FR')} €
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <p className="text-xs font-medium text-gray-500 mb-1">Total dépensé</p>
            <p className="text-2xl font-bold text-[#823F91]">
              {totalSpent === 0 ? '0' : totalSpent.toLocaleString('fr-FR')} €
            </p>
            {budgetAverage > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {percentageUsed.toFixed(0)}% du budget utilisé
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 mb-1">Restant</p>
              {budgetAverage > 0 && (
                remaining >= 0
                  ? <TrendingUp className="h-4 w-4 text-[#823F91]" />
                  : <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {budgetAverage > 0 ? `${remaining.toLocaleString('fr-FR')} €` : '-'}
            </p>
            {remaining < 0 && (
              <p className="text-xs text-red-500 mt-1">Budget dépassé</p>
            )}
          </motion.div>
        </div>

        {/* Progress bar */}
        {budgetAverage > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progression</span>
              <span className="text-sm font-bold text-[#823F91]">{percentageUsed.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentageUsed, 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-full rounded-full ${
                  percentageUsed > 100 ? 'bg-red-500' : percentageUsed > 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-[#823F91] to-[#9D5FA8]'
                }`}
              />
            </div>
          </motion.div>
        )}

        {/* Pie chart + Legend */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#FBF8F3] to-[#FAF9F6] px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Répartition par métier</h2>
              <p className="text-sm text-gray-500 mt-0.5">{chartData.length} catégorie{chartData.length > 1 ? 's' : ''}</p>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                {/* Donut chart */}
                <div className="h-[240px] sm:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius="50%"
                        outerRadius="85%"
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColor(entry.name, index)} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            const percentage = ((data.value / totalSpent) * 100).toFixed(1)
                            return (
                              <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3">
                                <p className="font-semibold text-gray-900 text-sm">{data.name}</p>
                                <p className="text-[#823F91] font-bold">{data.value.toLocaleString('fr-FR')} €</p>
                                <p className="text-gray-500 text-xs">{percentage}%</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend with progress bars */}
                <div className="space-y-3">
                  {chartData.map((item, index) => {
                    const percentage = ((item.value / totalSpent) * 100).toFixed(1)
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getColor(item.name, index) }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">{item.name}</span>
                            <span className="text-sm font-bold text-gray-700 whitespace-nowrap">
                              {item.value.toLocaleString('fr-FR')} €
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: getColor(item.name, index)
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-10 text-right">{percentage}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Expenses grouped by category/profession */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#FBF8F3] to-[#FAF9F6] px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Dépenses</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {budgetItems.length} dépense{budgetItems.length > 1 ? 's' : ''} enregistrée{budgetItems.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="p-5">
            {budgetItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                  <Wallet className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-gray-700 font-medium mb-1">Aucune dépense</p>
                <p className="text-sm text-gray-500">
                  Ajoutez votre première dépense pour commencer le suivi
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedCategoryKeys.map((category, catIndex) => {
                  const items = itemsByCategory[category]
                  const categoryTotal = items.reduce((s, i) => s + i.amount, 0)
                  const colorIndex = chartData.findIndex(d => d.name === category)

                  return (
                    <div key={category}>
                      {/* Category header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getColor(category, colorIndex >= 0 ? colorIndex : catIndex) }}
                          />
                          <span className="text-sm font-semibold text-gray-900">{category}</span>
                          <span className="text-xs text-gray-400">{items.length}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {categoryTotal.toLocaleString('fr-FR')} €
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 sm:p-4 bg-gray-50/60 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                              {item.notes && (
                                <p className="text-xs text-gray-500 mt-0.5 truncate">{item.notes}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                              <span className="text-sm font-bold text-gray-900">
                                {item.amount.toLocaleString('fr-FR')} €
                              </span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(item)}
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-[#823F91]"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* No budget defined hint */}
        {!budgetData.budget_total && !budgetData.budget_min && !budgetData.budget_max && (
          <div className="bg-[#823F91]/5 rounded-2xl border border-[#823F91]/10 p-5">
            <p className="text-sm text-gray-700">
              Budget non défini. Rendez-vous dans votre{' '}
              <a href="/couple/profil" className="text-[#823F91] hover:underline font-medium">
                profil
              </a>{' '}
              pour le configurer.
            </p>
          </div>
        )}

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {editingItem ? 'Modifier la dépense' : 'Ajouter une dépense'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                Enregistrez une dépense pour votre mariage
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="expense-title" className="text-sm">Titre</Label>
                <Input
                  id="expense-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Photographe, Traiteur..."
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-category" className="text-sm">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value, customCategory: value === 'Autre' ? formData.customCategory : '' })}
                >
                  <SelectTrigger id="expense-category" className="h-9">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.category === 'Autre' && (
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="custom-category" className="text-sm">Précisez la catégorie</Label>
                    <Input
                      id="custom-category"
                      value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      placeholder="Ex: Location de voiture, Coiffeur..."
                      className="h-9"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-amount" className="text-sm">Montant (€)</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-notes" className="text-sm">Notes (optionnel)</Label>
                <Input
                  id="expense-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ajoutez des détails..."
                  className="h-9"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setIsDialogOpen(false); resetForm() }}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleCreateOrUpdate}
                className="bg-[#823F91] hover:bg-[#6D3478] text-white"
                disabled={!formData.title || !formData.category || !formData.amount || (formData.category === 'Autre' && !formData.customCategory)}
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
