"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  CalendarDays,
} from "lucide-react";
import type { Prisma } from "@prisma/client";
import { getEmailHistoryByCompany } from "@/app/action/employee/getEmailHistoryByCompany";
import { useParams } from "next/navigation";

type EmailHistoryItem = Prisma.PayslipLogGetPayload<{
  include: {
    employee: {
      select: {
        id: true;
        name: true;
        email: true;
        designation: true;
      };
    };
  };
}>;

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

export default function HistoryPage() {
  const now = new Date();

  const [emails, setEmails] = useState<EmailHistoryItem[]>([]);
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  /* ---------------------------------------------------------------------- */
  /* Load history                                                            */
  /* ---------------------------------------------------------------------- */
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  useEffect(() => {
    (async () => {
      const res = await getEmailHistoryByCompany(slug);

      if (typeof res === "string") return;

      setEmails(res);
    })();
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Available years                                                         */
  /* ---------------------------------------------------------------------- */

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const emailYears = emails.map((email) => email.year);

    return [...new Set([currentYear, ...emailYears])].sort((a, b) => b - a);
  }, [emails]);

  /* ---------------------------------------------------------------------- */
  /* Filter emails                                                           */
  /* ---------------------------------------------------------------------- */

  const filteredEmails = useMemo(() => {
    return emails.filter(
      (email) => email.year === year && email.month === month + 1,
    );
  }, [emails, month, year]);

  /* ---------------------------------------------------------------------- */
  /* Statistics                                                              */
  /* ---------------------------------------------------------------------- */

  const sentCount = filteredEmails.filter(
    (email) => email.status === "SENT",
  ).length;

  const failedCount = filteredEmails.filter(
    (email) => email.status === "FAILED",
  ).length;

  /* ---------------------------------------------------------------------- */
  /* Expand selected month                                                   */
  /* ---------------------------------------------------------------------- */

  const selectedMonthLabel = `${MONTHS[month]} ${year}`;

  useEffect(() => {
    if (filteredEmails.length > 0) {
      setExpandedMonths(new Set([selectedMonthLabel]));
    } else {
      setExpandedMonths(new Set());
    }
  }, [month, year, filteredEmails.length, selectedMonthLabel]);

  const toggleMonth = (monthLabel: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);

      if (next.has(monthLabel)) {
        next.delete(monthLabel);
      } else {
        next.add(monthLabel);
      }

      return next;
    });
  };

  /* ---------------------------------------------------------------------- */
  /* Month navigation                                                        */
  /* ---------------------------------------------------------------------- */

  const changeMonth = (direction: number) => {
    const next = new Date(year, month + direction, 1);

    setMonth(next.getMonth());
    setYear(next.getFullYear());
  };

  return (
    <div className="w-full space-y-8 text-foreground">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Payslip
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Email History
          </h1>

          <p className="mt-1.5 text-sm text-muted-foreground">
            Track salary slip emails and delivery status
          </p>
        </div>

        {/* Month / Year filter */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Showing</span>
          </div>

          {/* Month */}
          <div className="relative">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="h-9 appearance-none rounded-lg border border-input bg-card pl-3 pr-8 text-xs font-medium text-card-foreground outline-none transition hover:border-ring focus:border-ring focus:ring-1 focus:ring-ring"
            >
              {MONTHS.map((name, index) => (
                <option
                  key={name}
                  value={index}
                  className="bg-background text-foreground"
                >
                  {name}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>

          {/* Year */}
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 appearance-none rounded-lg border border-input bg-card pl-3 pr-8 text-xs font-medium text-card-foreground outline-none transition hover:border-ring focus:border-ring focus:ring-1 focus:ring-ring"
            >
              {years.map((value) => (
                <option
                  key={value}
                  value={value}
                  className="bg-background text-foreground"
                >
                  {value}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Statistics                                                         */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Total */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Total emails
            </p>

            <p className="mt-0.5 text-sm font-semibold text-card-foreground">
              {filteredEmails.length}
            </p>
          </div>
        </div>

        {/* Sent */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-400/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Sent
            </p>

            <p className="mt-0.5 text-sm font-semibold text-card-foreground">
              {sentCount}
            </p>
          </div>
        </div>

        {/* Failed */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 dark:bg-red-400/10">
            <AlertCircle className="h-4 w-4 text-red-700 dark:text-red-400" />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Failed
            </p>

            <p className="mt-0.5 text-sm font-semibold text-card-foreground">
              {failedCount}
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* History                                                             */}
      {/* ------------------------------------------------------------------ */}

      <section className="w-full">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {selectedMonthLabel}
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Salary slip dispatch history
            </p>
          </div>

          <span className="text-xs text-muted-foreground">
            {filteredEmails.length}{" "}
            {filteredEmails.length === 1 ? "email" : "emails"}
          </span>
        </div>

        {filteredEmails.length > 0 ? (
          <div className="w-full overflow-hidden rounded-xl border border-border bg-card">
            {/* Month header */}
            <button
              type="button"
              onClick={() => toggleMonth(selectedMonthLabel)}
              className="flex w-full items-center justify-between border-b border-border px-4 py-3.5 text-left transition hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-card-foreground">
                    {selectedMonthLabel}
                  </h3>

                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {filteredEmails.length}{" "}
                    {filteredEmails.length === 1 ? "email" : "emails"}
                  </p>
                </div>
              </div>

              {expandedMonths.has(selectedMonthLabel) ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* Emails */}
            {expandedMonths.has(selectedMonthLabel) && (
              <div>
                {filteredEmails.map((message, index) => (
                  <div
                    key={message.id}
                    className={`px-4 py-4 transition hover:bg-accent/50 ${
                      index !== filteredEmails.length - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        {/* Status icon */}
                        <div className="mt-0.5 shrink-0">
                          {message.status === "SENT" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : message.status === "FAILED" ? (
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>

                        {/* Employee details */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h4 className="text-sm font-medium text-card-foreground">
                              {message.employee.name}
                            </h4>

                            <span className="text-xs text-muted-foreground">
                              {message.employee.designation}
                            </span>
                          </div>

                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {message.employee.email}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                            <span>
                              {new Date(message.createdAt).toLocaleString()}
                            </span>

                            {message.messageId && (
                              <span className="font-mono">
                                ID: {message.messageId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold ${
                          message.status === "SENT"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400"
                            : message.status === "FAILED"
                              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400"
                              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-400"
                        }`}
                      >
                        {message.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="flex min-h-52 items-center justify-center rounded-xl border border-border bg-card">
            <div className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>

              <p className="mt-3 text-sm font-medium text-foreground">
                No email history
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                No salary slip emails were sent in {selectedMonthLabel}.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
