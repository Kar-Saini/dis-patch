"use server";

import prisma from "@/utils";
import { Employee } from "@prisma/client";

export default async function addEmployee(
  employee: Omit<
    Employee,
    "id" | "created_at" | "updated_at" | "email_verified"
  >,
) {
  try {
    const new_emp = await prisma.employee.create({
      data: employee,
    });
    return new_emp.id;
  } catch (error) {
    throw new Error("Failed to create employee");
  }
}
