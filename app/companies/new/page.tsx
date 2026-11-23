"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ImagePlus,
  Upload,
  X,
  Loader2,
  FileText,
  Wallet,
  Landmark,
  Settings2,
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { createCompany } from "@/app/action/company/createCompany";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/20";

const labelClass = "mb-2 block text-xs font-semibold text-foreground";

type PayrollFormState = {
  basic: string;
  hra: string;
  specialAllowance: string;
  incomeTax: string;
  pf: string;
  esi: string;
  cess: string;
};

const initialPayroll: PayrollFormState = {
  basic: "",
  hra: "",
  specialAllowance: "",
  incomeTax: "",
  pf: "",
  esi: "",
  cess: "",
};

const payrollDefinitions = [
  {
    code: "BASIC_PAY",
    name: "Basic Pay",
    type: "EARNING" as const,
    field: "basic",
    sortOrder: 0,
  },
  {
    code: "HRA",
    name: "House Rent Allowance",
    type: "EARNING" as const,
    field: "hra",
    sortOrder: 1,
  },
  {
    code: "SPECIAL_ALLOWANCE",
    name: "Special Allowance",
    type: "EARNING" as const,
    field: "specialAllowance",
    sortOrder: 2,
  },
  {
    code: "TDS",
    name: "Income Tax / TDS",
    type: "DEDUCTION" as const,
    field: "incomeTax",
    sortOrder: 3,
  },
  {
    code: "PF",
    name: "Provident Fund",
    type: "DEDUCTION" as const,
    field: "pf",
    sortOrder: 4,
  },
  {
    code: "ESI",
    name: "Employee State Insurance",
    type: "DEDUCTION" as const,
    field: "esi",
    sortOrder: 5,
  },
  {
    code: "CESS",
    name: "Health & Education Cess",
    type: "DEDUCTION" as const,
    field: "cess",
    sortOrder: 6,
  },
] as const;

function generateSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildPayrollComponents(payroll: PayrollFormState) {
  return payrollDefinitions
    .filter((component) => payroll[component.field].trim() !== "")
    .map((component) => ({
      code: component.code,
      name: component.name,
      type: component.type,
      mode: "FIXED_AMOUNT" as const,
      value: Number(payroll[component.field]),
      isEnabled: true,
      sortOrder: component.sortOrder,
    }));
}

function PageHeader() {
  return (
    <header className="space-y-5">
      <Link
        href="/companies"
        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Companies
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card">
              <Building2 className="h-5 w-5 text-foreground" />
            </div>

            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Company Management
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Create Company
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Set up your company profile and default payroll configuration.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          New workspace
        </div>
      </div>
    </header>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-6 py-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>

      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
  step,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  min?: string;
  max?: string;
  step?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        className={inputClass}
      />
    </div>
  );
}

function CompanyInformationSection({
  companyName,
  setCompanyName,
  address,
  setAddress,
  employerTan,
  setEmployerTan,
  slug,
}: {
  companyName: string;
  setCompanyName: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  employerTan: string;
  setEmployerTan: (value: string) => void;
  slug: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <SectionHeader
        icon={Building2}
        title="Company Information"
        description="Basic details and company identity."
      />

      <div className="space-y-6 p-6">
        <div>
          <label className={labelClass}>
            Company Name <span className="text-destructive">*</span>
            <span className="ml-2 text-[10px] font-normal text-muted-foreground">
              Required
            </span>
          </label>

          <input
            type="text"
            required
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Enter registered company name"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Company URL</label>

          <div className="flex overflow-hidden rounded-xl border border-border bg-muted/40">
            <div className="flex items-center border-r border-border px-4 text-xs text-muted-foreground">
              /company/
            </div>

            <div className="min-w-0 flex-1 px-4 py-3 text-sm text-foreground">
              {slug || "company-name"}
            </div>
          </div>

          <p className="mt-2 text-[10px] text-muted-foreground">
            Generated automatically from the company name.
          </p>
        </div>

        <div>
          <label className={labelClass}>Registered Address</label>

          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="House number, street, city, state, PIN code..."
            rows={3}
            className={`${inputClass} resize-y`}
          />

          <p className="mt-2 text-[10px] text-muted-foreground">
            Used for company records and payslip letterheads.
          </p>
        </div>

        <div>
          <TextField
            label="Employer's TAN"
            value={employerTan}
            onChange={(value) => setEmployerTan(value.toUpperCase())}
            placeholder="Enter employer TAN"
            maxLength={10}
          />

          <p className="mt-2 text-[10px] text-muted-foreground">
            Employer tax deduction account number displayed in the payslip.
          </p>
        </div>
      </div>
    </section>
  );
}

