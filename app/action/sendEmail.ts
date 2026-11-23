"use server";

import "server-only";

import prisma from "@/utils";
import transporter from "@/mailer";

import {
  EmailStatus,
  PayrollCalculationMode,
  PayrollComponentType,
  Prisma,
} from "@prisma/client";

import payslipTemplate from "@/template/payslipTemplate";

import puppeteer from "puppeteer-core";
import type { Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

import { revalidatePath } from "next/cache";

// ======================================================
// REQUEST AND RESPONSE TYPES
// ======================================================

type EmployeeAttendanceInput = {
  employeeId: string;
  workingDays: number;
  offDays: number;
  leaveDays: number;
};

type SendSalaryEmailInput = {
  slug: string;
  month: number;
  year: number;
  subject: string;
  employees: EmployeeAttendanceInput[];
};

type EmailResult = {
  employeeId: string;
  email: string;
  status: "SENT" | "FAILED";
  messageId?: string;
  payslipLogId?: string;
  error?: string;
};

type TemplateValues = Record<string, string | number>;

type Attendance = {
  workingDays: number;
  offDays: number;
  leaveDays: number;
};

type AttendanceMetrics = {
  totalCalendarDays: number;
  workingDays: number;
  offDays: number;
  leaveDays: number;
  monthlySalaryBasis: number;
  paidDays: number;
  lopDays: number;
  payFactor: number;
};

type PayrollComponentRecord = {
  id: string;
  code: string;
  name: string;
  type: PayrollComponentType;
  mode: PayrollCalculationMode;
  value: {
    toString(): string;
  };
  isEnabled: boolean;
  sortOrder: number;
};

type PayrollRecord = {
  id: string;
  name: string;
  companyId: string;
  isDefault: boolean;
  components: PayrollComponentRecord[];
};

type CompanyRecord = {
  id: string;
  name: string;
  bannerUrl: string | null;
  registeredAddress: string | null;
  employerTan: string | null;
  currency: string;
  payrolls: PayrollRecord[];
};

type EmployeeRecord = {
  id: string;
  companyId: string;
  name: string;
  employee_id: string | null;
  designation: string;
  email: string;
  phone_num: string;
  date_of_birth: Date | null;
  nationality: string | null;
  address: string | null;
  passport_no: string | null;
  visa_no: string | null;
  frro_reg_no: string | null;
  tax_residency_status: string | null;
  iw_ssa_status: string | null;
  pan_num: string | null;
  bank_acc_num: string | null;
  bank: string | null;
  bank_ifsc: string | null;
  customPayroll: boolean;
  payrollId: string;
  payroll: PayrollRecord;
};

type CalculatedComponent = {
  code: string;
  name: string;
  type: "EARNING" | "DEDUCTION";
  mode: "FIXED_AMOUNT" | "PERCENT_OF_BASIC";
  configuredValue: number;
  monthlyAmount: number;
  payableAmount: number;
  isEnabled: boolean;
  isOneTime: boolean;
};

type CalculatedPayslip = {
  attendance: AttendanceMetrics;
  payrollSource: "COMPANY_STANDARD" | "CUSTOM";
  payrollName: string;
  basicMonthly: number;
  basicPayable: number;
  earnings: CalculatedComponent[];
  deductions: CalculatedComponent[];
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
};

// ======================================================
// CONFIGURATION
// ======================================================

const TEMPLATE_VERSION = "v2";

const ONE_TIME_COMPONENT_CODES = new Set([
  "SPECIAL_ALLOWANCE_ARREARS",
  "PERFORMANCE_BONUS",
  "BASIC_ARREARS",
]);

// ======================================================
// GENERAL HELPERS
// ======================================================

function roundAmount(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseComponentAmount(value: { toString(): string }): number {
  const amount = Number(value.toString());

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Invalid payroll component amount.");
  }

  return amount;
}

function formatAmount(value: number): string {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });
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

