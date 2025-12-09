import { TrendingUp, Users, Calendar, DollarSign } from "lucide-react";

const stats = [
  {
    label: "Prestataires contactés",
    value: "12",
    change: "+3 cette semaine",
    icon: Users,
    trend: "up",
    color: "from-purple-600 to-purple-700",
  },
  {
    label: "Jours avant le mariage",
    value: "156",
    change: "5 mois restants",
    icon: Calendar,
    trend: "neutral",
    color: "from-pink-600 to-pink-700",
  },
  {
    label: "Budget utilisé",
    value: "42%",
    change: "12,600€ / 30,000€",
    icon: DollarSign,
    trend: "up",
    color: "from-purple-600 to-pink-600",
  },
  {
    label: "Tâches complétées",
    value: "24/60",
    change: "40% complété",
    icon: TrendingUp,
    trend: "up",
    color: "from-pink-600 to-purple-600",
  },
];

export function StatsCards() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="relative overflow-hidden bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-purple-600/20 rounded-2xl p-6 hover:border-purple-600/40 transition-all group"
        >
          {/* Gradient background on hover */}
          <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity" 
               style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
          
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl`}>
                <stat.icon className="text-white" size={20} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="text-xs text-gray-500">{stat.change}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

