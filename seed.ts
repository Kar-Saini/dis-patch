import prisma from "./utils";

// ==========================================
// COMPANIES
// ==========================================

const COMPANIES = [
  {
    name: "Company A",
    slug: "company-a",
    employees: [
      {
        name: "Aarav Mehta",
        employee_id: "A001",
        email: "kackysaini8@gmail.com",
        designation: "Software Engineer",
        phone_num: "0000000001",
        bank: "Demo Bank",
        bank_acc_num: "000000000001",
        bank_ifsc: "DUMMY000001",
        pan_num: "DEMOA0000A",
      },
      {
        name: "Priya Shah",
        employee_id: "A002",
        email: "utkarshpatel1812@gmail.com",
        designation: "HR Executive",
        phone_num: "0000000002",
        bank: "Demo Bank",
        bank_acc_num: "000000000002",
        bank_ifsc: "DUMMY000002",
        pan_num: "DEMOB0000B",
      },
    ],
  },
  {
    name: "Company B",
    slug: "company-b",
    employees: [
      {
        name: "Rohan Desai",
        employee_id: "B001",
        email: "kackysaini8@gmail.com",
        designation: "Operations Manager",
        phone_num: "0000000003",
        bank: "Demo Bank",
        bank_acc_num: "000000000003",
        bank_ifsc: "DUMMY000003",
        pan_num: "DEMOC0000C",
      },
      {
        name: "Neha Kulkarni",
        employee_id: "B002",
        email: "utkarshpatel1812@gmail.com",
        designation: "Finance Associate",
        phone_num: "0000000004",
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
        logoUrl: null,
        bannerUrl: null,
      },
    });

    console.log(`\nCompany ready: ${company.name}`);

    for (const employeeData of companyData.employees) {
      const employee = await prisma.employee.upsert({
        where: {
          companyId_email: {
            companyId: company.id,
            email: employeeData.email,
          },
        },
        update: {},
        create: {
          ...employeeData,
          companyId: company.id,
        },
      });

      totalEmployees++;

      console.log(`Employee ready: ${employee.name} (${employee.email})`);
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
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