function getMonthLabel(month: number, year: number): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function logSection(title: string) {
  console.info(`\n========== ${title} ==========`);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// ======================================================
// NUMBER TO WORDS
// ======================================================

function numberToWordsUnderThousand(value: number): string {
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

  const parts: string[] = [];

  if (value >= 100) {
    parts.push(`${ones[Math.floor(value / 100)]} Hundred`);
    value %= 100;
  }

  if (value >= 20) {
    parts.push(tens[Math.floor(value / 10)]);

    if (value % 10) {
      parts.push(ones[value % 10]);
    }
  } else if (value > 0) {
    parts.push(ones[value]);
  }

  return parts.join(" ");
}

function numberToWordsIndian(value: number): string {
  if (!Number.isFinite(value)) {
    return "Zero";
  }

  let amount = Math.floor(Math.abs(value));
  const parts: string[] = [];

  const units: Array<[number, string]> = [
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
    [1, ""],
  ];

  for (const [unit, label] of units) {
    if (amount >= unit) {
      const count = Math.floor(amount / unit);

      parts.push(
        `${numberToWordsUnderThousand(count)}${label ? ` ${label}` : ""}`,
      );

      amount %= unit;
    }
  }

  return parts.length > 0 ? parts.join(" ") : "Zero";
}

function getCurrencyWords(currency: string): {
  major: string;
  minor: string;
} {
  const currencies: Record<string, { major: string; minor: string }> = {
    INR: { major: "Rupees", minor: "Paise" },
    USD: { major: "Dollars", minor: "Cents" },
    GBP: { major: "Pounds", minor: "Pence" },
    EUR: { major: "Euros", minor: "Cents" },
    AED: { major: "Dirhams", minor: "Fils" },
  };

  return (
    currencies[currency] ?? {
      major: currency,
      minor: "Minor Units",
    }
  );
}

function getAmountInWords(value: number, currency: string): string {
  const roundedAmount = roundAmount(value);
  const absoluteAmount = Math.abs(roundedAmount);

  const majorAmount = Math.floor(absoluteAmount);
  const minorAmount = Math.round((absoluteAmount - majorAmount) * 100);

  const currencyWords = getCurrencyWords(currency);

  let words = `${currencyWords.major} ${numberToWordsIndian(majorAmount)}`;

  if (minorAmount > 0) {
    words += ` and ${numberToWordsUnderThousand(minorAmount)} ${currencyWords.minor}`;
  }

  return `${roundedAmount < 0 ? "Minus " : ""}${words} Only`;
}

// ======================================================
// REQUEST VALIDATION
// ======================================================

function validateDispatchInput(input: SendSalaryEmailInput) {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid dispatch request.");
  }

  if (typeof input.slug !== "string" || !input.slug.trim()) {
    throw new Error("Company slug is required.");
  }

  if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12) {
    throw new Error("Invalid payslip month.");
  }

  if (!Number.isInteger(input.year) || input.year < 1900 || input.year > 9999) {
    throw new Error("Invalid payslip year.");
  }

  if (
    typeof input.subject !== "string" ||
    !input.subject.trim() ||
    input.subject.length > 200
  ) {
    throw new Error("A valid email subject is required.");
  }

  if (!Array.isArray(input.employees) || input.employees.length === 0) {
    throw new Error("Select at least one employee.");
  }

  if (input.employees.length > 200) {
    throw new Error("A maximum of 200 employees can be dispatched at once.");
  }

  const totalCalendarDays = new Date(
    Date.UTC(input.year, input.month, 0),
  ).getUTCDate();

  const seen = new Set<string>();

  for (const employee of input.employees) {
    if (
      !employee ||
      typeof employee.employeeId !== "string" ||
      !employee.employeeId.trim()
    ) {
      throw new Error("An employee ID is missing.");
    }

    employee.employeeId = employee.employeeId.trim();

    if (seen.has(employee.employeeId)) {
      throw new Error("Duplicate employee in dispatch request.");
    }

    seen.add(employee.employeeId);

    const counts = [employee.workingDays, employee.offDays, employee.leaveDays];

    if (
      counts.some(
        (value) =>
          !Number.isInteger(value) || value < 0 || value > totalCalendarDays,
      )
    ) {
      throw new Error(
        `Invalid attendance for employee ${employee.employeeId}.`,
      );
    }

    const total = counts.reduce((sum, value) => sum + value, 0);

    if (total !== totalCalendarDays) {
      throw new Error(
        `Attendance for employee ${employee.employeeId} must total ${totalCalendarDays} calendar days.`,
      );
    }
  }

  return totalCalendarDays;
}

// ======================================================
// ATTENDANCE CALCULATION
// ======================================================

function calculateMonthlySalaryBasis(
  year: number,
  month: number,
  totalCalendarDays: number,
): number {
  let sundayCount = 0;

  for (let day = 1; day <= totalCalendarDays; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));

    if (date.getUTCDay() === 0) {
      sundayCount++;
    }
  }

  return totalCalendarDays - sundayCount;
}

