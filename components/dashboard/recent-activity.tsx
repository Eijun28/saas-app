"use client";

import { MessageSquare, Heart, Calendar, User } from "lucide-react";

const activities = [
  { 
    id: 1, 
    type: "message", 
    title: "Nouveau message de Traiteur Delice", 
    time: "Il y a 2 heures",
    icon: MessageSquare,
    color: "text-purple-400"
  },
  { 
    id: 2, 
    type: "favorite", 
    title: "Photographe ajouté aux favoris", 
    time: "Il y a 5 heures",
    icon: Heart,
    color: "text-pink-400"
  },
  { 
    id: 3, 
    type: "calendar", 
    title: "RDV confirmé avec le fleuriste", 
    time: "Hier",
    icon: Calendar,
    color: "text-purple-400"
  },
  { 
    id: 4, 
    type: "contact", 
    title: "Nouveau prestataire contacté", 
    time: "Il y a 2 jours",
    icon: User,
    color: "text-pink-400"
  },
];

export function RecentActivity() {
  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-purple-600/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Activité récente</h2>
        <span className="text-sm text-gray-400">{activities.length} activités</span>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-700/30 hover:border-purple-600/30 transition-all"
          >
            <div className={`p-2 bg-gray-800/50 rounded-lg ${activity.color}`}>
              <activity.icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {activity.title}
              </p>
              <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

