/*
  Warnings:

  - You are about to drop the column `bank_account_holder_name` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `bank_branch` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `date_of_exit` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `date_of_joining` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `email_verified` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `emergency_contact_name` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `emergency_contact_phone` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `employer_tan` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `employment_status` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `employment_type` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the `CompanyPayrollComponent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmployeePayrollOverride` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `companyId` on table `Employee` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "CompanyPayrollComponent" DROP CONSTRAINT "CompanyPayrollComponent_companyId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeePayrollOverride" DROP CONSTRAINT "EmployeePayrollOverride_employeeId_fkey";

-- DropIndex
DROP INDEX "Employee_employment_status_idx";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "bank_account_holder_name",
DROP COLUMN "bank_branch",
DROP COLUMN "date_of_exit",
DROP COLUMN "date_of_joining",
DROP COLUMN "department",
DROP COLUMN "email_verified",
DROP COLUMN "emergency_contact_name",
DROP COLUMN "emergency_contact_phone",
DROP COLUMN "employer_tan",
DROP COLUMN "employment_status",
DROP COLUMN "employment_type",
ADD COLUMN     "customPayroll" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payrollId" TEXT,
ALTER COLUMN "companyId" SET NOT NULL;

-- DropTable
DROP TABLE "CompanyPayrollComponent";

-- DropTable
DROP TABLE "EmployeePayrollOverride";

-- DropEnum
DROP TYPE "EmployeeStatus";

-- DropEnum
DROP TYPE "EmploymentType";

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollComponent" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PayrollComponentType" NOT NULL,
    "mode" "PayrollCalculationMode" NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payroll_companyId_idx" ON "Payroll"("companyId");

-- CreateIndex
CREATE INDEX "Payroll_companyId_isDefault_idx" ON "Payroll"("companyId", "isDefault");

-- CreateIndex
CREATE INDEX "PayrollComponent_payrollId_type_idx" ON "PayrollComponent"("payrollId", "type");

-- CreateIndex
CREATE INDEX "PayrollComponent_payrollId_isEnabled_idx" ON "PayrollComponent"("payrollId", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollComponent_payrollId_code_key" ON "PayrollComponent"("payrollId", "code");

-- CreateIndex
CREATE INDEX "Employee_payrollId_idx" ON "Employee"("payrollId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollComponent" ADD CONSTRAINT "PayrollComponent_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