function calculateAttendance(
  attendance: Attendance,
  monthlySalaryBasis: number,
  totalCalendarDays: number,
): AttendanceMetrics {
  if (
    !Number.isInteger(monthlySalaryBasis) ||
    monthlySalaryBasis <= 0 ||
    monthlySalaryBasis > totalCalendarDays
  ) {
    throw new Error("Invalid monthly salary basis.");
  }

  if (attendance.leaveDays > monthlySalaryBasis) {
    throw new Error("Unpaid leave cannot exceed the monthly salary basis.");
  }

  // Only unpaid leave reduces salary.
  // Sundays are excluded from the monthly salary basis.
  // Additional off-days remain paid.

  const lopDays = attendance.leaveDays;
  const paidDays = monthlySalaryBasis - lopDays;
  const payFactor = paidDays / monthlySalaryBasis;

  return {
    totalCalendarDays,
    workingDays: attendance.workingDays,
    offDays: attendance.offDays,
    leaveDays: attendance.leaveDays,
    monthlySalaryBasis,
    paidDays,
    lopDays,
    payFactor,
  };
}

// ======================================================
// PAYROLL RESOLUTION
// ======================================================

function resolvePayroll(
  employee: Pick<
    EmployeeRecord,
    "customPayroll" | "payroll" | "payrollId" | "companyId"
  >,
  defaultPayroll: PayrollRecord | null,
): {
  payroll: PayrollRecord;
  source: "COMPANY_STANDARD" | "CUSTOM";
} {
  if (!defaultPayroll) {
    throw new Error("No default company Payroll has been configured.");
  }

  if (
    !defaultPayroll.isDefault ||
    defaultPayroll.companyId !== employee.companyId
  ) {
    throw new Error("The default Payroll configuration is invalid.");
  }

  const assignedPayroll = employee.payroll;

  if (
    !assignedPayroll ||
    assignedPayroll.id !== employee.payrollId ||
    assignedPayroll.companyId !== employee.companyId
  ) {
    throw new Error("The employee's assigned Payroll is invalid.");
  }

  if (employee.customPayroll) {
    if (assignedPayroll.isDefault || assignedPayroll.id === defaultPayroll.id) {
      throw new Error(
        "Employee is marked for custom payroll but is assigned the company default Payroll.",
      );
    }

    return {
      payroll: assignedPayroll,
      source: "CUSTOM",
    };
  }

  if (!assignedPayroll.isDefault || assignedPayroll.id !== defaultPayroll.id) {
    throw new Error(
      "Employee is marked for company standard payroll but is not assigned the company default Payroll.",
    );
  }

  return {
    payroll: assignedPayroll,
    source: "COMPANY_STANDARD",
  };
}

// ======================================================
// SALARY COMPONENT CALCULATION
// ======================================================

function calculatePayslip(
  payroll: PayrollRecord,
  payrollSource: "COMPANY_STANDARD" | "CUSTOM",
  attendance: Attendance,
  monthlySalaryBasis: number,
  totalCalendarDays: number,
): CalculatedPayslip {
  const attendanceMetrics = calculateAttendance(
    attendance,
    monthlySalaryBasis,
    totalCalendarDays,
  );

  const components = payroll.components;

  const basicComponent = components.find(
    (component) => component.code === "BASIC_PAY",
  );

  if (!basicComponent || !basicComponent.isEnabled) {
    throw new Error(
      "Basic Pay is missing or disabled in the selected Payroll.",
    );
  }

  if (basicComponent.mode !== PayrollCalculationMode.FIXED_AMOUNT) {
    throw new Error("Basic Pay must be configured as a fixed amount.");
  }

  const basicMonthly = parseComponentAmount(basicComponent.value);

  if (basicMonthly <= 0) {
    throw new Error("Basic Pay must be greater than zero.");
  }

  const basicPayable = roundAmount(basicMonthly * attendanceMetrics.payFactor);

  const earnings: CalculatedComponent[] = [];
  const deductions: CalculatedComponent[] = [];

  for (const component of components) {
    if (!component.isEnabled) {
      continue;
    }

    if (
      component.type !== PayrollComponentType.EARNING &&
      component.type !== PayrollComponentType.DEDUCTION
    ) {
      throw new Error(`Invalid payroll type for ${component.code}.`);
    }

    const configuredValue = parseComponentAmount(component.value);

    let monthlyAmount: number;

    if (component.mode === PayrollCalculationMode.FIXED_AMOUNT) {
      monthlyAmount = configuredValue;
    } else if (component.mode === PayrollCalculationMode.PERCENT_OF_BASIC) {
      monthlyAmount = roundAmount(basicMonthly * (configuredValue / 100));
    } else {
      throw new Error(`Invalid calculation mode for ${component.name}.`);
    }

    const isOneTime = ONE_TIME_COMPONENT_CODES.has(component.code);

    const payableAmount = roundAmount(
      isOneTime ? monthlyAmount : monthlyAmount * attendanceMetrics.payFactor,
    );

    const line: CalculatedComponent = {
      code: component.code,
      name: component.name,
      type: component.type,
      mode: component.mode,
      configuredValue,
      monthlyAmount,
      payableAmount,
      isEnabled: true,
      isOneTime,
    };

    if (component.type === PayrollComponentType.EARNING) {
      earnings.push(line);
    } else {
      deductions.push(line);
    }
  }

  if (!earnings.some((component) => component.code === "BASIC_PAY")) {
    throw new Error("Basic Pay was not included in the earnings.");
  }

  const grossEarnings = roundAmount(
    earnings.reduce((total, component) => total + component.payableAmount, 0),
  );

  const totalDeductions = roundAmount(
    deductions.reduce((total, component) => total + component.payableAmount, 0),
  );

  const netPay = roundAmount(grossEarnings - totalDeductions);

  return {
    attendance: attendanceMetrics,
    payrollSource,
    payrollName: payroll.name,
    basicMonthly,
    basicPayable,
    earnings,
    deductions,
    grossEarnings,
    totalDeductions,
    netPay,
  };
}

