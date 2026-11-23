"use server";

import prisma from "@/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function optionalText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  return value.trim() || null;
}

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseDate(value: string): Date | null {
  if (!value) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Please provide a valid date of birth.");
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error("Please provide a valid date of birth.");
  }

  return date;
}

function errorRedirect(slug: string, message: string): never {
  redirect(
    `/company/${slug}/employees/new?error=${encodeURIComponent(message)}`,
  );
}

export default async function addEmployee(
  companySlug: string,
  formData: FormData,
) {
  if (typeof companySlug !== "string" || !companySlug.trim()) {
    redirect("/companies");
  }

  const slug = companySlug.trim();

  const name = getText(formData, "name");
  const employeeId = getText(formData, "employee_id");
  const email = getText(formData, "email").toLowerCase();
  const designation = getText(formData, "designation");
  const phoneNum = getText(formData, "phone_num");

  // Required fields
  if (!name || !email || !designation || !phoneNum) {
    errorRedirect(slug, "Please complete all required fields.");
  }

  // Length validation
  if (name.length > 120) {
    errorRedirect(slug, "Employee name cannot exceed 120 characters.");
  }

  if (designation.length > 120) {
    errorRedirect(slug, "Designation cannot exceed 120 characters.");
  }

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorRedirect(slug, "Please enter a valid email address.");
  }

  if (phoneNum.length > 30) {
    errorRedirect(slug, "Phone number cannot exceed 30 characters.");
  }

  if (employeeId.length > 100) {
    errorRedirect(slug, "Employee ID cannot exceed 100 characters.");
  }

  // Date of birth
  let dateOfBirth: Date | null;

  try {
    dateOfBirth = parseDate(getText(formData, "date_of_birth"));
  } catch {
    errorRedirect(slug, "Please enter a valid date of birth.");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find company and its default payroll together.
      const company = await tx.company.findUnique({
        where: {
          slug,
        },
        select: {
          id: true,
          slug: true,
          payrolls: {
            where: {
              isDefault: true,
            },
            take: 1,
            select: {
              id: true,
            },
          },
        },
      });

      if (!company) {
        return {
          success: false as const,
          reason: "COMPANY_NOT_FOUND",
        };
      }

      const defaultPayroll = company.payrolls[0];

      if (!defaultPayroll) {
        return {
          success: false as const,
          reason: "DEFAULT_PAYROLL_NOT_FOUND",
        };
      }

      // Create employee and assign company default payroll.
      await tx.employee.create({
        data: {
          name,
          employee_id: employeeId || null,
          email,
          designation,
          phone_num: phoneNum,

          date_of_birth: dateOfBirth,
          nationality: optionalText(formData.get("nationality")),
          address: optionalText(formData.get("address")),
          passport_no: optionalText(formData.get("passport_no")),

          visa_no: optionalText(formData.get("visa_no")),
          frro_reg_no: optionalText(formData.get("frro_reg_no")),
          tax_residency_status: optionalText(
            formData.get("tax_residency_status"),
          ),
          iw_ssa_status: optionalText(formData.get("iw_ssa_status")),

          pan_num: getText(formData, "pan_num").toUpperCase() || null,
          bank_acc_num: optionalText(formData.get("bank_acc_num")),
          bank: optionalText(formData.get("bank")),
          bank_ifsc: getText(formData, "bank_ifsc").toUpperCase() || null,

          // Every employee must have a payroll assignment.
          customPayroll: false,
          payrollId: defaultPayroll.id,

          companyId: company.id,
        },
      });

      return {
        success: true as const,
        slug: company.slug,
      };
    });

    if (!result.success) {
      if (result.reason === "COMPANY_NOT_FOUND") {
        redirect("/companies");
      }

      errorRedirect(
        slug,
        "Company default payroll is not configured. Please configure it before adding employees.",
      );
    }

    revalidatePath(`/company/${result.slug}/employees`);
    revalidatePath(`/company/${result.slug}`);
  } catch (error) {
    // Preserve Next.js redirect behavior.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("Failed to create employee:", error);

    if ((error as { code?: string }).code === "P2002") {
      errorRedirect(
        slug,
        "This employee ID is already registered under this company.",
      );
    }

    errorRedirect(
      slug,
      "Unable to create employee. Please check the details and try again.",
    );
  }

  redirect(`/company/${slug}/employees`);
}
