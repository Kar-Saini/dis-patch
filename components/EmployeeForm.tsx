"use client";

import { useState } from "react";
import { X } from "lucide-react";
import addEmployee from "@/app/action/addEmployee";

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialForm = {
  name: "",
  email: "",
  designation: "",
  phone_num: "",
  bank: "",
  bank_acc_num: "",
  bank_ifsc: "",
  pan_num: "",
};

export function EmployeeForm({ isOpen, onClose }: EmployeeFormProps) {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      await addEmployee(formData);
      setFormData(initialForm);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-xl border border-white/10 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white">Add Employee</h2>

          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-400 hover:bg-white/10 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className=" p-5 ">
          <div className="flex gap-4 justify-between border-b pb-4">
            <div className="space-y-4 w-full">
              {/* Name */}
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                placeholder="John Doe"
                onChange={handleChange}
              />

              {/* Email */}
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                placeholder="john@example.com"
                onChange={handleChange}
              />

              {/* Designation */}
              <Input
                label="Designation"
                name="designation"
                value={formData.designation}
                placeholder="Software Engineer"
                onChange={handleChange}
              />
              <Input
                label="Phone Number"
                type="tel"
                name="phone_num"
                value={formData.phone_num}
                placeholder="+91 9876543210"
                onChange={handleChange}
              />
            </div>
            <div className="space-y-4 w-full">
              {/* Phone */}

              {/* Bank */}
              <Input
                label="Bank Name"
                name="bank"
                value={formData.bank}
                placeholder="State Bank of India"
                onChange={handleChange}
              />

              {/* Account Number */}
              <Input
                label="Bank Account Number"
                name="bank_acc_num"
                value={formData.bank_acc_num}
                placeholder="123456789012"
                onChange={handleChange}
              />

              {/* IFSC */}
              <Input
                label="IFSC Code"
                name="bank_ifsc"
                value={formData.bank_ifsc}
                placeholder="SBIN0001234"
                onChange={handleChange}
              />

              {/* PAN */}
              <Input
                label="PAN Number"
                name="pan_num"
                value={formData.pan_num}
                placeholder="ABCDE1234F"
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 font-medium text-white hover:bg-white/10 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-white py-2.5 font-semibold text-black hover:bg-gray-200 transition"
            >
              {loading ? "Adding..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

function Input({ label, ...props }: InputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-300">
        {label}
      </label>

      <input
        {...props}
        required
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
      />
    </div>
  );
}