// ======================================================
// TEMPLATE LOADING
// ======================================================

async function readPayslipTemplate(): Promise<string> {
  return payslipTemplate;
}
// ======================================================
// BUILD TEMPLATE DATA
// ======================================================

function getPayslipTemplateData(
  employee: EmployeeRecord,
  company: Omit<CompanyRecord, "payrolls">,
  month: string,
  year: number,
  payslip: CalculatedPayslip,
): TemplateValues {
  const componentAmount = (components: CalculatedComponent[], code: string) => {
    const component = components.find((item) => item.code === code);

    return component ? formatAmount(component.payableAmount) : "0.00";
  };

  const allOneTimeComponents = [
    ...payslip.earnings,
    ...payslip.deductions,
  ].filter((component) => component.isOneTime);

  const totalArrearsBonus = roundAmount(
    allOneTimeComponents.reduce(
      (total, component) => total + component.payableAmount,
      0,
    ),
  );

  const values: TemplateValues = {
    // Company
    company_name: company.name,
    company_banner: company.bannerUrl ?? "",
    company_address: company.registeredAddress ?? "N/A",
    employer_tan: company.employerTan ?? "N/A",
    currency: company.currency,

    // Employee
    employee_name: employee.name,
    employee_id: employee.employee_id || employee.id,
    designation: employee.designation,
    email: employee.email,
    phone_num: employee.phone_num,

    // Period
    month,
    year,
    pay_date: formatDate(new Date()),

    // Personal
    passport_no: employee.passport_no || "N/A",
    date_of_birth: formatDate(employee.date_of_birth),
    nationality: employee.nationality || "N/A",
    address: employee.address || "N/A",

    // Visa
    visa_no: employee.visa_no || "N/A",
    frro_reg_no: employee.frro_reg_no || "N/A",
    tax_residency_status: employee.tax_residency_status || "N/A",
    iw_ssa_status: employee.iw_ssa_status || "N/A",

    // Bank and tax
    pan: employee.pan_num || "N/A",
    bank: employee.bank || "N/A",
    account_no: employee.bank_acc_num || "N/A",
    ifsc: employee.bank_ifsc || "N/A",

    // Attendance
    working_days: payslip.attendance.workingDays,
    off_days: payslip.attendance.offDays,
    leave_days: payslip.attendance.leaveDays,
    paid_days: payslip.attendance.paidDays,
    lop_days: payslip.attendance.lopDays,
    monthly_salary_basis: payslip.attendance.monthlySalaryBasis,
    total_calendar_days: payslip.attendance.totalCalendarDays,

    // Earnings
    basic: formatAmount(payslip.basicPayable),
    basic_pay: formatAmount(payslip.basicPayable),
    hra: componentAmount(payslip.earnings, "HRA"),
    special_allowance: componentAmount(payslip.earnings, "SPECIAL_ALLOWANCE"),
    special_allowance_arrears: componentAmount(
      payslip.earnings,
      "SPECIAL_ALLOWANCE_ARREARS",
    ),
    performance_bonus: componentAmount(payslip.earnings, "PERFORMANCE_BONUS"),
    basic_arrears: componentAmount(payslip.earnings, "BASIC_ARREARS"),
    total_arrears_bonus: formatAmount(totalArrearsBonus),

    // Deductions
    pf: componentAmount(payslip.deductions, "PF"),
    income_tax: componentAmount(payslip.deductions, "TDS"),
    tds: componentAmount(payslip.deductions, "TDS"),
    esi: componentAmount(payslip.deductions, "ESI"),
    cess: componentAmount(payslip.deductions, "CESS"),

    // Totals
    gross_earnings: formatAmount(payslip.grossEarnings),
    total_earnings: formatAmount(payslip.grossEarnings),
    total_deductions: formatAmount(payslip.totalDeductions),
    net_pay: formatAmount(payslip.netPay),
    net_salary: formatAmount(payslip.netPay),
    net_pay_words: getAmountInWords(payslip.netPay, company.currency),

    // Payroll source
    payroll_name: payslip.payrollName,
    payroll_source: payslip.payrollSource,
  };

  return values;
}

