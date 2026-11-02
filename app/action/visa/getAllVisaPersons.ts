"use server";

import prisma from "@/utils";
import { VisaPerson } from "@prisma/client";

export default async function getAllVisaPersons(): Promise<
  string | VisaPerson[]
> {
  try {
    const people = await prisma.visaPerson.findMany({
      orderBy: {
        entry_date: "desc",
      },
    });
    return people;
  } catch (error) {
    console.error("Failed to fetch visa records:", error);
    return "Failed to fetch visa records";
  }
}
