"use server";

import prisma from "@/utils";
import { Prisma } from "@prisma/client";

export type VisaPersonDetail = Prisma.VisaPersonGetPayload<{
  include: { logs: true };
}>;

/**
 * One person plus their full log history, newest log first. Returns null when
 * the id does not exist so the page can show a not-found state rather than an
 * error.
 */
export default async function getVisaPerson(
  id: string,
): Promise<string | VisaPersonDetail | null> {
  try {
    return await prisma.visaPerson.findUnique({
      where: { id },
      include: {
        logs: { orderBy: { createdAt: "desc" } },
      },
    });
  } catch (error) {
    console.error("Failed to fetch visa record:", error);
    return "Failed to fetch visa record";
  }
}
