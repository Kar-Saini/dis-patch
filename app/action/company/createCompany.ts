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

type CreateCompanyInput = {
  name: string;
  slug: string;
  bannerUrl?: string | null;
  registeredAddress?: string | null;
  employerTan?: string | null;
  payrollComponents?: PayrollComponentInput[];
};

class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

function generateSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function validatePayrollComponents(components: PayrollComponentInput[] = []) {
  if (!Array.isArray(components)) {
    throw new InputValidationError("Invalid payroll components.");
  }

  if (components.length > 100) {
    throw new InputValidationError(
      "A payroll cannot contain more than 100 components.",
    );
  }

  const codes = new Set<string>();

  const validated: {
    code: string;
    name: string;
    type: "EARNING" | "DEDUCTION";
    mode: "FIXED_AMOUNT" | "PERCENT_OF_BASIC";
    value: string;
    isEnabled: boolean;
    sortOrder: number;
    notes: string | null;
  }[] = [];

  for (let index = 0; index < components.length; index++) {
    const component = components[index];

    if (!component || typeof component !== "object") {
      throw new InputValidationError("Invalid payroll component.");
    }

    const code = String(component.code ?? "")
      .trim()
      .toUpperCase();

    const name = String(component.name ?? "").trim();

    const isEnabled = component.isEnabled ?? true;

    if (typeof isEnabled !== "boolean") {
      throw new InputValidationError(
        `Invalid enabled status for ${name || "payroll component"}.`,
      );
    }

    const rawValue = String(component.value ?? "").trim();

    if (!rawValue && isEnabled) {
      continue;
    }

    const value = rawValue || "0";

    if (!/^[A-Z][A-Z0-9_]*$/.test(code) || code.length > 50) {
      throw new InputValidationError(
        `Invalid payroll component code: ${code || "empty"}.`,
      );
    }

    if (codes.has(code)) {
      throw new InputValidationError(`Duplicate payroll component: ${code}.`);
    }

    codes.add(code);

    if (!name || name.length > 100) {
      throw new InputValidationError(
        `Invalid name for payroll component ${code}.`,
      );
    }

    if (component.type !== "EARNING" && component.type !== "DEDUCTION") {
      throw new InputValidationError(`Invalid component type for ${code}.`);
    }

    if (
      component.mode !== "FIXED_AMOUNT" &&
      component.mode !== "PERCENT_OF_BASIC"
    ) {
      throw new InputValidationError(`Invalid calculation mode for ${code}.`);
    }

    if (code === "BASIC_PAY") {
      if (component.type !== "EARNING") {
        throw new InputValidationError(
          "Basic Pay must be an earning component.",
        );
      }

      if (component.mode !== "FIXED_AMOUNT") {
        throw new InputValidationError("Basic Pay must use a fixed amount.");
      }
    }

    if (!/^(?:\d+\.?\d*|\.\d+)$/.test(value)) {
      throw new InputValidationError(`Invalid amount for ${name}.`);
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      throw new InputValidationError(
        `Amount for ${name} must be zero or greater.`,
      );
    }

    if ((value.split(".")[1]?.length ?? 0) > 4) {
      throw new InputValidationError(
        `${name} supports a maximum of 4 decimal places.`,
      );
    }

    if (numericValue > 9999999999.9999) {
      throw new InputValidationError(
        `Amount for ${name} exceeds the supported limit.`,
      );
    }

    if (component.mode === "PERCENT_OF_BASIC" && numericValue > 10000) {
      throw new InputValidationError(`Percentage for ${name} is too large.`);
    }

    const sortOrder = component.sortOrder ?? index;

    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) {
      throw new InputValidationError(`Invalid sort order for ${name}.`);
    }

    const notes =
      typeof component.notes === "string"
        ? component.notes.trim() || null
        : null;

    if (notes && notes.length > 500) {
      throw new InputValidationError(
        `Notes for ${name} cannot exceed 500 characters.`,
      );
    }

    validated.push({
      code,
      name,
      type: component.type,
      mode: component.mode,
      value,
      isEnabled,
      sortOrder,
      notes,
    });
  }

  return validated;
}

export async function createCompany(input: CreateCompanyInput) {
  try {
    if (!input || typeof input !== "object") {
      throw new InputValidationError("Invalid company information.");
    }

    const name = String(input.name ?? "").trim();

    if (!name) {
      throw new InputValidationError("Company name is required.");
    }

    if (name.length > 120) {
      throw new InputValidationError(
        "Company name cannot exceed 120 characters.",
      );
    }

    const slug = generateSlug(
      typeof input.slug === "string" && input.slug.trim() ? input.slug : name,
    );

    if (!slug || slug.length > 100) {
      throw new InputValidationError("Please provide a valid company URL.");
    }

    const registeredAddress = input.registeredAddress?.trim() || null;

    if (registeredAddress && registeredAddress.length > 500) {
      throw new InputValidationError(
        "Registered address cannot exceed 500 characters.",
      );
    }

    const employerTan = input.employerTan?.trim().toUpperCase() || null;

    const bannerUrl = input.bannerUrl?.trim() || null;

    const payrollComponents = validatePayrollComponents(
      input.payrollComponents,
    );

    const company = await prisma.company.create({
      data: {
        name,
        slug,
        bannerUrl,
        registeredAddress,
        employerTan,

        payrolls: {
          create: {
            name: "Default Payroll",
            isDefault: true,

            ...(payrollComponents.length > 0
              ? {
                  components: {
                    create: payrollComponents,
                  },
                }
              : {}),
          },
        },
      },

      include: {
        payrolls: {
          include: {
            components: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        },

        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    revalidatePath("/companies");
    revalidatePath(`/company/${company.slug}`);

    return {
      success: true as const,
      message: "Company created successfully.",

      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        bannerUrl: company.bannerUrl,
        registeredAddress: company.registeredAddress,
        employerTan: company.employerTan,
        currency: company.currency,
        createdAt: company.createdAt.toISOString(),
        updatedAt: company.updatedAt.toISOString(),
        employeeCount: company._count.employees,

        payrolls: company.payrolls.map((payroll) => ({
          id: payroll.id,
          name: payroll.name,
          isDefault: payroll.isDefault,

          components: payroll.components.map((component) => ({
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
        })),
      },
    };
  } catch (error) {
    console.error("Create company error:", error);

    if (error instanceof InputValidationError) {
      return {
        success: false as const,
        message: error.message,
      };
    }

    if ((error as { code?: string }).code === "P2002") {
      return {
        success: false as const,
        message: "A company with this URL already exists.",
      };
    }

    return {
      success: false as const,
      message: "Failed to create company.",
    };
  }
}
