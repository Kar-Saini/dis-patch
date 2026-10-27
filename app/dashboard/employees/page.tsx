"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Mail,
  Calendar,
  Trash2,
  Phone,
  CreditCard,
  UserRound,
  Building2,
  Globe,
  BadgeCheck,
  FileText,
  IdCard,
  Loader2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

import { EmployeeForm } from "@/components/EmployeeForm";
import getAllEmployees from "@/app/action/getAllEmployees";
import type { Employee } from "@prisma/client";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(
    new Set(),
  );

  // Load employees from the database
  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await getAllEmployees();

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

  // Refresh the list when the form closes after saving
  const handleFormClose = () => {
    setIsFormOpen(false);
    void loadEmployees();
  };

  // Removes the employee from the current view only.
  // This does not delete the record from the database.
  const handleDeleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((employee) => employee.id !== id));
  };

  const toggleEmployee = (id: string) => {
    setExpandedEmployees((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage employee information and bank details.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void loadEmployees()}
            disabled={isLoading}
            aria-label="Refresh employees"
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-100 md:w-auto"
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
          className="flex items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadEmployees()}
            className="shrink-0 font-medium text-white hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && employees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Loader2 className="mb-3 h-7 w-7 animate-spin" />
          <p className="text-sm">Loading employees...</p>
        </div>
      )}

      {/* Employee Cards */}
      {!isLoading || employees.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => {
            const isExpanded = expandedEmployees.has(employee.id);

            return (
              <div
                key={employee.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                {/* Compact Employee Summary */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleEmployee(employee.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? "Hide" : "Show"} details for ${employee.name}`}
                    className="flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                      <UserRound className="h-5 w-5 text-gray-300" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-lg font-semibold text-white">
                        {employee.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-400">
                        {employee.designation}
                      </p>

                      <p className="mt-2 text-xs text-gray-500">Employee ID</p>

                      <p className="mt-0.5 break-all font-mono text-sm text-gray-200">
                        {employee.employee_id || "Not provided"}
                      </p>
                    </div>

                    <ChevronDown
                      className={`mt-1 h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteEmployee(employee.id)}
                    title="Remove from current view"
                    aria-label={`Remove ${employee.name} from current view`}
                    className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Expandable Employee Details */}
                {isExpanded && (
                  <div>
                    {/* Employee Information */}
                    <SectionTitle
                      icon={<UserRound className="h-4 w-4" />}
                      title="Employee Information"
                    />

                    <div className="mt-3 space-y-3">
                      <InfoRow
                        icon={<Mail />}
                        label="Email"
                        value={employee.email}
                      />

                      <InfoRow
                        icon={<Phone />}
                        label="Phone"
                        value={employee.phone_num}
                      />

                      <InfoRow
                        icon={<Calendar />}
                        label="Date of Joining"
                        value={formatDate(employee.date_of_joining)}
                      />

                      <InfoRow
                        icon={<Calendar />}
                        label="Date of Birth"
                        value={formatDate(employee.date_of_birth)}
                      />

                      <InfoRow
                        icon={<Globe />}
                        label="Nationality"
                        value={employee.nationality}
                      />

                      <InfoRow
                        icon={<IdCard />}
                        label="Passport"
                        value={employee.passport_no}
                      />

                      <InfoRow
                        icon={<FileText />}
                        label="Visa Number"
                        value={employee.visa_no}
                      />

                      <InfoRow
                        icon={<FileText />}
                        label="FRRO Registration"
                        value={employee.frro_reg_no}
                      />

                      <InfoRow
                        icon={<BadgeCheck />}
                        label="Tax Residency"
                        value={employee.tax_residency_status}
                      />

                      <InfoRow
                        icon={<FileText />}
                        label="IW / SSA Status"
                        value={employee.iw_ssa_status}
                      />
                    </div>

                    {/* Bank Details */}
                    <SectionTitle
                      icon={<Building2 className="h-4 w-4" />}
                      title="Bank Details"
                    />

                    <div className="mt-3 space-y-3">
                      <InfoRow
                        icon={<Building2 />}
                        label="Bank Name"
                        value={employee.bank}
                      />

                      <InfoRow
                        icon={<CreditCard />}
                        label="Account Number"
                        value={maskAccountNumber(employee.bank_acc_num)}
                      />

                      <InfoRow
                        icon={<FileText />}
                        label="IFSC Code"
                        value={employee.bank_ifsc}
                      />

                      <InfoRow
                        icon={<IdCard />}
                        label="PAN Number"
                        value={employee.pan_num}
                      />

                      <InfoRow
                        icon={<FileText />}
                        label="Employer TAN"
                        value={employee.employer_tan}
                      />
                    </div>

                    {/* Footer */}
                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-xs text-gray-500">
                        Created {formatDate(employee.created_at)}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          employee.email_verified
                            ? "bg-green-500/10 text-green-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {employee.email_verified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Empty State */}
      {!isLoading && !error && employees.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 py-16 text-center">
          <UserRound className="mx-auto mb-3 h-10 w-10 text-gray-600" />

          <h3 className="text-base font-medium text-white">No employees yet</h3>

          <p className="mt-1 text-sm text-gray-400">
            Add your first employee to get started.
          </p>

          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200"
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

/* Section Heading */
function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="mt-6 flex items-center gap-2 border-b border-white/10 pb-2">
      <span className="text-gray-400">{icon}</span>

      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
        {title}
      </h4>
    </div>
  );
}

/* Information Row */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactElement;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 shrink-0 text-gray-500">{icon}</span>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>

        <p className="mt-0.5 break-words text-sm text-gray-200">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

/* Format Date */
function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* Mask Bank Account Number */
function maskAccountNumber(value: string): string {
  if (!value) return "Not provided";

  if (value.length <= 4) {
    return value;
  }

  return `****${value.slice(-4)}`;
}
