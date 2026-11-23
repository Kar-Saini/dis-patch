"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Plus,
  Users,
} from "lucide-react";

import { AuthGuard } from "@/components/AuthGuard";
import {
  getCompanies,
  type CompanyListItem,
} from "@/app/action/company/getCompanies";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchCompanies = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const result = await getCompanies();

        if (cancelled) return;

        if (result.success) setCompanies(result.companies);
        else setLoadError(result.error);
      } catch (err) {
        console.error("Failed to load companies:", err);
        if (!cancelled)
          setLoadError("Unable to load companies. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void fetchCompanies();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalEmployees = companies.reduce(
    (total, company) => total + company.employeeCount,
    0,
  );
  const companiesLength = companies.length;

  return (
    <AuthGuard>
      <main className="min-h-screen bg-background px-4 py-5 text-foreground transition-colors duration-200 sm:px-6 sm:py-7 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <Header />
          <OrganizationSection />
          <CompaniesInformation
            comapaniesLength={companiesLength}
            isLoading={isLoading}
            totalEmployees={totalEmployees}
          />

          <section className="space-y-4">
            <CompaniesDirectory
              companiesLength={companiesLength}
              isLoading={isLoading}
              loadError={loadError}
            />

            {isLoading && <Loading />}
            {!isLoading && loadError && (
              <LoadCompaniesError loadError={loadError} />
            )}
            {!isLoading && !loadError && companies.length > 0 && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {companies.map((company) => (
                  <CompanyCard company={company} key={company.id} />
                ))}
              </div>
            )}

            {!isLoading && !loadError && companies.length === 0 && (
              <NoCompanies />
            )}
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Workspace
          </p>

          <h1 className="text-sm font-semibold tracking-tight">
            Company Management
          </h1>
        </div>
      </div>
      <Link
        href="/"
        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>
    </header>
  );
}

function OrganizationSection() {
  return (
    <section className="flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-end">
      <div className="max-w-xl">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Organization Management
        </p>

        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
          Your Companies
        </h2>

        <p className="mt-2 max-w-lg text-[13px] leading-6 text-muted-foreground">
          Manage your organizations, employees and monthly payroll operations
          from one place.
        </p>
      </div>

      <Link
        href="/companies/new"
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
      >
        <Plus className="h-3.5 w-3.5" />
        Create Company
      </Link>
    </section>
  );
}

function CompaniesInformation({
  isLoading,
  comapaniesLength,
  totalEmployees,
}: {
  isLoading: boolean;
  comapaniesLength: number;
  totalEmployees: number;
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">
            Total Companies
          </p>

          <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
            {isLoading ? "—" : comapaniesLength}
          </p>

          <p className="mt-1 text-[10px] text-muted-foreground">
            Registered organizations
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">
            Total Employees
          </p>

          <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
            {isLoading ? "—" : totalEmployees}
          </p>

          <p className="mt-1 text-[10px] text-muted-foreground">
            Across all companies
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </section>
  );
}

function CompanyCard({ company }: { company: CompanyListItem }) {
  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };
  return (
    <Link
      key={company.id}
      href={`/company/${company.slug}`}
      className="group overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-ring/60 hover:shadow-lg"
    >
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-stone-800 via-stone-700 to-stone-950 sm:h-48">
        {company.bannerUrl ? (
          <img
            src={company.bannerUrl}
            alt={`${company.name} banner`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="relative flex h-full items-center justify-center overflow-hidden">
            <div className="absolute -right-12 -top-14 h-56 w-56 rounded-full border border-white/10" />
            <div className="absolute -right-6 -top-8 h-44 w-44 rounded-full border border-white/10" />
            <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full border border-white/10" />
            <Building2 className="relative h-14 w-14 text-white/20" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/10" />

        <div className="absolute left-4 top-4">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-black/30 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md">
            <Building2 className="h-3 w-3" />
            Company Workspace
          </span>
        </div>

        <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:bg-white group-hover:text-black">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <p className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-white/65">
            Organization
          </p>

          <h4 className="max-w-[85%] truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {company.name}
          </h4>

          <p className="mt-1 truncate text-[11px] text-white/65">
            /company/{company.slug}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold tabular-nums">
              {company.employeeCount}
            </p>

            <p className="text-[10px] text-muted-foreground">Total Employees</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          <div>
            <p className="text-xs font-semibold">
              {formatDate(company.createdAt)}
            </p>
            <p className="text-[10px] text-muted-foreground">Date Created</p>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 text-[11px] font-semibold text-muted-foreground transition-colors group-hover:text-foreground sm:flex">
          Open Workspace
          <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

function NoCompanies() {
  return (
    <div className="flex min-h-[290px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-5 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <Building2 className="h-6 w-6 text-muted-foreground" />
      </div>

      <h3 className="mt-4 text-base font-semibold tracking-tight">
        No companies yet
      </h3>
    </div>
  );
}

function LoadCompaniesError({ loadError }: { loadError: string }) {
  return (
    <div className="flex min-h-[230px] flex-col items-center justify-center rounded-xl border border-border bg-card px-5 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
        <Building2 className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">Unable to load companies</h3>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {loadError}
      </p>
    </div>
  );
}
function Loading() {
  return (
    <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        Loading companies...
      </div>
    </div>
  );
}

function CompaniesDirectory({
  isLoading,
  loadError,
  companiesLength,
}: {
  companiesLength: number;
  isLoading: boolean;
  loadError: String;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold tracking-tight">
          Company Directory
        </h3>

        <p className="mt-1 text-[11px] text-muted-foreground">
          Select a company to access its workspace.
        </p>
      </div>

      {!isLoading && !loadError && companiesLength > 0 && (
        <span className="shrink-0 rounded-md border border-border bg-card px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
          {companiesLength} {companiesLength === 1 ? "Company" : "Companies"}
        </span>
      )}
    </div>
  );
}
