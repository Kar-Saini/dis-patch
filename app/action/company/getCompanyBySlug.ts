"use server";

import prisma from "@/utils";

export async function getCompanyBySlug(slug: string) {
  try {
    if (!slug) {
      return {
        success: false,
        error: "Company slug is required.",
        company: null,
      };
    }

    const company = await prisma.company.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        bannerUrl: true,
        createdAt: true,
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (!company) {
      return {
        success: false,
        error: "Company not found.",
        company: null,
      };
    }

    return {
      success: true,
      error: null,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        logoUrl: company.logoUrl,
        bannerUrl: company.bannerUrl,
        employeeCount: company._count.employees,
        createdAt: company.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Failed to fetch company:", error);

    return {
      success: false,
      error: "Unable to fetch company details.",
      company: null,
    };
  }
}
