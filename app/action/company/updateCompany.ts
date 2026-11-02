"use server";

import prisma from "@/utils";
import { revalidatePath } from "next/cache";

type UpdateCompanyInput = {
  id: string;
  name?: string;
  slug?: string;
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

export async function updateCompany(input: UpdateCompanyInput) {
  try {
    if (!input.id) {
      return {
        success: false,
        message: "Company ID is required.",
      };
    }

    const existingCompany = await prisma.company.findUnique({
      where: { id: input.id },
      select: { id: true, slug: true },
    });

    if (!existingCompany) {
      return {
        success: false,
        message: "Company not found.",
      };
    }

    const data: {
      name?: string;
      slug?: string;
      logoUrl?: string | null;
      bannerUrl?: string | null;
    } = {};

    if (input.name !== undefined) {
      const name = input.name.trim();

      if (!name) {
        return {
          success: false,
          message: "Company name cannot be empty.",
        };
      }

      data.name = name;
    }

    if (input.slug !== undefined) {
      const slug = generateSlug(input.slug);

      if (!slug) {
        return {
          success: false,
          message: "Please provide a valid company slug.",
        };
      }

      data.slug = slug;
    }

    if (Object.prototype.hasOwnProperty.call(input, "logoUrl")) {
      data.logoUrl = input.logoUrl ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(input, "bannerUrl")) {
      data.bannerUrl = input.bannerUrl ?? null;
    }

    if (Object.keys(data).length === 0) {
      return {
        success: false,
        message: "No changes provided.",
      };
    }

    const updatedCompany = await prisma.company.update({
      where: { id: input.id },
      data,
    });

    revalidatePath("/companies");
    revalidatePath(`/company/${existingCompany.slug}`);
    revalidatePath(`/company/${updatedCompany.slug}`);

    return {
      success: true,
      message: "Company updated successfully.",
      company: updatedCompany,
    };
  } catch (error) {
    console.error("Update company error:", error);

    if ((error as { code?: string }).code === "P2002") {
      return {
        success: false,
        message: "This company URL is already in use.",
      };
    }

    return {
      success: false,
      message: "Failed to update company.",
    };
  }
}
