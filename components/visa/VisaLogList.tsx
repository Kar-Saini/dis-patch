"use client";

import Link from "next/link";
import {
  Globe,
  PenLine,
  PlaneLanding,
  PlaneTakeoff,
  UserPlus,
} from "lucide-react";
import { VisaAction } from "@prisma/client";
import { formatLogStamp } from "@/lib/visa";

export const VISA_ACTION_META: Record<
  VisaAction,
  { label: string; icon: typeof UserPlus; badge: string; icon_color: string }
> = {
  ADDED: {
    label: "Person added",
    icon: UserPlus,
    badge: "bg-white/5 text-gray-300 border-white/20",
    icon_color: "text-gray-300",
  },
  ENTRY: {
    label: "Entry recorded",
    icon: PlaneLanding,
    badge: "bg-green-500/10 text-green-400 border-green-500/30",
    icon_color: "text-green-400",
  },
  EXIT: {
    label: "Exit recorded",
    icon: PlaneTakeoff,
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    icon_color: "text-blue-400",
  },
  UPDATED: {
    label: "Details updated",
    icon: PenLine,
    badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    icon_color: "text-yellow-400",
  },
};

export interface VisaLogListItem {
  id: string;
  action: VisaAction;
  note: string | null;
  createdAt: Date;
  visaPerson?: {
    id: string;
    name: string;
    nationality: string;
    passport_num: string;
  };
}

interface VisaLogListProps {
  logs: VisaLogListItem[];
  /** Off on a person's own page, where the heading already names them. */
  showPerson?: boolean;
  emptyMessage?: string;
}

export function VisaLogList({
  logs,
  showPerson = true,
  emptyMessage = "No visa activity logged yet.",
}: VisaLogListProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      {logs.map((log, idx) => {
        const meta = VISA_ACTION_META[log.action];
        const stamp = formatLogStamp(log.createdAt);
        const person = log.visaPerson;

        return (
          <div
            key={log.id}
            className={`p-4 ${idx !== logs.length - 1 ? "border-b border-white/10" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 min-w-0">
                <meta.icon
                  className={`w-5 h-5 mt-0.5 shrink-0 ${meta.icon_color}`}
                />

                <div className="min-w-0">
                  {showPerson && person && (
                    <>
                      <Link
                        href={`/dashboard/visa/${person.id}`}
                        className="text-white font-semibold hover:underline"
                      >
                        {person.name}
                      </Link>

                      <div className="flex items-center gap-2 mt-0.5">
                        <Globe className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span className="text-sm text-gray-400">
                          {person.nationality}
                        </span>
                        <span className="text-gray-600">·</span>
                        <span className="text-sm text-gray-500 font-mono">
                          {person.passport_num}
                        </span>
                      </div>
                    </>
                  )}

                  <p
                    className={`text-sm text-gray-400 ${showPerson && person ? "mt-2" : ""}`}
                  >
                    {log.note ?? meta.label}
                  </p>

                  <p className="text-xs text-gray-500 mt-2">
                    {stamp.date} at {stamp.time}
                  </p>
                </div>
              </div>

              <span
                className={`px-2 py-1 rounded border text-xs font-semibold whitespace-nowrap ${meta.badge}`}
              >
                {meta.label}
              </span>
            </div>
          </div>
        );
      })}

      {logs.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
