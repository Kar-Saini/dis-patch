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

type DayStatus = "working" | "off" | "leave";
type CalendarStatus = Record<string, DayStatus>;

interface EmailResult {
  email: string;
  status: "SENT" | "FAILED";
  messageId?: string;
  error?: string;
}

type TemplateValues = Record<string, string | number>;

/* ---------------------------------------------------
   LOGGING HELPERS
--------------------------------------------------- */

function logSection(title: string) {
  console.info(`\n========== ${title} ==========`);
}

function logErrorDetails(error: unknown) {
  const err = error as Error & {
    code?: string;
    command?: string;
    response?: string;
    responseCode?: number;
  };

  console.error("Error message:", err?.message ?? String(error));
  console.error("Error code:", err?.code ?? "N/A");
  console.error("SMTP command:", err?.command ?? "N/A");
  console.error("SMTP response code:", err?.responseCode ?? "N/A");
  console.error("SMTP response:", err?.response ?? "N/A");
  console.error("Full error:", error);
}

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
  console.log(paths);
  logSection("PAYSLIP TEMPLATE: LOADING");
  console.info("Project directory:", process.cwd());

  for (const filePath of paths) {
    try {
      const template = await readFile(filePath, "utf8");

      console.info("Template loaded successfully:", filePath);
      console.info("Template size:", `${template.length} characters`);

      return template;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("Failed to read template:", filePath);
        logErrorDetails(error);
        throw error;
      }

      console.info("Template not found at:", filePath);
    }
  }

  const message =
    "Payslip template not found. Expected template/new_tempalte.html, template/new_template.html, public/new_template.html, or new_template.html in the project root.";

  console.error(message);
  throw new Error(message);
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

function parseAmount(value: unknown): number {
  const parsed = Number(String(value ?? "0").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: number): string {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });
}

function numberToWordsIndian(value: number): string {
  const ones = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const underThousand = (n: number): string => {
    const parts: string[] = [];
    if (n >= 100) {
      parts.push(`${ones[Math.floor(n / 100)]} Hundred`);
      n %= 100;
    }
    if (n >= 20) {
      parts.push(tens[Math.floor(n / 10)]);
      if (n % 10) parts.push(ones[n % 10]);
    } else if (n > 0) {
      parts.push(ones[n]);
    }
    return parts.join(" ");
  };

  if (!Number.isFinite(value) || value < 0) return "Zero";
  let n = Math.floor(value);
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const groups: Array<[number, string]> = [
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
    [1, ""],
  ];
  for (const [unit, label] of groups) {
    if (n >= unit) {
      const count = Math.floor(n / unit);
      parts.push(underThousand(count) + (label ? ` ${label}` : ""));
      n %= unit;
    }
  }
  return parts.join(" ").trim();
}

function getAttendanceSalaryValues(
  calendarStatus: CalendarStatus,
  year: number,
  monthNumber: number,
): TemplateValues {
  const totalCalendarDays = new Date(year, monthNumber, 0).getDate();
  const salaryBasisDays = 22; // SALARY_CONSTANTS represent a full 22-working-day month.
  let workingDays = 0;
  let offDays = 0;
  let leaveDays = 0;

  for (const [dateKey, status] of Object.entries(calendarStatus)) {
    const [dateYear, dateMonth, dateDay] = dateKey.split("-").map(Number);
    if (
      dateYear !== year ||
      dateMonth !== monthNumber ||
      dateDay < 1 ||
      dateDay > totalCalendarDays
    ) {
      continue;
    }

    if (status === "working") workingDays++;
    else if (status === "off") offDays++;
    else if (status === "leave") leaveDays++;
  }

  // Salary constants are based on 22 working days. Only days marked "working"
  // count as worked/paid days; "off" days are non-working days and "leave"
  // days are treated as unpaid leave (LOP).
  const paidDays = Math.min(workingDays, salaryBasisDays);
  const lopDays = Math.min(leaveDays, Math.max(0, salaryBasisDays - paidDays));
  const payableRatio = paidDays / salaryBasisDays;

  const basic = parseAmount(SALARY_CONSTANTS.basic) * payableRatio;
  const hra = parseAmount(SALARY_CONSTANTS.hra) * payableRatio;
  const specialAllowance =
    parseAmount(SALARY_CONSTANTS.special_allowance) * payableRatio;
  const grossEarnings = basic + hra + specialAllowance;

  // These constants are also treated as full-month amounts and prorated using
  // the same 22-working-day ratio. Change this if your payroll policy requires
  // tax/PF/ESI to be calculated by separate statutory rules.
  const tds = parseAmount(SALARY_CONSTANTS.income_tax) * payableRatio;
  const pf = parseAmount(SALARY_CONSTANTS.pf) * payableRatio;
  const esi =
    parseAmount((SALARY_CONSTANTS as Record<string, unknown>).esi) *
    payableRatio;
  const cess = parseAmount(SALARY_CONSTANTS.cess) * payableRatio;
  const configuredTotalDeductions = parseAmount(
    SALARY_CONSTANTS.total_deductions,
  );
  const totalDeductions =
    configuredTotalDeductions > 0
      ? configuredTotalDeductions * payableRatio
      : tds + pf + esi + cess;
  const netPay = grossEarnings - totalDeductions;

  console.info("Attendance and salary calculation:", {
    salaryBasisDays,
    totalCalendarDays,
    workingDays,
    offDays,
    leaveDays,
    paidDays,
    lopDays,
    payableRatio,
    basic: formatAmount(basic),
    hra: formatAmount(hra),
    specialAllowance: formatAmount(specialAllowance),
    grossEarnings: formatAmount(grossEarnings),
    totalDeductions: formatAmount(totalDeductions),
    netPay: formatAmount(netPay),
  });

  return {
    basic: formatAmount(basic),
    hra: formatAmount(hra),
    special_allowance: formatAmount(specialAllowance),
    gross_earnings: formatAmount(grossEarnings),
    paid_days: paidDays,
    lop_days: lopDays,
    salary_basis_days: salaryBasisDays,
    total_calendar_days: totalCalendarDays,
    working_days: workingDays,
    off_days: offDays,
    leave_days: leaveDays,
    income_tax: formatAmount(tds),
    pf: formatAmount(pf),
    esi: formatAmount(esi),
    cess: formatAmount(cess),
    total_deductions: formatAmount(totalDeductions),
    net_pay: formatAmount(netPay),
    net_pay_words: `Rupees ${numberToWordsIndian(Math.max(0, netPay))} Only`,
  };
}

