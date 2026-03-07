'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

type BudgetOverviewProps = {
  budgetMax: number
  totalDepense: number
  budgetRestant: number
  pourcentageUtilise: number
}

const COLORS = {
  depense: '#823F91', // Violet
  restant: '#E5E7EB', // Gris clair
}

export function BudgetOverview({
  budgetMax,
  totalDepense,
  budgetRestant,
  pourcentageUtilise,
}: BudgetOverviewProps) {
  const getStatusColor = () => {
    if (pourcentageUtilise >= 100) return 'text-red-600'
    if (pourcentageUtilise >= 80) return 'text-orange-600'
    return 'text-green-600'
  }

  const getStatusBg = () => {
    if (pourcentageUtilise >= 100) return 'bg-red-50 border-red-200'
    if (pourcentageUtilise >= 80) return 'bg-orange-50 border-orange-200'
    return 'bg-green-50 border-green-200'
  }

  const getStatusIcon = () => {
    if (pourcentageUtilise >= 100) return <AlertCircle className="h-5 w-5 text-red-600" />
    if (pourcentageUtilise >= 80) return <TrendingUp className="h-5 w-5 text-orange-600" />
    return <CheckCircle2 className="h-5 w-5 text-green-600" />
  }

  const getStatusMessage = () => {
    if (pourcentageUtilise >= 100) {
      const depassement = totalDepense - budgetMax
      return `Budget dépassé de ${depassement.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`
    }
    if (pourcentageUtilise >= 90) {
      return 'Attention, budget bientôt atteint'
    }
    if (pourcentageUtilise >= 80) {
      return 'Attention, budget proche de la limite'
    }
    return 'Budget sous contrôle'
  }

  // Données pour le graphique donut
  const chartData = [
    { name: 'Dépensé', value: totalDepense },
    { name: 'Restant', value: Math.max(0, budgetRestant) },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Vue d'ensemble avec graphique */}
      <Card>
        <CardHeader>
          <CardTitle>Vue d'ensemble du budget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Graphique donut */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? COLORS.depense : COLORS.restant}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                  }
                />
                <Legend
                  formatter={(value) => {
                    const data = chartData.find((d) => d.name === value)
                    return `${value}: ${data?.value.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    })}`
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-[#6B7280] mb-1">Budget total</p>
              <p className="text-2xl font-bold text-[#111827]">
                {budgetMax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-[#6B7280] mb-1">Dépensé</p>
              <p className="text-2xl font-bold text-[#823F91]">
                {totalDepense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-[#6B7280] mb-1">Restant</p>
              <p className={`text-2xl font-bold ${budgetRestant < 0 ? 'text-red-600' : 'text-[#111827]'}`}>
                {budgetRestant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statut et progression */}
      <Card>
        <CardHeader>
          <CardTitle>Statut du budget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pourcentage utilisé */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#6B7280]">Utilisation du budget</span>
              <span className={`text-lg font-bold ${getStatusColor()}`}>
                {pourcentageUtilise.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={Math.min(pourcentageUtilise, 100)}
              className="h-3"
            />
          </div>

          {/* Alerte de statut */}
          <div className={`p-4 rounded-lg border ${getStatusBg()}`}>
            <div className="flex items-start gap-3">
              {getStatusIcon()}
              <div className="flex-1">
                <p className="font-medium text-[#111827] mb-1">Statut</p>
                <p className="text-sm text-[#6B7280]">{getStatusMessage()}</p>
              </div>
            </div>
          </div>

          {/* Détails */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B7280]">Budget maximum</span>
              <span className="font-semibold text-[#111827]">
                {budgetMax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B7280]">Total dépensé</span>
              <span className="font-semibold text-[#823F91]">
                {totalDepense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B7280]">Budget restant</span>
              <span className={`font-semibold ${budgetRestant < 0 ? 'text-red-600' : 'text-[#111827]'}`}>
                {budgetRestant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

