"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Send, History, LogOut, Menu, X, Mail } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { href: "/dashboard/employees", label: "Employees", icon: Users },
    { href: "/dashboard/dispatch", label: "Dispatch", icon: Send },
    { href: "/dashboard/history", label: "History", icon: History },
  ];

  const isActive = (href: string) => pathname === href;

  const NavContent = () => (
    <div className="flex flex-col h-full bg-black border-r border-white/10">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10 hover:cursor-pointer">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 bg-white rounded-lg">
            <Mail className="w-4 h-4 text-black" />
          </div>
          <h1 className="text-lg font-bold text-white">Dispatch</h1>
        </div>
        <p className="text-xs text-gray-500 mt-2 ml-10 font-medium">Admin</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 text-sm font-medium group relative ${
              isActive(href)
                ? "bg-white/10 text-white border border-white/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon
              className={`w-4 h-4 transition ${isActive(href) ? "text-white" : "group-hover:text-white"}`}
            />
            <span className="text-xs">{label}</span>
            {isActive(href) && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </Link>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="px-2 py-3 border-t border-white/10 space-y-2">
        <div className="px-3 py-2 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-gray-500 mb-0.5 font-medium uppercase">
            User
          </p>
          <p className="text-xs font-medium text-white truncate">
            {user?.email}
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-all duration-300 font-medium group text-sm"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400 transition" />
          <span className="text-xs">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 hidden md:flex z-40">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 md:hidden z-40 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
