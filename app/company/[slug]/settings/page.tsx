"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  ImagePlus,
  Loader2,
  Save,
  Settings,
  Trash2,
  Upload,
  Users,
  Wallet,
  Landmark,
  Calculator,
  X,
  IndianRupee,
} from "lucide-react";

import {
  getCompanyBySlug,
  type CompanyDetails,
} from "@/app/action/company/getCompanyBySlug";
import { updateCompany } from "@/app/action/company/updateCompany";
import { deleteCompany } from "@/app/action/company/deleteCompany";

type PayrollMode = "FIXED_AMOUNT" | "PERCENT_OF_BASIC";

type PayrollCode =
  | "BASIC_PAY"
  | "HRA"
  | "SPECIAL_ALLOWANCE"
  | "PF"
  | "TDS"
  | "ESI"
  | "SPECIAL_ALLOWANCE_ARREARS"
  | "PERFORMANCE_BONUS"
  | "BASIC_ARREARS";

type PayrollValue = {
  enabled: boolean;
  mode: PayrollMode;
  value: string;
};

type PayrollState = Record<PayrollCode, PayrollValue>;

type PayrollDefinition = {
  code: PayrollCode;
  name: string;
  type: "EARNING" | "DEDUCTION";
  defaultMode: PayrollMode;
  allowPercentage: boolean;
};

const payrollDefinitions: PayrollDefinition[] = [
  {
    code: "BASIC_PAY",
    name: "Basic Pay",
    type: "EARNING",
    defaultMode: "FIXED_AMOUNT",
    allowPercentage: false,
  },
  {
    code: "HRA",
    name: "House Rent Allowance",
    type: "EARNING",
    defaultMode: "PERCENT_OF_BASIC",
    allowPercentage: true,
  },
  {
    code: "SPECIAL_ALLOWANCE",
    name: "Special Allowance",
    type: "EARNING",
    defaultMode: "PERCENT_OF_BASIC",
    allowPercentage: true,
  },
  {
    code: "PF",
    name: "Provident Fund",
    type: "DEDUCTION",
    defaultMode: "PERCENT_OF_BASIC",
    allowPercentage: true,
  },
  {
    code: "TDS",
    name: "TDS",
    type: "DEDUCTION",
    defaultMode: "FIXED_AMOUNT",
    allowPercentage: true,
  },
  {
    code: "ESI",
    name: "ESI",
    type: "DEDUCTION",
    defaultMode: "PERCENT_OF_BASIC",
    allowPercentage: true,
  },
  {
    code: "SPECIAL_ALLOWANCE_ARREARS",
    name: "Special Allowance Arrears",
    type: "EARNING",
    defaultMode: "FIXED_AMOUNT",
    allowPercentage: false,
  },
  {
    code: "PERFORMANCE_BONUS",
    name: "Performance Bonus",
    type: "EARNING",
    defaultMode: "FIXED_AMOUNT",
    allowPercentage: false,
  },
  {
    code: "BASIC_ARREARS",
    name: "Basic Arrears",
    type: "EARNING",
    defaultMode: "FIXED_AMOUNT",
    allowPercentage: false,
  },
];

const initialPayroll: PayrollState = {
  BASIC_PAY: { enabled: false, mode: "FIXED_AMOUNT", value: "" },
  HRA: { enabled: false, mode: "PERCENT_OF_BASIC", value: "" },
  SPECIAL_ALLOWANCE: {
    enabled: false,
    mode: "PERCENT_OF_BASIC",
    value: "",
  },
  PF: { enabled: false, mode: "PERCENT_OF_BASIC", value: "" },
  TDS: { enabled: false, mode: "FIXED_AMOUNT", value: "" },
  ESI: { enabled: false, mode: "PERCENT_OF_BASIC", value: "" },
  SPECIAL_ALLOWANCE_ARREARS: {
    enabled: false,
    mode: "FIXED_AMOUNT",
    value: "",
  },
  PERFORMANCE_BONUS: {
    enabled: false,
    mode: "FIXED_AMOUNT",
    value: "",
  },
  BASIC_ARREARS: { enabled: false, mode: "FIXED_AMOUNT", value: "" },
};

const inputClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20";

