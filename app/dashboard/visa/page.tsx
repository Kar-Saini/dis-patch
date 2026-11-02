"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Globe,
  IdCard,
  Pencil,
  PlaneLanding,
  PlaneTakeoff,
  Plus,
} from "lucide-react";
import { VisaPerson } from "@prisma/client";
import getAllVisaPersons from "@/app/action/visa/getAllVisaPersons";
import { VisaPersonForm } from "@/components/visa/VisaPersonForm";
import {
  VisaAttentionPanel,
  VisaRow,
} from "@/components/visa/VisaAttentionPanel";
import {
  VISA_LEVEL_STYLES,
  VISA_STAY_LIMIT_DAYS,
  compareVisaUrgency,
  formatVisaDate,
  getVisaStatus,
  visaYear,
} from "@/lib/visa";

type YearFilter = number | "all";

export default function VisaPage() {
  const [people, setPeople] = useState<VisaPerson[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<VisaPerson | null>(null);
  const [year, setYear] = useState<YearFilter>("all");

  const loadPeople = useCallback(async () => {
    const res = await getAllVisaPersons();
    if (typeof res !== "string") {
      setPeople(res);
    }
  }, []);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  // Years actually present in the data, newest first, so the filter never
  // offers an empty year.
  const years = useMemo(() => {
    const present = new Set(people.map((p) => visaYear(p.entry_date)));
    return [...present].sort((a, b) => b - a);
  }, [people]);

  const rows: VisaRow[] = useMemo(
    () =>
      people
        .filter(
          (person) => year === "all" || visaYear(person.entry_date) === year,
        )
        .map((person) => ({
          person,
          status: getVisaStatus(person.entry_date, person.exit_date),
        }))
        .sort((a, b) => compareVisaUrgency(a.status, b.status)),
    [people, year],
  );

  const openAdd = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEdit = (person: VisaPerson) => {
    setEditing(person);
    setIsFormOpen(true);
  };

  const scopeLabel = year === "all" ? "all years" : `entries in ${year}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Visas</h1>
          <p className="text-sm text-gray-400 mt-1">
            Track stays against the {VISA_STAY_LIMIT_DAYS}-day allowance
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-100 transition w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Person
        </button>
      </div>

      {/* Year filter — grouped by the year the person entered */}
      {years.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mr-1">
            Entry year
          </span>

          <YearChip
            label="All"
            count={people.length}
            active={year === "all"}
            onClick={() => setYear("all")}
          />

          {years.map((value) => (
            <YearChip
              key={value}
              label={String(value)}
              count={
                people.filter((p) => visaYear(p.entry_date) === value).length
              }
              active={year === value}
              onClick={() => setYear(value)}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rows.map(({ person, status }) => {
              const styles = VISA_LEVEL_STYLES[status.level];

              return (
                <div
                  key={person.id}
                  className="group relative rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:border-white/[0.14] hover:bg-white/[0.045]"
                >
                  <Link
                    href={`/dashboard/visa/${person.id}`}
                    aria-label={`Open ${person.name}`}
                    className="absolute inset-0 z-10 rounded-xl"
                  />

                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-white">
                        {person.name}
                      </h3>

                      <div className="mt-1 flex items-center gap-1.5 text-xs text-white/40">
                        <Globe className="h-3.5 w-3.5" />
                        {person.nationality}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${styles.badge}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Stay usage */}
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-white/35">Stay usage</span>
                      <span className="text-white/60">
                        {status.daysStayed}/{VISA_STAY_LIMIT_DAYS} days
                      </span>
                    </div>

                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className={`h-full rounded-full transition-all ${styles.bar}`}
                        style={{ width: `${status.percentUsed}%` }}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-5 space-y-2.5 text-xs">
                    <div className="flex justify-between gap-4">
                      <span className="text-white/35">Passport</span>
                      <span className="truncate font-mono text-white/65">
                        {person.passport_num}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-white/35">Entered</span>
                      <span className="text-white/65">
                        {formatVisaDate(person.entry_date)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-white/35">
                        {person.exit_date
                          ? status.hasDeparted
                            ? "Exited"
                            : "Exits"
                          : "Exit"}
                      </span>

                      <span className="text-white/65">
                        {person.exit_date
                          ? formatVisaDate(person.exit_date)
                          : "Not recorded"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-white/35">Days left</span>

                      <span
                        className={
                          status.hasDeparted
                            ? "text-white/40"
                            : status.daysLeft < 0
                              ? "font-medium text-red-400"
                              : "font-medium text-white"
                        }
                      >
                        {status.hasDeparted
                          ? "—"
                          : `${status.daysLeft} ${
                              Math.abs(status.daysLeft) === 1 ? "day" : "days"
                            }`}
                      </span>
                    </div>
                  </div>

                  {/* Warning */}
                  {status.exceedsLimit && (
                    <div className="mt-4 rounded-lg bg-red-500/[0.08] px-3 py-2 text-[11px] text-red-400">
                      {status.hasDeparted
                        ? `Stay ran ${
                            status.daysStayed - VISA_STAY_LIMIT_DAYS
                          } day(s) past the allowance.`
                        : "Recorded exit date is past the allowance."}
                    </div>
                  )}

                  {/* Footer */}
                </div>
              );
            })}
          </div>

          {rows.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 text-center py-12">
              <p className="text-gray-400 text-sm">
                {people.length === 0
                  ? "No visa records yet. Add a person to get started."
                  : `No entries in ${year}.`}
              </p>
            </div>
          )}
        </div>

        <VisaAttentionPanel rows={rows} scopeLabel={scopeLabel} />
      </div>

      <VisaPersonForm
        isOpen={isFormOpen}
        person={editing}
        onClose={() => setIsFormOpen(false)}
        onSaved={loadPeople}
      />
    </div>
  );
}

interface YearChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function YearChip({ label, count, active, onClick }: YearChipProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-white/20 bg-white/10 text-white"
          : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
      <span
        className={`rounded px-1.5 py-0.5 text-[10px] ${
          active ? "bg-white/15 text-white" : "bg-white/5 text-gray-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
