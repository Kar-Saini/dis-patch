/*
  Warnings:

  - You are about to drop the column `logoUrl` on the `Company` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,employee_id]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PayrollComponentType" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "PayrollCalculationMode" AS ENUM ('FIXED_AMOUNT', 'PERCENT_OF_BASIC');

-- CreateEnum
CREATE TYPE "PayslipAdjustmentType" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN');

-- DropIndex
DROP INDEX "Employee_companyId_email_key";

-- DropIndex
DROP INDEX "Employee_companyId_idx";

-- DropIndex
DROP INDEX "Employee_employee_id_key";

-- DropIndex
DROP INDEX "Employee_id_key";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "logoUrl",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "employerTan" TEXT,
ADD COLUMN     "registeredAddress" TEXT,
ADD COLUMN     "salaryBasisDays" INTEGER NOT NULL DEFAULT 22;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bank_account_holder_name" TEXT,
ADD COLUMN     "bank_branch" TEXT,
ADD COLUMN     "date_of_exit" DATE,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "emergency_contact_name" TEXT,
ADD COLUMN     "emergency_contact_phone" TEXT,
ADD COLUMN     "employment_status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "employment_type" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
ALTER COLUMN "bank" DROP NOT NULL,
ALTER COLUMN "bank_acc_num" DROP NOT NULL,
ALTER COLUMN "bank_ifsc" DROP NOT NULL,
ALTER COLUMN "pan_num" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PayslipLog" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "grossEarnings" DECIMAL(14,2),
ADD COLUMN     "leaveDays" DECIMAL(7,2),
ADD COLUMN     "lopDays" DECIMAL(7,2),
ADD COLUMN     "netPay" DECIMAL(14,2),
ADD COLUMN     "offDays" DECIMAL(7,2),
ADD COLUMN     "paidDays" DECIMAL(7,2),
ADD COLUMN     "payDate" DATE,
ADD COLUMN     "payslipData" JSONB,
ADD COLUMN     "recipientEmail" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "templateVersion" TEXT,
ADD COLUMN     "totalDeductions" DECIMAL(14,2),
ADD COLUMN     "workingDays" DECIMAL(7,2);

-- CreateTable
CREATE TABLE "CompanyPayrollComponent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
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

    CONSTRAINT "CompanyPayrollComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeePayrollOverride" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PayrollComponentType" NOT NULL,
    "mode" "PayrollCalculationMode" NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeePayrollOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayslipAdjustment" (
    "id" TEXT NOT NULL,
    "payslipLogId" TEXT NOT NULL,
    "type" "PayslipAdjustmentType" NOT NULL,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayslipAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyPayrollComponent_companyId_type_idx" ON "CompanyPayrollComponent"("companyId", "type");

-- CreateIndex
CREATE INDEX "CompanyPayrollComponent_companyId_isEnabled_idx" ON "CompanyPayrollComponent"("companyId", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyPayrollComponent_companyId_code_key" ON "CompanyPayrollComponent"("companyId", "code");

-- CreateIndex
CREATE INDEX "EmployeePayrollOverride_employeeId_isEnabled_idx" ON "EmployeePayrollOverride"("employeeId", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeePayrollOverride_employeeId_code_key" ON "EmployeePayrollOverride"("employeeId", "code");

-- CreateIndex
CREATE INDEX "PayslipAdjustment_payslipLogId_idx" ON "PayslipAdjustment"("payslipLogId");

-- CreateIndex
CREATE INDEX "PayslipAdjustment_type_idx" ON "PayslipAdjustment"("type");

-- CreateIndex
CREATE INDEX "Employee_companyId_email_idx" ON "Employee"("companyId", "email");

-- CreateIndex
CREATE INDEX "Employee_passport_no_idx" ON "Employee"("passport_no");

-- CreateIndex
CREATE INDEX "Employee_employment_status_idx" ON "Employee"("employment_status");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_companyId_employee_id_key" ON "Employee"("companyId", "employee_id");

-- CreateIndex
CREATE INDEX "PayslipLog_employeeId_year_month_idx" ON "PayslipLog"("employeeId", "year", "month");

-- CreateIndex
CREATE INDEX "PayslipLog_status_createdAt_idx" ON "PayslipLog"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "CompanyPayrollComponent" ADD CONSTRAINT "CompanyPayrollComponent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePayrollOverride" ADD CONSTRAINT "EmployeePayrollOverride_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipAdjustment" ADD CONSTRAINT "PayslipAdjustment_payslipLogId_fkey" FOREIGN KEY ("payslipLogId") REFERENCES "PayslipLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
