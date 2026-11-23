"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  UserRound,
  Pencil,
  Save,
  X,
  Loader2,
  Mail,
  Building2,
  Wallet,
  Landmark,
  CalendarDays,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";

import getEmployeeById, {
  type EmployeeDetails,
  type EmployeePayrollComponent,
} from "@/app/action/employee/getEmployeeById";

import updateEmployee from "@/app/action/employee/updateEmployee";

type EmployeeFormValues = {
  name: string;
  employee_id: string;
  designation: string;
  email: string;
  phone_num: string;
  date_of_birth: string;
  nationality: string;
  address: string;
  passport_no: string;
  visa_no: string;
  frro_reg_no: string;
  tax_residency_status: string;
  iw_ssa_status: string;
  pan_num: string;
  bank_acc_num: string;
  bank: string;
  bank_ifsc: string;
};

type FieldConfig = {
  name: keyof EmployeeFormValues;
  label: string;
  type?: string;
  multiline?: boolean;
  required?: boolean;
};

const basicFields: FieldConfig[] = [
  { name: "name", label: "Full Name", required: true },
  { name: "employee_id", label: "Employee ID" },
  { name: "designation", label: "Designation", required: true },
  { name: "email", label: "Email Address", type: "email", required: true },
  { name: "phone_num", label: "Phone Number", type: "tel", required: true },
];

const personalFields: FieldConfig[] = [
  { name: "date_of_birth", label: "Date of Birth", type: "date" },
  { name: "nationality", label: "Nationality" },
  { name: "address", label: "Residential Address", multiline: true },
  { name: "passport_no", label: "Passport Number" },
];

const visaTaxFields: FieldConfig[] = [
  { name: "visa_no", label: "Visa Number" },
  { name: "frro_reg_no", label: "FRRO Registration Number" },
  { name: "tax_residency_status", label: "Tax Residency Status" },
  { name: "iw_ssa_status", label: "IW / SSA Status" },
  { name: "pan_num", label: "PAN Number" },
];

const bankFields: FieldConfig[] = [
  { name: "bank", label: "Bank Name" },
  { name: "bank_acc_num", label: "Account Number" },
  { name: "bank_ifsc", label: "IFSC Code" },
];

function getFormValues(employee: EmployeeDetails): EmployeeFormValues {
  return {
    name: employee.name,
    employee_id: employee.employee_id ?? "",
    designation: employee.designation,
    email: employee.email,
    phone_num: employee.phone_num,
    date_of_birth: employee.date_of_birth ?? "",
    nationality: employee.nationality ?? "",
    address: employee.address ?? "",
    passport_no: employee.passport_no ?? "",
    visa_no: employee.visa_no ?? "",
    frro_reg_no: employee.frro_reg_no ?? "",
    tax_residency_status: employee.tax_residency_status ?? "",
    iw_ssa_status: employee.iw_ssa_status ?? "",
    pan_num: employee.pan_num ?? "",
    bank_acc_num: employee.bank_acc_num ?? "",
    bank: employee.bank ?? "",
    bank_ifsc: employee.bank_ifsc ?? "",
  };
}

