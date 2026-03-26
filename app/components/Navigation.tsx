"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Link2, BarChart3, Settings, type LucideIcon } from "lucide-react";
import { useApp } from "@/lib/ui/AppContext";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/connect", label: "Connect", icon: Link2 },
  { href: "/analysis", label: "Analysis", icon: BarChart3 },
  { href: "/manage", label: "Manage", icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useApp();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CC</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Smart CC</span>
          </Link>

          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${user ? "bg-green-400" : "bg-gray-400"}`}></div>
                <span className="text-xs">{user ? "Connected" : "Not Connected"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
