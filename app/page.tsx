"use client";

import Link from "next/link";
import { ArrowRight, Mail, Plane, Receipt } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeToggle } from "@/components/ThemeToggle";

const sections = [
  {
    href: "/companies",
    icon: Receipt,
    title: "Companies",
    description: "Generate and email monthly salary slips to employees.",
    links: "Employees · Dispatch · History",
  },
  {
    href: "/dashboard/visa",
    icon: Plane,
    title: "Visas",
    description: "Track entry and exit dates against the 180-day allowance.",
    links: "Visas · Logs",
  },
];

export default function Page() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        {/* Header */}
        <header className=" bg-background/80 backdrop-blur-xl py-2">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-end gap-4 px-6">
            <div className="w-36 shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="relative mx-auto w-full max-w-6xl px-6 py-16">
          {/* Background glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-foreground/[0.025] blur-3xl" />

          <div className="relative">
            {/* Page heading */}
            <div className="mb-10 max-w-xl">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Dashboard
              </p>

              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                What would you like
                <br />
                <span className="text-muted-foreground">to manage?</span>
              </h1>

              <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                Manage employee payslips and visa records from one place.
              </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {sections.map(
                ({ href, icon: Icon, title, description, links }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:border-ring/50 hover:bg-accent dark:hover:border-white/20 dark:hover:bg-[#242424] hover:shadow-xl"
                  >
                    {/* Card glow */}
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-foreground/[0.025] blur-3xl transition-all duration-500 group-hover:bg-foreground/[0.05]" />

                    <div className="relative">
                      {/* Icon + Arrow */}
                      <div className="flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg">
                          <Icon className="h-5 w-5 text-primary-foreground" />
                        </div>

                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mt-10">
                        <h2 className="text-xl font-semibold tracking-tight text-card-foreground">
                          {title}
                        </h2>

                        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                          {description}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="mt-8 flex items-center border-t border-border pt-5">
                        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          {links}
                        </span>
                      </div>
                    </div>
                  </Link>
                ),
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
