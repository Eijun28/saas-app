"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { fr } from "date-fns/locale";

const events = [
  { id: 1, title: "RDV Traiteur", date: "2024-12-10", color: "purple" },
  { id: 2, title: "Essayage robe", date: "2024-12-15", color: "pink" },
  { id: 3, title: "Visite salle", date: "2024-12-20", color: "purple" },
];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Calendrier</h1>
          <p className="text-gray-400">Organise tous tes événements et rendez-vous</p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-white font-semibold min-w-[200px] text-center">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-purple-600/20 rounded-2xl p-6">
        {/* Days header */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-4">
          {daysInMonth.map((day) => {
            const dayEvents = events.filter((e) => e.date === format(day, "yyyy-MM-dd"));
            const today = isToday(day);

            return (
              <div
                key={day.toString()}
                className={`min-h-[100px] p-3 rounded-xl border transition-all ${
                  today
                    ? "bg-purple-600/20 border-purple-600/50"
                    : "bg-gray-800/30 border-gray-700/30 hover:border-purple-600/30"
                }`}
              >
                <div className={`text-sm font-semibold mb-2 ${today ? "text-purple-400" : "text-gray-300"}`}>
                  {format(day, "d")}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs px-2 py-1 rounded ${
                        event.color === "purple"
                          ? "bg-purple-600/30 text-purple-300"
                          : "bg-pink-600/30 text-pink-300"
                      }`}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