function formatCurrency(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function calculatePayrollValue(item: PayrollValue, basicPay: number): number {
  if (!item.enabled || !item.value.trim()) return 0;

  const value = Number(item.value);

  if (!Number.isFinite(value) || value < 0) return 0;

  return item.mode === "PERCENT_OF_BASIC" ? (basicPay * value) / 100 : value;
}

function createPayrollState(
  components: CompanyDetails["payrollComponents"],
): PayrollState {
  const state: PayrollState = {
    ...initialPayroll,
  };

  for (const component of components) {
    const code = component.code as PayrollCode;

    if (!(code in state)) continue;

    state[code] = {
      enabled: component.isEnabled,
      mode: component.mode,
      value: component.value,
    };
  }

  return state;
}

function PageHeader({ companyName }: { companyName: string }) {
  return (
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Settings className="h-3.5 w-3.5" />
          Company Settings
        </div>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {companyName}
        </h1>

        <p className="mt-1 text-xs text-muted-foreground">
          Manage company information and payroll defaults.
        </p>
      </div>

      <Link
        href="/companies"
        className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Companies
      </Link>
    </header>
  );
}

function Feedback({ error, success }: { error: string; success: string }) {
  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function GeneralInformationCard({
  companyName,
  setCompanyName,
  companySlug,
  setCompanySlug,
  registeredAddress,
  setRegisteredAddress,
  employerTan,
  setEmployerTan,
  bannerUrl,
  onBannerUpload,
  onBannerRemove,
  isSaving,
  onSave,
}: {
  companyName: string;
  setCompanyName: (value: string) => void;
  companySlug: string;
  setCompanySlug: (value: string) => void;
  registeredAddress: string;
  setRegisteredAddress: (value: string) => void;
  employerTan: string;
  setEmployerTan: (value: string) => void;
  bannerUrl: string;
  onBannerUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onBannerRemove: () => void;
  isSaving: boolean;
  onSave: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <SectionHeading
        icon={Building2}
        title="General Information"
        description="Company details and branding."
      />

      <div className="grid gap-5 p-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-medium">Company Name</label>

          <input
            value={companyName}
            maxLength={120}
            onChange={(event) => setCompanyName(event.target.value)}
            className={inputClass}
            placeholder="Company name"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium">Company URL</label>

          <div className="flex h-10 overflow-hidden rounded-lg border border-border bg-background">
            <span className="flex items-center border-r border-border px-3 text-xs text-muted-foreground">
              /company/
            </span>

            <input
              value={companySlug}
              onChange={(event) =>
                setCompanySlug(
                  event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-")
                    .replace(/-+/g, "-"),
                )
              }
              className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
              placeholder="company-name"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium">
            Registered Address
          </label>

          <textarea
            value={registeredAddress}
            onChange={(event) => setRegisteredAddress(event.target.value)}
            rows={3}
            className={`${inputClass} h-auto resize-y py-3`}
            placeholder="Registered company address"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium">Employer TAN</label>

          <input
            value={employerTan}
            maxLength={10}
            onChange={(event) =>
              setEmployerTan(event.target.value.toUpperCase())
            }
            className={inputClass}
            placeholder="Employer TAN"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-medium">
            Company Banner
          </label>

          <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
            {bannerUrl ? (
              <div className="relative">
                <img
                  src={bannerUrl}
                  alt="Company banner"
                  className="h-32 w-full object-cover sm:h-40"
                />

                <button
                  type="button"
                  onClick={onBannerRemove}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-black/70 px-3 py-2 text-[10px] font-medium text-white hover:bg-black/90"
                >
                  <X className="h-3 w-3" />
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex h-28 flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs">No banner uploaded</span>
              </div>
            )}

            <div className="border-t border-border p-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-medium transition hover:bg-muted">
                <Upload className="h-3.5 w-3.5" />
                {bannerUrl ? "Replace Banner" : "Upload Banner"}

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onBannerUpload}
                  className="hidden"
                />
              </label>

              <p className="mt-2 text-[10px] text-muted-foreground">
                PNG, JPG or WEBP. Maximum size: 5 MB.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-border bg-muted/20 px-5 py-4">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save Company Details
        </button>
      </div>
    </section>
  );
}

function PayrollField({
  name,
  item,
  allowPercentage,
  onChange,
}: {
  name: string;
  item: PayrollValue;
  allowPercentage: boolean;
  onChange: (changes: Partial<PayrollValue>) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium">{name}</label>

        <button
          type="button"
          role="switch"
          aria-checked={item.enabled}
          onClick={() => onChange({ enabled: !item.enabled })}
          className={`relative h-5 w-9 shrink-0 rounded-full transition ${
            item.enabled ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
              item.enabled ? "left-[18px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_112px] gap-2">
        <select
          value={item.mode}
          disabled={!item.enabled || !allowPercentage}
          onChange={(event) =>
            onChange({ mode: event.target.value as PayrollMode })
          }
          className="h-9 min-w-0 rounded-md border border-border bg-card px-2 text-[11px] outline-none disabled:opacity-40"
        >
          <option value="FIXED_AMOUNT">Fixed amount</option>
          {allowPercentage && (
            <option value="PERCENT_OF_BASIC">% of Basic</option>
          )}
        </select>

        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.value}
            disabled={!item.enabled}
            onChange={(event) => onChange({ value: event.target.value })}
            placeholder="0.00"
            className="h-9 w-full rounded-md border border-border bg-card px-2 pr-7 text-right text-xs outline-none disabled:opacity-40"
          />

          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">
            {item.enabled && item.mode === "PERCENT_OF_BASIC" ? "%" : "₹"}
          </span>
        </div>
      </div>
    </div>
  );
}

function PayrollCard({
  title,
  description,
  icon: Icon,
  fields,
  payroll,
  onUpdate,
}: {
  title: string;
  description: string;
  icon: typeof Wallet;
  fields: PayrollDefinition[];
  payroll: PayrollState;
  onUpdate: (code: PayrollCode, changes: Partial<PayrollValue>) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {fields.map((field) => (
          <PayrollField
            key={field.code}
            name={field.name}
            item={payroll[field.code]}
            allowPercentage={field.allowPercentage}
            onChange={(changes) => onUpdate(field.code, changes)}
          />
        ))}
      </div>
    </section>
  );
}

function GrossSalaryCard({
  payroll,
  grossSalary,
  totalDeductions,
  netPay,
  currency,
  onUpdate,
}: {
  payroll: PayrollState;
  grossSalary: number;
  totalDeductions: number;
  netPay: number;
  currency: string;
  onUpdate: (code: PayrollCode, changes: Partial<PayrollValue>) => void;
}) {
  const basicPay = payroll.BASIC_PAY;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-foreground text-white shadow-sm dark:bg-neutral-800">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <Calculator className="h-4 w-4 text-white/80" />
        </div>

        <div>
          <h2 className="text-sm font-semibold">Gross Salary</h2>
          <p className="mt-0.5 text-[11px] text-white/55">
            Estimated salary calculation
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <label className="mb-2 block text-[11px] font-medium text-white/70">
            Basic Pay
          </label>

          <div className="flex h-10 items-center overflow-hidden rounded-lg border border-white/15 bg-white/5">
            <span className="border-r border-white/10 px-3 text-xs text-white/60">
              ₹
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={basicPay.value}
              disabled={!basicPay.enabled}
              onChange={(event) =>
                onUpdate("BASIC_PAY", { value: event.target.value })
              }
              placeholder="Enter basic pay"
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/35 disabled:opacity-50"
            />
          </div>

          <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 text-[10px] text-white/60">
            <input
              type="checkbox"
              checked={basicPay.enabled}
              onChange={(event) =>
                onUpdate("BASIC_PAY", { enabled: event.target.checked })
              }
              className="accent-white"
            />
            Include Basic Pay
          </label>
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/50">
            Estimated Gross Salary
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
            {formatCurrency(grossSalary, currency)}
          </p>
        </div>

        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">Total deductions</span>
            <span className="font-medium tabular-nums text-rose-300">
              -{formatCurrency(totalDeductions, currency)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">
              Estimated Net Pay
            </span>

            <span className="text-lg font-semibold tabular-nums text-emerald-300">
              {formatCurrency(netPay, currency)}
            </span>
          </div>
        </div>

        <p className="text-[10px] leading-5 text-white/45">
          Preview based on the configured company standard components. Actual
          payslip calculations may include attendance and monthly adjustments.
        </p>
      </div>
    </section>
  );
}

function CompanyMetadata({ company }: { company: CompanyDetails }) {
  const date = new Date(company.createdAt);

  const formattedDate = Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>

        <div>
          <h2 className="text-sm font-semibold">Company Information</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Workspace details.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Company ID
          </p>
          <p className="mt-1 break-all text-xs font-medium">{company.id}</p>
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Created On
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs font-medium">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            {formattedDate}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Employee Count
          </p>
          <p className="mt-1 text-xs font-medium">
            {company.employeeCount} Employees
          </p>
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Workspace URL
          </p>
          <p className="mt-1 break-all text-xs font-medium">
            /company/{company.slug}
          </p>
        </div>
      </div>
    </section>
  );
}

function DangerZone({
  companyName,
  isDeleting,
  disabled,
  onDelete,
}: {
  companyName: string;
  isDeleting: boolean;
  disabled: boolean;
  onDelete: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-destructive/30 bg-card">
      <div className="border-b border-destructive/20 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
            <Trash2 className="h-4 w-4 text-destructive" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-destructive">
              Delete Company
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Irreversible company action.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xs font-semibold">
            Permanently delete {companyName}
          </h3>

          <p className="mt-1 max-w-xl text-[11px] leading-5 text-muted-foreground">
            This permanently deletes the company workspace. Companies with
            associated employees or payslip records cannot be deleted.
          </p>
        </div>

        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-destructive/30 px-4 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          {isDeleting ? "Deleting..." : "Delete Company"}
        </button>
      </div>
    </section>
  );
}

function PayrollSaveButton({
  isSaving,
  onSave,
}: {
  isSaving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Save className="h-3.5 w-3.5" />
        )}
        Save Payroll Defaults
      </button>
    </div>
  );
}

export default function CompanySettingsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [employerTan, setEmployerTan] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const [payroll, setPayroll] = useState<PayrollState>(initialPayroll);

  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isSavingPayroll, setIsSavingPayroll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCompany() {
      setIsLoading(true);
      setLoadError("");

      try {
        const result = await getCompanyBySlug(slug);

        if (cancelled) return;

        if (!result.success) {
          setLoadError(result.error);
          return;
        }

        const loadedCompany = result.company;

        setCompany(loadedCompany);
        setCompanyName(loadedCompany.name);
        setCompanySlug(loadedCompany.slug);
        setRegisteredAddress(loadedCompany.registeredAddress ?? "");
        setEmployerTan(loadedCompany.employerTan ?? "");
        setBannerUrl(loadedCompany.bannerUrl ?? "");
        setPayroll(createPayrollState(loadedCompany.payrollComponents));
      } catch (error) {
        console.error("Failed to load company settings:", error);

        if (!cancelled) {
          setLoadError("Unable to load company settings.");
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
      setLoadError("Invalid company URL.");
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const updatePayroll = (code: PayrollCode, changes: Partial<PayrollValue>) => {
    setPayroll((previous) => ({
      ...previous,
      [code]: {
        ...previous[code],
        ...changes,
      },
    }));

    setSuccessMessage("");
  };

  const getAmount = (code: PayrollCode) =>
    calculatePayrollValue(payroll[code], Number(payroll.BASIC_PAY.value) || 0);

  const grossSalary = useMemo(() => {
    return (
      getAmount("BASIC_PAY") +
      getAmount("HRA") +
      getAmount("SPECIAL_ALLOWANCE") +
      getAmount("SPECIAL_ALLOWANCE_ARREARS") +
      getAmount("PERFORMANCE_BONUS") +
      getAmount("BASIC_ARREARS")
    );
  }, [payroll]);

  const totalDeductions = useMemo(
    () => getAmount("PF") + getAmount("TDS") + getAmount("ESI"),
    [payroll],
  );

  const estimatedNetPay = grossSalary - totalDeductions;

  const handleBannerUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setActionError("");

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setActionError("Please select a PNG, JPG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setActionError("Banner must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBannerUrl(reader.result);
        setSuccessMessage("");
      }
    };

    reader.onerror = () => {
      setActionError("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);
  };

  const handleSaveCompany = async () => {
    if (!company) return;

    if (!companyName.trim()) {
      setActionError("Company name is required.");
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(companySlug)) {
      setActionError("Enter a valid company URL.");
      return;
    }

    setIsSavingCompany(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const result = await updateCompany({
        id: company.id,
        name: companyName.trim(),
        slug: companySlug,
        registeredAddress: registeredAddress.trim() || null,
        employerTan: employerTan.trim().toUpperCase() || null,
        bannerUrl: bannerUrl.trim() || null,
      });

      if (!result.success) {
        setActionError(result.message);
        return;
      }

      setCompany((previous) =>
        previous
          ? {
              ...previous,
              name: companyName.trim(),
              slug: companySlug,
              registeredAddress: registeredAddress.trim() || null,
              employerTan: employerTan.trim().toUpperCase() || null,
              bannerUrl: bannerUrl.trim() || null,
            }
          : previous,
      );

      setSuccessMessage("Company details saved successfully.");

      if (companySlug !== slug) {
        router.replace(`/company/${companySlug}/settings`);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to save company:", error);
      setActionError("Unable to save company details.");
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleSavePayroll = async () => {
    if (!company) return;

    const payrollComponents = payrollDefinitions.map((definition) => ({
      code: definition.code,
      name: definition.name,
      type: definition.type,
      mode: payroll[definition.code].mode,
      value: Number(payroll[definition.code].value) || 0,
      isEnabled: payroll[definition.code].enabled,
      sortOrder: payrollDefinitions.indexOf(definition),
      notes: null,
    }));

    for (const component of payrollComponents) {
      if (
        component.isEnabled &&
        (!Number.isFinite(component.value) || component.value < 0)
      ) {
        setActionError(`Invalid value for ${component.name}.`);
        return;
      }

      if (
        component.isEnabled &&
        component.mode === "PERCENT_OF_BASIC" &&
        component.value > 10000
      ) {
        setActionError(`${component.name} percentage is too large.`);
        return;
      }
    }

    if (
      payroll.BASIC_PAY.enabled &&
      payroll.BASIC_PAY.mode !== "FIXED_AMOUNT"
    ) {
      setActionError("Basic Pay must be a fixed amount.");
      return;
    }

    setIsSavingPayroll(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const result = await updateCompany({
        id: company.id,
        payrollComponents,
      });

      if (!result.success) {
        setActionError(result.message);
        return;
      }

      const refreshed = await getCompanyBySlug(company.slug);

      if (refreshed.success) {
        setCompany(refreshed.company);
        setPayroll(createPayrollState(refreshed.company.payrollComponents));
      }

      setSuccessMessage("Company payroll defaults saved successfully.");
      router.refresh();
    } catch (error) {
      console.error("Failed to save payroll defaults:", error);
      setActionError("Unable to save payroll defaults.");
    } finally {
      setIsSavingPayroll(false);
    }
  };

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
    } catch (error) {
      console.error("Failed to delete company:", error);
      setActionError("Unable to delete company.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading company settings...
        </div>
      </main>
    );
  }

  if (loadError || !company) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
        <Building2 className="h-9 w-9 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-semibold">Unable to load settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {loadError || "Company not found."}
        </p>
        <Link
          href="/companies"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Companies
        </Link>
      </main>
    );
  }

  const earningsFields = payrollDefinitions.filter(
    (field) => field.code === "HRA" || field.code === "SPECIAL_ALLOWANCE",
  );

  const deductionFields = payrollDefinitions.filter(
    (field) =>
      field.code === "PF" || field.code === "TDS" || field.code === "ESI",
  );

  const bonusFields = payrollDefinitions.filter(
    (field) =>
      field.code === "SPECIAL_ALLOWANCE_ARREARS" ||
      field.code === "PERFORMANCE_BONUS" ||
      field.code === "BASIC_ARREARS",
  );

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader companyName={company.name} />

        <Feedback error={actionError} success={successMessage} />

        <GeneralInformationCard
          companyName={companyName}
          setCompanyName={setCompanyName}
          companySlug={companySlug}
          setCompanySlug={setCompanySlug}
          registeredAddress={registeredAddress}
          setRegisteredAddress={setRegisteredAddress}
          employerTan={employerTan}
          setEmployerTan={setEmployerTan}
          bannerUrl={bannerUrl}
          onBannerUpload={handleBannerUpload}
          onBannerRemove={() => setBannerUrl("")}
          isSaving={isSavingCompany}
          onSave={handleSaveCompany}
        />

        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-base font-semibold">
                Default Payroll Configuration
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Configure the company's default salary components.
              </p>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Used unless an employee has a custom payroll assigned.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PayrollCard
              title="Earnings & Allowances"
              description="Monthly allowances added to Basic Pay"
              icon={Wallet}
              fields={earningsFields}
              payroll={payroll}
              onUpdate={updatePayroll}
            />

            <PayrollCard
              title="Deductions"
              description="Amounts deducted from salary"
              icon={Landmark}
              fields={deductionFields}
              payroll={payroll}
              onUpdate={updatePayroll}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PayrollCard
              title="Bonus & Arrears"
              description="Additional payments and adjustments"
              icon={IndianRupee}
              fields={bonusFields}
              payroll={payroll}
              onUpdate={updatePayroll}
            />

            <GrossSalaryCard
              payroll={payroll}
              grossSalary={grossSalary}
              totalDeductions={totalDeductions}
              netPay={estimatedNetPay}
              currency={company.currency || "INR"}
              onUpdate={updatePayroll}
            />
          </div>

          <p className="text-[10px] leading-5 text-muted-foreground">
            Disabled components are not applied. Percentage-based values are
            calculated against Basic Pay. These are company defaults; an
            employee with a custom payroll assignment uses that payroll instead.
          </p>

          <PayrollSaveButton
            isSaving={isSavingPayroll}
            onSave={handleSavePayroll}
          />
        </section>

        <CompanyMetadata company={company} />

        <DangerZone
          companyName={company.name}
          isDeleting={isDeleting}
          disabled={isDeleting || isSavingCompany || isSavingPayroll}
          onDelete={handleDeleteCompany}
        />
      </div>
    </main>
  );
}
