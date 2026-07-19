"use client";

import { useState, useEffect } from "react";
import { Plus, Mail, Briefcase, Calendar, Trash2 } from "lucide-react";
import { EmployeeForm } from "@/components/EmployeeForm";
import getAllEmployees from "@/app/action/getAllEmployees";
import { Employee } from "@prisma/client";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const all_employees = await getAllEmployees();
      if (typeof all_employees != "string") {
        setEmployees(all_employees);
      }
    })();
  }, []);

  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="text-sm text-gray-400 mt-1">Manage company employees</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-100 transition w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((employee) => (
          <div
            key={employee.id}
            className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {employee.name}
                </h3>

                <p className="text-sm text-gray-400 mt-1">
                  {employee.designation}
                </p>
              </div>

              <button
                onClick={() => handleDeleteEmployee(employee.id)}
                className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-300 break-all">
                  {employee.email}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="text-gray-300">{employee.phone_num}</span>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-300">
                  Joined{" "}
                  {new Date(employee.created_at).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Bank</span>
                <span className="text-gray-200">{employee.bank}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Account</span>
                <span className="text-gray-200">
                  ****{employee.bank_acc_num.slice(-4)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">IFSC</span>
                <span className="text-gray-200">{employee.bank_ifsc}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">PAN</span>
                <span className="text-gray-200">{employee.pan_num}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Email Verified</span>

                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    employee.email_verified
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {employee.email_verified ? "Verified" : "Pending"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {employees.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">
            No employees yet. Add one to get started.
          </p>
        </div>
      )}

      <EmployeeForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
}
