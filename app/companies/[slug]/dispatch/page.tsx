"use client";

import { useEffect, useState } from "react";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Coffee,
} from "lucide-react";
import type { Employee } from "@prisma/client";
import getAllEmployees from "@/app/action/employee/getAllEmployeesByCompany";
import { sendSalaryEmail } from "@/app/action/sendEmail";
import getAllEmployeesByCompany from "@/app/action/employee/getAllEmployeesByCompany";
import { useParams } from "next/navigation";

type DayStatus = "working" | "off" | "leave";
type CalendarStatus = Record<string, DayStatus>;

const STATUS_CONFIG = {
  working: {
    label: "Working",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-400/10",
    border: "border-emerald-200 dark:border-emerald-400/20",
    icon: Check,
  },
  off: {
    label: "Off",
    dot: "bg-red-500 dark:bg-red-400",
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-400/10",
    border: "border-red-200 dark:border-red-400/20",
    icon: X,
  },
  leave: {
    label: "Leave",
    dot: "bg-amber-500 dark:bg-amber-400",
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-400/10",
    border: "border-amber-200 dark:border-amber-400/20",
    icon: Coffee,
  },
} as const;

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

function getDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}

function getDefaultStatus(year: number, month: number, day: number): DayStatus {
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();

  // Saturday = 6, Sunday = 0
  return dayOfWeek === 0 || dayOfWeek === 6 ? "off" : "working";
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function createDefaultCalendarStatus(
  year: number,
  month: number,
): CalendarStatus {
  const status: CalendarStatus = {};
  const days = getDaysInMonth(year, month);

  for (let day = 1; day <= days; day++) {
    status[getDateKey(year, month, day)] = getDefaultStatus(year, month, day);
  }

  return status;
}

/* -------------------------------------------------------------------------- */
/* Calendar                                                                    */
/* -------------------------------------------------------------------------- */

function WorkCalendar({
  year,
  month,
  status,
  onStatusChange,
  onMonthChange,
}: {
  year: number;
  month: number;
  status: CalendarStatus;
  onStatusChange: (dateKey: string, status: DayStatus) => void;
  onMonthChange: (year: number, month: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysInMonth = getDaysInMonth(year, month);

  const firstDay = new Date(year, month, 1).getDay();
  const leadingDays = firstDay === 0 ? 6 : firstDay - 1;

  const days = Array.from({ length: leadingDays + daysInMonth }, (_, index) => {
    if (index < leadingDays) return null;
    return index - leadingDays + 1;
  });

  const counts = Object.values(status).reduce(
    (acc, value) => {
      acc[value]++;
      return acc;
    },
    {
      working: 0,
      off: 0,
      leave: 0,
    },
  );

  const monthLabel = new Date(year, month, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const changeMonth = (direction: number) => {
    const next = new Date(year, month + direction, 1);

    onMonthChange(next.getFullYear(), next.getMonth());
    setSelectedDay(null);
  };

  const handleDayClick = (day: number) => {
    setSelectedDay((current) => (current === day ? null : day));
  };

  const handleStatusChange = (day: number, value: DayStatus) => {
    const key = getDateKey(year, month, day);

    onStatusChange(key, value);
    setSelectedDay(null);
  };

  return (
    <div className="relative">
      {/* Calendar Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setSelectedDay(null);
        }}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-left text-foreground transition hover:border-ring hover:bg-muted"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-8 items-center justify-center rounded-lg bg-muted">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          <div>
            <p className="text-xs font-medium text-foreground">{monthLabel}</p>

            <div className="mt-0.5 flex items-center gap-2.5 text-[9px]">
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                {counts.working}
              </span>

              <span className="flex items-center gap-1 text-red-700 dark:text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                {counts.off}
              </span>

              {counts.leave > 0 && (
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                  {counts.leave}
                </span>
              )}
            </div>
          </div>
        </div>

        <span className="text-[10px] text-muted-foreground">
          {open ? "Close" : "Edit"}
        </span>
      </button>

      {/* Calendar Dropdown */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setSelectedDay(null);
            }}
          />

          <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-full max-w-[340px] rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <div className="text-xs font-semibold text-popover-foreground">
                {monthLabel}
              </div>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Next month"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Legend */}
            <div className="mb-3 flex items-center justify-center gap-3 border-b border-border pb-2.5">
              {(
                Object.entries(STATUS_CONFIG) as [
                  DayStatus,
                  (typeof STATUS_CONFIG)[DayStatus],
                ][]
              ).map(([key, config]) => (
                <div
                  key={key}
                  className={`flex items-center gap-1 text-[9px] ${config.text}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                  {config.label}
                </div>
              ))}
            </div>

            {/* Weekdays */}
            <div className="mb-1 grid grid-cols-7">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <div
                  key={`${day}-${index}`}
                  className="py-1 text-center text-[8px] font-medium uppercase text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} />;
                }

                const key = getDateKey(year, month, day);

                const dayStatus =
                  status[key] ?? getDefaultStatus(year, month, day);

                const config = STATUS_CONFIG[dayStatus];

                const date = new Date(year, month, day);

                const isToday =
                  date.toDateString() === new Date().toDateString();

                const isSelected = selectedDay === day;

                return (
                  <div key={day} className="relative">
                    <button
                      type="button"
                      onClick={() => handleDayClick(day)}
                      aria-label={`${day} ${monthLabel}, ${dayStatus}`}
                      aria-pressed={isSelected}
                      className={`relative flex h-8 w-full flex-col items-center justify-center rounded-md transition ${
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent"
                      }`}
                    >
                      <span
                        className={`text-[10px] ${
                          isToday
                            ? "font-bold text-foreground"
                            : "text-foreground/70"
                        }`}
                      >
                        {day}
                      </span>

                      <span
                        className={`mt-0.5 h-1 w-1 rounded-full ${config.dot}`}
                      />

                      {isToday && (
                        <span className="absolute right-0.5 top-0.5 h-0.5 w-0.5 rounded-full bg-foreground" />
                      )}
                    </button>

                    {/* Status Selector */}
                    {isSelected && (
                      <div className="absolute left-1/2 top-[calc(100%+3px)] z-50 w-28 -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl">
                        {(
                          Object.entries(STATUS_CONFIG) as [
                            DayStatus,
                            (typeof STATUS_CONFIG)[DayStatus],
                          ][]
                        ).map(([key, option]) => {
                          const Icon = option.icon;

                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleStatusChange(day, key)}
                              className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[9px] transition ${
                                dayStatus === key
                                  ? `${option.bg} ${option.text}`
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${option.dot}`}
                              />

                              <span className="flex-1">{option.label}</span>

                              {dayStatus === key && (
                                <Icon className="h-2.5 w-2.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-3 border-t border-border pt-2">
              <p className="text-center text-[9px] text-muted-foreground">
                Click a date to change its status
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dispatch Page                                                               */
/* -------------------------------------------------------------------------- */

export default function DispatchPage() {
  const now = new Date();

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set(),
  );

  const [calendarDate, setCalendarDate] = useState({
    month: now.getMonth(),
    year: now.getFullYear(),
  });

  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus>(() =>
    createDefaultCalendarStatus(now.getFullYear(), now.getMonth()),
  );

  // Counts for the currently selected payroll month.
  const workingDays = Object.values(calendarStatus).filter(
    (status) => status === "working",
  ).length;

  const offDays = Object.values(calendarStatus).filter(
    (status) => status === "off",
  ).length;

  const leaveDays = Object.values(calendarStatus).filter(
    (status) => status === "leave",
  ).length;

  const monthAndYear = {
    month: MONTHS[calendarDate.month],
    year: String(calendarDate.year),
  };

  const [subject, setSubject] = useState(
    `Salary Slip - ${monthAndYear.month} ${monthAndYear.year}`,
  );

  const [isSending, setIsSending] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Load employees                                                            */
  /* ------------------------------------------------------------------------ */
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  useEffect(() => {
    (async () => {
      const allEmployees = await getAllEmployeesByCompany(slug);

      if (typeof allEmployees !== "string") {
        setEmployees(allEmployees);
      }
    })();
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Update subject when month changes                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    setSubject(`Salary Slip - ${monthAndYear.month} ${monthAndYear.year}`);
  }, [calendarDate.month, calendarDate.year]);

  /* ------------------------------------------------------------------------ */
  /* Employee selection                                                       */
  /* ------------------------------------------------------------------------ */

  const handleSelectEmployee = (email: string) => {
    const newSelected = new Set(selectedEmployees);

    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }

    setSelectedEmployees(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEmployees.size === employees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(
        new Set(employees.map((employee) => employee.email)),
      );
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Calendar                                                                  */
  /* ------------------------------------------------------------------------ */

  const handleCalendarStatusChange = (dateKey: string, status: DayStatus) => {
    setCalendarStatus((current) => ({
      ...current,
      [dateKey]: status,
    }));
  };

  const handleCalendarMonthChange = (year: number, month: number) => {
    setCalendarDate({
      year,
      month,
    });

    // Every new month starts with:
    // Monday-Friday = Working
    // Saturday-Sunday = Off
    setCalendarStatus(createDefaultCalendarStatus(year, month));
  };

  /* ------------------------------------------------------------------------ */
  /* Send                                                                      */
  /* ------------------------------------------------------------------------ */

  const handleSendEmail = async () => {
    if (selectedEmployees.size === 0) {
      setSentMessage("Please select at least one employee");
      return;
    }

    if (!subject.trim()) {
      setSentMessage("Please enter a subject");
      return;
    }

    setIsSending(true);
    setSentMessage(null);

    try {
      const res = await sendSalaryEmail({
        slug,
        employeeEmails: Array.from(selectedEmployees),
        monthAndYear,
        subject,
        calendarStatus,
        workingDays,
        offDays,
        leaveDays,
      });
      console.log(res);

      if (!res.success) {
        setSentMessage("Failed to send salary slips.");
        return;
      }

      setSentMessage(
        `Successfully sent ${res.totalSent} email(s)${
          res.totalFailed > 0 ? `. ${res.totalFailed} failed.` : "."
        }`,
      );

      setSelectedEmployees(new Set());

      console.table(res.results);
    } catch (error) {
      console.error(error);
      setSentMessage("Something went wrong while sending emails.");
    } finally {
      setIsSending(false);
    }
  };

  const allSelected =
    selectedEmployees.size === employees.length && employees.length > 0;

  return (
    <div className="w-full space-y-8 text-foreground">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Payslip
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Dispatch Email
        </h1>

        <p className="mt-1.5 text-sm text-muted-foreground">
          Send salary slips to selected employees
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Success / Error message                                             */}
      {/* ------------------------------------------------------------------ */}

      {sentMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/[0.07]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />

          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            {sentMessage}
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Main layout                                                         */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ---------------------------------------------------------------- */}
        {/* Recipients                                                        */}
        {/* ---------------------------------------------------------------- */}

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-card-foreground">
                  Recipients
                </h2>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {selectedEmployees.size} selected
                </p>
              </div>

              <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                {employees.length} total
              </span>
            </div>

            {/* Select all */}
            <div className="mb-3 border-b border-border pb-3">
              <label className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-muted">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded accent-foreground"
                />

                <span className="text-xs font-medium text-foreground/80 transition group-hover:text-foreground">
                  Select All
                </span>
              </label>
            </div>

            {/* Employees */}
            <div className="max-h-96 space-y-1 overflow-y-auto pr-1">
              {employees.map((employee) => {
                const selected = selectedEmployees.has(employee.email);

                return (
                  <label
                    key={employee.id}
                    className={`group flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2.5 transition ${
                      selected ? "bg-accent" : "hover:bg-muted/60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => handleSelectEmployee(employee.email)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded accent-foreground"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground transition group-hover:text-foreground">
                        {employee.name}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {employee.email}
                      </p>
                    </div>
                  </label>
                );
              })}

              {employees.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-xs text-muted-foreground">
                    No employees found
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Email configuration                                               */}
        {/* ---------------------------------------------------------------- */}

        <div className="space-y-4 lg:col-span-2">
          {/* Send month */}
          <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Send Month
            </label>

            <WorkCalendar
              year={calendarDate.year}
              month={calendarDate.month}
              status={calendarStatus}
              onStatusChange={handleCalendarStatusChange}
              onMonthChange={handleCalendarMonthChange}
            />

            {/* Working, off, and leave day summary */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Working Days
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {workingDays}
                </p>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-400/20 dark:bg-red-400/10">
                <p className="text-xs text-red-700 dark:text-red-400">
                  Off Days
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {offDays}
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-400/20 dark:bg-amber-400/10">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Leave Days
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {leaveDays}
                </p>
              </div>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Email will be logged for{" "}
              <span className="font-medium text-foreground">
                {monthAndYear.month} {monthAndYear.year}
              </span>
            </p>
          </div>

          {/* Subject */}
          <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Subject
            </label>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Send button */}
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={isSending || selectedEmployees.size === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Email to {selectedEmployees.size}
              </>
            )}
          </button>

          {/* Empty selection warning */}
          {selectedEmployees.size === 0 && (
            <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/20 dark:bg-blue-500/[0.06]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-400" />

              <p className="text-xs text-blue-700 dark:text-blue-400">
                Select employees to send salary slips.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
