"use server";

import prisma from "@/utils";

export interface PayrollComponentItem {
  id: string;
  code: string;
  name: string;
  type: "EARNING" | "DEDUCTION";
  mode: "FIXED_AMOUNT" | "PERCENT_OF_BASIC";
  value: string;
  isEnabled: boolean;
  sortOrder: number;
  notes: string | null;
}

export interface CompanyDetails {
  id: string;
  name: string;
  slug: string;
  registeredAddress: string | null;
  employerTan: string | null;
  bannerUrl: string | null;
  currency: string;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
  payrollComponents: PayrollComponentItem[];
}

export type GetCompanyBySlugResult =
  | {
      success: true;
      error: null;
      company: CompanyDetails;
    }
  | {
      success: false;
      error: string;
      company: null;
    };

export async function getCompanyBySlug(
  slug: string,
): Promise<GetCompanyBySlugResult> {
  if (typeof slug !== "string" || !slug.trim()) {
    return {
      success: false,
      error: "Company slug is required.",
      company: null,
    };
  }

  try {
    const company = await prisma.company.findUnique({
      where: {
        slug: slug.trim(),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        registeredAddress: true,
        employerTan: true,
        bannerUrl: true,
        currency: true,
        createdAt: true,
        updatedAt: true,

        _count: {
          select: {
            employees: true,
          },
        },

        payrolls: {
          where: {
            isDefault: true,
          },
          take: 1,
          select: {
            components: {
              orderBy: {
                sortOrder: "asc",
              },
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
                mode: true,
                value: true,
                isEnabled: true,
                sortOrder: true,
                notes: true,
              },
            },
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

    const defaultPayroll = company.payrolls[0];

    if (!defaultPayroll) {
      console.error("Company is missing its default payroll:", company.id);

      return {
        success: false,
        error: "Company default payroll is not configured.",
        company: null,
      };
    }

    const formattedCompany: CompanyDetails = {
      id: company.id,
      name: company.name,
      slug: company.slug,
      registeredAddress: company.registeredAddress,
      employerTan: company.employerTan,
      bannerUrl: company.bannerUrl,
      currency: company.currency,
      employeeCount: company._count.employees,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),

      payrollComponents: defaultPayroll.components.map((component) => ({
        id: component.id,
        code: component.code,
        name: component.name,
        type: component.type,
        mode: component.mode,
        value: component.value.toString(),
        isEnabled: component.isEnabled,
        sortOrder: component.sortOrder,
        notes: component.notes,
      })),
    };

    return {
      success: true,
      error: null,
      company: formattedCompany,
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
