'use client';

import { SERVICE_CATEGORIES } from '@/lib/constants/service-types';
import { cn } from '@/lib/utils';

interface ServiceSelectorProps {
  onSelectService: (serviceType: string) => void;
}

export function ServiceSelector({ onSelectService }: ServiceSelectorProps) {
  // Prendre les 8 premières catégories principales
  const mainCategories = SERVICE_CATEGORIES.slice(0, 8);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {mainCategories.map((category) => {
        const Icon = category.icon;
        
        return (
          <button
            key={category.id}
            onClick={() => onSelectService(category.label)}
            className={cn(
              'group relative flex flex-col items-center justify-center',
              'p-6 rounded-xl border-2 border-gray-200',
              'bg-white hover:border-[#823F91]/30',
              'transition-all duration-300',
              'hover:shadow-lg hover:-translate-y-1',
              'cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-[#823F91]/20 focus:ring-offset-2'
            )}
          >
            {/* Icône */}
            <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-[#823F91]/10 to-[#9333ea]/10 group-hover:from-[#823F91]/20 group-hover:to-[#9333ea]/20 transition-all duration-300">
              <Icon className="h-8 w-8 text-[#823F91] group-hover:scale-110 transition-transform duration-300" />
            </div>
            
            {/* Nom du service */}
            <span className="text-sm font-semibold text-gray-900 text-center group-hover:text-[#823F91] transition-colors duration-300">
              {category.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