// ======================================================
// HTML TEMPLATE FILLING
// ======================================================

function fillTemplate(template: string, values: TemplateValues): string {
  const populatedHtml = template.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (_match, key: string) => escapeHtml(String(values[key] ?? "N/A")),
  );

  const unresolved = populatedHtml.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g);

  if (unresolved?.length) {
    console.warn("Unresolved template placeholders:", [...new Set(unresolved)]);
  }

  return populatedHtml;
}

// ======================================================
// PDF BROWSER
// ======================================================

async function launchPdfBrowser(): Promise<Browser> {
  const CHROMIUM_PACK_URL =
    "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";
  chromium.setGraphicsMode = false;

  const isVercel = process.env.VERCEL === "1";

  const executablePath = isVercel
    ? await chromium.executablePath(CHROMIUM_PACK_URL)
    : process.env.CHROME_EXECUTABLE_PATH;

  if (!executablePath) {
    throw new Error(
      "Chrome executable not found. Set CHROME_EXECUTABLE_PATH locally.",
    );
  }

  const args = isVercel
    ? await puppeteer.defaultArgs({
        args: chromium.args,
        headless: "shell",
      })
    : [];

  return puppeteer.launch({
    args,
    executablePath,
    headless: isVercel ? "shell" : true,
    defaultViewport: {
      width: 1100,
      height: 1400,
      deviceScaleFactor: 1,
    },
  });
}

