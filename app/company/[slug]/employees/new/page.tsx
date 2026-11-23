import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/app/action/company/getCompanyBySlug";
import addEmployee from "@/app/action/employee/addEmployee";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        maxLength={type === "email" ? 254 : 200}
        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
      />
    </div>
  );
}

function TextAreaField({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}
      </label>

      <textarea
        id={name}
        name={name}
        rows={3}
        maxLength={1000}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className="w-full resize-y rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
      />
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>

        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default async function NewEmployeePage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const result = await getCompanyBySlug(slug);

  if (!result.success) {
    notFound();
  }

  const company = result.company;
  const createEmployee = addEmployee.bind(null, company.slug);

  return (
    <main className="mx-auto max-w-5xl space-y-6 pb-12">
      <div>
        <Link
          href={`/company/${company.slug}/employees`}
          className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          ← Back to Employees
        </Link>

        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Employee Management
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Add New Employee
          </h1>

          <p className="mt-1.5 text-sm text-muted-foreground">
            Create an employee record for your company.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Company
          </p>

          <p className="mt-1 text-base font-semibold text-foreground">
            {company.name}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            /company/{company.slug}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
          <p className="text-xs font-medium text-foreground">
            Company Standard Payroll
          </p>

          <p className="mt-1 text-[10px] text-muted-foreground">
            This employee will use the company's default payroll.
          </p>
        </div>
      </div>

      {query.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
        >
          {query.error}
        </div>
      )}

      <form action={createEmployee} className="space-y-5">
        <Section
          title="Basic Information"
          description="Enter the employee's primary details."
        >
          <Field
            label="Full Name"
            name="name"
            required
            placeholder="Employee full name"
          />

          <Field label="Employee ID" name="employee_id" placeholder="EMP-001" />

          <Field
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="employee@example.com"
          />

          <Field
            label="Designation"
            name="designation"
            required
            placeholder="Software Engineer"
          />

          <Field
            label="Phone Number"
            name="phone_num"
            required
            placeholder="+91 9876543210"
          />
        </Section>

        <Section
          title="Personal Information"
          description="Optional personal and identification details."
        >
          <Field label="Date of Birth" name="date_of_birth" type="date" />

          <Field label="Nationality" name="nationality" placeholder="Indian" />

          <div className="sm:col-span-2">
            <TextAreaField
              label="Residential Address"
              name="address"
              placeholder="Enter complete residential address"
            />
          </div>

          <Field
            label="Passport Number"
            name="passport_no"
            placeholder="Passport number"
          />
        </Section>

        <Section
          title="Visa and Tax Information"
          description="Optional international employment and tax details."
        >
          <Field label="Visa Number" name="visa_no" />

          <Field label="FRRO Registration Number" name="frro_reg_no" />

          <Field label="Tax Residency Status" name="tax_residency_status" />

          <Field label="IW / SSA Status" name="iw_ssa_status" />

          <Field label="PAN Number" name="pan_num" placeholder="ABCDE1234F" />
        </Section>

        <Section
          title="Bank Information"
          description="Optional bank details for salary payments."
        >
          <Field label="Bank Name" name="bank" placeholder="Bank name" />

          <Field
            label="Account Number"
            name="bank_acc_num"
            placeholder="Bank account number"
          />

          <Field label="IFSC Code" name="bank_ifsc" placeholder="ABCD0123456" />
        </Section>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Link
            href={`/company/${company.slug}/employees`}
            className="flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Create Employee
          </button>
        </div>
      </form>
    </main>
  );
}