function BannerSection({
  companyName,
  bannerPreview,
  bannerFileName,
  onUpload,
  onRemove,
}: {
  companyName: string;
  bannerPreview: string;
  bannerFileName: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <SectionHeader
        icon={ImagePlus}
        title="Company Branding"
        description="Customize the company payslip letterhead."
      />

      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-semibold">
            Payslip Banner
            <span className="ml-2 font-normal text-muted-foreground">
              Optional
            </span>
          </label>

          {bannerPreview && (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
            >
              <X className="h-3 w-3" />
              Remove
            </button>
          )}
        </div>

        <div className="relative flex aspect-[797/120] min-h-[110px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
          {bannerPreview ? (
            <>
              <img
                src={bannerPreview}
                alt="Company banner preview"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/10" />

              <h3 className="relative z-10 max-w-[90%] truncate px-5 text-center text-lg font-bold uppercase tracking-wide text-white sm:text-2xl">
                {companyName || "Company Name"}
              </h3>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImagePlus className="h-7 w-7" />
              <p className="text-xs">
                Your company banner preview will appear here
              </p>
            </div>
          )}
        </div>

        <label className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-5 py-7 text-center transition hover:bg-muted">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted transition group-hover:scale-105">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="text-xs font-semibold">
            {bannerPreview ? "Replace Banner" : "Upload Company Banner"}
          </p>

          <p className="mt-1 text-[10px] text-muted-foreground">
            PNG, JPG or WEBP · Maximum 5MB
          </p>

          <p className="mt-1 text-[10px] text-muted-foreground">
            Recommended proportions: 797 × 120 px
          </p>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onUpload}
          />
        </label>

        {bannerFileName && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <ImagePlus className="h-4 w-4 text-emerald-500" />
            <span className="truncate text-xs text-muted-foreground">
              {bannerFileName}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function PayrollInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextField
      label={label}
      type="number"
      min="0"
      step="0.01"
      value={value}
      onChange={onChange}
      placeholder="0.00"
    />
  );
}

