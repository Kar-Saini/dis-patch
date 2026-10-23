"use server";

import transporter from "@/mailer";
import { EmailStatus } from "@prisma/client";
import type { Employee } from "@prisma/client";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";

import { SALARY_CONSTANTS } from "./salaryConstants";
import getEmployeeByEmail from "./getEmployeeByEmail";
import prisma from "@/utils";
import type { SALARY_SLIP_DATA_TYPE } from "@/lib/types";
import SalarySlipDocument from "@/components/SalarySlipDocument";

interface MonthAndYear {
  month: string;
  year: string;
}

interface EmailResult {
  email: string;
  status: "SENT" | "FAILED";
  messageId?: string;
  error?: string;
}

/* ---------------------------------------------------
   HELPERS
--------------------------------------------------- */

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getMonthNumber(month: string, year: string): number {
  const normalizedMonth = month.trim();

  // Support numeric months: "1", "01", ..., "12".
  if (/^\d{1,2}$/.test(normalizedMonth)) {
    const numericMonth = Number(normalizedMonth);

    if (numericMonth >= 1 && numericMonth <= 12) {
      return numericMonth;
    }
  }

  // Also support input such as "2026-10".
  const yearMonthMatch = normalizedMonth.match(/^\d{4}-(\d{2})$/);

  if (yearMonthMatch) {
    const numericMonth = Number(yearMonthMatch[1]);

    if (numericMonth >= 1 && numericMonth <= 12) {
      return numericMonth;
    }
  }

  // Support month names such as "October".
  const parsedDate = new Date(`${normalizedMonth} 1, ${year}`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid payslip month: ${month}`);
  }

  return parsedDate.getMonth() + 1;
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------------------------------------------------
   SEND SALARY EMAILS
--------------------------------------------------- */

export async function sendSalaryEmail({
  employeeEmails,
  monthAndYear,
  subject,
}: {
  employeeEmails: string[];
  monthAndYear: MonthAndYear;
  subject: string;
}) {
  const month = getMonthNumber(monthAndYear.month, monthAndYear.year);

  const year = Number(monthAndYear.year);

  if (!Number.isInteger(year) || year < 1900 || year > 9999) {
    throw new Error("Invalid payslip year.");
  }

  const logs: {
    employeeId: string;
    month: number;
    year: number;
    status: EmailStatus;
    messageId: string;
  }[] = [];

  const results: EmailResult[] = [];

  for (const email of employeeEmails) {
    let employee: Employee | null = null;

    try {
      // Fetch each employee only once per iteration.
      const foundEmployee = await getEmployeeByEmail(email);

      if (!foundEmployee || typeof foundEmployee === "string") {
        const reason =
          typeof foundEmployee === "string"
            ? foundEmployee
            : `No employee found for ${email}`;

        results.push({
          email,
          status: "FAILED",
          error: reason,
        });

        console.error(`Salary email skipped for ${email}: ${reason}`);
        continue;
      }

      employee = foundEmployee as Employee;

      // Build the PDF data.
      const slipData = getSalarySlipData(employee, monthAndYear);

      // Create a proper React element for PDF rendering.
      const pdfBuffer = await renderToBuffer(
        createElement(SalarySlipDocument, {
          data: slipData,
        }) as any,
      );

      // Send the generated PDF.
      const info = await sendEmailWithAttachment({
        employee,
        monthAndYear,
        subject,
        pdfBuffer: Buffer.from(pdfBuffer),
      });

      results.push({
        email: employee.email,
        status: "SENT",
        messageId: info.messageId,
      });

      logs.push({
        employeeId: employee.id,
        month,
        year,
        status: EmailStatus.SENT,
        messageId: info.messageId ?? "",
      });

      console.info(`Salary email sent to ${employee.email}`);
    } catch (error) {
      const message = getErrorMessage(error);

      console.error(`Failed to send salary email to ${email}:`, error);

      results.push({
        email,
        status: "FAILED",
        error: message,
      });

      // Log failures without fetching the employee a second time.
      if (employee) {
        logs.push({
          employeeId: employee.id,
          month,
          year,
          status: EmailStatus.FAILED,
          messageId: "",
        });
      }
    }
  }

  // Persist the results of successful sends and failures.
  if (logs.length > 0) {
    await prisma.payslipLog.createMany({
      data: logs,
    });
  }

  const totalSent = results.filter((result) => result.status === "SENT").length;

  const totalFailed = results.filter(
    (result) => result.status === "FAILED",
  ).length;

  return {
    success: totalFailed === 0 && totalSent > 0,
    totalSent,
    totalFailed,
    results,
  };
}

/* ---------------------------------------------------
   BUILD SALARY SLIP DATA
--------------------------------------------------- */

function getSalarySlipData(
  employee: Employee,
  monthAndYear: MonthAndYear,
): SALARY_SLIP_DATA_TYPE {
  const data = {
    // Retain all existing salary constants and the logo.
    ...SALARY_CONSTANTS,

    // Employee summary.
    employee_name: employee.name,
    employee_id: employee.employee_id || employee.id,
    designation: employee.designation,

    month: monthAndYear.month,
    year: monthAndYear.year,
    pay_date: formatDate(new Date()),

    // Employee information.
    date_of_joining: formatDate(employee.date_of_joining),
    passport_no: employee.passport_no ?? "N/A",
    date_of_birth: formatDate(employee.date_of_birth),
    nationality: employee.nationality ?? "N/A",
    visa_no: employee.visa_no ?? "N/A",
    frro_reg_no: employee.frro_reg_no ?? "N/A",
    tax_residency_status: employee.tax_residency_status ?? "N/A",
    iw_ssa_status: employee.iw_ssa_status ?? "N/A",

    // Bank and tax details.
    pan: employee.pan_num,
    bank: employee.bank,
    account_no: employee.bank_acc_num,
    ifsc: employee.bank_ifsc,
    employer_tan: employee.employer_tan ?? "N/A",
  };

  return data as SALARY_SLIP_DATA_TYPE;
}

/* ---------------------------------------------------
   SEND EMAIL WITH PDF ATTACHMENT
--------------------------------------------------- */

async function sendEmailWithAttachment({
  employee,
  monthAndYear,
  subject,
  pdfBuffer,
}: {
  employee: Employee;
  monthAndYear: MonthAndYear;
  subject: string;
  pdfBuffer: Buffer;
}) {
  const from = process.env.SMTP_USER;

  if (!from) {
    throw new Error("SMTP_USER is missing. Check your environment variables.");
  }

  const employeeName = escapeHtml(employee.name);

  const emailText = `
Dear ${employee.name},

Please find attached your salary slip for ${monthAndYear.month} ${monthAndYear.year}.

Kindly review the details. If you notice any discrepancies or have any queries, please contact the HR department.

Thank you for your continued contribution to Goa Oceanarium Private Limited.

Warm regards,
HR Department
Goa Oceanarium Private Limited
`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <p>Dear ${employeeName},</p>

      <p>
        Please find attached your salary slip for
        ${escapeHtml(monthAndYear.month)}
        ${escapeHtml(monthAndYear.year)}.
      </p>

      <p>
        Kindly review the details. If you notice any discrepancies
        or have any queries, please contact the HR department.
      </p>

      <p>
        Thank you for your continued contribution to
        Goa Oceanarium Private Limited.
      </p>

      <p>
        Warm regards,<br />
        <strong>HR Department</strong><br />
        Goa Oceanarium Private Limited
      </p>
    </div>
  `;

  return transporter.sendMail({
    from,
    to: employee.email,
    subject,
    text: emailText,
    html: emailHtml,
    attachments: [
      {
        filename: `Payslip_${monthAndYear.month}_${monthAndYear.year}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
