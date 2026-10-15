import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gt,
  ilike,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { employees, salaryRecords } from "../db/schema";
import {
  EmployeeCreateInput,
  EmployeeListQuery,
  EmployeeUpdateInput,
} from "../schema/employee";
import { db } from "../db/client";
import { EmployeeDetails, EmployeeList } from "../types/employee";

const sortColumns = {
  employeeCode: employees.employeeCode,
  firstName: employees.firstName,
  lastName: employees.lastName,
  department: employees.department,
  countryCode: employees.countryCode,
  createdAt: employees.createdAt,
} as const;

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

function selectEmployeeWithCurrentSalary() {
  const currentSalary = currentSalarySubquery();

  return db
    .select({
      ...getTableColumns(employees),
      currentAnnualSalary: currentSalary.amount,
      salaryCurrency: currentSalary.currency,
    })
    .from(employees)
    .leftJoinLateral(currentSalary, sql`true`);
}

export async function createEmployee(
  employeeInput: EmployeeCreateInput,
): Promise<EmployeeDetails> {
  const [employee] = await db
    .insert(employees)
    .values(employeeInput)
    .returning();

  if (!employee) {
    throw new Error("Employee insert did not return a record");
  }

  return {
    ...employee,
    currentAnnualSalary: null,
    salaryCurrency: null,
  };
}

export async function getEmployeeById(
  employeeId: string,
): Promise<EmployeeDetails | null> {
  const [employee] = await selectEmployeeWithCurrentSalary()
    .where(eq(employees.employeeId, employeeId))
    .limit(1);

  return employee ?? null;
}

export async function updateEmployee(
  employeeId: string,
  employeeInput: EmployeeUpdateInput,
): Promise<EmployeeDetails | null> {
  const [updatedEmployee] = await db
    .update(employees)
    .set({ ...employeeInput, updatedAt: new Date() })
    .where(eq(employees.employeeId, employeeId))
    .returning({ employeeId: employees.employeeId });

  if (!updatedEmployee) {
    return null;
  }

  return getEmployeeById(updatedEmployee.employeeId);
}

export async function listEmployees(
  query: EmployeeListQuery,
): Promise<EmployeeList> {
  const filters: SQL[] = [];

  if (query.country) {
    filters.push(eq(employees.countryCode, query.country));
  }

  if (query.department) {
    filters.push(eq(employees.department, query.department));
  }

  if (query.status) {
    filters.push(eq(employees.employmentStatus, query.status));
  }

  if (query.search) {
    const searchTerm = `%${query.search}%`;

    const searchFilter = or(
      ilike(employees.employeeCode, searchTerm),
      ilike(employees.firstName, searchTerm),
      ilike(employees.lastName, searchTerm),
      ilike(employees.email, searchTerm),
    );

    if (searchFilter) {
      filters.push(searchFilter);
    }
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const offset = (query.page - 1) * query.pageSize;

  const orderColumn = sortColumns[query.sortBy];
  const orderExpression =
    query.sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn);

  const [data, countResult] = await Promise.all([
    selectEmployeeWithCurrentSalary()
      .where(whereClause)
      .orderBy(orderExpression, asc(employees.employeeId))
      .limit(query.pageSize)
      .offset(offset),

    db
      .select({ total: sql<number>`count(*)::int` })
      .from(employees)
      .where(whereClause),
  ]);

  const totalItems = countResult[0]?.total ?? 0;

  return {
    data,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / query.pageSize),
    },
  };
}
