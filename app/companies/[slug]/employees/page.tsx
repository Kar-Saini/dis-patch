"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Mail,
  UserRound,
  Loader2,
  RefreshCw,
  IdCard,
} from "lucide-react";

import { EmployeeForm } from "@/components/EmployeeForm";
import getAllEmployees from "@/app/action/employee/getAllEmployeesByCompany";
import type { Employee } from "@prisma/client";
import getAllEmployeesByCompany from "@/app/action/employee/getAllEmployeesByCompany";
import { useParams } from "next/navigation";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  // Load employees
  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await getAllEmployeesByCompany(slug);

      if (Array.isArray(result)) {
        setEmployees(result);
      } else {
        setError(
          typeof result === "string" ? result : "Failed to load employees.",
        );
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
      setError("Unable to load employees. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  // Refresh employee list after form closes
  const handleFormClose = () => {
    setIsFormOpen(false);
    void loadEmployees();
  };

  return (
    <div className="space-y-6 text-foreground">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Management
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Employees
          </h1>

          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage your employee records.
          </p>
        </div>

        <div className="flex gap-3">
          {/* Refresh */}
          <button
            type="button"
            onClick={() => void loadEmployees()}
            disabled={isLoading}
            aria-label="Refresh employees"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground transition hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          {/* Add Employee */}
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Error */}
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

      {/* Loading */}
      {isLoading && employees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mb-3 h-7 w-7 animate-spin" />
          <p className="text-sm">Loading employees...</p>
        </div>
      )}

      {/* Employee Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="group rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-all duration-200 hover:border-ring/50 hover:shadow-md"
            >
              {/* Employee Header */}
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
                  <UserRound className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Name and Designation */}
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-base font-semibold text-card-foreground">
                    {employee.name}
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {employee.designation}
                  </p>
                </div>
              </div>

              {/* Employee Details */}
              <div className="mt-5 space-y-3 border-t border-border pt-4">
                {/* Employee ID */}
                <div className="flex items-center gap-3">
                  <IdCard className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Employee ID
                    </p>

                    <p className="mt-0.5 truncate font-mono text-xs text-foreground">
                      {employee.employee_id || "Not provided"}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Email Address
                    </p>

                    <p className="mt-0.5 truncate text-xs text-foreground">
                      {employee.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && employees.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <UserRound className="h-6 w-6 text-muted-foreground" />
          </div>

          <h3 className="mt-4 text-base font-semibold text-foreground">
            No employees yet
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Add your first employee to get started.
          </p>

          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </button>
        </div>
      )}

      {/* Add Employee Form */}
      <EmployeeForm isOpen={isFormOpen} onClose={handleFormClose} />
    </div>
  );
}
