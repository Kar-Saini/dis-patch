"use server";

import prisma from "@/utils";
import { revalidatePath } from "next/cache";

type PayrollComponentInput = {
  code: string;
  name: string;
  type: "EARNING" | "DEDUCTION";
  mode: "FIXED_AMOUNT" | "PERCENT_OF_BASIC";
  value: string | number;
  isEnabled?: boolean;
  sortOrder?: number;
  notes?: string | null;
};

type UpdateCompanyInput = {
  id: string;
  name?: string;
  slug?: string;
  registeredAddress?: string | null;
  employerTan?: string | null;
  bannerUrl?: string | null;
  payrollComponents?: PayrollComponentInput[];
};

const allowedComponents: Record<string, "EARNING" | "DEDUCTION"> = {
  BASIC_PAY: "EARNING",
  HRA: "EARNING",
  SPECIAL_ALLOWANCE: "EARNING",
  PF: "DEDUCTION",
  TDS: "DEDUCTION",
  ESI: "DEDUCTION",
  SPECIAL_ALLOWANCE_ARREARS: "EARNING",
  PERFORMANCE_BONUS: "EARNING",
  BASIC_ARREARS: "EARNING",
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

function validatePayrollComponents(components: PayrollComponentInput[]) {
  const normalized = [];
  const seenCodes = new Set<string>();

  for (let index = 0; index < components.length; index++) {
    const component = components[index];

    const code = component.code.trim().toUpperCase();
    const name = component.name.trim();
    const isEnabled = component.isEnabled ?? true;

    if (!Object.hasOwn(allowedComponents, code)) {
      return {
        success: false as const,
        message: `Unsupported payroll component: ${code}.`,
      };
    }

    if (seenCodes.has(code)) {
      return {
        success: false as const,
        message: `Duplicate payroll component: ${code}.`,
      };
    }

    seenCodes.add(code);

    if (!name || name.length > 100) {
      return {
        success: false as const,
        message: `Invalid name for payroll component ${code}.`,
      };
    }

    if (component.type !== allowedComponents[code]) {
      return {
        success: false as const,
        message: `Invalid component type for ${code}.`,
      };
    }

    if (
      component.mode !== "FIXED_AMOUNT" &&
      component.mode !== "PERCENT_OF_BASIC"
    ) {
      return {
        success: false as const,
        message: `Invalid calculation mode for ${code}.`,
      };
    }

    const rawValue = String(component.value ?? "").trim();
    const valueText = !rawValue && !isEnabled ? "0" : rawValue;

    if (!/^(?:\d+\.?\d*|\.\d+)$/.test(valueText)) {
      return {
        success: false as const,
        message: `Invalid amount for ${name}.`,
      };
    }

    const value = Number(valueText);

    if (!Number.isFinite(value) || value < 0) {
      return {
        success: false as const,
        message: `${name} must have a valid non-negative value.`,
      };
    }

    if (value > 9999999999.9999) {
      return {
        success: false as const,
        message: `${name} exceeds the supported amount.`,
      };
    }

    if ((valueText.split(".")[1]?.length ?? 0) > 4) {
      return {
        success: false as const,
        message: `${name} supports a maximum of 4 decimal places.`,
      };
    }

    if (component.mode === "PERCENT_OF_BASIC" && value > 10000) {
      return {
        success: false as const,
        message: `${name} percentage cannot exceed 10000%.`,
      };
    }

    if (code === "BASIC_PAY" && component.mode !== "FIXED_AMOUNT") {
      return {
        success: false as const,
        message: "Basic Pay must use a fixed amount.",
      };
    }

    const sortOrder = component.sortOrder ?? index;

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return {
        success: false as const,
        message: `Invalid sort order for ${name}.`,
      };
    }

    const notes = component.notes?.trim() || null;

    if (notes && notes.length > 500) {
      return {
        success: false as const,
        message: `Notes for ${name} cannot exceed 500 characters.`,
      };
    }

    normalized.push({
      code,
      name,
      type: component.type,
      mode: component.mode,
      value: valueText,
      isEnabled,
      sortOrder,
      notes,
    });
  }

  return {
    success: true as const,
    components: normalized,
  };
}

