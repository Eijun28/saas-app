"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const tasks = [
  { id: 1, title: "Confirmer le traiteur", dueDate: "Dans 3 jours", completed: false, priority: "high" },
  { id: 2, title: "Essayage robe", dueDate: "15 décembre", completed: false, priority: "medium" },
  { id: 3, title: "Réserver la salle", dueDate: "20 décembre", completed: true, priority: "high" },
  { id: 4, title: "Envoyer les faire-parts", dueDate: "1er janvier", completed: false, priority: "low" },
];

export function UpcomingTasks() {
  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-purple-600/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Tâches à venir</h2>
        <span className="text-sm text-gray-400">{tasks.filter(t => !t.completed).length} restantes</span>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border transition-all",
              task.completed
                ? "bg-gray-800/30 border-gray-700/30 opacity-60"
                : "bg-gray-800/50 border-purple-600/20 hover:border-purple-600/40"
            )}
          >
            <button className="mt-0.5">
              {task.completed ? (
                <CheckCircle2 className="text-purple-400" size={20} />
              ) : (
                <Circle className="text-gray-500 hover:text-purple-400 transition-colors" size={20} />
              )}
            </button>
            <div className="flex-1">
              <p className={cn(
                "font-medium",
                task.completed ? "text-gray-500 line-through" : "text-white"
              )}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={14} className="text-gray-500" />
                <span className="text-xs text-gray-400">{task.dueDate}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  task.priority === "high" ? "bg-red-600/20 text-red-400" :
                  task.priority === "medium" ? "bg-yellow-600/20 text-yellow-400" :
                  "bg-gray-600/20 text-gray-400"
                )}>
                  {task.priority === "high" ? "Urgent" : task.priority === "medium" ? "Moyen" : "Faible"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

