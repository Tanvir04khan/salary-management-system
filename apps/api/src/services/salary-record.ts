import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { employees, salaryRecords } from "../db/schema";
import type { EmployeeSalaryHistory } from "../types/employee";

export async function getEmployeeSalaryHistory(
  employeeId: string,
): Promise<EmployeeSalaryHistory | null> {
  const rows = await db
    .select({
      employeeId: employees.employeeId,
      salaryRecordId: salaryRecords.salaryRecordsId,
      amount: salaryRecords.amount,
      currency: salaryRecords.currency,
      effectiveFrom: salaryRecords.effectiveFrom,
      effectiveTo: salaryRecords.effectiveTo,
      changeReason: salaryRecords.changeReason,
      createdAt: salaryRecords.createdAt,
    })
    .from(employees)
    .leftJoin(
      salaryRecords,
      eq(employees.employeeId, salaryRecords.employeeId),
    )
    .where(eq(employees.employeeId, employeeId))
    .orderBy(desc(salaryRecords.effectiveFrom));

  if (rows.length === 0) {
    return null;
  }

  const firstRow = rows[0];
  const salaryHistory = rows.flatMap((row) => {
    if (row.salaryRecordId === null) {
      return [];
    }

    return [{
      salaryRecordId: row.salaryRecordId,
      amount: row.amount!,
      currency: row.currency!,
      effectiveFrom: row.effectiveFrom!,
      effectiveTo: row.effectiveTo,
      changeReason: row.changeReason,
      createdAt: row.createdAt!,
    }];
  });

  return {
    employeeId: firstRow.employeeId,
    salaryHistory,
  };
}
