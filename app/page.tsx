"use client";

import Link from "next/link";
import { ArrowRight, Plane, Receipt } from "lucide-react";

import { AuthGuard } from "@/components/AuthGuard";

const sections = [
  {
    href: "/companies",
    icon: Receipt,
    title: "Companies",
    description: "Generate and email monthly salary slips to employees.",
    footer: "Employees · Dispatch · History",
  },
  {
    href: "/dashboard/visa",
    icon: Plane,
    title: "Visas",
    description: "Track entry and exit dates against the 180-day allowance.",
    footer: "Visas · Logs",
    status: "In Development",
  },
];

export default function Page() {
  return (
    <AuthGuard>
      <main className="relative flex min-h-screen items-center overflow-hidden bg-background px-5 py-16 text-foreground transition-colors duration-200 sm:px-8">
        {/* Background Decoration */}

        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-foreground/[0.025] blur-3xl" />

        {/* Main Content */}

        <div className="relative mx-auto w-full max-w-6xl">
          {/* Page Heading */}

          <section className="mb-12 max-w-2xl">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Dashboard
            </p>

            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              What would you like
              <br />
              <span className="text-muted-foreground">to manage today?</span>
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">
              Access your management tools and keep your operations organized
              from one place.
            </p>
          </section>

          {/* Application Cards */}

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {sections.map(
              ({ href, icon: Icon, title, description, footer, status }) => (
                <Link
                  key={href}
                  href={href}
                  className="
                    group relative flex min-h-[300px] flex-col
                    overflow-hidden rounded-2xl
                    border border-border bg-card
                    p-6 text-card-foreground
                    transition-all duration-300
                    hover:-translate-y-1
                    hover:border-ring/50
                    hover:bg-muted/30
                    hover:shadow-xl
                    sm:p-8
                  "
                >
                  {/* Decorative Glow */}

                  <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-foreground/[0.025] blur-3xl transition-all duration-500 group-hover:bg-foreground/[0.06]" />

                  <div className="relative flex flex-1 flex-col">
                    {/* Icon and Arrow */}

                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform duration-300 group-hover:scale-105">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>

                    {/* Card Content */}

                    <div className="mt-10">
                      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        {title}
                      </h2>

                      <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
                        {description}
                      </p>
                    </div>

                    {/* Card Footer */}

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                        {footer}
                      </span>

                      {status && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          {status}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ),
            )}
          </section>

          {/* Bottom Footer */}
        </div>
      </main>
    </AuthGuard>
  );
}
