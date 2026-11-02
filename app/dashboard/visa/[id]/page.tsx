"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  ChevronLeft,
  Globe,
  IdCard,
  Pencil,
  PlaneLanding,
  PlaneTakeoff,
} from "lucide-react";
import getVisaPerson, {
  VisaPersonDetail,
} from "@/app/action/visa/getVisaPerson";
import { VisaPersonForm } from "@/components/visa/VisaPersonForm";
import { VisaLogList } from "@/components/visa/VisaLogList";
import {
  VISA_LEVEL_STYLES,
  VISA_STAY_LIMIT_DAYS,
  formatLogStamp,
  formatVisaDate,
  getVisaStatus,
} from "@/lib/visa";

export default function VisaPersonPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [person, setPerson] = useState<VisaPersonDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">(
    "loading",
  );
  const [isEditOpen, setIsEditOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await getVisaPerson(id);

    if (typeof res === "string") {
      setState("error");
      return;
    }
    if (!res) {
      setState("missing");
      return;
    }

    setPerson(res);
    setState("ready");
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (state === "loading") {
    return <Notice text="Loading…" />;
  }
  if (state === "error") {
    return <Notice text="Could not load this visa record." />;
  }
  if (state === "missing" || !person) {
    return <Notice text="This visa record no longer exists." />;
  }

  const status = getVisaStatus(person.entry_date, person.exit_date);
  const styles = VISA_LEVEL_STYLES[status.level];
  const updated = formatLogStamp(person.updated_at);

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/dashboard/visa"
        className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-white transition group"
      >
        <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        All visas
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{person.name}</h1>
            <span
              className={`rounded-full border px-2 py-1 text-xs font-semibold whitespace-nowrap ${styles.badge}`}
            >
              {status.label}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Globe className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span className="text-gray-400">{person.nationality}</span>
            <span className="text-gray-600">·</span>
            <IdCard className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span className="font-mono text-gray-400">
              {person.passport_num}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsEditOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100 transition w-full md:w-auto shrink-0"
        >
          <Pencil className="w-4 h-4" />
          Edit Details
        </button>
      </div>

      {status.needsAttention && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-orange-400" />
          <div>
            <p className="text-sm font-semibold text-orange-300">
              {status.attentionReason}
            </p>
            {!person.exit_date && (
              <p className="mt-1 text-xs text-orange-200/70">
                No exit date on record — add one with Edit Details once the
                departure is known.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Allowance */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Allowance
          </h2>
          <span className="text-xs text-gray-500">
            {status.daysStayed} of {VISA_STAY_LIMIT_DAYS} days used
          </span>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${styles.bar}`}
            style={{ width: `${status.percentUsed}%` }}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat
            label="Days left"
            value={
              status.hasDeparted
                ? "—"
                : `${status.daysLeft} ${Math.abs(status.daysLeft) === 1 ? "day" : "days"}`
            }
            tone={
              status.hasDeparted
                ? "text-gray-400"
                : status.daysLeft < 0
                  ? "text-red-400"
                  : "text-white"
            }
          />
          <Stat label="Must exit by" value={formatVisaDate(status.limitDate)} />
          <Stat
            label="Days stayed"
            value={`${status.daysStayed} ${status.daysStayed === 1 ? "day" : "days"}`}
          />
        </div>

        {status.exceedsLimit && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {status.hasDeparted
              ? `Stay ran ${status.daysStayed - VISA_STAY_LIMIT_DAYS} day(s) past the allowance.`
              : "Recorded exit date is past the allowance."}
          </p>
        )}
      </div>

      {/* Dates */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
          Travel Dates
        </h2>

        <div className="mt-4 space-y-3 text-sm">
          <Row
            icon={<PlaneLanding className="w-4 h-4 text-gray-500 shrink-0" />}
            label="Entry date"
            value={formatVisaDate(person.entry_date)}
          />

          <Row
            icon={<PlaneTakeoff className="w-4 h-4 text-gray-500 shrink-0" />}
            label="Exit date"
            value={
              person.exit_date ? (
                formatVisaDate(person.exit_date)
              ) : (
                <span className="text-gray-500">Not recorded</span>
              )
            }
          />

          {person.exit_date && !status.hasDeparted && (
            <Row
              icon={
                <CalendarClock className="w-4 h-4 text-gray-500 shrink-0" />
              }
              label="Departs in"
              value={`${status.daysUntilExit} ${status.daysUntilExit === 1 ? "day" : "days"}`}
            />
          )}

          <Row
            icon={<CalendarClock className="w-4 h-4 text-gray-500 shrink-0" />}
            label="Last updated"
            value={`${updated.date} at ${updated.time}`}
          />
        </div>
      </div>

      {/* Logs for this person */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            History
          </h2>
          <span className="text-xs text-gray-500">
            {person.logs.length}{" "}
            {person.logs.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        <VisaLogList
          logs={person.logs}
          showPerson={false}
          emptyMessage="Nothing logged for this person yet."
        />
      </div>

      <VisaPersonForm
        isOpen={isEditOpen}
        person={person}
        onClose={() => setIsEditOpen(false)}
        onSaved={load}
      />
    </div>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <div className="max-w-4xl space-y-4">
      <Link
        href="/dashboard/visa"
        className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-white transition"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        All visas
      </Link>
      <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center text-sm text-gray-400">
        {text}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "text-white",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`mt-1 text-base font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-gray-500">{label}</span>
      <span className="ml-auto text-gray-200">{value}</span>
    </div>
  );
}
