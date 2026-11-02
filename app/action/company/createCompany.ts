"use server";

import prisma from "@/utils";
import { revalidatePath } from "next/cache";

type CreateCompanyInput = {
  name: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
};

function generateSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createCompany(input: CreateCompanyInput) {
  try {
    const name = input.name?.trim();

    if (!name) {
      return {
        success: false,
        message: "Company name is required.",
      };
    }

    const slug = generateSlug(name);

    if (!slug) {
      return {
        success: false,
        message: "Unable to generate a valid company URL.",
      };
    }

    const company = await prisma.company.create({
      data: {
        name,
        slug,
        logoUrl: input.logoUrl ?? null,
        bannerUrl: input.bannerUrl ?? null,
      },
    });

    revalidatePath("/companies");

    return {
      success: true,
      message: "Company created successfully.",
      company,
    };
  } catch (error) {
    console.error("Create company error:", error);

    if ((error as { code?: string }).code === "P2002") {
      return {
        success: false,
        message: "A company with this URL already exists.",
      };
    }

    return {
      success: false,
      message: "Failed to create company.",
    };
  }
}