function DetailSection({
  title,
  fields,
  values,
  isEditing,
  isSaving,
  onChange,
}: {
  title: string;
  fields: FieldConfig[];
  values: EmployeeFormValues;
  isEditing: boolean;
  isSaving: boolean;
  onChange: (name: keyof EmployeeFormValues, value: string) => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 className="mb-5 text-base font-semibold text-foreground">{title}</h2>

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.name}
            className={field.multiline ? "sm:col-span-2" : ""}
          >
            <label
              htmlFor={field.name}
              className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </label>

            {isEditing ? (
              field.multiline ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  rows={3}
                  value={values[field.name]}
                  disabled={isSaving}
                  required={field.required}
                  onChange={(event) => onChange(field.name, event.target.value)}
                  className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                />
              ) : (
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type || "text"}
                  value={values[field.name]}
                  disabled={isSaving}
                  required={field.required}
                  maxLength={field.name === "email" ? 254 : 200}
                  onChange={(event) => onChange(field.name, event.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                />
              )
            ) : (
              <p className="mt-2 min-h-5 whitespace-pre-wrap break-words text-sm font-medium text-foreground">
                {values[field.name] || (
                  <span className="font-normal text-muted-foreground">
                    Not provided
                  </span>
                )}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function formatPayrollValue(
  component: EmployeePayrollComponent,
  currency: string,
) {
  if (!component.configured || component.value === null) {
    return "Not configured";
  }

  if (component.mode === "PERCENT_OF_BASIC") {
    return `${Number(component.value)}% of Basic Pay`;
  }

  const amount = Number(component.value);

  if (!Number.isFinite(amount)) {
    return "Invalid amount";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function PayrollComponentList({
  title,
  components,
  currency,
  type,
}: {
  title: string;
  components: EmployeePayrollComponent[];
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
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {filteredComponents.length} salary components
          </p>
        </div>
      </div>

      <div className="divide-y divide-border px-5">
        {filteredComponents.map((component) => (
          <div
            key={component.code}
            className="flex items-center justify-between gap-4 py-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {component.name}
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                {component.code}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatPayrollValue(component, currency)}
              </p>

              <p
                className={`mt-1 text-[10px] font-medium ${
                  !component.configured
                    ? "text-muted-foreground"
                    : component.isEnabled
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {!component.configured
                  ? "Not configured"
                  : component.isEnabled
                    ? "Enabled"
                    : "Disabled"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PayrollSection({ employee }: { employee: EmployeeDetails }) {
  const isCompanyStandard = employee.payrollSource === "COMPANY_STANDARD";

  const isCustom = employee.payrollSource === "CUSTOM";

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Employee Payroll
        </h2>

        <p className="mt-1 text-xs text-muted-foreground">
          The payroll configuration currently applied to this employee.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Current Payroll Type
              </p>

              <h3 className="mt-1 text-base font-semibold text-foreground">
                {isCompanyStandard
                  ? "Company Standard Payroll"
                  : isCustom
                    ? "Custom Employee Payroll"
                    : "Custom Payroll Not Assigned"}
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                {isCompanyStandard
                  ? `Inherited from ${employee.companyName}`
                  : isCustom
                    ? "This employee uses an individually assigned payroll."
                    : "A custom payroll is selected but has not been assigned."}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold ${
              isCompanyStandard
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : isCustom
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {isCompanyStandard ? (
              <BadgeCheck className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}

            {isCompanyStandard
              ? "Company Default"
              : isCustom
                ? "Custom"
                : "Needs Assignment"}
          </span>
        </div>

        <div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Company
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {employee.companyName}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Payroll Configuration
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {employee.payrollName || "Default payroll not configured"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PayrollComponentList
          title="Earnings"
          components={employee.payrollComponents}
          currency={employee.currency}
          type="EARNING"
        />

        <PayrollComponentList
          title="Deductions"
          components={employee.payrollComponents}
          currency={employee.currency}
          type="DEDUCTION"
        />
      </div>

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        These are the configured payroll rules for this employee. Percentage
        components are calculated using Basic Pay. Disabled or unconfigured
        components are not included in payroll calculations.
      </p>
    </section>
  );
}

export default function EmployeePage() {
  const params = useParams<{ slug: string; id: string }>();

  const slug = params.slug;
  const id = params.id;

  const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
  const [form, setForm] = useState<EmployeeFormValues | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadEmployee = useCallback(async () => {
    if (!id || !slug) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await getEmployeeById(id, slug);

      if (!result) {
        setEmployee(null);
        setForm(null);
        setError("Employee not found.");
        return;
      }

      setEmployee(result);
      setForm(getFormValues(result));
    } catch (err) {
      console.error("Failed to load employee:", err);
      setError("Unable to load employee details.");
    } finally {
      setIsLoading(false);
    }
  }, [id, slug]);

  useEffect(() => {
    void loadEmployee();
  }, [loadEmployee]);

  const handleChange = (name: keyof EmployeeFormValues, value: string) => {
    setForm((previous) =>
      previous
        ? {
            ...previous,
            [name]: value,
          }
        : previous,
    );

    setSuccess("");
    setError("");
  };

  const handleEdit = () => {
    if (!employee) return;

    setForm(getFormValues(employee));
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    if (employee) {
      setForm(getFormValues(employee));
    }

    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!employee || !form) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await updateEmployee(slug, {
        id: employee.id,
        ...form,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setEmployee((previous) =>
        previous
          ? {
              ...previous,
              ...form,
              date_of_birth: form.date_of_birth || null,
            }
          : previous,
      );

      setIsEditing(false);
      setSuccess(result.message);
    } catch (err) {
      console.error("Failed to save employee:", err);
      setError("Unable to save employee details.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading employee...
        </div>
      </main>
    );
  }

  if (!employee || !form) {
    return (
      <main className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <UserRound className="h-10 w-10 text-muted-foreground" />

        <h2 className="mt-4 text-lg font-semibold">Employee not found</h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {error || "This employee does not exist."}
        </p>

        <Link
          href={`/company/${slug}/employees`}
          className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
        >
          Back to Employees
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 pb-12">
      <Link
        href={`/company/${employee.companySlug}/employees`}
        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Employees
      </Link>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
              <UserRound className="h-7 w-7 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <h1 className="break-words text-xl font-semibold tracking-tight text-foreground">
                {employee.name}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                {employee.designation}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {employee.email}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {employee.companyName}
                </span>
              </div>
            </div>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Pencil className="h-4 w-4" />
              Edit Employee
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>

              <button
                type="submit"
                form="employee-edit-form"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
        >
          {success}
        </div>
      )}

      <form id="employee-edit-form" onSubmit={handleSave} className="space-y-5">
        <DetailSection
          title="Basic Information"
          fields={basicFields}
          values={form}
          isEditing={isEditing}
          isSaving={isSaving}
          onChange={handleChange}
        />

        <DetailSection
          title="Personal Information"
          fields={personalFields}
          values={form}
          isEditing={isEditing}
          isSaving={isSaving}
          onChange={handleChange}
        />

        <DetailSection
          title="Visa and Tax Information"
          fields={visaTaxFields}
          values={form}
          isEditing={isEditing}
          isSaving={isSaving}
          onChange={handleChange}
        />

        <DetailSection
          title="Bank Information"
          fields={bankFields}
          values={form}
          isEditing={isEditing}
          isSaving={isSaving}
          onChange={handleChange}
        />
      </form>

      <PayrollSection employee={employee} />

      {!isEditing && (
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />

              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Created
                </p>

                <p className="mt-1 text-xs font-medium text-foreground">
                  {new Date(employee.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />

              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Last Updated
                </p>

                <p className="mt-1 text-xs font-medium text-foreground">
                  {new Date(employee.updatedAt).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
