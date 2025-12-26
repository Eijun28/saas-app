"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const currentYear = new Date().getFullYear()
  const fromYear = currentYear
  const toYear = currentYear + 20 // 20 ans dans le futur

  return (
    <DayPicker
      locale={fr}
      weekStartsOn={1}
      showOutsideDays={showOutsideDays}
      fromYear={fromYear}
      toYear={toYear}
      className={cn("p-3", className)}
      components={{
        Navbar: () => null,
      }}
      classNames={{
        months: "flex flex-col space-y-4",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "hidden",
        caption_dropdowns: "flex justify-center gap-3 items-center w-full",
        dropdown: "px-3 py-1.5 text-sm rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 min-w-[120px]",
        dropdown_month: "px-3 py-1.5 text-sm rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 min-w-[120px]",
        dropdown_year: "px-3 py-1.5 text-sm rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 min-w-[100px]",
        nav: "hidden",
        nav_button: "hidden",
        nav_button_previous: "hidden",
        nav_button_next: "hidden",
        table: "w-full border-collapse space-y-1 mt-2",
        head_row: "flex justify-between",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] flex items-center justify-center",
        row: "flex w-full mt-1 justify-between",
        cell: "h-9 w-9 text-center text-sm p-0 relative flex items-center justify-center [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground flex items-center justify-center"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground font-semibold",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

