"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
} from "lucide-react";
import { format, parse } from "date-fns";
import { Prisma } from "@prisma/client";
import { getEmailHistory } from "@/app/action/getHistory";

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

interface EmailGroup {
  month: string;
  messages: EmailHistoryItem[];
}

export default function HistoryPage() {
  const [groupedEmails, setGroupedEmails] = useState<EmailGroup[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const res = await getEmailHistory();

      if (typeof res === "string") return;

      const grouped = res.reduce((acc, log) => {
        const month = format(new Date(log.year, log.month - 1), "MMMM yyyy");

        const existing = acc.find((g) => g.month === month);

        if (existing) {
          existing.messages.push(log);
        } else {
          acc.push({
            month,
            messages: [log],
          });
        }

        return acc;
      }, [] as EmailGroup[]);

      grouped.sort((a, b) => {
        const aDate = parse(a.month, "MMMM yyyy", new Date());
        const bDate = parse(b.month, "MMMM yyyy", new Date());

        return bDate.getTime() - aDate.getTime();
      });

      setGroupedEmails(grouped);

      if (grouped.length > 0) {
        setExpandedMonths(new Set([grouped[0].month]));
      }
    })();
  }, []);

  const toggleMonth = (month: string) => {
    const expanded = new Set(expandedMonths);

    if (expanded.has(month)) {
      expanded.delete(month);
    } else {
      expanded.add(month);
    }

    setExpandedMonths(expanded);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Email History</h1>
        <p className="text-sm text-gray-400 mt-1">
          Track all salary slip emails organized by month
        </p>
      </div>

      <div className="space-y-3">
        {groupedEmails.map(({ month, messages }) => (
          <div
            key={month}
            className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleMonth(month)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>

                <div className="text-left">
                  <h3 className="text-sm font-semibold text-white">{month}</h3>

                  <p className="text-xs text-gray-400">
                    {messages.length} email(s)
                  </p>
                </div>
              </div>

              {expandedMonths.has(month) ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {expandedMonths.has(month) && (
              <div className="border-t border-white/10">
                {messages.map((message, idx) => (
                  <div
                    key={message.id}
                    className={`p-4 ${
                      idx !== messages.length - 1
                        ? "border-b border-white/10"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        {message.status === "SENT" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400 mt-1" />
                        ) : message.status === "FAILED" ? (
                          <AlertCircle className="w-5 h-5 text-red-400 mt-1" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-400 mt-1" />
                        )}

                        <div>
                          <h4 className="text-white font-semibold">
                            {message.employee.name}
                          </h4>

                          <p className="text-sm text-gray-400">
                            {message.employee.designation}
                          </p>

                          <p className="text-sm text-gray-500">
                            {message.employee.email}
                          </p>

                          {message.messageId && (
                            <p className="text-xs text-gray-500 font-mono mt-2 break-all">
                              Message ID: {message.messageId}
                            </p>
                          )}

                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          message.status === "SENT"
                            ? "bg-green-500/10 text-green-400 border border-green-500/30"
                            : message.status === "FAILED"
                              ? "bg-red-500/10 text-red-400 border border-red-500/30"
                              : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
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
        ))}
      </div>

      {groupedEmails.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No email history yet.
        </div>
      )}
    </div>
  );
}
