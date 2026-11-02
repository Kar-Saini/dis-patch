"use server";

import prisma from "@/utils";

export interface CompanyListItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  createdAt: string;
  employeeCount: number;
}

type GetCompaniesResult =
  | {
      success: true;
      companies: CompanyListItem[];
    }
  | {
      success: false;
      error: string;
    };

export async function getCompanies(): Promise<GetCompaniesResult> {
  try {
    const companies = await prisma.company.findMany({
      orderBy: {
        createdAt: "desc",
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

    const formattedCompanies: CompanyListItem[] = companies.map((company) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      logoUrl: company.logoUrl,
      bannerUrl: company.bannerUrl,
      createdAt: company.createdAt.toISOString(),
      employeeCount: company._count.employees,
    }));

    return {
      success: true,
      companies: formattedCompanies,
    };
  } catch (error) {
    console.error("Failed to fetch companies:", error);

    return {
      success: false,
      error: "Failed to load companies.",
    };
  }
}
