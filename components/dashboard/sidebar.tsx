"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sparkles,
  Calendar,
  MessageSquare,
  DollarSign,
  Clock,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth/actions";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Accueil", href: "/couple/dashboard", icon: Home },
  { name: "Matching IA", href: "/couple/matching", icon: Sparkles },
  { name: "Calendrier", href: "/couple/timeline", icon: Calendar },
  { name: "Messages", href: "/couple/messagerie", icon: MessageSquare },
  { name: "Budget", href: "/couple/budget", icon: DollarSign },
  { name: "Timeline", href: "/couple/timeline", icon: Clock },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <aside className="w-72 bg-gradient-to-b from-gray-900 to-black border-r border-purple-600/20 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-purple-600/20">
        <Link href="/couple/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">NUPLY</h1>
            <p className="text-xs text-gray-400">Espace Couple</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                isActive
                  ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-600/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <item.icon
                size={20}
                className={cn(
                  "transition-colors",
                  isActive
                    ? "text-purple-400"
                    : "group-hover:text-purple-400"
                )}
              />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-purple-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-purple-600/20 space-y-1">
        <Link
          href="/couple/profil"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all"
        >
          <Settings size={20} />
          <span className="font-medium">Paramètres</span>
        </Link>
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-600/10 transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}

