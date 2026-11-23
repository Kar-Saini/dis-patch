"use server";

import prisma from "@/utils";
import { revalidatePath } from "next/cache";

export async function deleteCompany(companyId: string) {
  try {
    // ========================================
    // VALIDATE INPUT
    // ========================================

    if (typeof companyId !== "string" || !companyId.trim()) {
      return {
        success: false,
        message: "Company ID is required.",
      };
    }

    companyId = companyId.trim();

    // ========================================
    // CHECK AND DELETE TRANSACTIONALLY
    // ========================================

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.findUnique({
        where: {
          id: companyId,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              employees: true,
              payslipLogs: true,
            },
          },
        },
      });

      if (!company) {
        return {
          success: false as const,
          message: "Company not found.",
        };
      }

      // Protect employee records and payslip history.
      if (company._count.employees > 0 || company._count.payslipLogs > 0) {
        return {
          success: false as const,
          message: `Cannot delete ${company.name}. It has ${company._count.employees} employee(s) and ${company._count.payslipLogs} payslip record(s). Remove or migrate these records first.`,
        };
      }

      // CompanyPayrollComponent records are automatically
      // deleted through the onDelete: Cascade relation.
      await tx.company.delete({
        where: {
          id: companyId,
        },
      });

      return {
        success: true as const,
        message: "Company deleted successfully.",
        slug: company.slug,
      };
    });

    if (!result.success) {
      return result;
    }

    // ========================================
    // REVALIDATE ROUTES
    // ========================================

    revalidatePath("/companies");
    revalidatePath(`/company/${result.slug}`);
    revalidatePath(`/company/${result.slug}/settings`);

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error("Delete company error:", error);

    const prismaError = error as { code?: string };

    if (prismaError.code === "P2003") {
      return {
        success: false,
        message:
          "Cannot delete this company because related employee or payslip records still exist.",
      };
    }

    if (prismaError.code === "P2025") {
      return {
        success: false,
        message: "Company no longer exists.",
      };
    }

    return {
      success: false,
      message: "Failed to delete company. Please try again.",
    };
  }
}
