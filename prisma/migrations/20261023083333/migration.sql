/*
  Warnings:

  - A unique constraint covering the columns `[employee_id]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "date_of_joining" DATE,
ADD COLUMN     "employee_id" TEXT,
ADD COLUMN     "employer_tan" TEXT,
ADD COLUMN     "frro_reg_no" TEXT,
ADD COLUMN     "iw_ssa_status" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "passport_no" TEXT,
ADD COLUMN     "tax_residency_status" TEXT,
ADD COLUMN     "visa_no" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employee_id_key" ON "Employee"("employee_id");

-- CreateIndex
CREATE INDEX "VisaPerson_entry_date_idx" ON "VisaPerson"("entry_date");
