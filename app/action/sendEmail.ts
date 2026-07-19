"use server";

import transporter from "@/mailer";
import { Employee, EmailStatus } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";

import { SALARY_CONSTANTS } from "./salaryConstants";
import getEmployeeByEmail from "./getEmployeeByEmail";
import prisma from "@/utils";
import { SALARY_SLIP_DATA_TYPE } from "@/lib/types";
import SalarySlipDocument from "@/components/SalarySlipDocument";

export async function sendSalaryEmail({
  employeeEmails,
  monthAndYear,
  subject,
}: {
  employeeEmails: string[];
  monthAndYear: { month: string; year: string };
  subject: string;
}) {
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

  for (const email of employeeEmails) {
    try {
      const employee = await getEmployeeByEmail(email);

      if (!employee) continue;

      const slipData = getSalarySlipData(employee as Employee, monthAndYear);

      // No browser, no Chromium — pure JS PDF generation
      const pdfBuffer = await renderToBuffer(
        SalarySlipDocument({ data: slipData }) as any,
      );

      const info = await sendEmailWithAttachment({
        employee: employee as Employee,
        monthAndYear,
        subject,
        pdfBuffer: Buffer.from(pdfBuffer),
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
