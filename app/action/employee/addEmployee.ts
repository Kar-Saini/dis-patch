"use server";

import prisma from "@/utils";

interface AddEmployeeInput {
  // Employee Information
  name: string;
  employee_id: string;
  designation: string;
  date_of_joining: string;
  email: string;
  phone_num: string;

  // Personal & Identification Details
  passport_no: string;
  date_of_birth: string;
  nationality: string;
  visa_no: string;
  frro_reg_no: string;
  tax_residency_status: string;
  iw_ssa_status: string;

  // Bank & Tax Details
  pan_num: string;
  bank_acc_num: string;
  bank: string;
  bank_ifsc: string;
  employer_tan: string;
}

function parseDate(value: string): Date | null {
  if (!value?.trim()) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Please provide a valid date.");
  }

  return date;
}

export default async function addEmployee(employee: AddEmployeeInput) {
  // Validate required fields on the server
  const requiredFields = [
    employee.name,
    employee.employee_id,
    employee.designation,
    employee.date_of_joining,
    employee.email,
    employee.phone_num,
    employee.pan_num,
    employee.bank_acc_num,
    employee.bank,
    employee.bank_ifsc,
  ];

  if (requiredFields.some((field) => !field?.trim())) {
    throw new Error("Please fill in all required fields.");
  }

  const dateOfJoining = parseDate(employee.date_of_joining);
  const dateOfBirth = parseDate(employee.date_of_birth);

  if (!dateOfJoining) {
    throw new Error("Date of joining is required.");
  }

  try {
    const newEmployee = await prisma.employee.create({
      data: {
        // Employee Information
        name: employee.name.trim(),
        employee_id: employee.employee_id.trim(),
        designation: employee.designation.trim(),
        date_of_joining: dateOfJoining,
        email: employee.email.trim(),
        phone_num: employee.phone_num.trim(),

        // Personal & Identification Details
        passport_no: employee.passport_no.trim() || null,
        date_of_birth: dateOfBirth,
        nationality: employee.nationality.trim() || null,
        visa_no: employee.visa_no.trim() || null,
        frro_reg_no: employee.frro_reg_no.trim() || null,
        tax_residency_status: employee.tax_residency_status.trim() || null,
        iw_ssa_status: employee.iw_ssa_status.trim() || null,

        // Bank & Tax Details
        pan_num: employee.pan_num.trim().toUpperCase(),
        bank_acc_num: employee.bank_acc_num.trim(),
        bank: employee.bank.trim(),
        bank_ifsc: employee.bank_ifsc.trim().toUpperCase(),
        employer_tan: employee.employer_tan.trim().toUpperCase() || null,
      },
    });

    return newEmployee.id;
  } catch (error) {
    console.error("Failed to create employee:", error);

    throw new Error(
      "Failed to create employee. Check whether the email or employee ID already exists.",
    );
  }
}
