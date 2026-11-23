"use server";

import prisma from "@/utils";

export interface EmployeePayrollComponent {
  id: string | null;
  code: string;
  name: string;
  type: "EARNING" | "DEDUCTION";
  mode: "FIXED_AMOUNT" | "PERCENT_OF_BASIC" | null;
  value: string | null;
  isEnabled: boolean;
  configured: boolean;
  sortOrder: number;
}

export interface EmployeeDetails {
  id: string;
  name: string;
  employee_id: string | null;
  designation: string;
  email: string;
  phone_num: string;
  date_of_birth: string | null;
  nationality: string | null;
  address: string | null;
  passport_no: string | null;
  visa_no: string | null;
  frro_reg_no: string | null;
  tax_residency_status: string | null;
  iw_ssa_status: string | null;
  pan_num: string | null;
  bank_acc_num: string | null;
  bank: string | null;
  bank_ifsc: string | null;
  companyName: string;
  companySlug: string;
  currency: string;
  payrollSource: "COMPANY_STANDARD" | "CUSTOM";
  payrollName: string;
  payrollComponents: EmployeePayrollComponent[];
  createdAt: string;
  updatedAt: string;
}

const STANDARD_COMPONENTS = [
  {
    code: "BASIC_PAY",
    name: "Basic Pay",
    type: "EARNING",
  },
  {
    code: "HRA",
    name: "House Rent Allowance",
    type: "EARNING",
  },
  {
    code: "SPECIAL_ALLOWANCE",
    name: "Special Allowance",
    type: "EARNING",
  },
  {
    code: "PF",
    name: "Provident Fund",
    type: "DEDUCTION",
  },
  {
    code: "TDS",
    name: "TDS",
    type: "DEDUCTION",
  },
  {
    code: "ESI",
    name: "ESI",
    type: "DEDUCTION",
  },
  {
    code: "CESS",
    name: "Health & Education Cess",
    type: "DEDUCTION",
  },
  {
    code: "SPECIAL_ALLOWANCE_ARREARS",
    name: "Special Allowance Arrears",
    type: "EARNING",
  },
  {
    code: "PERFORMANCE_BONUS",
    name: "Performance Bonus",
    type: "EARNING",
  },
  {
    code: "BASIC_ARREARS",
    name: "Basic Arrears",
    type: "EARNING",
  },
] as const;

export default async function getEmployeeById(
  id: string,
  companySlug: string,
): Promise<EmployeeDetails | null> {
  if (
    typeof id !== "string" ||
    !id.trim() ||
    typeof companySlug !== "string" ||
    !companySlug.trim()
  ) {
    return null;
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: {
        id: id.trim(),
      },
      select: {
        id: true,
        companyId: true,
        name: true,
        employee_id: true,
        designation: true,
        email: true,
        phone_num: true,
        date_of_birth: true,
        nationality: true,
        address: true,
        passport_no: true,
        visa_no: true,
        frro_reg_no: true,
        tax_residency_status: true,
        iw_ssa_status: true,
        pan_num: true,
        bank_acc_num: true,
        bank: true,
        bank_ifsc: true,
        customPayroll: true,
        payrollId: true,
        created_at: true,
        updated_at: true,

        payroll: {
          select: {
            id: true,
            name: true,
            companyId: true,
            isDefault: true,
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
              },
            },
          },
        },

        company: {
          select: {
            name: true,
            slug: true,
            currency: true,
            payrolls: {
              where: {
                isDefault: true,
              },
              take: 1,
              select: {
                id: true,
                name: true,
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
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!employee || employee.company.slug !== companySlug.trim()) {
      return null;
    }

    const defaultPayroll = employee.company.payrolls[0];

    // Every company must have a default payroll.
    if (!defaultPayroll) {
      throw new Error(
        `Default payroll missing for company ${employee.company.slug}.`,
      );
    }

    // The employee's assigned payroll must belong to the same company.
    if (employee.payroll.companyId !== employee.companyId) {
      throw new Error(
        `Employee ${employee.id} has a payroll assigned to another company.`,
      );
    }

    let selectedPayroll: typeof employee.payroll;
    let payrollSource: EmployeeDetails["payrollSource"];

    if (employee.customPayroll) {
      // Custom payroll must not be the company's default payroll.
      if (
        employee.payroll.isDefault ||
        employee.payrollId === defaultPayroll.id
      ) {
        throw new Error(
          `Employee ${employee.id} has an invalid custom payroll assignment.`,
        );
      }

      selectedPayroll = employee.payroll;
      payrollSource = "CUSTOM";
    } else {
      // Standard payroll assignment must point to the company default.
      if (
        !employee.payroll.isDefault ||
        employee.payrollId !== defaultPayroll.id
      ) {
        throw new Error(
          `Employee ${employee.id} is not assigned to the company default payroll.`,
        );
      }

      selectedPayroll = employee.payroll;
      payrollSource = "COMPANY_STANDARD";
    }

    const componentMap = new Map(
      selectedPayroll.components.map((component) => [
        component.code,
        component,
      ]),
    );

    const payrollComponents: EmployeePayrollComponent[] =
      STANDARD_COMPONENTS.map((definition, index) => {
        const component = componentMap.get(definition.code);

        return {
          id: component?.id ?? null,
          code: definition.code,
          name: component?.name ?? definition.name,
          type: component?.type ?? definition.type,
          mode: component?.mode ?? null,
          value: component?.value.toString() ?? null,
          isEnabled: component?.isEnabled ?? false,
          configured: Boolean(component),
          sortOrder: component?.sortOrder ?? index,
        };
      });

    return {
      id: employee.id,
      name: employee.name,
      employee_id: employee.employee_id,
      designation: employee.designation,
      email: employee.email,
      phone_num: employee.phone_num,
      date_of_birth: employee.date_of_birth?.toISOString().slice(0, 10) ?? null,
      nationality: employee.nationality,
      address: employee.address,
      passport_no: employee.passport_no,
      visa_no: employee.visa_no,
      frro_reg_no: employee.frro_reg_no,
      tax_residency_status: employee.tax_residency_status,
      iw_ssa_status: employee.iw_ssa_status,
      pan_num: employee.pan_num,
      bank_acc_num: employee.bank_acc_num,
      bank: employee.bank,
      bank_ifsc: employee.bank_ifsc,
      companyName: employee.company.name,
      companySlug: employee.company.slug,
      currency: employee.company.currency,
      payrollSource,
      payrollName: selectedPayroll.name,
      payrollComponents,
      createdAt: employee.created_at.toISOString(),
      updatedAt: employee.updated_at.toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch employee:", error);
    throw new Error("Unable to fetch employee details.");
  }
}
