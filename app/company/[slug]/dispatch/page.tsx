"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Users,
  Loader2,
  RefreshCw,
  UserRound,
  Mail,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";

import getAllEmployeesByCompany, {
  type EmployeeListItem,
} from "@/app/action/employee/getAllEmployeesByCompany";

import { sendSalaryEmail } from "@/app/action/sendEmail";

type AttendanceCounts = {
  workingDays: number;
  offDays: number;
  leaveDays: number;
};

type MonthAndYear = {
  month: number;
  year: number;
  monthName: string;
  totalDays: number;
};

type DispatchResponse = Awaited<ReturnType<typeof sendSalaryEmail>>;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getMonthDetails(date: Date): MonthAndYear {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return {
    month,
    year,
    monthName: MONTHS[month - 1],
    totalDays: new Date(year, month, 0).getDate(),
  };
}

function getDefaultAttendance(year: number, month: number): AttendanceCounts {
  const totalDays = new Date(year, month, 0).getDate();

  let workingDays = 0;
  let offDays = 0;

  for (let day = 1; day <= totalDays; day++) {
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    if (dayOfWeek === 0) {
      offDays++;
    } else {
      workingDays++;
    }
  }

  return {
    workingDays,
    offDays,
    leaveDays: 0,
  };
}

function getTotalAllocatedDays(counts: AttendanceCounts) {
  return counts.workingDays + counts.offDays + counts.leaveDays;
}

function normalizeCount(value: string, max: number) {
  if (value.trim() === "") return 0;

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return 0;

  return Math.min(max, Math.max(0, Math.floor(parsed)));
}

function AttendanceInput({
  label,
  value,
  onChange,
  disabled = false,
  max,
  tone,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  max: number;
  tone: "working" | "off" | "leave";
}) {
  const toneClasses = {
    working:
      "border-emerald-200 bg-emerald-50 text-emerald-800 focus:border-emerald-500 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
    off: "border-red-200 bg-red-50 text-red-800 focus:border-red-500 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300",
    leave:
      "border-amber-200 bg-amber-50 text-amber-800 focus:border-amber-500 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300",
  };

  const dotClasses = {
    working: "bg-emerald-500",
    off: "bg-red-500",
    leave: "bg-amber-400",
  };

  return (
    <label className="min-w-0 space-y-1.5">
      <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
        <span className={`h-2 w-2 rounded-full ${dotClasses[tone]}`} />
        {label}
      </span>

      <input
        type="number"
        min={0}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(normalizeCount(event.target.value, max))}
        className={`w-full rounded-lg border px-2.5 py-2 text-sm font-semibold tabular-nums outline-none transition focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60 ${toneClasses[tone]}`}
      />
    </label>
  );
}

