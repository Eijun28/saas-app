'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateBudget } from '@/lib/actions/budget'
import { Loader2, Save } from 'lucide-react'

type BudgetFormProps = {
  initialBudgetMin?: number
  initialBudgetMax?: number
}

export function BudgetForm({ initialBudgetMin = 0, initialBudgetMax = 0 }: BudgetFormProps) {
  const [budgetMin, setBudgetMin] = useState(initialBudgetMin.toString())
  const [budgetMax, setBudgetMax] = useState(initialBudgetMax.toString())
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const min = parseFloat(budgetMin)
    const max = parseFloat(budgetMax)

    if (isNaN(min) || isNaN(max) || min < 0 || max < 0) {
      alert('Veuillez entrer des montants valides')
      return
    }

    if (min > max) {
      alert('Le budget minimum ne peut pas être supérieur au budget maximum')
      return
    }

    setLoading(true)
    const result = await updateBudget(min, max)
    setLoading(false)

    if (result.error) {
      alert(`Erreur: ${result.error}`)
    } else {
      alert('Budget enregistré avec succès')
    }
  }

  const handleSliderChange = (value: number) => {
    const min = parseFloat(budgetMin) || 0
    const newMax = Math.max(min, value)
    setBudgetMax(newMax.toString())
  }

  const budgetMinNum = parseFloat(budgetMin) || 0
  const budgetMaxNum = parseFloat(budgetMax) || 0
  const sliderValue = Math.max(budgetMinNum, budgetMaxNum)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Définir votre budget</CardTitle>
        <CardDescription>
          Définissez votre budget minimum et maximum pour votre mariage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget-min">Budget minimum (€)</Label>
              <Input
                id="budget-min"
                type="number"
                min="0"
                step="100"
                value={budgetMin}
                onChange={(e) => {
                  const value = e.target.value
                  setBudgetMin(value)
                  // Ajuster le max si nécessaire
                  const min = parseFloat(value) || 0
                  const max = parseFloat(budgetMax) || 0
                  if (min > max) {
                    setBudgetMax(value)
                  }
                }}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-max">Budget maximum (€)</Label>
              <Input
                id="budget-max"
                type="number"
                min={budgetMinNum}
                step="100"
                value={budgetMax}
                onChange={(e) => {
                  const value = e.target.value
                  const numValue = parseFloat(value) || 0
                  if (numValue >= budgetMinNum) {
                    setBudgetMax(value)
                  }
                }}
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Slider visuel */}
          <div className="space-y-2">
            <Label>Ajustement visuel du budget maximum</Label>
            <div className="relative">
              <input
                type="range"
                min={budgetMinNum}
                max={budgetMinNum + 50000}
                step="500"
                value={sliderValue}
                onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#823F91]"
              />
              <div className="flex justify-between text-xs text-[#6B7280] mt-1">
                <span>{budgetMinNum.toLocaleString('fr-FR')} €</span>
                <span>{(budgetMinNum + 50000).toLocaleString('fr-FR')} €</span>
              </div>
            </div>
            <p className="text-sm text-[#6B7280] text-center">
              Budget maximum sélectionné :{' '}
              <span className="font-semibold text-[#823F91]">
                {budgetMaxNum.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </span>
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#823F91] hover:bg-[#6D3478] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer le budget
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

