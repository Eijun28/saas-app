"use client"

import * as React from "react"
import { Calendar as CalendarShadcn } from "./calendar"
import { Calendar as CalendarCustom } from "./calendar-old-custom"

// Props de l'ancien Calendar custom
interface CalendarCustomProps {
  initialDate?: Date
  onDateSelect?: (date: Date) => void
  showSelectedDateInfo?: boolean
  maxWidth?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  events?: any[]
  onDateClick?: (date: Date) => void
  className?: string
}

// Props du nouveau Calendar (DayPicker)
type CalendarShadcnProps = React.ComponentProps<typeof CalendarShadcn>

// Union des deux types
type CalendarWrapperProps = CalendarCustomProps | CalendarShadcnProps

/**
 * Wrapper qui détecte les props et utilise soit l'ancien Calendar custom
 * soit le nouveau Calendar shadcn selon les props utilisées
 */
export function CalendarWrapper(props: CalendarWrapperProps) {
  // Détecter si on utilise les props de l'ancien Calendar custom
  const hasCustomProps = 
    'onDateSelect' in props ||
    'showSelectedDateInfo' in props ||
    'maxWidth' in props ||
    ('events' in props && props.events !== undefined) ||
    'onDateClick' in props ||
    ('value' in props && 'onChange' in props && !('selected' in props || 'onSelect' in props))

  if (hasCustomProps) {
    // Utiliser l'ancien Calendar custom
    const customProps = props as CalendarCustomProps
    return (
      <CalendarCustom
        initialDate={customProps.value || customProps.initialDate}
        onDateSelect={customProps.onDateSelect || customProps.onDateClick || ((date) => {
          if (customProps.onChange) {
            customProps.onChange(date)
          }
        })}
        showSelectedDateInfo={customProps.showSelectedDateInfo}
        maxWidth={customProps.maxWidth}
        className={customProps.className}
      />
    )
  }

  // Utiliser le nouveau Calendar shadcn
  return <CalendarShadcn {...(props as CalendarShadcnProps)} />
}

