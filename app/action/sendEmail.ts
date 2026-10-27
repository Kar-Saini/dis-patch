"use server";

import transporter from "@/mailer";
import { EmailStatus } from "@prisma/client";
import type { Employee } from "@prisma/client";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import puppeteer from "puppeteer";

import { SALARY_CONSTANTS } from "./salaryConstants";
import getEmployeeByEmail from "./getEmployeeByEmail";
import prisma from "@/utils";

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

type TemplateValues = Record<string, string | number>;

/* ---------------------------------------------------
   READ THE HTML TEMPLATE
--------------------------------------------------- */

async function readPayslipTemplate(): Promise<string> {
  const paths = [
    join(process.cwd(), "template", "new_tempalte.html"),
    join(process.cwd(), "template", "new_template.html"),
    join(process.cwd(), "public", "new_template.html"),
    join(process.cwd(), "new_template.html"),
  ];

  for (const filePath of paths) {
    try {
      return await readFile(filePath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  throw new Error(
    "Payslip template not found. Put new_template.html in the project root or public folder.",
  );
}

/* ---------------------------------------------------
   HELPERS
--------------------------------------------------- */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function getMonthNumber(month: string, year: string): number {
  const value = month.trim();

  // Accept YYYY-MM.
  const yearMonthMatch = value.match(/^\d{4}-(\d{2})$/);

  if (yearMonthMatch) {
    const number = Number(yearMonthMatch[1]);

    if (number >= 1 && number <= 12) return number;
  }

  // Accept numeric months such as 10.
  if (/^\d{1,2}$/.test(value)) {
    const number = Number(value);

    if (number >= 1 && number <= 12) return number;
  }

  // Accept names such as October.
  const date = new Date(`${value} 1, ${year}`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid payslip month: ${month}`);
  }

  return date.getMonth() + 1;
}

function getMonthLabel(month: string, year: string): string {
  const monthNumber = getMonthNumber(month, year);

  return new Date(Number(year), monthNumber - 1, 1).toLocaleDateString(
    "en-IN",
    { month: "long" },
  );
}

/* ---------------------------------------------------
   BUILD TEMPLATE DATA
--------------------------------------------------- */

function getPayslipTemplateData(
  employee: Employee,
  month: string,
  year: string,
): TemplateValues {
  // Preserve all existing constants, including the logo.
  const constants = SALARY_CONSTANTS as unknown as TemplateValues;

  return {
    ...constants,

    // Employee Summary
    employee_name: employee.name,
    employee_id: employee.employee_id || employee.id,
    designation: employee.designation,
    month,
    year,
    pay_date: formatDate(new Date()),
    date_of_joining: formatDate(employee.date_of_joining),
    paid_days: constants.paid_days ?? 0,
    lop_days: constants.lop_days ?? 0,

    // Employee Information
    passport_no: employee.passport_no || "N/A",
    date_of_birth: formatDate(employee.date_of_birth),
    nationality: employee.nationality || "N/A",
    visa_no: employee.visa_no || "N/A",
    frro_reg_no: employee.frro_reg_no || "N/A",
    tax_residency_status: employee.tax_residency_status || "N/A",
    iw_ssa_status: employee.iw_ssa_status || "N/A",

    // Bank and Tax Details
    pan: employee.pan_num,
    bank: employee.bank,
    account_no: employee.bank_acc_num,
    ifsc: employee.bank_ifsc,
    employer_tan: employee.employer_tan || "N/A",

    // These default to zero without removing any other constants.
    basic_arrears: constants.basic_arrears ?? "0.00",
    special_allowance_arrears: constants.special_allowance_arrears ?? "0.00",
    performance_bonus: constants.performance_bonus ?? "0.00",
    total_arrears_bonus: constants.total_arrears_bonus ?? "0.00",
  };
}

/* ---------------------------------------------------
   FILL THE HTML TEMPLATE
--------------------------------------------------- */

function fillTemplate(template: string, values: TemplateValues): string {
  return template.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (_match, key: string) => escapeHtml(String(values[key] ?? "N/A")),
  );
}

/* ---------------------------------------------------
   CONVERT HTML TO PDF
--------------------------------------------------- */

async function generatePdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width: 1100,
      height: 1400,
      deviceScaleFactor: 1,
    });

    await page.setContent(html, {
      waitUntil: "load",
      timeout: 30000,
    });

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
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
  const year = Number(monthAndYear.year);

  if (!Number.isInteger(year) || year < 1900 || year > 9999) {
    throw new Error("Invalid payslip year.");
  }

  const monthNumber = getMonthNumber(monthAndYear.month, monthAndYear.year);

  const monthLabel = getMonthLabel(monthAndYear.month, monthAndYear.year);

  const logs: {
    employeeId: string;
    month: number;
    year: number;
    status: EmailStatus;
    messageId: string;
  }[] = [];

  const results: EmailResult[] = [];

  // Load the HTML template once per batch.
  const template = await readPayslipTemplate();

  for (const email of employeeEmails) {
    let employee: Employee | null = null;

    try {
      const foundEmployee = await getEmployeeByEmail(email);

      if (!foundEmployee || typeof foundEmployee === "string") {
        results.push({
          email,
          status: "FAILED",
          error:
            typeof foundEmployee === "string"
              ? foundEmployee
              : `Employee not found: ${email}`,
        });

        continue;
      }

      employee = foundEmployee as Employee;

      // Populate the uploaded new-format HTML.
      const values = getPayslipTemplateData(employee, monthLabel, String(year));

      const populatedHtml = fillTemplate(template, values);

      // Render the populated HTML as a PDF.
      const pdfBuffer = await generatePdf(populatedHtml);

      // Email the PDF attachment.
      const info = await sendEmailWithAttachment({
        employee,
        month: monthLabel,
        year: String(year),
        subject,
        pdfBuffer,
      });

      results.push({
        email: employee.email,
        status: "SENT",
        messageId: info.messageId,
      });

      logs.push({
        employeeId: employee.id,
        month: monthNumber,
        year,
        status: EmailStatus.SENT,
        messageId: info.messageId ?? "",
      });

      console.info(`Salary slip sent to ${employee.email}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.error(`Failed to send salary slip to ${email}:`, error);

      results.push({
        email,
        status: "FAILED",
        error: message,
      });

      if (employee) {
        logs.push({
          employeeId: employee.id,
          month: monthNumber,
          year,
          status: EmailStatus.FAILED,
          messageId: "",
        });
      }
    }
  }

  // Store delivery logs separately so a logging error doesn't
  // incorrectly report already-sent emails as failed.
  let logWarning: string | undefined;

  if (logs.length > 0) {
    try {
      await prisma.payslipLog.createMany({
        data: logs,
      });
    } catch (error) {
      console.error("Failed to save payslip email logs:", error);
      logWarning =
        "Emails were processed, but the payslip logs could not be saved.";
    }
  }

  const totalSent = results.filter((result) => result.status === "SENT").length;

  const totalFailed = results.filter(
    (result) => result.status === "FAILED",
  ).length;

  return {
    success: totalSent > 0 && totalFailed === 0,
    totalSent,
    totalFailed,
    results,
    ...(logWarning ? { warning: logWarning } : {}),
  };
}

/* ---------------------------------------------------
   SEND EMAIL WITH PDF ATTACHMENT
--------------------------------------------------- */

async function sendEmailWithAttachment({
  employee,
  month,
  year,
  subject,
  pdfBuffer,
}: {
  employee: Employee;
  month: string;
  year: string;
  subject: string;
  pdfBuffer: Buffer;
}) {
  const from = process.env.SMTP_USER;

  if (!from) {
    throw new Error("SMTP_USER is missing from your environment variables.");
  }

  const safeName = escapeHtml(employee.name);
  const safeMonth = escapeHtml(month);
  const safeYear = escapeHtml(year);

  const text = `
Dear ${employee.name},

Please find attached your salary slip for ${month} ${year}.

Please review the details and contact HR if you notice any discrepancies.

Thank you for your continued contribution to Goa Oceanarium Private Limited.

Warm regards,
HR Department
Goa Oceanarium Private Limited
`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <p>Dear ${safeName},</p>
      <p>
        Please find attached your salary slip for
        ${safeMonth} ${safeYear}.
      </p>
      <p>
        Please review the details and contact HR if you notice
        any discrepancies.
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
    text,
    html,
    attachments: [
      {
        filename: `Payslip_${month}_${year}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
