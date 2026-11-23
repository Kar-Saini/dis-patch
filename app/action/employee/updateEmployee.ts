"use server";

import prisma from "@/utils";
import { revalidatePath } from "next/cache";

export interface UpdateEmployeeInput {
  id: string;
  name: string;
  employee_id: string;
  designation: string;
  email: string;
  phone_num: string;
  date_of_birth: string;
  nationality: string;
  address: string;
  passport_no: string;
  visa_no: string;
  frro_reg_no: string;
  tax_residency_status: string;
  iw_ssa_status: string;
  pan_num: string;
  bank_acc_num: string;
  bank: string;
  bank_ifsc: string;
}

function getText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  return getText(value) || null;
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

export default async function updateEmployee(
  companySlug: string,
  input: UpdateEmployeeInput,
) {
  try {
    const slug = getText(companySlug);
    const id = getText(input?.id);

    if (!slug || !id) {
      return {
        success: false,
        message: "Company and employee are required.",
      };
    }

    // Normalize input fields.
    const name = getText(input.name);
    const employeeId = getText(input.employee_id);
    const designation = getText(input.designation);
    const email = getText(input.email).toLowerCase();
    const phoneNum = getText(input.phone_num);

    // Required fields.
    if (!name || !designation || !email || !phoneNum) {
      return {
        success: false,
        message: "Please complete all required fields.",
      };
    }

    // Length validation.
    if (name.length > 120 || designation.length > 120) {
      return {
        success: false,
        message: "Name and designation cannot exceed 120 characters.",
      };
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        success: false,
        message: "Please enter a valid email address.",
      };
    }

    if (phoneNum.length > 30) {
      return {
        success: false,
        message: "Phone number cannot exceed 30 characters.",
      };
    }

    if (employeeId.length > 100) {
      return {
        success: false,
        message: "Employee ID cannot exceed 100 characters.",
      };
    }

    // Validate date of birth.
    let dateOfBirth: Date | null;

    try {
      dateOfBirth = parseDate(getText(input.date_of_birth));
    } catch {
      return {
        success: false,
        message: "Please provide a valid date of birth.",
      };
    }

    // Find company.
    const company = await prisma.company.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!company) {
      return {
        success: false,
        message: "Company not found.",
      };
    }

    // Update only the employee belonging to this company.
    const result = await prisma.employee.updateMany({
      where: {
        id,
        companyId: company.id,
      },
      data: {
        name,
        employee_id: employeeId || null,
        designation,
        email,
        phone_num: phoneNum,

        date_of_birth: dateOfBirth,
        nationality: optionalText(input.nationality),
        address: optionalText(input.address),
        passport_no: optionalText(input.passport_no),

        visa_no: optionalText(input.visa_no),
        frro_reg_no: optionalText(input.frro_reg_no),
        tax_residency_status: optionalText(input.tax_residency_status),
        iw_ssa_status: optionalText(input.iw_ssa_status),

        pan_num: getText(input.pan_num).toUpperCase() || null,
        bank_acc_num: optionalText(input.bank_acc_num),
        bank: optionalText(input.bank),
        bank_ifsc: getText(input.bank_ifsc).toUpperCase() || null,

        // Intentionally preserve:
        // customPayroll
        // payrollId
      },
    });

    if (result.count === 0) {
      return {
        success: false,
        message: "Employee not found in this company.",
      };
    }

    revalidatePath(`/company/${slug}/employees`);
    revalidatePath(`/company/${slug}/employees/${id}`);
    revalidatePath(`/company/${slug}`);

    return {
      success: true,
      message: "Employee updated successfully.",
    };
  } catch (error) {
    console.error("Failed to update employee:", error);

    if ((error as { code?: string }).code === "P2002") {
      return {
        success: false,
        message: "This employee ID is already registered in this company.",
      };
    }

    return {
      success: false,
      message: "Unable to update employee. Please try again.",
    };
  }
}
