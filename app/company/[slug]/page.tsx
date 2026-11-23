"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  type CompanyDetails,
  type PayrollComponentItem,
} from "@/app/action/company/getCompanyBySlug";
import {
  Building2,
  Users,
  CalendarDays,
  Wallet,
  Landmark,
  FileText,
  Loader2,
  MapPin,
  ArrowUpRight,
} from "lucide-react";

import { getCompanyBySlug } from "@/app/action/company/getCompanyBySlug";

// ==========================================
// TYPES
// ==========================================

function formatDate(date: string | Date | null | undefined) {
  if (!date) return "Not available";

  const parsedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    console.error("Invalid company date:", date);
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function formatAmount(value: string, currency: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Not added";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatComponentValue(
  component: PayrollComponentItem,
  currency: string,
) {
  if (component.mode === "PERCENT_OF_BASIC") {
    return `${Number(component.value)}% of Basic Pay`;
  }

  return formatAmount(component.value, currency);
}

// ==========================================
// PAYROLL COMPONENT CARD
// ==========================================

function PayrollSection({
  title,
  description,
  components,
  currency,
  type,
}: {
  title: string;
  description: string;
  components: PayrollComponentItem[];
  currency: string;
  type: "EARNING" | "DEDUCTION";
}) {
  const filteredComponents = components
    .filter((component) => component.type === type)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          {type === "EARNING" ? (
            <Wallet className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Landmark className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="p-5">
        {filteredComponents.length > 0 ? (
          <div className="space-y-4">
            {filteredComponents.map((component) => (
              <div
                key={component.id}
                className={`flex items-center justify-between gap-4 ${
                  !component.isEnabled ? "opacity-50" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {component.name}
                  </p>

                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {component.code}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatComponentValue(component, currency)}
                  </p>

                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {!component.isEnabled
                      ? "Disabled"
                      : component.mode === "FIXED_AMOUNT"
                        ? "Fixed amount"
                        : "Percentage of Basic"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[90px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <div className="text-center">
              <p className="text-sm font-semibold text-red-500 dark:text-red-400">
                Not added
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                No company standard {type.toLowerCase()} configured.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ==========================================
// COMPANY OVERVIEW PAGE
// ==========================================

export default function CompanyPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // FETCH COMPANY DETAILS
  // ========================================

  useEffect(() => {
    let cancelled = false;

    async function loadCompany() {
      setIsLoading(true);
      setError("");

      try {
        const result = await getCompanyBySlug(slug);

        if (cancelled) return;

        if (!result.success) {
          setCompany(null);
          setError(result.error);
          return;
        }

        setCompany(result.company);
      } catch (err) {
        console.error("Failed to load company:", err);

        if (!cancelled) {
          setError("Unable to load company details.");
          setCompany(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    if (slug) {
      void loadCompany();
    } else {
      setError("Invalid company URL.");
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ========================================
  // LOADING
  // ========================================

  if (isLoading) {
    return (
      <main className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading company...
        </div>
      </main>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (error || !company) {
    return (
      <main className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <Building2 className="h-10 w-10 text-muted-foreground" />

        <h2 className="mt-4 text-lg font-semibold">Unable to load company</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error || "This company does not exist."}
        </p>

        <Link
          href="/companies"
          className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
        >
          Back to Companies
        </Link>
      </main>
    );
  }

  // ========================================
  // PAYROLL DATA
  // ========================================

  const payrollComponents = company.payrollComponents ?? [];

  return (
    <main className="space-y-7 pb-10">
      {/* COMPANY HEADER */}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-950 sm:h-52">
          {company.bannerUrl && (
            <img
              src={company.bannerUrl}
              alt={`${company.name} banner`}
              className="h-full w-full object-cover"
            />
          )}
          {!company.bannerUrl?.trim() && (
            <span className="absolute left-4 top-4 rounded-md border border-red-400/30 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-red-300 backdrop-blur-sm">
              Banner not added
            </span>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 p-5 sm:p-7">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/60">
              Company Workspace
            </p>

            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {company.name}
            </h1>

            <p className="mt-1 text-xs text-white/60">
              /company/{company.slug}
            </p>
          </div>

          <Link
            href={`/company/${company.slug}/settings`}
            className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-[11px] font-medium text-white backdrop-blur-md transition hover:bg-black/50"
          >
            Company Settings
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* COMPANY STATISTICS */}

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>

            <div>
              <p className="text-xl font-semibold tabular-nums">
                {company.employeeCount}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Total Employees
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>

            <div>
              <p className="text-sm font-semibold">
                {formatDate(company.createdAt)}
              </p>
              <p className="text-[11px] text-muted-foreground">Date Created</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPANY DETAILS */}

      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Company Information</h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Registered company details.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />

            <div>
              <p className="text-[11px] text-muted-foreground">
                Registered Address
              </p>

              <p className="mt-1 text-sm font-medium">
                {company.registeredAddress?.trim() ? (
                  company.registeredAddress
                ) : (
                  <span className="font-semibold text-red-500 dark:text-red-400">
                    Not added
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />

            <div>
              <p className="text-[11px] text-muted-foreground">Employer TAN</p>

              <p className="mt-1 text-sm font-medium">
                {company.employerTan?.trim() ? (
                  company.employerTan
                ) : (
                  <span className="font-semibold text-red-500 dark:text-red-400">
                    Not added
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPANY STANDARD AMOUNTS */}

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-base font-semibold">
              Company Standard Amounts
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Standard earnings and deductions for employees assigned to the
              company default payroll.
            </p>
          </div>

          <Link
            href={`/company/${company.slug}/settings`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            Manage Payroll Defaults
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <PayrollSection
            title="Standard Earnings"
            description="Company default salary components"
            components={payrollComponents}
            currency={company.currency || "INR"}
            type="EARNING"
          />

          <PayrollSection
            title="Standard Deductions"
            description="Company default deduction components"
            components={payrollComponents}
            currency={company.currency || "INR"}
            type="DEDUCTION"
          />
        </div>

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          These amounts apply to employees assigned to the company standard
          payroll. Employees assigned a custom payroll use the components
          configured in their own payroll. Percentage-based components are
          calculated using that employee's Basic Pay.
        </p>
      </section>
    </main>
  );
}
