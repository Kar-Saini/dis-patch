"use server";

import prisma from "@/utils";
import { VisaAction } from "@prisma/client";
import { formatVisaDate, isSameVisaDay, parseVisaDateInput } from "@/lib/visa";

export interface UpdateVisaPersonInput {
  id: string;
  name: string;
  passport_num: string;
  nationality: string;
  /** "YYYY-MM-DD" from the date input. */
  entry_date: string;
  /** "YYYY-MM-DD", or empty to clear a recorded exit. */
  exit_date?: string;
}

interface PendingLog {
  action: VisaAction;
  note: string;
}

/**
 * Applies an edit and records what changed. Every field change produces a log
 * entry, so the person's timeline explains how the record reached its current
 * state rather than just showing the latest values.
 */
export default async function updateVisaPerson(input: UpdateVisaPersonInput) {
  const name = input.name.trim();
  const passport_num = input.passport_num.trim().toUpperCase();
  const nationality = input.nationality.trim();

  if (!input.id) {
    return { success: false as const, error: "Missing person id" };
  }
  if (!name || !passport_num || !nationality) {
    return {
      success: false as const,
      error: "Name, passport number and nationality are required",
    };
  }

  const entry_date = parseVisaDateInput(input.entry_date);
  if (!entry_date) {
    return { success: false as const, error: "Entry date is required" };
  }

  const exit_date = input.exit_date ? parseVisaDateInput(input.exit_date) : null;
  if (input.exit_date && !exit_date) {
    return { success: false as const, error: "Exit date is invalid" };
  }
  if (exit_date && exit_date < entry_date) {
    return {
      success: false as const,
      error: "Exit date cannot be before the entry date",
    };
  }

  try {
    const existing = await prisma.visaPerson.findUnique({
      where: { id: input.id },
    });

    if (!existing) {
      return { success: false as const, error: "Person not found" };
    }

    const logs = describeChanges(existing, {
      name,
      passport_num,
      nationality,
      entry_date,
      exit_date,
    });

    // Nothing actually moved — skip the write so we do not log a no-op edit.
    if (logs.length === 0) {
      return { success: true as const, id: existing.id, changed: false };
    }

    await prisma.visaPerson.update({
      where: { id: input.id },
      data: {
        name,
        passport_num,
        nationality,
        entry_date,
        exit_date,
        logs: { create: logs },
      },
    });

    return { success: true as const, id: existing.id, changed: true };
  } catch (error) {
    console.error("Failed to update visa record:", error);
    return { success: false as const, error: "Failed to save changes" };
  }
}

interface VisaFields {
  name: string;
  passport_num: string;
  nationality: string;
  entry_date: Date;
  exit_date: Date | null;
}

/** Builds one log per changed field. An empty result means nothing changed. */
function describeChanges(
  before: VisaFields,
  after: VisaFields,
): PendingLog[] {
  const logs: PendingLog[] = [];

  // Exit date first — it is the change this page exists to make, so it should
  // read as the headline entry on the timeline.
  if (!isSameVisaDay(before.exit_date, after.exit_date)) {
    if (after.exit_date && !before.exit_date) {
      logs.push({
        action: "EXIT",
        note: `Exit recorded for ${formatVisaDate(after.exit_date)}`,
      });
    } else if (after.exit_date && before.exit_date) {
      logs.push({
        action: "EXIT",
        note: `Exit date moved from ${formatVisaDate(before.exit_date)} to ${formatVisaDate(after.exit_date)}`,
      });
    } else if (before.exit_date) {
      logs.push({
        action: "UPDATED",
        note: `Exit date cleared (was ${formatVisaDate(before.exit_date)})`,
      });
    }
  }

  if (!isSameVisaDay(before.entry_date, after.entry_date)) {
    logs.push({
      action: "ENTRY",
      note: `Entry date changed from ${formatVisaDate(before.entry_date)} to ${formatVisaDate(after.entry_date)}`,
    });
  }

  const textFields = [
    { label: "Name", before: before.name, after: after.name },
    {
      label: "Passport number",
      before: before.passport_num,
      after: after.passport_num,
    },
    {
      label: "Nationality",
      before: before.nationality,
      after: after.nationality,
    },
  ];

  for (const field of textFields) {
    if (field.before !== field.after) {
      logs.push({
        action: "UPDATED",
        note: `${field.label} changed from "${field.before}" to "${field.after}"`,
      });
    }
  }

  return logs;
}
