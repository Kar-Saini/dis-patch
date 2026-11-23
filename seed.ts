import prisma from "./utils";

// ==========================================
// COMPANIES AND EMPLOYEES
// ==========================================

const COMPANIES = [
  {
    name: "FINALTEST 1",
    slug: "finaltest-1",
    employees: [
      {
        name: "Kabir Nair",
        employee_id: "FT1-001",
        email: "kackysaini8@gmail.com",
        designation: "Software Engineer",
        phone_num: "9000000001",
        bank: "Demo Bank",
        bank_acc_num: "000000000001",
        bank_ifsc: "DUMMY000001",
        pan_num: "DEMOA0000A",
      },
      {
        name: "Ananya Rao",
        employee_id: "FT1-002",
        email: "utkarshpatel1812@gmail.com",
        designation: "HR Executive",
        phone_num: "9000000002",
        bank: "Demo Bank",
        bank_acc_num: "000000000002",
        bank_ifsc: "DUMMY000002",
        pan_num: "DEMOB0000B",
      },
    ],
  },
  {
    name: "FINALTEST 2",
    slug: "finaltest-2",
    employees: [
      {
        name: "Vihaan Kapoor",
        employee_id: "FT2-001",
        email: "kackysaini8@gmail.com",
        designation: "Operations Manager",
        phone_num: "9000000003",
        bank: "Demo Bank",
        bank_acc_num: "000000000003",
        bank_ifsc: "DUMMY000003",
        pan_num: "DEMOC0000C",
      },
      {
        name: "Isha Menon",
        employee_id: "FT2-002",
        email: "utkarshpatel1812@gmail.com",
        designation: "Finance Associate",
        phone_num: "9000000004",
        bank: "Demo Bank",
        bank_acc_num: "000000000004",
        bank_ifsc: "DUMMY000004",
        pan_num: "DEMOD0000D",
      },
    ],
  },
];

// ==========================================
// SEED COMPANIES AND EMPLOYEES
// ==========================================

async function seedCompaniesAndEmployees() {
  let totalEmployees = 0;

  for (const companyData of COMPANIES) {
    // Create or update company
    const company = await prisma.company.upsert({
      where: {
        slug: companyData.slug,
      },
      update: {
        name: companyData.name,
      },
      create: {
        name: companyData.name,
        slug: companyData.slug,
        bannerUrl: null,
        registeredAddress: null,
        employerTan: null,
        salaryBasisDays: 22,
      },
    });

    console.log(`\nCompany ready: ${company.name}`);

    // Create or update employees
    for (const employeeData of companyData.employees) {
      const employee = await prisma.employee.upsert({
        where: {
          companyId_employee_id: {
            companyId: company.id,
            employee_id: employeeData.employee_id,
          },
        },

        update: {
          name: employeeData.name,
          email: employeeData.email,
          designation: employeeData.designation,
          phone_num: employeeData.phone_num,
          bank: employeeData.bank,
          bank_acc_num: employeeData.bank_acc_num,
          bank_ifsc: employeeData.bank_ifsc,
          pan_num: employeeData.pan_num,
        },

        create: {
          ...employeeData,
          companyId: company.id,
        },
      });

      totalEmployees++;

      console.log(`Employee ready: ${employee.name} (${employee.employee_id})`);
    }
  }

  console.log("\n================================");
  console.log("SEED COMPLETED");
  console.log("================================");
  console.log(`Companies: ${COMPANIES.length}`);
  console.log(`Employees processed: ${totalEmployees}`);
}

// ==========================================
// MAIN
// ==========================================

async function main() {
  await seedCompaniesAndEmployees();
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
