"use server";

import prisma from "@/utils";

export async function getEmailHistoryByCompany(companySlug: string) {
  if (!companySlug) {
    throw new Error("Company slug is required");
  }

  try {
    const company = await prisma.company.findUnique({
      where: {
        slug: companySlug,
      },
      select: {
        id: true,
      },
    });

    if (!company) {
      throw new Error("Company not found");
    }

    const history = await prisma.payslipLog.findMany({
      where: {
        OR: [
          {
            companyId: company.id,
          },
          {
            companyId: null,
            employee: {
              is: {
                companyId: company.id,
              },
            },
          },
        ],
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return history;
  } catch (error) {
    console.error("Failed to fetch email history:", error);
    throw error;
  }
}
