"use server";

import prisma from "@/utils";
import { Employee } from "@prisma/client";

export default async function getAllEmployees(): Promise<string | Employee[]> {
  try {
    const employees = await prisma.employee.findMany();
    return employees;
  } catch (error) {
    throw new Error("Error while fetching Emplyees");
  }
}
