"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  Building2,
  Users,
  Send,
  History,
  ArrowLeft,
  Settings,
} from "lucide-react";

import { AuthGuard } from "@/components/AuthGuard";

const navigation = [
  {
    label: "Overview",
    path: "",
    icon: Building2,
  },
  {
    label: "Employees",
    path: "/employees",
    icon: Users,
  },
  {
    label: "Dispatch",
    path: "/dispatch",
    icon: Send,
  },
  {
    label: "History",
    path: "/history",
    icon: History,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams<{ slug: string }>();

  const slug = params.slug;
  const companyPath = `/company/${slug}`;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}

        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Top Bar */}

            <div className="flex h-16 items-center justify-between gap-3">
              {/* Brand */}

              <div className="flex min-w-0 items-center gap-3">
                <Link
                  href="/companies"
                  aria-label="Company management"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                >
                  <Building2 className="h-4 w-4" />
                </Link>

                <div className="min-w-0">
                  <h1 className="truncate text-sm font-semibold tracking-tight">
                    Payslip Management
                  </h1>

                  <p className="text-[10px] text-muted-foreground">
                    Company Workspace
                  </p>
                </div>
              </div>

              {/* Back to Companies */}

              <Link
                href="/companies"
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>All Companies</span>
              </Link>
            </div>

            {/* Navigation */}

            <nav
              aria-label="Company navigation"
              className="-mb-px flex items-center gap-1 overflow-x-auto"
            >
              {navigation.map(({ label, path, icon: Icon }) => {
                const href = `${companyPath}${path}`;

                const isActive =
                  path === ""
                    ? pathname === companyPath
                    : pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <Link
                    key={label}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-medium transition-colors sm:px-4 ${
                      isActive
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Page Content */}

        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
