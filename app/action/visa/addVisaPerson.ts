"use server";

import prisma from "@/utils";
import { formatVisaDate, parseVisaDateInput } from "@/lib/visa";

export interface AddVisaPersonInput {
  name: string;
  passport_num: string;
  nationality: string;
  /** "YYYY-MM-DD" from the date input. */
  entry_date: string;
  /** "YYYY-MM-DD", or empty when the person has not left yet. */
  exit_date?: string;
}

export default async function addVisaPerson(input: AddVisaPersonInput) {
  const name = input.name.trim();
  const passport_num = input.passport_num.trim().toUpperCase();
  const nationality = input.nationality.trim();

  if (!name || !passport_num || !nationality) {
    return { success: false as const, error: "Name, passport number and nationality are required" };
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
    return { success: false as const, error: "Exit date cannot be before the entry date" };
  }

  try {
    const person = await prisma.visaPerson.create({
      data: {
        name,
        passport_num,
        nationality,
        entry_date,
        exit_date,
        logs: {
          create: [
            {
              action: "ADDED",
              note: `${name} (${nationality}) added to visa tracking`,
            },
            {
              action: "ENTRY",
              note: `Entry recorded for ${formatVisaDate(entry_date)}`,
            },
            ...(exit_date
              ? [
                  {
                    action: "EXIT" as const,
                    note: `Exit recorded for ${formatVisaDate(exit_date)}`,
                  },
                ]
              : []),
          ],
        },
      },
    });
    return { success: true as const, id: person.id };
  } catch (error) {
    console.error("Failed to add visa record:", error);
    return { success: false as const, error: "Failed to add person" };
  }
}
