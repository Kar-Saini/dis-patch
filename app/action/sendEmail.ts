"use server";

import transporter from "@/mailer";
import { Employee, EmailStatus } from "@prisma/client";
import fs from "fs";
import path from "path";
import puppeteer, { Browser } from "puppeteer-core";

import { SALARY_CONSTANTS } from "./salaryConstants";
import getEmployeeByEmail from "./getEmployeeByEmail";
import prisma from "@/utils";
import { SALARY_SLIP_DATA_TYPE } from "@/lib/types";

import chromium from "@sparticuz/chromium";

export async function sendSalaryEmail({
  employeeEmails,
  monthAndYear,
  subject,
}: {
  employeeEmails: string[];
  monthAndYear: { month: string; year: string };
  subject: string;
}) {
  const browser = await puppeteer.launch({
    args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const logs: {
    employeeId: string;
    month: number;
    year: number;
    status: EmailStatus;
    messageId: string;
  }[] = [];

  const results = [];

  const month =
    new Date(`${monthAndYear.month} 1, ${monthAndYear.year}`).getMonth() + 1;

  const year = Number(monthAndYear.year);

  try {
    for (const email of employeeEmails) {
      try {
        const employee = await getEmployeeByEmail(email);

        if (!employee) continue;

        const slipData = getSalarySlipData(employee as Employee, monthAndYear);

        const pdfBuffer = await generateSalarySlipPDF(slipData, browser);

        const info = await sendEmailWithAttachment({
          employee: employee as Employee,
          monthAndYear,
          subject,
          pdfBuffer,
        });

        results.push({
          email,
          messageId: info.messageId,
        });

        logs.push({
          employeeId: employee.id,
          month,
          year,
          status: "SENT",
          messageId: info.messageId,
        });
      } catch (err) {
        console.error(`Failed to send email to ${email}`, err);

        const employee = await getEmployeeByEmail(email);

        if (employee) {
          logs.push({
            employeeId: employee.id,
            month,
            year,
            status: "FAILED",
            messageId: "",
          });
        }
      }
    }

    if (logs.length > 0) {
      await prisma.payslipLog.createMany({
        data: logs,
      });
    }

    return {
      success: true,
      totalSent: logs.filter((l) => l.status === "SENT").length,
      totalFailed: logs.filter((l) => l.status === "FAILED").length,
      results,
    };
  } finally {
    await browser.close();
  }
}

/* ---------------------------------------------------
   BUILD SALARY SLIP DATA OBJECT
--------------------------------------------------- */

function getSalarySlipData(
  employee: Employee,
  monthAndYear: { month: string; year: string },
): SALARY_SLIP_DATA_TYPE {
  return {
    employee_name: employee.name,
    employee_id: employee.id,
    designation: employee.designation,

    month: monthAndYear.month,
    year: monthAndYear.year,
    pay_date: new Date().toLocaleString(),

    pan: employee.pan_num,
    bank: employee.bank,
    account_no: employee.bank_acc_num,
    ifsc: employee.bank_ifsc,

    ...SALARY_CONSTANTS,
  };
}

/* ---------------------------------------------------
   GENERATE PDF
--------------------------------------------------- */

async function generateSalarySlipPDF(
  data: SALARY_SLIP_DATA_TYPE,
  browser: Browser,
): Promise<Buffer> {
  const html = loadHTMLTemplate("salaryslip.html", data);

  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: "domcontentloaded",
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
  });

  await page.close();

  return Buffer.from(pdfBuffer);
}

/* ---------------------------------------------------
   LOAD TEMPLATE
--------------------------------------------------- */

function loadHTMLTemplate(
  templateName: string,
  data: SALARY_SLIP_DATA_TYPE,
): string {
  const filePath = path.join(process.cwd(), "template", templateName);

  let html = fs.readFileSync(filePath, "utf8");

  for (const [key, value] of Object.entries(data)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }

  return html;
}

/* ---------------------------------------------------
   SEND EMAIL
--------------------------------------------------- */

async function sendEmailWithAttachment({
  employee,
  monthAndYear,
  subject,
  pdfBuffer,
}: {
  employee: Employee;
  monthAndYear: { month: string; year: string };
  subject: string;
  pdfBuffer: Buffer;
}) {
  const emailText = `
Dear ${employee.name},

Please find attached your salary slip for ${monthAndYear.month} ${monthAndYear.year}. Kindly review the details, and if you notice any discrepancies or have any queries, feel free to reach out to the HR department.

Thank you for your continued contribution to Goa Oceanarium Private Limited.

Warm regards,
<b>HR Department</b>
Goa Oceanarium Private Limited
`;

  return transporter.sendMail({
    from: process.env.SMTP_USER,
    to: employee.email,
    subject,
    text: emailText,
    html: emailText.replace(/\n/g, "<br />"),
    attachments: [
      {
        filename: `Payslip_${monthAndYear.month}_${monthAndYear.year}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
