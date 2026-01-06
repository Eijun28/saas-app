import { Sparkles, Calendar, MessageSquare, DollarSign } from "lucide-react";
import Link from "next/link";

const actions = [
  {
    label: "Parler à Nora IA",
    description: "Trouve des prestataires",
    href: "/couple/matching",
    icon: Sparkles,
  },
  {
    label: "Voir le calendrier",
    description: "Événements à venir",
    href: "/couple/timeline",
    icon: Calendar,
  },
  {
    label: "Messages",
    description: "3 nouveaux messages",
    href: "/couple/messagerie",
    icon: MessageSquare,
  },
  {
    label: "Gérer le budget",
    description: "Suivi des dépenses",
    href: "/couple/budget",
    icon: DollarSign,
  },
];

export function QuickActions() {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Actions rapides</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group relative overflow-hidden bg-gradient-to-br from-gray-900/50 to-black/50 border border-purple-600/20 rounded-2xl p-6 hover:border-purple-600/40 transition-all"
          >
            <div className="inline-flex p-3 bg-purple-600 rounded-xl mb-4">
              <action.icon className="text-white" size={20} />
            </div>
            <h3 className="font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">
              {action.label}
            </h3>
            <p className="text-sm text-gray-400">{action.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

