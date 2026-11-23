"use server";

import prisma from "@/utils";

// ==========================================
// GET EMAIL HISTORY BY COMPANY
// ==========================================

export async function getEmailHistoryByCompany(companySlug: string) {
  if (typeof companySlug !== "string" || !companySlug.trim()) {
    throw new Error("Company slug is required.");
  }

  try {
    // ========================================
    // FIND COMPANY
    // ========================================

    const company = await prisma.company.findUnique({
      where: {
        slug: companySlug.trim(),
      },
      select: {
        id: true,
      },
    });

    if (!company) {
      throw new Error("Company not found.");
    }

    // ========================================
    // FETCH PAYSLIP HISTORY
    // ========================================

    const history = await prisma.payslipLog.findMany({
      where: {
        companyId: company.id,

        // Ensure the associated employee also belongs
        // to this company.
        employee: {
          is: {
            companyId: company.id,
          },
        },
      },

      select: {
        id: true,
        month: true,
        year: true,
        payDate: true,

        workingDays: true,
        offDays: true,
        leaveDays: true,
        paidDays: true,
        lopDays: true,

        currency: true,
        grossEarnings: true,
        totalDeductions: true,
        netPay: true,

        payslipData: true,
        templateVersion: true,

        recipientEmail: true,
        status: true,
        messageId: true,
        failureReason: true,

        sentAt: true,
        createdAt: true,

        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            employee_id: true,
          },
        },

        adjustments: {
          select: {
            id: true,
            type: true,
            code: true,
            description: true,
            amount: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    // ========================================
    // RETURN SERIALIZABLE DATA
    // ========================================

    return history.map((record) => ({
      ...record,

      workingDays: record.workingDays?.toString() ?? null,
      offDays: record.offDays?.toString() ?? null,
      leaveDays: record.leaveDays?.toString() ?? null,
      paidDays: record.paidDays?.toString() ?? null,
      lopDays: record.lopDays?.toString() ?? null,

      grossEarnings: record.grossEarnings?.toString() ?? null,
      totalDeductions: record.totalDeductions?.toString() ?? null,
      netPay: record.netPay?.toString() ?? null,

      adjustments: record.adjustments.map((adjustment) => ({
        ...adjustment,
        amount: adjustment.amount.toString(),
      })),
    }));
  } catch (error) {
    console.error("Failed to fetch email history:", error);
    throw error;
  }
}
