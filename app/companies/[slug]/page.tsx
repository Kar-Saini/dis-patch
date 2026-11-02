"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  Users,
  ArrowLeft,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  Loader2,
  ImagePlus,
} from "lucide-react";

import {
  getCompanies,
  type CompanyListItem,
} from "@/app/action/company/getCompanies";

import { updateCompany } from "@/app/action/company/updateCompany";
import { deleteCompany } from "@/app/action/company/deleteCompany";

export default function CompanyPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [company, setCompany] = useState<CompanyListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editBannerUrl, setEditBannerUrl] = useState("");

  // Action loading states
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState("");

  // Load company
  useEffect(() => {
    let cancelled = false;

    async function loadCompany() {
      setIsLoading(true);
      setError("");

      try {
        const result = await getCompanies();

        if (cancelled) return;

        if (!result.success) {
          setError(result.error);
          return;
        }

        const selectedCompany = result.companies.find(
          (item) => item.slug === slug,
        );

        if (!selectedCompany) {
          setError("Company not found.");
          return;
        }

        setCompany(selectedCompany);
      } catch (err) {
        console.error("Failed to load company:", err);

        if (!cancelled) {
          setError("Unable to load company details.");
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

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));

  // Open edit modal and populate existing values
  const openEditModal = () => {
    if (!company) return;

    setEditName(company.name);
    setEditSlug(company.slug);
    setEditLogoUrl(company.logoUrl || "");
    setEditBannerUrl(company.bannerUrl || "");
    setActionError("");
    setIsEditOpen(true);
  };

  // Handle image uploads
  const handleImageUpload = (
    event: ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setActionError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setActionError("Image size must be less than 5MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setter(reader.result);
        setActionError("");
      }
    };

    reader.onerror = () => {
      setActionError("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);
  };

  // Update company
  const handleUpdateCompany = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!company) return;

    const trimmedName = editName.trim();
    const trimmedSlug = editSlug.trim();

    if (!trimmedName) {
      setActionError("Company name is required.");
      return;
    }

    if (!trimmedSlug) {
      setActionError("Company URL is required.");
      return;
    }

    setIsUpdating(true);
    setActionError("");

    try {
      const result = await updateCompany({
        id: company.id,
        name: trimmedName,
        slug: trimmedSlug,
        logoUrl: editLogoUrl.trim() || null,
        bannerUrl: editBannerUrl.trim() || null,
      });

      if (!result.success) {
        setActionError(result.message);
        return;
      }

      const updatedCompany = result.company;

      setCompany((previous) =>
        previous
          ? {
              ...previous,
              name: updatedCompany?.name!,
              slug: updatedCompany?.slug!,
              logoUrl: updatedCompany?.logoUrl!,
              bannerUrl: updatedCompany?.bannerUrl!,
            }
          : previous,
      );

      setIsEditOpen(false);

      // Update URL if the company slug changed
      if (updatedCompany?.slug !== slug) {
        router.replace(`/company/${updatedCompany?.slug}`);
      }

      router.refresh();
    } catch (err) {
      console.error("Failed to update company:", err);
      setActionError("Something went wrong while updating the company.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete company
  const handleDeleteCompany = async () => {
    if (!company) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${company.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setActionError("");

    try {
      const result = await deleteCompany(company.id);

      if (!result.success) {
        setActionError(result.message);
        return;
      }

      router.push("/companies");
      router.refresh();
    } catch (err) {
      console.error("Failed to delete company:", err);
      setActionError("Something went wrong while deleting the company.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="bg-background px-5 py-8 text-foreground transition-colors duration-200 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Back */}
        <Link
          href="/companies"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All Companies
        </Link>

        {/* Loading */}
        {isLoading && (
          <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading company...
            </div>
          </div>
        )}

        {/* Error */}
        {!isLoading && (error || !company) && (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />

            <h1 className="mt-4 text-xl font-semibold">Company not found</h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {error || "This company does not exist."}
            </p>

            <Link
              href="/companies"
              className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
            >
              Back to Companies
            </Link>
          </div>
        )}

        {/* Company Details */}
        {!isLoading && company && (
          <>
            {/* Company Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Company Workspace
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Manage your company details and settings.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openEditModal}
                  disabled={isDeleting || isUpdating}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-card-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Company
                </button>

                <button
                  type="button"
                  onClick={handleDeleteCompany}
                  disabled={isDeleting || isUpdating}
                  className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2.5 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}

                  {isDeleting ? "Deleting..." : "Delete Company"}
                </button>
              </div>
            </div>

            {/* Action Error */}
            {actionError && !isEditOpen && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {actionError}
              </div>
            )}

            {/* Company Header */}
            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              {/* Banner */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-950 sm:h-60">
                {company.bannerUrl && (
                  <img
                    src={company.bannerUrl}
                    alt={`${company.name} banner`}
                    className="h-full w-full object-cover"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Logo and Name */}
                <div className="absolute bottom-0 left-0 flex items-end gap-4 p-5 sm:p-8">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white shadow-xl sm:h-20 sm:w-20">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={`${company.name} logo`}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <Building2 className="h-9 w-9 text-slate-500" />
                    )}
                  </div>

                  <div className="min-w-0 pb-1 text-white">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">
                      Company Workspace
                    </p>

                    <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                      {company.name}
                    </h1>

                    <p className="mt-1 text-xs text-white/60">{company.slug}</p>
                  </div>
                </div>
              </div>

              {/* Company Statistics */}
              <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div>
                    <p className="text-2xl font-semibold tabular-nums">
                      {company.employeeCount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total Employees
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      {formatDate(company.createdAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Date Created
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Edit Company Modal */}
      {isEditOpen && company && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative my-auto w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl sm:p-8">
            {/* Modal Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Edit Company</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Update your company information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                disabled={isUpdating}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleUpdateCompany} className="space-y-5">
              {/* Company Name */}
              <div>
                <label className="mb-2 block text-xs font-medium">
                  Company Name
                </label>

                <input
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  placeholder="Enter company name"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="mb-2 block text-xs font-medium">
                  Company URL
                </label>

                <div className="flex items-center overflow-hidden rounded-xl border border-border bg-background">
                  <span className="whitespace-nowrap border-r border-border px-3 py-3 text-xs text-muted-foreground">
                    /company/
                  </span>

                  <input
                    type="text"
                    value={editSlug}
                    onChange={(event) => setEditSlug(event.target.value)}
                    placeholder="company-name"
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-foreground outline-none"
                    required
                  />
                </div>

                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  Changing this will also change the company's URL.
                </p>
              </div>

              {/* Logo */}
              <div>
                <label className="mb-2 block text-xs font-medium">
                  Company Logo
                </label>

                <div className="flex items-center gap-3">
                  {editLogoUrl ? (
                    <img
                      src={editLogoUrl}
                      alt="Logo preview"
                      className="h-12 w-12 rounded-lg border border-border bg-white object-contain p-1"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        handleImageUpload(event, setEditLogoUrl)
                      }
                      className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-xs file:font-medium file:text-foreground hover:file:bg-accent"
                    />
                  </div>
                </div>

                {editLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setEditLogoUrl("")}
                    className="mt-2 text-[11px] text-destructive hover:underline"
                  >
                    Remove logo
                  </button>
                )}
              </div>

              {/* Banner */}
              <div>
                <label className="mb-2 block text-xs font-medium">
                  Company Banner
                </label>

                {editBannerUrl ? (
                  <img
                    src={editBannerUrl}
                    alt="Banner preview"
                    className="mb-3 h-28 w-full rounded-xl border border-border object-cover"
                  />
                ) : (
                  <div className="mb-3 flex h-28 items-center justify-center rounded-xl border border-dashed border-border bg-muted">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleImageUpload(event, setEditBannerUrl)
                  }
                  className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-xs file:font-medium file:text-foreground hover:file:bg-accent"
                />

                {editBannerUrl && (
                  <button
                    type="button"
                    onClick={() => setEditBannerUrl("")}
                    className="mt-2 text-[11px] text-destructive hover:underline"
                  >
                    Remove banner
                  </button>
                )}
              </div>

              {/* Error */}
              {actionError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                  {actionError}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isUpdating}
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
