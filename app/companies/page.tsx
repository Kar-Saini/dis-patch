"use client";

import {
  useMemo,
  useState,
  useEffect,
  type FormEvent,
  type ChangeEvent,
} from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Users,
  CalendarDays,
  Search,
  X,
  ImagePlus,
  ArrowUpRight,
  Upload,
  BriefcaseBusiness,
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import {
  getCompanies,
  type CompanyListItem,
} from "@/app/action/company/getCompanies";
import { createCompany } from "@/app/action/company/createCompany";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH COMPANIES
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const fetchCompanies = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const result = await getCompanies();

        if (cancelled) return;

        if (result.success) {
          setCompanies(result.companies);
        } else {
          setLoadError(result.error);
        }
      } catch (err) {
        console.error("Failed to load companies:", err);

        if (!cancelled) {
          setLoadError("Unable to load companies. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchCompanies();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // ==========================================
  // FILTER COMPANIES
  // ==========================================

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [companies, searchQuery]);

  // ==========================================
  // HELPERS
  // ==========================================

  const generateSlug = (name: string) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  // ==========================================
  // BANNER PREVIEW
  // ==========================================

  const handleBannerChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Banner image must be smaller than 5 MB.");
      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBannerPreview(reader.result);
      }
    };

    reader.onerror = () => {
      setError("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);
  };

  // ==========================================
  // MODAL
  // ==========================================

  const resetForm = () => {
    setCompanyName("");
    setBannerPreview(null);
    setError("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // ==========================================
  // CREATE COMPANY
  // ==========================================

  const handleCreateCompany = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = companyName.trim();

    if (!trimmedName) {
      setError("Please enter a company name.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await createCompany({
        name: trimmedName,
        bannerUrl: bannerPreview,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      const newCompany: CompanyListItem = {
        id: result.company?.id!,
        name: result.company?.name!,
        slug: result.company?.slug!,
        logoUrl: result.company?.logoUrl!,
        bannerUrl: result.company?.bannerUrl!,
        employeeCount: 0,
        createdAt: result.company?.createdAt.toISOString()!,
      };

      setCompanies((previous) => [newCompany, ...previous]);

      closeModal();
    } catch (error) {
      console.error("Failed to create company:", error);
      setError("Something went wrong while creating the company.");
    } finally {
      setIsLoading(false);
    }
  };
  // ==========================================
  // REFRESH
  // ==========================================

  const refreshCompanies = () => {
    setReloadKey((previous) => previous + 1);
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <AuthGuard>
      <main className=" bg-background px-5 py-2 text-foreground transition-colors duration-200 sm:px-8 lg:px-10">
        <header className=" bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-end gap-4 px-6">
            <div className="w-36 shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Page Header */}
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Companies
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Select a company to manage its employees and payslips.
              </p>
            </div>
          </div>

          {/* Summary */}
          {/* Companies Overview + Create Action */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-stretch">
            {/* Total Companies Card */}
            <div className="group relative flex min-h-32 items-center justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-slate-300 dark:hover:border-white/20">
              {/* Decorative Background */}
              <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-slate-200/50 blur-3xl dark:bg-white/[0.04]" />

              <div className="relative">
                <div className="mb-1 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Workspace Overview
                  </p>
                </div>

                <div className="flex items-baseline gap-3">
                  <p className="text-4xl font-semibold tracking-tight tabular-nums">
                    {isLoading
                      ? "—"
                      : companies.length.toString().padStart(2, "0")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {companies.length === 1
                      ? "company registered"
                      : "companies registered"}
                  </p>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  All your organizations in one place.
                </p>
              </div>

              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted shadow-sm transition-transform duration-300 group-hover:scale-105">
                <Building2 className="h-6 w-6 text-foreground" />
              </div>
            </div>

            {/* Create Company Action */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="group relative flex min-h-32 w-full items-center justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 text-left text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ring/50 hover:bg-muted hover:shadow-lg sm:w-64"
            >
              <div className="relative">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted transition-transform duration-300 group-hover:rotate-90">
                  <Plus className="h-5 w-5 text-foreground" />
                </div>

                <p className="text-sm font-semibold text-card-foreground">
                  Create Company
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Add a new organization
                </p>
              </div>

              <ArrowUpRight className="absolute bottom-6 right-6 h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-foreground" />
            </button>
          </div>

          {/* Companies Section */}
          <section className="space-y-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold">All Companies</h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  {companies.length}{" "}
                  {companies.length === 1 ? "company" : "companies"} added
                </p>
              </div>
            </div>

            {/* Loading */}
            {isLoading ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
                  Loading companies...
                </div>
              </div>
            ) : loadError ? (
              /* Loading Error */
              <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 text-center">
                <p className="text-sm text-red-500">{loadError}</p>

                <button
                  type="button"
                  onClick={refreshCompanies}
                  className="mt-4 rounded-xl border border-border px-4 py-2 text-xs font-medium transition hover:bg-muted"
                >
                  Try again
                </button>
              </div>
            ) : filteredCompanies.length > 0 ? (
              /* Company Cards */
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCompanies.map((company) => (
                  <Link
                    key={company.id}
                    href={`/companies/${company.slug}`}
                    className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:hover:border-white/20 dark:hover:bg-[#242424]"
                  >
                    {/* Banner */}
                    <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
                      {company.bannerUrl ? (
                        <img
                          src={company.bannerUrl}
                          alt={`${company.name} banner`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Building2 className="h-14 w-14 text-white/30" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                      <div className="absolute bottom-4 left-4 flex items-center gap-2">
                        <span className="rounded-lg border border-white/20 bg-black/30 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-md">
                          Company
                        </span>
                      </div>

                      <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white opacity-0 backdrop-blur-md transition group-hover:opacity-100">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Company Details */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold tracking-tight">
                            {company.name}
                          </h3>
                        </div>

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                          {company.logoUrl ? (
                            <img
                              src={company.logoUrl}
                              alt={`${company.name} logo`}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />

                          <div>
                            <p className="text-sm font-semibold tabular-nums">
                              {company.employeeCount}
                            </p>

                            <p className="text-[10px] text-muted-foreground">
                              Employees
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />

                          <div>
                            <p className="text-sm font-semibold">
                              {formatDate(company.createdAt)}
                            </p>

                            <p className="text-[10px] text-muted-foreground">
                              Created
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  {searchQuery ? (
                    <Search className="h-7 w-7 text-muted-foreground" />
                  ) : (
                    <Building2 className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  {searchQuery
                    ? "No companies found"
                    : "No companies added yet"}
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  {searchQuery
                    ? "Try searching with a different company name."
                    : "Create your first company to start managing its employees and monthly payslips."}
                </p>

                {!searchQuery && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    <Plus className="h-4 w-4" />
                    Create your first company
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Create Company Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeModal();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-company-title"
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <div>
                  <h2
                    id="create-company-title"
                    className="text-lg font-semibold"
                  >
                    Create Company
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Add a new company to your payroll system.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close modal"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-slate-100 hover:text-foreground dark:hover:bg-[#303030]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateCompany}>
                <div className="space-y-6 p-6">
                  {/* Company Name */}
                  <div>
                    <label
                      htmlFor="company-name"
                      className="mb-2 block text-xs font-medium"
                    >
                      Company Name <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="company-name"
                      type="text"
                      value={companyName}
                      onChange={(event) => {
                        setCompanyName(event.target.value);
                        setError("");
                      }}
                      placeholder="e.g. Acme Technologies"
                      maxLength={100}
                      required
                      autoFocus
                      className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring"
                    />
                  </div>

                  {/* Company Banner */}
                  <div>
                    <label className="mb-2 block text-xs font-medium">
                      Company Banner
                    </label>

                    <label
                      htmlFor="company-banner"
                      className="group relative flex h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-background transition hover:border-slate-400 dark:hover:border-white/30"
                    >
                      {bannerPreview ? (
                        <>
                          <img
                            src={bannerPreview}
                            alt="Company banner preview"
                            className="absolute inset-0 h-full w-full object-cover"
                          />

                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                            <div className="flex items-center gap-2 rounded-lg bg-black/60 px-4 py-2 text-xs font-medium text-white">
                              <Upload className="h-4 w-4" />
                              Change banner
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                            <ImagePlus className="h-5 w-5 text-muted-foreground" />
                          </div>

                          <p className="text-xs font-medium">
                            Upload company banner
                          </p>

                          <p className="mt-1 text-[10px] text-muted-foreground">
                            PNG, JPG or WEBP · Maximum 5 MB
                          </p>
                        </>
                      )}
                    </label>

                    <input
                      id="company-banner"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleBannerChange}
                      className="hidden"
                    />

                    <p className="mt-2 text-[10px] text-muted-foreground">
                      This image will appear on the company card.
                    </p>
                  </div>

                  {/* Automatically Generated Details */}
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Automatically generated
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />

                        <div>
                          <p className="text-sm font-semibold">0</p>
                          <p className="text-[10px] text-muted-foreground">
                            Employees
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />

                        <div>
                          <p className="text-sm font-semibold">Today</p>
                          <p className="text-[10px] text-muted-foreground">
                            Created date
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-500">
                      {error}
                    </p>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/20 px-6 py-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="h-10 rounded-xl border border-border px-4 text-xs font-medium text-muted-foreground transition hover:bg-slate-100 hover:text-foreground dark:hover:bg-[#303030]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!companyName.trim()}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    <Plus className="h-4 w-4" />
                    Create Company
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
