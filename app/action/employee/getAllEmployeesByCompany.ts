"use server";

import prisma from "@/utils";

export interface EmployeeListItem {
  id: string;
  name: string;
  employee_id: string | null;
  designation: string;
  email: string;
}

export default async function getAllEmployeesByCompany(
  companySlug: string,
): Promise<EmployeeListItem[]> {
  if (typeof companySlug !== "string" || !companySlug.trim()) {
    throw new Error("Company slug is required.");
  }

  const slug = companySlug.trim();

  let company;

  try {
    company = await prisma.company.findUnique({
      where: {
        slug,
      },
      select: {
        employees: {
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
            employee_id: true,
            designation: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw new Error("Unable to fetch employees.");
  }

  if (!company) {
    throw new Error("Company not found.");
  }

  return company.employees;
}
