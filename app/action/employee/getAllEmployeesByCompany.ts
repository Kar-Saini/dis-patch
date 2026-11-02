"use server";

import prisma from "@/utils";
import { Employee } from "@prisma/client";

export default async function getAllEmployeesByCompany(
  companySlug: string,
): Promise<Employee[]> {
  if (!companySlug) {
    throw new Error("Company slug is required");
  }

  try {
    // Find the company using its URL slug
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

    // Fetch only employees belonging to this company
    const employees = await prisma.employee.findMany({
      where: {
        companyId: company.id,
      },
      orderBy: {
        name: "asc",
      },
    });

    return employees;
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
}