function AttendanceSummary({
  counts,
  totalDays,
  editable,
  onChange,
}: {
  counts: AttendanceCounts;
  totalDays: number;
  editable: boolean;
  onChange?: (key: keyof AttendanceCounts, value: number) => void;
}) {
  const allocatedDays = getTotalAllocatedDays(counts);
  const isValid = allocatedDays === totalDays;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <AttendanceInput
          label="Working"
          value={counts.workingDays}
          max={totalDays}
          disabled={!editable}
          tone="working"
          onChange={(value) => onChange?.("workingDays", value)}
        />

        <AttendanceInput
          label="Off"
          value={counts.offDays}
          max={totalDays}
          disabled={!editable}
          tone="off"
          onChange={(value) => onChange?.("offDays", value)}
        />

        <AttendanceInput
          label="Leave"
          value={counts.leaveDays}
          max={totalDays}
          disabled={!editable}
          tone="leave"
          onChange={(value) => onChange?.("leaveDays", value)}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <p
          className={`text-[10px] ${
            isValid
              ? "text-muted-foreground"
              : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {allocatedDays} of {totalDays} days allocated
        </p>

        {!isValid && (
          <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
            {allocatedDays > totalDays
              ? `${allocatedDays - totalDays} days over`
              : `${totalDays - allocatedDays} days remaining`}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DispatchPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [monthAndYear] = useState<MonthAndYear>(() =>
    getMonthDetails(new Date()),
  );

  const defaultAttendance = useMemo(
    () => getDefaultAttendance(monthAndYear.year, monthAndYear.month),
    [monthAndYear],
  );

  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set(),
  );

  const [sharedAttendance, setSharedAttendance] =
    useState<AttendanceCounts>(defaultAttendance);

  const [employeeAttendance, setEmployeeAttendance] = useState<
    Record<string, AttendanceCounts>
  >({});

  const [sameForAll, setSameForAll] = useState(true);
  const [subject, setSubject] = useState(
    `Salary Slip - ${monthAndYear.monthName} ${monthAndYear.year}`,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dispatchResult, setDispatchResult] = useState<DispatchResponse | null>(
    null,
  );

  const totalDays = monthAndYear.totalDays;

  const loadEmployees = useCallback(async () => {
    if (!slug) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await getAllEmployeesByCompany(slug);

      setEmployees(result);

      setEmployeeAttendance((previous) => {
        const next = { ...previous };

        for (const employee of result) {
          if (!next[employee.id]) {
            next[employee.id] = { ...defaultAttendance };
          }
        }

        return next;
      });

      setSelectedEmployees((previous) => {
        const validIds = new Set(result.map((employee) => employee.id));

        return new Set([...previous].filter((id) => validIds.has(id)));
      });
    } catch (err) {
      console.error("Failed to load employees:", err);
      setError("Unable to load employees. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [slug, defaultAttendance]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const invalidateDispatch = () => {
    setDispatchResult(null);
    setMessage("");
    setError("");
  };

  const handleSharedAttendanceChange = (
    key: keyof AttendanceCounts,
    value: number,
  ) => {
    setSharedAttendance((previous) => ({
      ...previous,
      [key]: value,
    }));

    invalidateDispatch();
  };

  const handleEmployeeAttendanceChange = (
    employeeId: string,
    key: keyof AttendanceCounts,
    value: number,
  ) => {
    setEmployeeAttendance((previous) => ({
      ...previous,
      [employeeId]: {
        ...(previous[employeeId] ?? defaultAttendance),
        [key]: value,
      },
    }));

    invalidateDispatch();
  };

  const handleSameForAllToggle = () => {
    if (sameForAll) {
      setEmployeeAttendance((previous) => {
        const next = { ...previous };

        for (const employee of employees) {
          next[employee.id] = { ...sharedAttendance };
        }

        return next;
      });
    }

    setSameForAll((previous) => !previous);
    invalidateDispatch();
  };

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployees((previous) => {
      const next = new Set(previous);

      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }

      return next;
    });

    invalidateDispatch();
  };

  const allSelected =
    employees.length > 0 && selectedEmployees.size === employees.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(employees.map((employee) => employee.id)));
    }

    invalidateDispatch();
  };

  const getAttendanceForEmployee = (employeeId: string) => {
    if (sameForAll) {
      return sharedAttendance;
    }

    return employeeAttendance[employeeId] ?? defaultAttendance;
  };

  const selectedAttendance = useMemo(() => {
    return employees
      .filter((employee) => selectedEmployees.has(employee.id))
      .map((employee) => {
        const attendance = sameForAll
          ? sharedAttendance
          : (employeeAttendance[employee.id] ?? defaultAttendance);

        return {
          employeeId: employee.id,
          workingDays: attendance.workingDays,
          offDays: attendance.offDays,
          leaveDays: attendance.leaveDays,
        };
      });
  }, [
    employees,
    selectedEmployees,
    sameForAll,
    sharedAttendance,
    employeeAttendance,
    defaultAttendance,
  ]);

  const selectedCount = selectedEmployees.size;

  const invalidAttendance = selectedAttendance.find(
    (employee) =>
      employee.workingDays + employee.offDays + employee.leaveDays !==
      totalDays,
  );

  const handleDispatch = async () => {
    setError("");
    setMessage("");
    setDispatchResult(null);

    if (!slug) {
      setError("Company URL is missing.");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter an email subject.");
      return;
    }

    if (selectedCount === 0) {
      setError("Please select at least one employee.");
      return;
    }

    if (invalidAttendance) {
      setError(
        `Attendance for ${
          employees.find(
            (employee) => employee.id === invalidAttendance.employeeId,
          )?.name ?? "an employee"
        } must total exactly ${totalDays} days.`,
      );
      return;
    }

    const payload = {
      slug,
      month: monthAndYear.month,
      year: monthAndYear.year,
      subject: subject.trim(),
      employees: selectedAttendance.map((employee) => ({
        employeeId: employee.employeeId,
        workingDays: employee.workingDays,
        offDays: employee.offDays,
        leaveDays: employee.leaveDays,
      })),
    };

    setIsDispatching(true);

    try {
      const result = await sendSalaryEmail(payload);

      setDispatchResult(result);

      setMessage(
        `Dispatch completed: ${result.totalSent} email(s) sent and ${result.totalFailed} failed.`,
      );
    } catch (err) {
      console.error("Salary dispatch failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while dispatching salary slips.",
      );
    } finally {
      setIsDispatching(false);
    }
  };

  const monthLabel = `${monthAndYear.monthName} ${monthAndYear.year}`;

  return (
    <div className="w-full space-y-6 text-foreground">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Payslip
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Dispatch Salary Slips
        </h1>

        <p className="mt-1.5 text-sm text-muted-foreground">
          Configure monthly attendance and send salary slips to employees.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {message && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/[0.07]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            {message}
          </p>
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Payroll Month
                </p>

                <h2 className="mt-1 text-lg font-semibold">{monthLabel}</h2>
              </div>
            </div>

            <span className="w-fit rounded-full border border-border bg-muted px-3 py-1.5 text-[10px] font-semibold text-muted-foreground">
              Current Month
            </span>
          </div>

          <div className="border-t border-border pt-5">
            <label
              htmlFor="subject"
              className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
            >
              Email Subject
            </label>

            <input
              id="subject"
              type="text"
              value={subject}
              disabled={isDispatching}
              onChange={(event) => {
                setSubject(event.target.value);
                invalidateDispatch();
              }}
              placeholder={`Salary Slip - ${monthLabel}`}
              maxLength={200}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-60"
            />

            <p className="mt-2 text-[10px] text-muted-foreground">
              Automatically generated for the current month. You can edit the
              subject before dispatch.
            </p>
          </div>

          <div className="border-t border-border pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold">
                    Same attendance for all employees
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Apply one set of working days, off days and leaves to
                    everyone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={sameForAll}
                disabled={isDispatching}
                onClick={handleSameForAllToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
                  sameForAll ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    sameForAll ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {sameForAll && (
              <div className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
                <div className="mb-4">
                  <h4 className="text-xs font-semibold">
                    Shared Monthly Attendance
                  </h4>

                  <p className="mt-1 text-[10px] text-muted-foreground">
                    These values will be applied to every employee. Sunday is
                    counted as the default weekly off.
                  </p>
                </div>

                <AttendanceSummary
                  counts={sharedAttendance}
                  totalDays={totalDays}
                  editable={!isDispatching}
                  onChange={handleSharedAttendanceChange}
                />
              </div>
            )}

            {!sameForAll && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/20 dark:bg-blue-500/10">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Individual attendance mode is enabled. Configure each
                  employee's working, off and leave days below.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Employee List</h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Select employees who should receive a salary slip.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-muted px-3 py-1.5 text-[10px] font-semibold text-muted-foreground">
              {selectedCount} of {employees.length} selected
            </span>

            <button
              type="button"
              onClick={() => void loadEmployees()}
              disabled={isLoading || isDispatching}
              aria-label="Refresh employees"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
              disabled={employees.length === 0 || isDispatching}
              className="h-4 w-4 rounded accent-primary"
            />
            Select All Employees
          </label>

          <span className="text-[10px] text-muted-foreground">
            {employees.length} total
          </span>
        </div>

        {isLoading && employees.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mb-3 h-6 w-6 animate-spin" />
            <p className="text-xs">Loading employees...</p>
          </div>
        )}

        {!isLoading && employees.length === 0 && (
          <div className="py-12 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

            <p className="text-sm font-semibold">No employees found</p>

            <p className="mt-1 text-xs text-muted-foreground">
              Add employees to this company before dispatching salary slips.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {employees.map((employee) => {
            const selected = selectedEmployees.has(employee.id);
            const attendance = getAttendanceForEmployee(employee.id);

            return (
              <div
                key={employee.id}
                className={`rounded-xl border p-4 transition ${
                  selected
                    ? "border-primary/40 bg-primary/[0.025]"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={isDispatching}
                      onChange={() => handleSelectEmployee(employee.id)}
                      aria-label={`Select ${employee.name}`}
                      className="mt-1 h-4 w-4 shrink-0 rounded accent-primary"
                    />

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                      <UserRound className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-foreground">
                        {employee.name}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {employee.designation}
                      </p>

                      <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                        <Mail className="h-3 w-3 shrink-0" />
                        {employee.email}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                        selected
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {selected ? "Selected" : "Not selected"}
                    </span>
                  </div>

                  <div className="border-t border-border pt-3">
                    {sameForAll ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            Working Days
                          </p>

                          <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {attendance.workingDays}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            Off Days
                          </p>

                          <p className="mt-1 text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
                            {attendance.offDays}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            Leave Days
                          </p>

                          <p className="mt-1 text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                            {attendance.leaveDays}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <AttendanceSummary
                        counts={attendance}
                        totalDays={totalDays}
                        editable={!isDispatching}
                        onChange={(key, value) =>
                          handleEmployeeAttendanceChange(
                            employee.id,
                            key,
                            value,
                          )
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <button
          type="button"
          onClick={handleDispatch}
          disabled={
            isDispatching ||
            isLoading ||
            employees.length === 0 ||
            selectedCount === 0 ||
            Boolean(invalidAttendance)
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isDispatching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Payslips & Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Dispatch Salary Slips to {selectedCount} Employee
              {selectedCount === 1 ? "" : "s"}
            </>
          )}
        </button>

        {isDispatching && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />

              <div>
                <p className="text-sm font-semibold text-foreground">
                  Dispatch in progress
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Generating individual payslip PDFs and sending emails. Please
                  keep this page open.
                </p>
              </div>
            </div>
          </div>
        )}

        {invalidAttendance && !isDispatching && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />

            <p className="text-xs text-amber-700 dark:text-amber-400">
              Attendance for{" "}
              {employees.find(
                (employee) => employee.id === invalidAttendance.employeeId,
              )?.name ?? "an employee"}{" "}
              must total exactly {totalDays} days before dispatch.
            </p>
          </div>
        )}

        {selectedCount === 0 && !isDispatching && (
          <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/20 dark:bg-blue-500/[0.06]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-400" />

            <p className="text-xs text-blue-700 dark:text-blue-400">
              Select employees to dispatch their salary slips.
            </p>
          </div>
        )}
      </section>

      {dispatchResult && (
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-base font-semibold">Dispatch Results</h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Successfully Sent
              </p>

              <p className="mt-1 text-2xl font-semibold text-emerald-700 dark:text-emerald-400">
                {dispatchResult.totalSent}
              </p>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
              <p className="text-xs text-red-700 dark:text-red-400">Failed</p>

              <p className="mt-1 text-2xl font-semibold text-red-700 dark:text-red-400">
                {dispatchResult.totalFailed}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {dispatchResult.results.map((result) => (
              <div
                key={`${result.employeeId}-${result.status}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">
                    {result.email || result.employeeId}
                  </p>

                  {result.error && (
                    <p className="mt-1 text-[10px] text-red-600 dark:text-red-400">
                      {result.error}
                    </p>
                  )}

                  {result.payslipLogId && (
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">
                      Log: {result.payslipLogId}
                    </p>
                  )}
                </div>

                {result.status === "SENT" ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Sent
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400">
                    <XCircle className="h-3.5 w-3.5" />
                    Failed
                  </span>
                )}
              </div>
            ))}
          </div>

          {dispatchResult.warnings && dispatchResult.warnings.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
              {dispatchResult.warnings.map((warning, index) => (
                <p
                  key={index}
                  className="text-xs text-amber-700 dark:text-amber-400"
                >
                  {warning}
                </p>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
