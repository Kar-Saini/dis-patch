"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Employee } from "@prisma/client";
import getAllEmployees from "@/app/action/getAllEmployees";
import { sendSalaryEmail } from "@/app/action/sendEmail";

export default function DispatchPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set(),
  );
  const [monthAndYear, setMonthAndYear] = useState({
    month: new Date().toLocaleString("default", { month: "long" }),
    year: new Date().toLocaleString("default", { year: "numeric" }),
  });

  useEffect(() => {
    setSubject(`Salary Slip - ${monthAndYear.month} ${monthAndYear.year}`);
  }, [monthAndYear]);

  const [subject, setSubject] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const all_employees = await getAllEmployees();
      if (typeof all_employees != "string") {
        setEmployees(all_employees);
      }
    })();
  }, []);

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
      setSelectedEmployees(new Set(employees.map((e) => e.email)));
    }
  };
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
        employeeEmails: Array.from(selectedEmployees),
        monthAndYear,
        subject,
      });

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
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Dispatch Email</h1>
        <p className="text-sm text-gray-400 mt-1">
          Send emails to selected employees
        </p>
      </div>

      {sentMessage && (
        <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-sm text-green-400">{sentMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h2 className="text-base font-semibold text-white mb-3">
              Recipients{" "}
              <span className="text-gray-400">({selectedEmployees.size})</span>
            </h2>

            <div className="mb-3 pb-3 border-b border-white/10">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 accent-white rounded"
                />
                <span className="font-medium text-white text-sm group-hover:text-gray-300 transition">
                  Select All ({employees.length})
                </span>
              </label>
            </div>

            <div className="space-y-1 max-h-96 overflow-y-auto">
              {employees.map((employee) => (
                <label
                  key={employee.id}
                  className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-white/5 transition group"
                >
                  <input
                    type="checkbox"
                    checked={selectedEmployees.has(employee.email)}
                    onChange={() => handleSelectEmployee(employee.email)}
                    className="w-4 h-4 accent-white rounded mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white group-hover:text-gray-300">
                      {employee.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {employee.email}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <label className="block text-xs font-semibold text-white mb-2 uppercase tracking-wider">
              Send Month
            </label>

            <input
              type="month"
              value={`${monthAndYear.year}-${String(
                new Date(
                  `${monthAndYear.month} 1, ${monthAndYear.year}`,
                ).getMonth() + 1,
              ).padStart(2, "0")}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split("-");

                setMonthAndYear({
                  month: new Date(
                    Number(year),
                    Number(month) - 1,
                  ).toLocaleString("default", {
                    month: "long",
                  }),
                  year,
                });
              }}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-white focus:border-transparent transition"
            />

            <p className="text-xs text-gray-400 mt-1.5">
              Email will be logged for {monthAndYear.month} {monthAndYear.year}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <label className="block text-xs font-semibold text-white mb-2 uppercase tracking-wider">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-white focus:border-transparent transition"
            />
          </div>

          <button
            onClick={handleSendEmail}
            disabled={isSending || selectedEmployees.size === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-100 disabled:opacity-50 transition"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Email to {selectedEmployees.size}
              </>
            )}
          </button>

          {selectedEmployees.size === 0 && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-400">
                Select employees to send email
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
