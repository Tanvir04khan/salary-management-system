import { and, asc, desc, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "../db/client";
import { employees, salaryRecords } from "../db/schema";
import type {
  AnalyticsSummary,
  CountryAnalytics,
  DepartmentAnalytics,
} from "../types/analytics";

function currentSalarySubquery() {
  return db
    .select({
      amount: salaryRecords.amount,
      currency: salaryRecords.currency,
    })
    .from(salaryRecords)
    .where(
      and(
        eq(salaryRecords.employeeId, employees.employeeId),
        lte(salaryRecords.effectiveFrom, sql`CURRENT_DATE`),
        or(
          isNull(salaryRecords.effectiveTo),
          gt(salaryRecords.effectiveTo, sql`CURRENT_DATE`),
        ),
      ),
    )
    .orderBy(desc(salaryRecords.effectiveFrom))
    .limit(1)
    .as("current_salary");
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [statusRows, salaryRows] = await Promise.all([
    db
      .select({
        status: employees.employmentStatus,
        employeeCount: sql<number>`count(*)::int`,
      })
      .from(employees)
      .groupBy(employees.employmentStatus)
      .orderBy(asc(employees.employmentStatus)),
    (() => {
      const currentSalary = currentSalarySubquery();
      return db
        .select({
          currency: currentSalary.currency,
          employeeCount: sql<number>`count(*)::int`,
          averageAnnualSalary: sql<string>`round(avg(${currentSalary.amount}), 2)::text`,
        })
        .from(employees)
        .innerJoinLateral(currentSalary, sql`true`)
        .where(eq(employees.employmentStatus, "ACTIVE"))
        .groupBy(currentSalary.currency)
        .orderBy(asc(currentSalary.currency));
    })(),
  ]);

  return {
    employeeCountsByStatus: statusRows.map((row) => ({
      status: row.status,
      employeeCount: row.employeeCount,
    })),
    currentSalaryByCurrency: salaryRows.map((row) => ({
      currency: row.currency!,
      employeeCount: row.employeeCount,
      averageAnnualSalary: row.averageAnnualSalary,
    })),
  };
}

export async function getAnalyticsByCountry(): Promise<CountryAnalytics> {
  const currentSalary = currentSalarySubquery();
  const [headcountRows, salaryRows] = await Promise.all([
    db
      .select({
        countryCode: employees.countryCode,
        activeEmployeeCount: sql<number>`count(*)::int`,
      })
      .from(employees)
      .where(eq(employees.employmentStatus, "ACTIVE"))
      .groupBy(employees.countryCode)
      .orderBy(asc(employees.countryCode)),
    db
      .select({
        countryCode: employees.countryCode,
        currency: currentSalary.currency,
        employeeCount: sql<number>`count(*)::int`,
        averageAnnualSalary: sql<string>`round(avg(${currentSalary.amount}), 2)::text`,
      })
      .from(employees)
      .innerJoinLateral(currentSalary, sql`true`)
      .where(eq(employees.employmentStatus, "ACTIVE"))
      .groupBy(employees.countryCode, currentSalary.currency)
      .orderBy(asc(employees.countryCode), asc(currentSalary.currency)),
  ]);

  return headcountRows.map((headcount) => ({
    countryCode: headcount.countryCode,
    activeEmployeeCount: headcount.activeEmployeeCount,
    currentSalaryByCurrency: salaryRows
      .filter((salary) => salary.countryCode === headcount.countryCode)
      .map((salary) => ({
        currency: salary.currency!,
        employeeCount: salary.employeeCount,
        averageAnnualSalary: salary.averageAnnualSalary,
      })),
  }));
}

export async function getAnalyticsByDepartment(): Promise<DepartmentAnalytics> {
  const currentSalary = currentSalarySubquery();
  const [headcountRows, salaryRows] = await Promise.all([
    db
      .select({
        department: employees.department,
        activeEmployeeCount: sql<number>`count(*)::int`,
      })
      .from(employees)
      .where(eq(employees.employmentStatus, "ACTIVE"))
      .groupBy(employees.department)
      .orderBy(asc(employees.department)),
    db
      .select({
        department: employees.department,
        currency: currentSalary.currency,
        employeeCount: sql<number>`count(*)::int`,
        averageAnnualSalary: sql<string>`round(avg(${currentSalary.amount}), 2)::text`,
      })
      .from(employees)
      .innerJoinLateral(currentSalary, sql`true`)
      .where(eq(employees.employmentStatus, "ACTIVE"))
      .groupBy(employees.department, currentSalary.currency)
      .orderBy(asc(employees.department), asc(currentSalary.currency)),
  ]);

  return headcountRows.map((headcount) => ({
    department: headcount.department,
    activeEmployeeCount: headcount.activeEmployeeCount,
    currentSalaryByCurrency: salaryRows
      .filter((salary) => salary.department === headcount.department)
      .map((salary) => ({
        currency: salary.currency!,
        employeeCount: salary.employeeCount,
        averageAnnualSalary: salary.averageAnnualSalary,
      })),
  }));
}
