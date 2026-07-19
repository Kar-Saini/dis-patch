"use server";

import prisma from "@/utils";

export async function getEmailHistory() {
  try {
    const history = await prisma.payslipLog.findMany({
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
    return "Failed to fetch email history";
  }
}
