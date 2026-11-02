"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight, ShieldCheck } from "lucide-react";
import { VisaPerson } from "@prisma/client";
import {
  VISA_ATTENTION_DAYS_LEFT,
  VISA_DEPARTURE_SOON_DAYS,
  VISA_LEVEL_STYLES,
  VisaStatus,
  compareVisaAttention,
  formatVisaDate,
} from "@/lib/visa";

export interface VisaRow {
  person: VisaPerson;
  status: VisaStatus;
}

interface VisaAttentionPanelProps {
  rows: VisaRow[];
  /** Shown under the heading so it is clear the list follows the year filter. */
  scopeLabel: string;
}

/**
 * The critical-status column: anyone still in the country who is inside the
 * 30-day window, already overstayed, or leaving within a fortnight.
 */
export function VisaAttentionPanel({
  rows,
  scopeLabel,
}: VisaAttentionPanelProps) {
  const flagged = rows
    .filter(({ status }) => status.needsAttention)
    .sort((a, b) => compareVisaAttention(a.status, b.status));

  return (
    <aside className="lg:sticky lg:top-6 space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Needs Attention
          </h2>
          <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-gray-300">
            {flagged.length}
          </span>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Under {VISA_ATTENTION_DAYS_LEFT} days left, overstayed, or departing
          within {VISA_DEPARTURE_SOON_DAYS} days · {scopeLabel}
        </p>
      </div>

      {flagged.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
          <ShieldCheck className="mx-auto w-5 h-5 text-green-400" />
          <p className="mt-2 text-sm text-gray-300">All clear</p>
          <p className="mt-1 text-xs text-gray-500">
            No stay needs action right now.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {flagged.map(({ person, status }) => {
            const styles = VISA_LEVEL_STYLES[status.level];

            return (
              <Link
                key={person.id}
                href={`/dashboard/visa/${person.id}`}
                className="group block rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.09] hover:border-white/20 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {person.name}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${styles.badge}`}
                  >
                    {status.label}
                  </span>
                </div>

                <p className={`mt-2 text-xs ${styles.text}`}>
                  {status.attentionReason}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <span className="text-xs text-gray-500">
                    {status.exceedsLimit || status.daysLeft < 0
                      ? `Limit was ${formatVisaDate(status.limitDate)}`
                      : `Must exit by ${formatVisaDate(status.limitDate)}`}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:translate-x-0.5 group-hover:text-white transition" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
