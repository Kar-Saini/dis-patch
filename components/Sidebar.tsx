"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  Users,
  Send,
  History,
  LogOut,
  Menu,
  X,
  Mail,
  Building2,
  Plane,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams<{ slug?: string }>();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const slug = typeof params?.slug === "string" ? params.slug : "";

  const isVisaSection = pathname.toLowerCase().includes("visa");

  const companyPath = slug ? `/companies/${slug}` : "/companies";

  const currentSectionLabel = isVisaSection ? "Visas" : "Companies";
  const CurrentSectionIcon = isVisaSection ? Plane : Building2;

  const navigation =
    !isVisaSection && slug
      ? [
          {
            href: `${companyPath}/employees`,
            label: "Employees",
            icon: Users,
          },
          {
            href: `${companyPath}/dispatch`,
            label: "Dispatch",
            icon: Send,
          },
          {
            href: `${companyPath}/history`,
            label: "History",
            icon: History,
          },
        ]
      : [];

  const isActive = (href: string) => pathname === href;

  const closeMobileMenu = () => setIsOpen(false);

  const NavContent = () => (
    <div className="relative flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-foreground/[0.025] blur-3xl" />

      {/* Header */}
      <div className="relative border-b border-sidebar-border px-4 py-4">
        <Link
          href={companyPath}
          onClick={closeMobileMenu}
          className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-100 dark:hover:bg-[#242424]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary shadow-lg shadow-black/20">
            <Mail className="h-4 w-4 text-primary-foreground" />
          </div>

          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight">
              Payslip Management
            </h1>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Company Workspace
            </p>
          </div>
        </Link>
      </div>

      {/* Current Section */}
      <div className="relative px-3 pt-5">
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Current Section
        </div>

        <Link
          href="/"
          onClick={closeMobileMenu}
          className="group flex w-full items-center gap-3 rounded-xl border border-sidebar-border bg-card px-3 py-3 transition-colors hover:bg-slate-100 dark:hover:bg-[#242424]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <CurrentSectionIcon className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">
              {currentSectionLabel}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Switch workspace
            </p>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-3 py-6">
        {navigation.length > 0 && (
          <>
            <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Navigation
            </div>

            <div className="space-y-1">
              {navigation.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobileMenu}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 ${
                      active
                        ? "border-slate-200 bg-slate-100 text-slate-900 shadow-sm dark:border-white/10 dark:bg-[#292929] dark:text-white"
                        : "border-transparent text-sidebar-foreground/70 hover:bg-slate-100 hover:text-foreground dark:hover:bg-[#242424]"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        active
                          ? "text-slate-700 dark:text-white"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    />

                    <span className="text-xs font-medium">{label}</span>

                    {active && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-slate-500 dark:bg-white/70" />
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="relative border-t border-sidebar-border p-3">
        {/* User */}
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {user?.email?.charAt(0).toUpperCase() ?? "U"}
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Signed in as
            </p>
            <p className="mt-0.5 truncate text-xs text-foreground/70">
              {user?.email ?? "User"}
            </p>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="mb-1">
          <ThemeToggle />
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
        >
          <LogOut className="h-4 w-4 transition-colors group-hover:text-red-500" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-xl backdrop-blur-xl transition-colors hover:bg-slate-100 dark:hover:bg-[#242424] md:hidden"
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeMobileMenu}
      />

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 md:flex">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
