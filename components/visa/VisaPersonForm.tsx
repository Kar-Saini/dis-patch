"use client";

import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { VisaPerson } from "@prisma/client";
import addVisaPerson from "@/app/action/visa/addVisaPerson";
import updateVisaPerson from "@/app/action/visa/updateVisaPerson";
import { VISA_STAY_LIMIT_DAYS, toVisaDateInput } from "@/lib/visa";

interface VisaPersonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** When set, the form edits this person instead of creating a new one. */
  person?: VisaPerson | null;
}

const emptyForm = {
  name: "",
  passport_num: "",
  nationality: "",
  entry_date: "",
  exit_date: "",
};

/** The form values that represent an existing record. */
function formFor(person: VisaPerson | null | undefined) {
  if (!person) return emptyForm;
  return {
    name: person.name,
    passport_num: person.passport_num,
    nationality: person.nationality,
    entry_date: toVisaDateInput(person.entry_date),
    exit_date: toVisaDateInput(person.exit_date),
  };
}

export function VisaPersonForm({
  isOpen,
  onClose,
  onSaved,
  person,
}: VisaPersonFormProps) {
  const isEditing = Boolean(person);

  const [formData, setFormData] = useState(() => formFor(person));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Re-seed the fields each time the modal opens so a cancelled edit does not
  // leave stale values behind for the next one.
  useEffect(() => {
    if (isOpen) {
      setFormData(formFor(person));
      setError("");
    }
  }, [isOpen, person]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.exit_date && formData.exit_date < formData.entry_date) {
      setError("Exit date cannot be before the entry date");
      return;
    }

    setLoading(true);

    try {
      const res = person
        ? await updateVisaPerson({ ...formData, id: person.id })
        : await addVisaPerson(formData);

      if (!res.success) {
        setError(res.error);
        return;
      }

      if (!isEditing) setFormData(emptyForm);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        isEditing
          ? "Something went wrong while saving the changes"
          : "Something went wrong while adding the person",
      );
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

  const handleClose = () => {
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? "Edit Person" : "Add Person"}
          </h2>

          <button
            onClick={handleClose}
            className="rounded-md p-2 text-gray-400 hover:bg-white/10 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4 border-b border-white/10 pb-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              placeholder="John Smith"
              onChange={handleChange}
            />

            <div className="flex gap-4">
              <Input
                label="Passport Number"
                name="passport_num"
                value={formData.passport_num}
                placeholder="P1234567"
                onChange={handleChange}
              />

              <Input
                label="Nationality"
                name="nationality"
                value={formData.nationality}
                placeholder="British"
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-4">
              <Input
                label="Entry Date"
                type="date"
                name="entry_date"
                value={formData.entry_date}
                onChange={handleChange}
              />

              <Input
                label="Exit Date"
                type="date"
                name="exit_date"
                value={formData.exit_date}
                min={formData.entry_date || undefined}
                onChange={handleChange}
                required={false}
                hint="Leave blank if still in the country"
              />
            </div>

            <p className="text-xs text-gray-500">
              Stay allowance is {VISA_STAY_LIMIT_DAYS} days from the entry date.
            </p>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 font-medium text-white hover:bg-white/10 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-white py-2.5 font-semibold text-black hover:bg-gray-200 disabled:opacity-50 transition"
            >
              {loading
                ? isEditing
                  ? "Saving..."
                  : "Adding..."
                : isEditing
                  ? "Save Changes"
                  : "Add Person"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

function Input({ label, hint, required = true, ...props }: InputProps) {
  return (
    <div className="w-full">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-300">
        {label}
      </label>

      <input
        {...props}
        required={required}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
      />

      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
