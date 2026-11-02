"use client";

import { useEffect, useMemo, useState } from "react";
import { Prisma } from "@prisma/client";
import {
  Activity,
  CalendarDays,
  ChevronDown,
  Clock3,
  FileText,
} from "lucide-react";
import { getVisaLogs } from "@/app/action/visa/getVisaLogs";
import { VisaLogList } from "@/components/visa/VisaLogList";

type VisaLogItem = Prisma.VisaLogGetPayload<{
  include: {
    visaPerson: {
      select: {
        id: true;
        name: true;
        nationality: true;
        passport_num: true;
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

export default function VisaLogsPage() {
  const [logs, setLogs] = useState<VisaLogItem[]>([]);

  const now = new Date();

  // Default: current month + current year
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    (async () => {
      const res = await getVisaLogs();

      if (typeof res !== "string") {
        setLogs(res);
      }
    })();
  }, []);

  // Years available in the logs
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();

    const logYears = logs.map((log) => new Date(log.createdAt).getFullYear());

    return [...new Set([currentYear, ...logYears])].sort((a, b) => b - a);
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const date = new Date(log.createdAt);

      return date.getFullYear() === year && date.getMonth() === month;
    });
  }, [logs, month, year]);

  const entryCount = filteredLogs.filter(
    (log) => log.action === "ENTRY",
  ).length;

  const exitCount = filteredLogs.filter((log) => log.action === "EXIT").length;

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
            Visa
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Activity Logs
          </h1>

          <p className="mt-1.5 text-sm text-white/35">
            Entry, exit and visa activity
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Showing</span>
          </div>

          {/* Month */}
          <div className="relative">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="h-9 appearance-none rounded-lg border border-white/[0.09] bg-white/[0.035] pl-3 pr-8 text-xs font-medium text-white outline-none transition hover:border-white/[0.16] focus:border-white/20"
            >
              {MONTHS.map((name, index) => (
                <option
                  key={name}
                  value={index}
                  className="bg-[#0a0a0a] text-white"
                >
                  {name}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          </div>

          {/* Year */}
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 appearance-none rounded-lg border border-white/[0.09] bg-white/[0.035] pl-3 pr-8 text-xs font-medium text-white outline-none transition hover:border-white/[0.16] focus:border-white/20"
            >
              {years.map((value) => (
                <option
                  key={value}
                  value={value}
                  className="bg-[#0a0a0a] text-white"
                >
                  {value}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
            <Activity className="h-4 w-4 text-white/50" />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/25">
              Activity
            </p>
            <p className="mt-0.5 text-sm font-medium text-white">
              {filteredLogs.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
            <Clock3 className="h-4 w-4 text-white/50" />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/25">
              Entries
            </p>
            <p className="mt-0.5 text-sm font-medium text-white">
              {entryCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
            <FileText className="h-4 w-4 text-white/50" />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/25">
              Exits
            </p>
            <p className="mt-0.5 text-sm font-medium text-white">{exitCount}</p>
          </div>
        </div>
      </div>

      {/* Logs */}
      <section className="w-full">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-white">Recent activity</h2>

            <p className="mt-0.5 text-xs text-white/30">
              {MONTHS[month]} {year}
            </p>
          </div>

          <span className="text-xs text-white/25">
            {filteredLogs.length}{" "}
            {filteredLogs.length === 1 ? "record" : "records"}
          </span>
        </div>

        <div className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02]">
          <VisaLogList logs={filteredLogs} />
        </div>
      </section>
    </div>
  );
}
