"use server";

import prisma from "@/utils";

export default async function getEmployeeByEmail(email: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: {
        email,
      },
    });
    return employee;
  } catch (error) {}
}
