"use server";

import prisma from "@/utils";

export async function getVisaLogs() {
  try {
    const logs = await prisma.visaLog.findMany({
      include: {
        visaPerson: {
          select: {
            id: true,
            name: true,
            nationality: true,
            passport_num: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return logs;
  } catch (error) {
    console.error("Failed to fetch visa logs:", error);
    return "Failed to fetch visa logs";
  }
}
