'use client'

import { useState } from 'react'
import { Check, Palette } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const BRAND_COLORS = [
  { id: 'purple', hex: '#823F91', label: 'Violet' },
  { id: 'blue', hex: '#2563EB', label: 'Bleu' },
  { id: 'pink', hex: '#DB2777', label: 'Rose' },
  { id: 'teal', hex: '#0D9488', label: 'Turquoise' },
  { id: 'orange', hex: '#EA580C', label: 'Orange' },
  { id: 'emerald', hex: '#059669', label: 'Emeraude' },
  { id: 'red', hex: '#DC2626', label: 'Rouge' },
  { id: 'slate', hex: '#475569', label: 'Ardoise' },
]

interface BrandColorPickerProps {
  userId: string
  currentColor?: string
  onSave?: () => void
}

export function BrandColorPicker({ userId, currentColor = '#823F91', onSave }: BrandColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(currentColor)
  const [isSaving, setIsSaving] = useState(false)

  const handleColorSelect = async (hex: string) => {
    if (hex === selectedColor) return

    setSelectedColor(hex)
    setIsSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('prestataire_profiles')
      .upsert({ user_id: userId, brand_color: hex }, { onConflict: 'user_id' })

    if (error) {
      // Fallback: try profiles table
      await supabase
        .from('profiles')
        .update({ brand_color: hex })
        .eq('id', userId)
    }

    setIsSaving(false)
    toast.success('Couleur mise a jour')
    onSave?.()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Couleur de marque</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {BRAND_COLORS.map((color) => (
          <button
            key={color.id}
            onClick={() => handleColorSelect(color.hex)}
            disabled={isSaving}
            className={cn(
              "h-10 w-10 rounded-full transition-all relative",
              "ring-2 ring-offset-2",
              selectedColor === color.hex
                ? "ring-gray-900 scale-110"
                : "ring-transparent hover:ring-gray-300"
            )}
            style={{ backgroundColor: color.hex }}
            title={color.label}
          >
            {selectedColor === color.hex && (
              <Check className="h-5 w-5 text-white absolute inset-0 m-auto" />
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">Cette couleur sera utilisee dans votre carte de profil</p>
    </div>
  )
}

export { BRAND_COLORS }
