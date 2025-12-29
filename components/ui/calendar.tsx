"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

// Composant personnalisé Table pour forcer 7 lignes (7 semaines)
function TableCustom(props: React.ComponentProps<'table'>) {
  const tableRef = React.useRef<HTMLTableElement>(null)
  const observerRef = React.useRef<MutationObserver | null>(null)
  
  React.useEffect(() => {
    const ensureSevenRows = () => {
      if (!tableRef.current) return
      
      const tbody = tableRef.current.querySelector('tbody')
      if (!tbody) return
      
      // Supprimer les lignes vides existantes créées précédemment
      const allRows = Array.from(tbody.querySelectorAll('tr'))
      allRows.forEach(row => {
        const cells = row.querySelectorAll('td')
        const isEmpty = Array.from(cells).every(cell => {
          const day = cell.querySelector('span[aria-hidden="true"], button[aria-hidden="true"]')
          return day !== null
        })
        if (isEmpty) {
          row.remove()
        }
      })
      
      // Compter les lignes réelles (avec des jours visibles)
      const realRows = Array.from(tbody.querySelectorAll('tr')).filter(row => {
        const cells = row.querySelectorAll('td')
        return Array.from(cells).some(cell => {
          const day = cell.querySelector('span:not([aria-hidden]), button:not([aria-hidden])')
          return day !== null && !day.classList.contains('invisible')
        })
      })
      
      const currentRows = realRows.length
      
      // Ajouter des lignes vides pour avoir toujours 7 lignes
      if (currentRows < 7) {
        for (let i = currentRows; i < 7; i++) {
          const emptyRow = document.createElement('tr')
          emptyRow.className = '!flex !w-full !mt-1 !flex-row !justify-around'
          for (let j = 0; j < 7; j++) {
            const emptyCell = document.createElement('td')
            emptyCell.className = 'relative p-0 text-center text-sm !w-9 !h-9 !flex !items-center !justify-center !flex-1'
            const emptyDay = document.createElement('span')
            emptyDay.className = '!h-9 !w-9 p-0 font-normal rounded-md !flex !items-center !justify-center opacity-0 pointer-events-none'
            emptyDay.setAttribute('aria-hidden', 'true')
            emptyCell.appendChild(emptyDay)
            emptyRow.appendChild(emptyCell)
          }
          tbody.appendChild(emptyRow)
        }
      }
    }
    
    // Exécuter immédiatement
    ensureSevenRows()
    
    // Observer les changements dans le tbody
    const tbody = tableRef.current?.querySelector('tbody')
    if (tbody) {
      observerRef.current = new MutationObserver(() => {
        // Délai pour laisser react-day-picker terminer son rendu
        setTimeout(ensureSevenRows, 0)
      })
      
      observerRef.current.observe(tbody, {
        childList: true,
        subtree: true
      })
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [props.children])

  return <table ref={tableRef} {...props} />
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const currentYear = new Date().getFullYear()
  const fromYear = props.fromYear ?? currentYear - 5 // 5 ans dans le passé par défaut
  const toYear = props.toYear ?? currentYear + 20 // 20 ans dans le futur par défaut

  return (
    <DayPicker
      locale={fr}
      weekStartsOn={1} // Lundi
      showOutsideDays={showOutsideDays}
      fixedWeeks={true} // Force l'affichage de 6 semaines complètes
      fromYear={fromYear}
      toYear={toYear}
      mode={props.mode || "single"} // Mode par défaut
      className={cn("p-3", className)}
      components={{
        Navbar: () => null, // Masquer les flèches (on utilise dropdown)
        Table: TableCustom, // Utiliser notre composant Table personnalisé
      }}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "hidden", // ⚠️ Masquer le label car on utilise dropdown
        caption_dropdowns: "flex justify-center gap-3 items-center w-full",

        // ⚠️ IMPORTANT : Styles des dropdowns
        dropdown: "px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
        dropdown_month: "px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 min-w-[120px]",
        dropdown_year: "px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 min-w-[90px]",

        nav: "hidden",
        nav_button: "hidden",
        nav_button_previous: "hidden",
        nav_button_next: "hidden",

        // ⚠️ CRITIQUE : Grille du calendrier
        table: "w-full border-collapse mt-4",
        tbody: "min-h-[280px]", // Force la hauteur minimale pour 7 lignes (7 * 40px)
        
        // ⚠️ CRITIQUE : Ligne des jours de la semaine (DOIT être en FLEX avec !important)
        head_row: "!flex !w-full !flex-row !justify-around",
        head_cell: cn(
          "text-muted-foreground !w-9 font-normal text-sm text-center",
          "!flex !items-center !justify-center !flex-1"
        ),

        // ⚠️ CRITIQUE : Lignes des jours (DOIVENT être en FLEX avec !important)
        row: "!flex !w-full !mt-1 !flex-row !justify-around",

        // ⚠️ CRITIQUE : Cellules individuelles
        cell: cn(
          "relative p-0 text-center text-sm",
          "focus-within:relative focus-within:z-20",
          "!w-9 !h-9 !flex !items-center !justify-center !flex-1" // Taille fixe + flex pour centrer
        ),

        // ⚠️ CRITIQUE : Jours
        day: cn(
          "!h-9 !w-9 p-0 font-normal rounded-md",
          "hover:bg-accent hover:text-accent-foreground",
          "!flex !items-center !justify-center", // ⚠️ FLEX pour centrer
          "transition-colors"
        ),

        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground font-semibold",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
        day_hidden: "invisible",
        day_range_end: "day-range-end",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",

        ...classNames,
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