export async function updateCompany(input: UpdateCompanyInput) {
  try {
    if (!input.id?.trim()) {
      return {
        success: false,
        message: "Company ID is required.",
      };
    }

    const data: {
      name?: string;
      slug?: string;
      registeredAddress?: string | null;
      employerTan?: string | null;
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

      if (name.length > 120) {
        return {
          success: false,
          message: "Company name cannot exceed 120 characters.",
        };
      }

      data.name = name;
    }

    if (input.slug !== undefined) {
      const slug = generateSlug(input.slug);

      if (!slug || slug.length > 100) {
        return {
          success: false,
          message: "Please provide a valid company URL.",
        };
      }

      data.slug = slug;
    }

    if (input.registeredAddress !== undefined) {
      const address = input.registeredAddress?.trim() || null;

      if (address && address.length > 500) {
        return {
          success: false,
          message: "Registered address cannot exceed 500 characters.",
        };
      }

      data.registeredAddress = address;
    }

    if (input.employerTan !== undefined) {
      const tan = input.employerTan?.trim().toUpperCase() || null;

      if (tan && tan.length > 20) {
        return {
          success: false,
          message: "Employer TAN cannot exceed 20 characters.",
        };
      }

      data.employerTan = tan;
    }

    if (input.bannerUrl !== undefined) {
      data.bannerUrl = input.bannerUrl?.trim() || null;
    }

    let payrollComponents: Extract<
      ReturnType<typeof validatePayrollComponents>,
      { success: true }
    >["components"] = [];

    const hasPayrollChanges = input.payrollComponents !== undefined;

    if (hasPayrollChanges) {
      const validation = validatePayrollComponents(input.payrollComponents!);

      if (!validation.success) {
        return {
          success: false,
          message: validation.message,
        };
      }

      payrollComponents = validation.components;
    }

    const hasCompanyChanges = Object.keys(data).length > 0;

    if (!hasCompanyChanges && !hasPayrollChanges) {
      return {
        success: false,
        message: "No changes provided.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingCompany = await tx.company.findUnique({
        where: {
          id: input.id,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

      if (!existingCompany) {
        throw new Error("COMPANY_NOT_FOUND");
      }

      const updatedCompany = hasCompanyChanges
        ? await tx.company.update({
            where: {
              id: input.id,
            },
            data,
          })
        : await tx.company.findUniqueOrThrow({
            where: {
              id: input.id,
            },
          });

      let defaultPayroll = await tx.payroll.findFirst({
        where: {
          companyId: input.id,
          isDefault: true,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
        },
      });

      if (!defaultPayroll) {
        defaultPayroll = await tx.payroll.create({
          data: {
            companyId: input.id,
            name: "Default Payroll",
            isDefault: true,
          },
          select: {
            id: true,
          },
        });
      }

      await tx.payroll.updateMany({
        where: {
          companyId: input.id,
          isDefault: true,
          id: {
            not: defaultPayroll.id,
          },
        },
        data: {
          isDefault: false,
        },
      });

      if (hasPayrollChanges) {
        for (const component of payrollComponents) {
          await tx.payrollComponent.upsert({
            where: {
              payrollId_code: {
                payrollId: defaultPayroll.id,
                code: component.code,
              },
            },

            create: {
              payrollId: defaultPayroll.id,
              code: component.code,
              name: component.name,
              type: component.type,
              mode: component.mode,
              value: component.value,
              isEnabled: component.isEnabled,
              sortOrder: component.sortOrder,
              notes: component.notes,
            },

            update: {
              name: component.name,
              type: component.type,
              mode: component.mode,
              value: component.value,
              isEnabled: component.isEnabled,
              sortOrder: component.sortOrder,
              notes: component.notes,
            },
          });
        }

        const submittedCodes = payrollComponents.map(
          (component) => component.code,
        );

        if (submittedCodes.length > 0) {
          await tx.payrollComponent.deleteMany({
            where: {
              payrollId: defaultPayroll.id,
              code: {
                notIn: submittedCodes,
              },
            },
          });
        } else {
          await tx.payrollComponent.deleteMany({
            where: {
              payrollId: defaultPayroll.id,
            },
          });
        }
      }

      const savedComponents = await tx.payrollComponent.findMany({
        where: {
          payrollId: defaultPayroll.id,
        },
        orderBy: {
          sortOrder: "asc",
        },
      });

      return {
        existingCompany,
        updatedCompany,
        savedComponents,
      };
    });

    const oldSlug = result.existingCompany.slug;
    const newSlug = result.updatedCompany.slug;

    revalidatePath("/companies");

    const routes = ["", "/settings", "/employees", "/dispatch", "/history"];

    for (const route of routes) {
      revalidatePath(`/company/${oldSlug}${route}`);
      revalidatePath(`/company/${newSlug}${route}`);
    }

    return {
      success: true,
      message: "Company settings updated successfully.",

      company: {
        id: result.updatedCompany.id,
        name: result.updatedCompany.name,
        slug: result.updatedCompany.slug,
        registeredAddress: result.updatedCompany.registeredAddress,
        employerTan: result.updatedCompany.employerTan,
        bannerUrl: result.updatedCompany.bannerUrl,
        currency: result.updatedCompany.currency,
        createdAt: result.updatedCompany.createdAt.toISOString(),
        updatedAt: result.updatedCompany.updatedAt.toISOString(),
      },

      payrollComponents: result.savedComponents.map((component) => ({
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
  } catch (error) {
    console.error("Update company error:", error);

    if (error instanceof Error && error.message === "COMPANY_NOT_FOUND") {
      return {
        success: false,
        message: "Company not found.",
      };
    }

    if ((error as { code?: string }).code === "P2002") {
      return {
        success: false,
        message:
          "This company URL or payroll component code is already in use.",
      };
    }

    if ((error as { code?: string }).code === "P2025") {
      return {
        success: false,
        message: "Company or payroll record no longer exists.",
      };
    }

    return {
      success: false,
      message: "Failed to update company settings.",
    };
  }
}
