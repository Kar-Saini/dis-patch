"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Plus,
  Mail,
  UserRound,
  Loader2,
  RefreshCw,
  IdCard,
  ArrowUpRight,
} from "lucide-react";
import getAllEmployeesByCompany, {
  type EmployeeListItem,
} from "@/app/action/employee/getAllEmployeesByCompany";

export default function EmployeesPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const newEmployeeUrl = `/company/${slug}/employees/new`;

  const loadEmployees = useCallback(async () => {
    if (!slug) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await getAllEmployeesByCompany(slug);
      setEmployees(result);
    } catch (err) {
      console.error("Failed to load employees:", err);
      setError("Unable to load employees. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Management
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Employees
          </h1>

          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage your employee records.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void loadEmployees()}
            disabled={isLoading}
            aria-label="Refresh employees"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <Link
            href={newEmployeeUrl}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Link>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadEmployees()}
            className="shrink-0 font-medium underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {isLoading && employees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mb-3 h-7 w-7 animate-spin" />
          <p className="text-sm">Loading employees...</p>
        </div>
      )}

      {!isLoading && employees.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => (
            <Link
              key={employee.id}
              href={`/company/${slug}/employees/${employee.id}`}
              aria-label={`View ${employee.name}'s profile`}
              className="group block rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-ring/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
                  <UserRound className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-base font-semibold">
                    {employee.name}
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {employee.designation}
                  </p>
                </div>

                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>

              <div className="mt-5 space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-3">
                  <IdCard className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Employee ID
                    </p>

                    <p className="mt-0.5 truncate font-mono text-xs">
                      {employee.employee_id || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Email Address
                    </p>

                    <p className="mt-0.5 truncate text-xs">{employee.email}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && !error && employees.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <UserRound className="h-6 w-6 text-muted-foreground" />
          </div>

          <h3 className="mt-4 text-base font-semibold">No employees yet</h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Add your first employee to get started.
          </p>

          <Link
            href={newEmployeeUrl}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Link>
        </div>
      )}
    </div>
  );
}