function PayrollSection({
  payroll,
  onChange,
}: {
  payroll: PayrollFormState;
  onChange: (field: keyof PayrollFormState, value: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <SectionHeader
        icon={Wallet}
        title="Default Payroll Configuration"
        description="Default earnings and deduction values for this company."
      />

      <div className="space-y-7 p-6">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Settings2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

            <p className="text-xs leading-relaxed text-muted-foreground">
              These values are optional company defaults. They can be overridden
              for individual employees. Leave a field empty when the value will
              be configured individually.
            </p>
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Earnings
            </h3>
            <span className="text-[10px] text-muted-foreground">
              Optional · INR
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <PayrollInput
              label="Basic Pay"
              value={payroll.basic}
              onChange={(value) => onChange("basic", value)}
            />

            <PayrollInput
              label="House Rent Allowance (HRA)"
              value={payroll.hra}
              onChange={(value) => onChange("hra", value)}
            />

            <PayrollInput
              label="Special Allowance"
              value={payroll.specialAllowance}
              onChange={(value) => onChange("specialAllowance", value)}
            />
          </div>
        </div>

        <div className="border-t border-border" />

        <div>
          <div className="mb-4 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Deductions
            </h3>
            <span className="text-[10px] text-muted-foreground">
              Optional · INR
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <PayrollInput
              label="Income Tax / TDS"
              value={payroll.incomeTax}
              onChange={(value) => onChange("incomeTax", value)}
            />

            <PayrollInput
              label="Provident Fund (PF)"
              value={payroll.pf}
              onChange={(value) => onChange("pf", value)}
            />

            <PayrollInput
              label="Employee State Insurance (ESI)"
              value={payroll.esi}
              onChange={(value) => onChange("esi", value)}
            />

            <PayrollInput
              label="Health & Education Cess"
              value={payroll.cess}
              onChange={(value) => onChange("cess", value)}
            />
          </div>
        </div>

        <div className="border-t border-border" />

        <div>
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Attendance & Salary Basis
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
}

function CreationSummary({
  companyName,
  slug,
  bannerPreview,
  address,
  employerTan,
  payroll,
}: {
  companyName: string;
  slug: string;
  bannerPreview: string;
  address: string;
  employerTan: string;
  payroll: PayrollFormState;
}) {
  const configuredComponents = payrollDefinitions.filter(
    (component) => payroll[component.field].trim() !== "",
  ).length;

  const items = [
    ["Company Name", companyName.trim() || "Not entered"],
    ["Company URL", slug ? `/company/${slug}` : "Generated automatically"],
    ["Banner", bannerPreview ? "Uploaded" : "Not uploaded"],
    ["Address", address.trim() ? "Provided" : "Not provided"],
    ["Employer TAN", employerTan.trim() ? "Provided" : "Not provided"],
    ["Payroll Defaults", `${configuredComponents} values configured`],
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Creation Summary</h2>
      </div>

      <div className="space-y-3 text-xs">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FormError({ error }: { error: string }) {
  if (!error) return null;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      <X className="mt-0.5 h-4 w-4 shrink-0" />
      {error}
    </div>
  );
}

function FormFooter({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="flex flex-col-reverse justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
      <Link
        href="/companies"
        className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        Cancel
      </Link>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating Company...
          </>
        ) : (
          <>
            Create Company
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}

function CompanyCreatePageContent() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [employerTan, setEmployerTan] = useState("");

  const [bannerPreview, setBannerPreview] = useState("");
  const [bannerFileName, setBannerFileName] = useState("");

  const [payroll, setPayroll] = useState<PayrollFormState>(initialPayroll);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const slug = generateSlug(companyName);

  const handlePayrollChange = (
    field: keyof PayrollFormState,
    value: string,
  ) => {
    setPayroll((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleBannerUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Please select a PNG, JPG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Banner image must be smaller than 5MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBannerPreview(reader.result);
        setBannerFileName(file.name);
      }
    };

    reader.onerror = () => {
      setError("Unable to read the banner image.");
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveBanner = () => {
    setBannerPreview("");
    setBannerFileName("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }

    if (!slug) {
      setError("Please enter a valid company name.");
      return;
    }

    const payrollValues = payrollDefinitions.map(
      (component) => payroll[component.field],
    );

    if (
      payrollValues.some(
        (value) =>
          value.trim() !== "" &&
          (!Number.isFinite(Number(value)) || Number(value) < 0),
      )
    ) {
      setError("Payroll values must be valid non-negative numbers.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createCompany({
        name: companyName.trim(),
        slug,
        bannerUrl: bannerPreview || null,
        registeredAddress: address.trim() || null,
        employerTan: employerTan.trim().toUpperCase() || null,
        payrollComponents: buildPayrollComponents(payroll),
      });

      if (!result.success) {
        setError(result.message || "Failed to create company.");
        return;
      }

      router.replace(`/companies`);
      router.refresh();
    } catch (err) {
      console.error("Company creation error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the company.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground transition-colors sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <PageHeader />

        <form onSubmit={handleSubmit} className="space-y-7">
          <CompanyInformationSection
            companyName={companyName}
            setCompanyName={setCompanyName}
            address={address}
            setAddress={setAddress}
            employerTan={employerTan}
            setEmployerTan={setEmployerTan}
            slug={slug}
          />

          <BannerSection
            companyName={companyName}
            bannerPreview={bannerPreview}
            bannerFileName={bannerFileName}
            onUpload={handleBannerUpload}
            onRemove={handleRemoveBanner}
          />

          <PayrollSection payroll={payroll} onChange={handlePayrollChange} />

          <CreationSummary
            companyName={companyName}
            slug={slug}
            bannerPreview={bannerPreview}
            address={address}
            employerTan={employerTan}
            payroll={payroll}
          />

          <FormError error={error} />

          <FormFooter isLoading={isLoading} />
        </form>
      </div>
    </main>
  );
}

export default function CompanyCreatePage() {
  return (
    <AuthGuard>
      <CompanyCreatePageContent />
    </AuthGuard>
  );
}