/* ---------------------------------------------------
   BUILD TEMPLATE DATA
--------------------------------------------------- */

function getPayslipTemplateData(
  employee: Employee,
  month: string,
  year: string,
  salaryValues: TemplateValues,
): TemplateValues {
  // Preserve existing constants, including the logo, then override salary
  // fields with values calculated from this month's attendance calendar.
  const constants = {
    ...(SALARY_CONSTANTS as unknown as TemplateValues),
    ...salaryValues,
  };

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

    // Arrears and bonuses
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
  const populatedHtml = template.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (_match, key: string) => escapeHtml(String(values[key] ?? "N/A")),
  );

  const remainingPlaceholders = populatedHtml.match(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
  );

  if (remainingPlaceholders?.length) {
    console.warn("Unresolved HTML template placeholders:", [
      ...new Set(remainingPlaceholders),
    ]);
  } else {
    console.info("All HTML template placeholders were processed.");
  }

  return populatedHtml;
}

/* ---------------------------------------------------
   CONVERT HTML TO PDF
--------------------------------------------------- */

async function generatePdf(html: string): Promise<Buffer> {
  logSection("PDF GENERATION: STARTED");

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();

    page.on("console", (message) => {
      if (message.type() === "error") {
        console.error("[PDF Browser Console]", message.text());
      }
    });

    page.on("pageerror", (error) => {
      console.error("[PDF Browser Error]", error.message as string);
    });

    page.on("requestfailed", (request) => {
      console.error("[PDF Resource Failed]", {
        url: request.url(),
        error: request.failure()?.errorText,
      });
    });

    await page.setViewport({
      width: 1100,
      height: 1400,
      deviceScaleFactor: 1,
    });

    await page.setContent(html, {
      waitUntil: "load",
      timeout: 30000,
    });

    // Wait for images to finish loading before generating the PDF.
    const imageResults = await page.evaluate(async () => {
      const images = Array.from(document.images);

      return Promise.all(
        images.map(
          (img) =>
            new Promise<{
              src: string;
              loaded: boolean;
              naturalWidth: number;
            }>((resolve) => {
              const finish = () =>
                resolve({
                  src: img.currentSrc || img.src,
                  loaded: img.complete && img.naturalWidth > 0,
                  naturalWidth: img.naturalWidth,
                });

              if (img.complete) {
                finish();
                return;
              }

              img.addEventListener("load", finish, { once: true });
              img.addEventListener("error", finish, { once: true });
            }),
        ),
      );
    });

    console.info("PDF image loading results:", imageResults);

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

    const pdfBuffer = Buffer.from(pdf);

    console.info("PDF generated successfully.");
    console.info("PDF size:", `${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    return pdfBuffer;
  } catch (error) {
    console.error("PDF GENERATION FAILED");
    logErrorDetails(error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/* ---------------------------------------------------
   SEND SALARY EMAILS
--------------------------------------------------- */

export async function sendSalaryEmail({
  employeeEmails,
  monthAndYear,
  subject,
  calendarStatus,
}: {
  employeeEmails: string[];
  monthAndYear: MonthAndYear;
  subject: string;
  calendarStatus: CalendarStatus;
  // Accepted from the UI for convenience; the server recalculates counts
  // from calendarStatus so the salary calculation uses the actual calendar.
  workingDays?: number;
  offDays?: number;
  leaveDays?: number;
}) {
  logSection("SALARY EMAIL BATCH: STARTED");

  console.info("Recipients requested:", employeeEmails.length);
  console.info("Payslip month:", monthAndYear.month);
  console.info("Payslip year:", monthAndYear.year);
  console.info("Subject:", subject);

  const year = Number(monthAndYear.year);

  if (!Number.isInteger(year) || year < 1900 || year > 9999) {
    throw new Error("Invalid payslip year.");
  }

  const monthNumber = getMonthNumber(monthAndYear.month, monthAndYear.year);

  const monthLabel = getMonthLabel(monthAndYear.month, monthAndYear.year);
  const salaryValues = getAttendanceSalaryValues(
    calendarStatus,
    year,
    monthNumber,
  );

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

    logSection(`PROCESSING RECIPIENT: ${email}`);

    try {
      console.info("Looking up employee:", email);

      const foundEmployee = await getEmployeeByEmail(email);

      if (!foundEmployee || typeof foundEmployee === "string") {
        const message =
          typeof foundEmployee === "string"
            ? foundEmployee
            : `Employee not found: ${email}`;

        console.error("EMPLOYEE LOOKUP FAILED:", message);

        results.push({
          email,
          status: "FAILED",
          error: message,
        });

        continue;
      }

      employee = foundEmployee as Employee;

      console.info("Employee found:", {
        name: employee.name,
        employeeId: employee.employee_id || employee.id,
        email: employee.email,
        designation: employee.designation,
      });

      // Populate the HTML template.
      console.info("Populating payslip HTML template.");

      const values = getPayslipTemplateData(
        employee,
        monthLabel,
        String(year),
        salaryValues,
      );

      const populatedHtml = fillTemplate(template, values);

      console.info("HTML template populated successfully.");
      console.info("Generating PDF for:", employee.email);

      // Render the populated HTML as a PDF.
      const pdfBuffer = await generatePdf(populatedHtml);

      console.info("PDF ready. Sending email to:", employee.email);

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

      console.info("RECIPIENT PROCESS COMPLETED SUCCESSFULLY:", {
        employee: employee.name,
        email: employee.email,
        messageId: info.messageId,
      });
    } catch (error) {
      const err = error as Error & {
        code?: string;
        command?: string;
        response?: string;
        responseCode?: number;
      };

      console.error("========== PAYSLIP PROCESSING FAILED ==========");
      console.error("Recipient:", email);
      console.error("Employee:", employee?.name ?? "Employee lookup failed");
      console.error("Payslip period:", `${monthLabel} ${year}`);
      logErrorDetails(error);
      console.error("================================================");

      results.push({
        email,
        status: "FAILED",
        error: err?.message || String(error),
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
      console.info("Saving payslip delivery logs.");

      await prisma.payslipLog.createMany({
        data: logs,
      });

      console.info("Payslip delivery logs saved successfully.");
    } catch (error) {
      console.error("FAILED TO SAVE PAYSLIP DELIVERY LOGS");
      logErrorDetails(error);

      logWarning =
        "Emails were processed, but the payslip logs could not be saved.";
    }
  }

  const totalSent = results.filter((result) => result.status === "SENT").length;

  const totalFailed = results.filter(
    (result) => result.status === "FAILED",
  ).length;

  logSection("SALARY EMAIL BATCH: FINAL SUMMARY");

  console.info("Total requested:", employeeEmails.length);
  console.info("Successfully sent:", totalSent);
  console.info("Failed:", totalFailed);
  console.info("Results:", results);

  if (logWarning) {
    console.warn("Warning:", logWarning);
  }

  console.info("===============================================\n");

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

  logSection("SALARY EMAIL: SENDING");

  console.info("Recipient:", employee.email);
  console.info("Employee:", employee.name);
  console.info("Payslip period:", `${month} ${year}`);
  console.info("Subject:", subject);
  console.info("From:", from);
  console.info("PDF attachment:", `Payslip_${month}_${year}.pdf`);
  console.info("PDF size:", `${(pdfBuffer.length / 1024).toFixed(2)} KB`);

  try {
    const info = await transporter.sendMail({
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

    logSection("SALARY EMAIL: SUCCESS");

    console.info("Recipient:", employee.email);
    console.info("Employee:", employee.name);
    console.info("Message ID:", info.messageId);
    console.info("SMTP response:", info.response);
    console.info("Accepted recipients:", info.accepted);
    console.info("Rejected recipients:", info.rejected);

    // Nodemailer can resolve even if a recipient was rejected.
    const accepted = info.accepted.some(
      (recipient) =>
        String(recipient).toLowerCase() === employee.email.toLowerCase(),
    );

    const rejected = info.rejected.some(
      (recipient) =>
        String(recipient).toLowerCase() === employee.email.toLowerCase(),
    );

    if (!accepted || rejected) {
      throw new Error(
        `SMTP did not confirm acceptance for recipient ${employee.email}. ` +
          `Accepted: ${JSON.stringify(info.accepted)}. ` +
          `Rejected: ${JSON.stringify(info.rejected)}.`,
      );
    }

    console.info("SMTP accepted the recipient successfully.");
    console.info("============================================");

    return info;
  } catch (error) {
    console.error("========== SALARY EMAIL: FAILED ==========");
    console.error("Recipient:", employee.email);
    console.error("Employee:", employee.name);
    console.error("Payslip period:", `${month} ${year}`);
    logErrorDetails(error);
    console.error("==========================================");

    throw error;
  }
}
