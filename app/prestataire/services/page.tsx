'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, Star, Package, Euro, GripVertical, ChevronDown, ChevronUp, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────────

type PricingUnit =
  | 'forfait' | 'par_personne' | 'par_heure' | 'par_demi_journee'
  | 'par_journee' | 'par_part' | 'par_essayage' | 'par_piece' | 'par_km' | 'sur_devis'

interface Package {
  id: string
  provider_id: string
  label: string | null
  pricing_unit: PricingUnit
  price_min: number | null
  price_max: number | null
  is_primary: boolean
  display_order: number
  description: string | null
  forfait_items: string[] | null
  created_at: string
}

interface PackageFormData {
  label: string
  pricing_unit: PricingUnit
  price_min: string
  price_max: string
  is_primary: boolean
  description: string
  forfait_items: string[]
  newItem: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const PRICING_UNIT_LABELS: Record<PricingUnit, string> = {
  forfait: 'Forfait (prix fixe)',
  par_personne: 'Par personne / invité',
  par_heure: 'Par heure',
  par_demi_journee: 'Par demi-journée (4h)',
  par_journee: 'Par journée complète',
  par_part: 'Par part (traiteur)',
  par_essayage: 'Par essayage',
  par_piece: 'Par pièce / unité',
  par_km: 'Par kilomètre',
  sur_devis: 'Sur devis uniquement',
}

const PRICING_UNIT_SHORT: Record<PricingUnit, string> = {
  forfait: 'Forfait',
  par_personne: '/pers.',
  par_heure: '/h',
  par_demi_journee: '/demi-j.',
  par_journee: '/jour',
  par_part: '/part',
  par_essayage: '/essayage',
  par_piece: '/pièce',
  par_km: '/km',
  sur_devis: 'Sur devis',
}

const DEFAULT_FORM: PackageFormData = {
  label: '',
  pricing_unit: 'forfait',
  price_min: '',
  price_max: '',
  is_primary: false,
  description: '',
  forfait_items: [],
  newItem: '',
}

// ─── Format helper ──────────────────────────────────────────────────────────────

function formatPrice(amount: number | null): string {
  if (amount === null || amount === undefined) return ''
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
}

function formatPriceRange(pkg: Package): string {
  if (pkg.pricing_unit === 'sur_devis') return 'Sur devis'
  if (pkg.price_min === null && pkg.price_max === null) return 'Prix non défini'
  if (pkg.price_min !== null && pkg.price_max !== null && pkg.price_min !== pkg.price_max) {
    return `${formatPrice(pkg.price_min)} – ${formatPrice(pkg.price_max)}`
  }
  return formatPrice(pkg.price_min ?? pkg.price_max)
}

// ─── Package Card ───────────────────────────────────────────────────────────────

function PackageCard({
  pkg,
  onEdit,
  onDelete,
}: {
  pkg: Package
  onEdit: (pkg: Package) => void
  onDelete: (pkg: Package) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        'border hover:border-[#D4ADE0] hover:shadow-sm transition-all duration-200 bg-white',
        pkg.is_primary && 'border-[#823F91]/30 shadow-[0_0_0_1px_rgba(130,63,145,0.15)]',
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-[#0B0E12] truncate">
                  {pkg.label || 'Sans titre'}
                </span>
                {pkg.is_primary && (
                  <Badge className="bg-[#823F91]/10 text-[#823F91] text-[10px] gap-1 py-0">
                    <Star className="h-2.5 w-2.5" />
                    Principal
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] text-[#6B7280] py-0">
                  {PRICING_UNIT_LABELS[pkg.pricing_unit]}
                </Badge>
              </div>

              <p className="text-lg font-bold text-[#823F91]">
                {formatPriceRange(pkg)}
                {pkg.pricing_unit !== 'forfait' && pkg.pricing_unit !== 'sur_devis' && (
                  <span className="text-sm font-normal text-[#6B7280] ml-1">
                    {PRICING_UNIT_SHORT[pkg.pricing_unit]}
                  </span>
                )}
              </p>

              {pkg.description && (
                <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">{pkg.description}</p>
              )}

              {pkg.forfait_items && pkg.forfait_items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(v => !v)}
                  className="flex items-center gap-1 text-xs text-[#823F91] mt-2 hover:underline"
                >
                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {pkg.forfait_items.length} prestation{pkg.forfait_items.length > 1 ? 's' : ''} incluse{pkg.forfait_items.length > 1 ? 's' : ''}
                </button>
              )}

              <AnimatePresence>
                {expanded && pkg.forfait_items && pkg.forfait_items.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-1 overflow-hidden"
                  >
                    {pkg.forfait_items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[#374151]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#823F91] flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(pkg)}
                className="h-8 w-8 text-[#6B7280] hover:text-[#823F91]"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(pkg)}
                className="h-8 w-8 text-[#6B7280] hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Package Form Dialog ────────────────────────────────────────────────────────

function PackageDialog({
  open,
  onClose,
  onSave,
  initial,
  isSaving,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<PackageFormData, 'newItem'>) => void
  initial: PackageFormData
  isSaving: boolean
}) {
  const [form, setForm] = useState<PackageFormData>(initial)

  useEffect(() => {
    if (open) setForm(initial)
  }, [open, initial])

  const set = (field: keyof PackageFormData) => (value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const addItem = () => {
    const trimmed = form.newItem.trim()
    if (!trimmed || form.forfait_items.includes(trimmed)) return
    setForm(prev => ({ ...prev, forfait_items: [...prev.forfait_items, trimmed], newItem: '' }))
  }

  const removeItem = (idx: number) =>
    setForm(prev => ({ ...prev, forfait_items: prev.forfait_items.filter((_, i) => i !== idx) }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.label.trim()) { toast.error('Le nom du forfait est requis'); return }
    const { newItem: _, ...data } = form
    onSave(data)
  }

  const showPriceFields = form.pricing_unit !== 'sur_devis'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial.label ? 'Modifier le forfait' : 'Nouveau forfait'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Nom */}
          <div className="space-y-1.5">
            <Label htmlFor="pkg-label">Nom du forfait *</Label>
            <Input
              id="pkg-label"
              value={form.label}
              onChange={e => set('label')(e.target.value)}
              placeholder="Ex : Formule Journée, Menu Standard, Reportage Complet…"
            />
          </div>

          {/* Unité de prix */}
          <div className="space-y-1.5">
            <Label>Type de tarification</Label>
            <Select value={form.pricing_unit} onValueChange={v => set('pricing_unit')(v as PricingUnit)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PRICING_UNIT_LABELS) as [PricingUnit, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prix */}
          {showPriceFields && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price-min">Prix min (€)</Label>
                <Input
                  id="price-min"
                  type="number"
                  min="0"
                  step="50"
                  value={form.price_min}
                  onChange={e => set('price_min')(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price-max">Prix max (€) <span className="text-[#6B7280] font-normal">optionnel</span></Label>
                <Input
                  id="price-max"
                  type="number"
                  min="0"
                  step="50"
                  value={form.price_max}
                  onChange={e => set('price_max')(e.target.value)}
                  placeholder="—"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="pkg-desc">Description <span className="text-[#6B7280] font-normal">optionnelle</span></Label>
            <Textarea
              id="pkg-desc"
              rows={2}
              value={form.description}
              onChange={e => set('description')(e.target.value)}
              placeholder="Décrivez brièvement ce que comprend ce forfait…"
            />
          </div>

          {/* Prestations incluses */}
          <div className="space-y-2">
            <Label>Prestations incluses <span className="text-[#6B7280] font-normal">optionnelles</span></Label>
            <div className="flex gap-2">
              <Input
                value={form.newItem}
                onChange={e => set('newItem')(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
                placeholder="Ex: Préparatifs, Cérémonie, Vin d'honneur…"
              />
              <Button type="button" variant="outline" onClick={addItem} className="flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {form.forfait_items.length > 0 && (
              <ul className="space-y-1.5 mt-2">
                {form.forfait_items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-sm bg-[#F7F7F7] rounded-lg px-3 py-2">
                    <span className="flex items-center gap-2">
                      <GripVertical className="h-3.5 w-3.5 text-[#D1D5DB]" />
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-[#9CA3AF] hover:text-red-500 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Forfait principal */}
          <div className="flex items-center justify-between rounded-xl border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Mettre en avant</p>
              <p className="text-xs text-[#6B7280]">Affiché en priorité sur votre profil public</p>
            </div>
            <Switch
              checked={form.is_primary}
              onCheckedChange={v => set('is_primary')(v)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white"
            >
              {isSaving ? 'Enregistrement…' : (initial.label ? 'Modifier' : 'Créer le forfait')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function CatalogueServicesPage() {
  const { user } = useUser()
  const supabase = createClient()

  const [packages, setPackages] = useState<Package[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null)
  const [editTarget, setEditTarget] = useState<Package | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // ─── Data ────────────────────────────────────────────────────────────────────

  const fetchPackages = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('provider_pricing')
      .select('id, provider_id, label, pricing_unit, price_min, price_max, is_primary, display_order, description, forfait_items, created_at')
      .eq('provider_id', user.id)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) { toast.error('Erreur chargement des forfaits'); return }
    setPackages((data as Package[]) || [])
    setIsLoading(false)
  }, [user])

  useEffect(() => { fetchPackages() }, [fetchPackages])

  // ─── Form initial data ────────────────────────────────────────────────────────

  const initialForm = (pkg?: Package): PackageFormData => {
    if (!pkg) return DEFAULT_FORM
    return {
      label: pkg.label || '',
      pricing_unit: pkg.pricing_unit,
      price_min: pkg.price_min?.toString() ?? '',
      price_max: pkg.price_max?.toString() ?? '',
      is_primary: pkg.is_primary,
      description: pkg.description || '',
      forfait_items: pkg.forfait_items || [],
      newItem: '',
    }
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  const handleSave = async (form: Omit<PackageFormData, 'newItem'>) => {
    if (!user) return
    setIsSaving(true)

    const payload = {
      provider_id: user.id,
      label: form.label.trim() || null,
      pricing_unit: form.pricing_unit,
      price_min: form.price_min ? parseFloat(form.price_min) : null,
      price_max: form.price_max ? parseFloat(form.price_max) : null,
      is_primary: form.is_primary,
      description: form.description.trim() || null,
      forfait_items: form.forfait_items.length > 0 ? form.forfait_items : null,
      display_order: editTarget?.display_order ?? packages.length,
    }

    if (editTarget) {
      const { error } = await supabase
        .from('provider_pricing')
        .update(payload)
        .eq('id', editTarget.id)
        .eq('provider_id', user.id)

      if (error) { toast.error('Erreur lors de la modification'); setIsSaving(false); return }
      toast.success('Forfait modifié')
    } else {
      const { error } = await supabase
        .from('provider_pricing')
        .insert(payload)

      if (error) { toast.error('Erreur lors de la création'); setIsSaving(false); return }
      toast.success('Forfait créé')
    }

    setIsSaving(false)
    setDialogOpen(false)
    setEditTarget(null)
    fetchPackages()
  }

  const handleDelete = async () => {
    if (!deleteTarget || !user) return

    const { error } = await supabase
      .from('provider_pricing')
      .delete()
      .eq('id', deleteTarget.id)
      .eq('provider_id', user.id)

    if (error) { toast.error('Erreur lors de la suppression'); return }
    toast.success('Forfait supprimé')
    setDeleteTarget(null)
    setPackages(prev => prev.filter(p => p.id !== deleteTarget.id))
  }

  const openEdit = (pkg: Package) => {
    setEditTarget(pkg)
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-7 w-56 bg-gray-100 rounded-xl" />
        <div className="h-10 w-40 bg-gray-100 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map(i => <div key={i} className="h-44 bg-white rounded-2xl border border-gray-100" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageTitle
          title="Catalogue de services"
          description="Créez vos forfaits et tarifs visibles sur votre profil public"
        />
        <Button
          onClick={openCreate}
          className="bg-[#823F91] hover:bg-[#6D3478] text-white gap-2 self-start sm:self-auto flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nouveau forfait
        </Button>
      </div>

      {packages.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun forfait défini"
          description="Créez vos forfaits et tarifs pour qu'ils apparaissent sur votre profil public et facilitent la prise de contact."
          action={{ label: 'Créer mon premier forfait', onClick: openCreate }}
        />
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {packages.map(pkg => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Dialog create / edit */}
      <PackageDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditTarget(null) }}
        onSave={handleSave}
        initial={initialForm(editTarget ?? undefined)}
        isSaving={isSaving}
      />

      {/* Confirm delete */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Supprimer ce forfait ?</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.label || 'Ce forfait'}</strong> sera définitivement supprimé.
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
