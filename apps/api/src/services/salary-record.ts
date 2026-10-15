import { and, asc, desc, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "../db/client";
import { employees, salaryRecords } from "../db/schema";
import type { SalaryUpdateInput } from "../schema/employee";
import type {
  EmployeeCurrentSalary,
  EmployeeSalaryHistory,
  SalaryHistoryItem,
} from "../types/employee";

export class FutureSalaryEffectiveDateError extends Error {
  constructor() {
    super("Salary effective date cannot be in the future");
    this.name = "FutureSalaryEffectiveDateError";
  }
}

export class OverlappingSalaryPeriodsError extends Error {
  constructor() {
    super("Salary history contains overlapping effective periods");
    this.name = "OverlappingSalaryPeriodsError";
  }
}

type SalaryRecord = typeof salaryRecords.$inferSelect;

type SalaryChangePlan =
  | { type: "replace"; record: SalaryRecord }
  | { type: "split"; record: SalaryRecord; effectiveTo: string | null }
  | { type: "insert"; effectiveTo: string | null };

export function planSalaryChange(
  records: SalaryRecord[],
  effectiveFrom: string,
): SalaryChangePlan {
  const coveringRecords = records.filter((record) =>
    record.effectiveFrom <= effectiveFrom
    && (record.effectiveTo === null || effectiveFrom < record.effectiveTo),
  );

  if (coveringRecords.length > 1) {
    throw new OverlappingSalaryPeriodsError();
  }

  const exactStart = records.find(
    (record) => record.effectiveFrom === effectiveFrom,
  );

  if (exactStart) {
    return { type: "replace", record: exactStart };
  }

  const coveringRecord = coveringRecords[0];
  if (coveringRecord) {
    return {
      type: "split",
      record: coveringRecord,
      effectiveTo: coveringRecord.effectiveTo,
    };
  }

  const nextRecord = records.find(
    (record) => record.effectiveFrom > effectiveFrom,
  );
  return { type: "insert", effectiveTo: nextRecord?.effectiveFrom ?? null };
}

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

export async function getEmployeeCurrentSalary(
  employeeId: string,
): Promise<EmployeeCurrentSalary | null> {
  const [row] = await db
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
      and(
        eq(employees.employeeId, salaryRecords.employeeId),
        lte(salaryRecords.effectiveFrom, sql`CURRENT_DATE`),
        or(
          isNull(salaryRecords.effectiveTo),
          gt(salaryRecords.effectiveTo, sql`CURRENT_DATE`),
        ),
      ),
    )
    .where(eq(employees.employeeId, employeeId))
    .orderBy(desc(salaryRecords.effectiveFrom))
    .limit(1);

  if (!row) {
    return null;
  }

  const currentSalary = row.salaryRecordId === null
    ? null
    : {
      salaryRecordId: row.salaryRecordId,
      amount: row.amount!,
      currency: row.currency!,
      effectiveFrom: row.effectiveFrom!,
      effectiveTo: row.effectiveTo,
      changeReason: row.changeReason,
      createdAt: row.createdAt!,
    };

  return { employeeId: row.employeeId, currentSalary };
}

export async function updateEmployeeSalary(
  employeeId: string,
  input: SalaryUpdateInput,
): Promise<SalaryHistoryItem | null> {
  return db.transaction(async (tx) => {
    const [employee] = await tx
      .select({
        employeeId: employees.employeeId,
        today: sql<string>`CURRENT_DATE::text`,
      })
      .from(employees)
      .where(eq(employees.employeeId, employeeId))
      .for("update");

    if (!employee) {
      return null;
    }

    const effectiveFrom = input.effectiveFrom ?? employee.today;

    if (effectiveFrom > employee.today) {
      throw new FutureSalaryEffectiveDateError();
    }

    const records = await tx
      .select()
      .from(salaryRecords)
      .where(eq(salaryRecords.employeeId, employeeId))
      .orderBy(asc(salaryRecords.effectiveFrom))
      .for("update");

    const plan = planSalaryChange(records, effectiveFrom);

    if (plan.type === "replace") {
      const [updatedRecord] = await tx
        .update(salaryRecords)
        .set({
          amount: input.amount,
          currency: input.currency,
          changeReason: input.changeReason ?? plan.record.changeReason,
        })
        .where(eq(salaryRecords.salaryRecordsId, plan.record.salaryRecordsId))
        .returning();

      return updatedRecord ? toSalaryHistoryItem(updatedRecord) : null;
    }

    if (plan.type === "split") {
      await tx
        .update(salaryRecords)
        .set({ effectiveTo: effectiveFrom })
        .where(eq(salaryRecords.salaryRecordsId, plan.record.salaryRecordsId));
    }

    const [createdRecord] = await tx
      .insert(salaryRecords)
      .values({
        employeeId,
        amount: input.amount,
        currency: input.currency,
        effectiveFrom,
        effectiveTo: plan.effectiveTo,
        changeReason: input.changeReason ?? null,
      })
      .returning();

    return createdRecord ? toSalaryHistoryItem(createdRecord) : null;
  });
}

function toSalaryHistoryItem(
  record: typeof salaryRecords.$inferSelect,
): SalaryHistoryItem {
  return {
    salaryRecordId: record.salaryRecordsId,
    amount: record.amount,
    currency: record.currency,
    effectiveFrom: record.effectiveFrom,
    effectiveTo: record.effectiveTo,
    changeReason: record.changeReason,
    createdAt: record.createdAt,
  };
}
