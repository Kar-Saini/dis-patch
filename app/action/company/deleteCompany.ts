"use server";

import prisma from "@/utils";
import { revalidatePath } from "next/cache";

export async function deleteCompany(companyId: string) {
  try {
    if (!companyId) {
      return {
        success: false,
        message: "Company ID is required.",
      };
    }

    const company = await prisma.company.findUnique({
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
        success: false,
        message: "Company not found.",
      };
    }

    // Protect existing employee and payslip history records.
    if (company._count.employees > 0 || company._count.payslipLogs > 0) {
      return {
        success: false,
        message: `Cannot delete ${company.name}. It has ${company._count.employees} employee(s) and ${company._count.payslipLogs} payslip record(s). Remove or migrate these records first.`,
      };
    }

    await prisma.company.delete({
      where: {
        id: companyId,
      },
    });

    revalidatePath("/companies");
    revalidatePath(`/company/${company.slug}`);

    return {
      success: true,
      message: "Company deleted successfully.",
    };
  } catch (error) {
    console.error("Delete company error:", error);

    return {
      success: false,
      message: "Failed to delete company.",
    };
  }
}
