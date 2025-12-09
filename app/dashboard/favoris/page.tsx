import { Heart } from 'lucide-react'

export default function FavorisPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Mes favoris</h1>
        <p className="text-[#6B7280] mt-2">
          Gérez vos prestataires favoris
        </p>
      </div>
      
      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-12 text-center">
        <Heart className="h-12 w-12 text-[#D1D5DB] mx-auto mb-4" />
        <p className="text-[#6B7280] text-lg mb-2">Vous n'avez pas encore de favoris</p>
        <p className="text-[#9CA3AF] text-sm">
          Commencez à rechercher des prestataires et ajoutez-les à vos favoris
        </p>
      </div>
    </div>
  )
}