async function generatePdf(browser: Browser, html: string): Promise<Buffer> {
  const page = await browser.newPage();

  try {
    await page.setContent(html, {
      waitUntil: "load",
      timeout: 30000,
    });

    await page.evaluate(async () => {
      const images = Array.from(document.images);

      await Promise.all(
        images.map(
          (image) =>
            new Promise<void>((resolve) => {
              if (image.complete) {
                resolve();
                return;
              }

              image.addEventListener("load", () => resolve(), {
                once: true,
              });

              image.addEventListener("error", () => resolve(), {
                once: true,
              });
            }),
        ),
      );
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
    await page.close();
  }
}

// ======================================================
// EMAIL DELIVERY
// ======================================================

async function sendEmailWithAttachment({
  employee,
  companyName,
  month,
  year,
  subject,
  pdfBuffer,
}: {
  employee: EmployeeRecord;
  companyName: string;
  month: string;
  year: number;
  subject: string;
  pdfBuffer: Buffer;
}) {
  const from = process.env.SMTP_USER;

  if (!from) {
    throw new Error("SMTP_USER is missing from environment variables.");
  }

  const safeName = escapeHtml(employee.name);
  const safeCompanyName = escapeHtml(companyName);
  const safeMonth = escapeHtml(month);
  const safeYear = escapeHtml(String(year));

  const text = `
Dear ${employee.name},

Please find attached your salary slip for ${month} ${year}.

Please review the details and contact HR if you notice any discrepancies.

Thank you for your continued contribution to ${companyName}.

Warm regards,
HR Department
${companyName}
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
        ${safeCompanyName}.
      </p>

      <p>
        Warm regards,<br />
        <strong>HR Department</strong><br />
        ${safeCompanyName}
      </p>
    </div>
  `;

  const safeMonthFile = month.replace(/[^a-zA-Z0-9_-]/g, "_");

  const info = await transporter.sendMail({
    from,
    to: employee.email,
    subject,
    text,
    html,
    attachments: [
      {
        filename: `Payslip_${safeMonthFile}_${year}_${employee.employee_id || employee.id}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  const normalizedEmail = employee.email.toLowerCase();

  const accepted = (info.accepted ?? []).some((recipient) => {
    const address =
      typeof recipient === "string" ? recipient : recipient.address;

    return address.toLowerCase() === normalizedEmail;
  });

  const rejected = (info.rejected ?? []).some((recipient) => {
    const address =
      typeof recipient === "string" ? recipient : recipient.address;

    return address.toLowerCase() === normalizedEmail;
  });

  if (!accepted || rejected) {
    throw new Error(`SMTP did not confirm acceptance for ${employee.email}.`);
  }

  return info;
}

// ======================================================
// CREATE FAILED DELIVERY LOG
// ======================================================

async function createFailedPayslipLog({
  employee,
  company,
  month,
  year,
  attendance,
  totalCalendarDays,
  monthlySalaryBasis,
  reason,
}: {
  employee: EmployeeRecord;
  company: Omit<CompanyRecord, "payrolls">;
  month: number;
  year: number;
  attendance: Attendance;
  totalCalendarDays: number;
  monthlySalaryBasis: number;
  reason: string;
}) {
  const attendanceIsValid = attendance.leaveDays <= monthlySalaryBasis;

  const metrics = attendanceIsValid
    ? calculateAttendance(attendance, monthlySalaryBasis, totalCalendarDays)
    : null;

  return prisma.payslipLog.create({
    data: {
      employeeId: employee.id,
      companyId: company.id,
      month,
      year,
      payDate: new Date(),

      workingDays: attendance.workingDays,
      offDays: attendance.offDays,
      leaveDays: attendance.leaveDays,
      paidDays: metrics?.paidDays ?? null,
      lopDays: metrics?.lopDays ?? null,

      currency: company.currency,

      recipientEmail: employee.email,
      status: EmailStatus.FAILED,
      failureReason: reason,
      templateVersion: TEMPLATE_VERSION,

      payslipData: {
        error: reason,
        attendance: {
          workingDays: attendance.workingDays,
          offDays: attendance.offDays,
          leaveDays: attendance.leaveDays,
          paidDays: metrics?.paidDays ?? null,
          lopDays: metrics?.lopDays ?? null,
          monthlySalaryBasis,
        },
      },
    },
  });
}

// ======================================================
// MAIN SEND SALARY EMAIL ACTION
// ======================================================

export async function sendSalaryEmail(input: SendSalaryEmailInput) {
  logSection("SALARY DISPATCH STARTED");

  const totalCalendarDays = validateDispatchInput(input);

  const slug = input.slug.trim();
  const subject = input.subject.trim();
  const month = input.month;
  const year = input.year;

  const monthLabel = getMonthLabel(month, year);

  console.info("Period:", `${monthLabel} ${year}`);
  console.info("Requested employees:", input.employees.length);

  if (!process.env.SMTP_USER) {
    throw new Error("SMTP_USER is missing from environment variables.");
  }

  // --------------------------------------------------
  // FETCH COMPANY AND DEFAULT PAYROLL
  // --------------------------------------------------

  const companyRecord = await prisma.company.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      name: true,
      bannerUrl: true,
      registeredAddress: true,
      employerTan: true,
      currency: true,

      payrolls: {
        where: {
          isDefault: true,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
        select: {
          id: true,
          name: true,
          companyId: true,
          isDefault: true,
          components: {
            orderBy: {
              sortOrder: "asc",
            },
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              mode: true,
              value: true,
              isEnabled: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  });

  if (!companyRecord) {
    throw new Error("Company not found.");
  }

  const company: Omit<CompanyRecord, "payrolls"> = {
    id: companyRecord.id,
    name: companyRecord.name,
    bannerUrl: companyRecord.bannerUrl,
    registeredAddress: companyRecord.registeredAddress,
    employerTan: companyRecord.employerTan,
    currency: companyRecord.currency,
  };

  const defaultPayroll: PayrollRecord | null =
    companyRecord.payrolls[0] ?? null;

  const monthlySalaryBasis = calculateMonthlySalaryBasis(
    year,
    month,
    totalCalendarDays,
  );

  console.info("Company found:", company.name);
  console.info("Monthly salary basis:", monthlySalaryBasis);
  console.info("Default Payroll configured:", Boolean(defaultPayroll));

  // --------------------------------------------------
  // FETCH SELECTED EMPLOYEES
  // --------------------------------------------------

  const requestedEmployeeIds = input.employees.map(
    (employee) => employee.employeeId,
  );

  const employeeRecords = await prisma.employee.findMany({
    where: {
      companyId: company.id,
      id: {
        in: requestedEmployeeIds,
      },
    },
    select: {
      id: true,
      companyId: true,
      name: true,
      employee_id: true,
      designation: true,
      email: true,
      phone_num: true,
      date_of_birth: true,
      nationality: true,
      address: true,
      passport_no: true,
      visa_no: true,
      frro_reg_no: true,
      tax_residency_status: true,
      iw_ssa_status: true,
      pan_num: true,
      bank_acc_num: true,
      bank: true,
      bank_ifsc: true,
      customPayroll: true,
      payrollId: true,

      payroll: {
        select: {
          id: true,
          name: true,
          companyId: true,
          isDefault: true,
          components: {
            orderBy: {
              sortOrder: "asc",
            },
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              mode: true,
              value: true,
              isEnabled: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  });

  const employeeMap = new Map(
    employeeRecords.map((employee) => [
      employee.id,
      employee as EmployeeRecord,
    ]),
  );

  console.info("Employees found:", employeeRecords.length);

  // --------------------------------------------------
  // READ TEMPLATE AND START BROWSER
  // --------------------------------------------------

  const template = await readPayslipTemplate();

  let browser: Browser | null = null;

  const results: EmailResult[] = [];
  const missingEmployees: string[] = [];
  const logWarnings: string[] = [];

  try {
    browser = await launchPdfBrowser();

    // ------------------------------------------------
    // PROCESS EACH EMPLOYEE
    // ------------------------------------------------

    for (const requestedEmployee of input.employees) {
      const employeeId = requestedEmployee.employeeId;
      const employee = employeeMap.get(employeeId);

      const attendance: Attendance = {
        workingDays: requestedEmployee.workingDays,
        offDays: requestedEmployee.offDays,
        leaveDays: requestedEmployee.leaveDays,
      };

      logSection(`PROCESSING EMPLOYEE: ${employeeId}`);

      if (!employee) {
        const error = `Employee ${employeeId} does not exist in ${company.name}.`;

        missingEmployees.push(employeeId);

        results.push({
          employeeId,
          email: "",
          status: "FAILED",
          error,
        });

        console.error(error);

        continue;
      }

      let payslipLogId: string | undefined;
      let emailSent = false;

      try {
        // --------------------------------------------
        // RESOLVE EFFECTIVE PAYROLL
        // --------------------------------------------

        const resolved = resolvePayroll(employee, defaultPayroll);

        console.info("Payroll resolved for an employee.");

        // --------------------------------------------
        // CALCULATE ATTENDANCE AND SALARY
        // --------------------------------------------

        const calculated = calculatePayslip(
          resolved.payroll,
          resolved.source,
          attendance,
          monthlySalaryBasis,
          totalCalendarDays,
        );

        console.info("Payslip amounts calculated.");

        // --------------------------------------------
        // BUILD TEMPLATE VALUES
        // --------------------------------------------

        const templateValues = getPayslipTemplateData(
          employee,
          company,
          monthLabel,
          year,
          calculated,
        );

        const populatedHtml = fillTemplate(template, templateValues);

        // --------------------------------------------
        // BUILD IMMUTABLE PAYSLIP SNAPSHOT
        // --------------------------------------------

        const payslipSnapshot = {
          templateVersion: TEMPLATE_VERSION,

          employee: {
            id: employee.id,
            name: employee.name,
            employeeId: employee.employee_id,
            designation: employee.designation,
            email: employee.email,
          },

          company: {
            id: company.id,
            name: company.name,
            slug,
            currency: company.currency,
            employerTan: company.employerTan,
            registeredAddress: company.registeredAddress,
          },

          period: {
            month,
            monthName: monthLabel,
            year,
          },

          payroll: {
            name: calculated.payrollName,
            source: calculated.payrollSource,
          },

          attendance: calculated.attendance,

          earnings: calculated.earnings,
          deductions: calculated.deductions,

          basicMonthly: calculated.basicMonthly,
          basicPayable: calculated.basicPayable,

          grossEarnings: calculated.grossEarnings,
          totalDeductions: calculated.totalDeductions,
          netPay: calculated.netPay,

          currency: company.currency,
        };

        // --------------------------------------------
        // CREATE PENDING PAYSLIP LOG
        // --------------------------------------------

        const payslipLog = await prisma.payslipLog.create({
          data: {
            employeeId: employee.id,
            companyId: company.id,
            month,
            year,

            payDate: new Date(),

            workingDays: attendance.workingDays,
            offDays: attendance.offDays,
            leaveDays: attendance.leaveDays,

            paidDays: calculated.attendance.paidDays,
            lopDays: calculated.attendance.lopDays,

            currency: company.currency,

            grossEarnings: calculated.grossEarnings,
            totalDeductions: calculated.totalDeductions,
            netPay: calculated.netPay,

            payslipData: payslipSnapshot as Prisma.InputJsonValue,

            templateVersion: TEMPLATE_VERSION,

            recipientEmail: employee.email,
            status: EmailStatus.PENDING,
          },
          select: {
            id: true,
          },
        });

        payslipLogId = payslipLog.id;

        // --------------------------------------------
        // GENERATE PDF
        // --------------------------------------------

        const pdfBuffer = await generatePdf(browser, populatedHtml);

        // --------------------------------------------
        // SEND EMAIL
        // --------------------------------------------

        const emailInfo = await sendEmailWithAttachment({
          employee,
          companyName: company.name,
          month: monthLabel,
          year,
          subject,
          pdfBuffer,
        });

        emailSent = true;

        // --------------------------------------------
        // UPDATE DELIVERY LOG
        // --------------------------------------------

        try {
          await prisma.payslipLog.update({
            where: {
              id: payslipLogId,
            },
            data: {
              status: EmailStatus.SENT,
              messageId: emailInfo.messageId ?? null,
              failureReason: null,
              sentAt: new Date(),
            },
          });
        } catch (logError) {
          const warning = `Email sent to ${employee.email}, but its delivery log could not be updated.`;

          console.error(warning, logError);

          logWarnings.push(warning);
        }

        results.push({
          employeeId,
          email: employee.email,
          status: "SENT",
          messageId: emailInfo.messageId,
          payslipLogId,
        });

        console.info("Payslip email accepted by SMTP.");
      } catch (error) {
        const reason = errorMessage(error);

        console.error("Employee dispatch failed:", reason);

        // Do not report a successfully sent email as failed
        // just because its final log update had a problem.
        if (emailSent) {
          results.push({
            employeeId,
            email: employee.email,
            status: "SENT",
            payslipLogId,
          });

          continue;
        }

        // --------------------------------------------
        // MARK EXISTING LOG FAILED
        // --------------------------------------------

        if (payslipLogId) {
          try {
            await prisma.payslipLog.update({
              where: {
                id: payslipLogId,
              },
              data: {
                status: EmailStatus.FAILED,
                failureReason: reason.slice(0, 2000),
              },
            });
          } catch (logError) {
            console.error("Unable to update failed payslip log:", logError);

            logWarnings.push(
              `Unable to update the failed payslip log for ${employee.email}.`,
            );
          }
        } else {
          // If calculation failed before a pending log was created,
          // still preserve a failed dispatch record.
          try {
            const failedLog = await createFailedPayslipLog({
              employee,
              company,
              month,
              year,
              attendance,
              totalCalendarDays,
              monthlySalaryBasis,
              reason,
            });

            payslipLogId = failedLog.id;
          } catch (logError) {
            console.error("Unable to create failed payslip log:", logError);

            logWarnings.push(
              `Could not save a failure log for ${employee.email}.`,
            );
          }
        }

        results.push({
          employeeId,
          email: employee.email,
          status: "FAILED",
          payslipLogId,
          error: reason,
        });
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // ==================================================
  // FINAL SUMMARY
  // ==================================================

  const totalSent = results.filter((result) => result.status === "SENT").length;

  const totalFailed = results.filter(
    (result) => result.status === "FAILED",
  ).length;

  logSection("SALARY DISPATCH COMPLETED");

  console.info("Requested:", input.employees.length);
  console.info("Sent:", totalSent);
  console.info("Failed:", totalFailed);
  console.info("Dispatch processing finished.");

  revalidatePath(`/company/${slug}/history`);
  revalidatePath(`/company/${slug}/dispatch`);

  return {
    success: totalSent > 0 && totalFailed === 0,
    totalRequested: input.employees.length,
    totalSent,
    totalFailed,
    results,
    ...(missingEmployees.length > 0 ? { missingEmployees } : {}),
    ...(logWarnings.length > 0 ? { warnings: logWarnings } : {}),
  };
}
