UPDATE "Employee" AS e
SET
    "payrollId" = p."id",
    "customPayroll" = false
FROM "Payroll" AS p
WHERE
    e."companyId" = p."companyId"
    AND p."isDefault" = true
    AND e."payrollId" IS NULL;