import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { employees, salaryRecords } from "../db/schema";
import {
  getAnalyticsByCountry,
  getAnalyticsByDepartment,
  getAnalyticsSummary,
} from "./analytics";

const { selectMock } = vi.hoisted(() => ({ selectMock: vi.fn() }));

vi.mock("../db/client", () => ({ db: { select: selectMock } }));

function query(result: unknown) {
  const builder = {
    from: vi.fn(),
    where: vi.fn(),
    groupBy: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    as: vi.fn(),
    innerJoinLateral: vi.fn(),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  for (const method of ["from", "where", "groupBy", "orderBy", "limit", "innerJoinLateral"] as const) {
    builder[method].mockReturnValue(builder);
  }
  return builder;
}

describe("getAnalyticsSummary service", () => {
  beforeEach(() => {
    selectMock.mockReset();
  });

  it("groups headcount by status and active current salary averages by currency", async () => {
    const statusQuery = query([
      { status: "ACTIVE", employeeCount: 8 },
      { status: "INACTIVE", employeeCount: 2 },
    ]);
    const currentSalaryQuery = query(undefined);
    const salarySummaryQuery = query([
      { currency: "INR", employeeCount: 3, averageAnnualSalary: "850000.00" },
      { currency: "USD", employeeCount: 1, averageAnnualSalary: "92000.00" },
    ]);
    const currentSalaryAlias = {
      amount: salaryRecords.amount,
      currency: salaryRecords.currency,
    };
    currentSalaryQuery.as.mockReturnValue(currentSalaryAlias);
    selectMock
      .mockReturnValueOnce(statusQuery)
      .mockReturnValueOnce(currentSalaryQuery)
      .mockReturnValueOnce(salarySummaryQuery);

    await expect(getAnalyticsSummary()).resolves.toEqual({
      employeeCountsByStatus: [
        { status: "ACTIVE", employeeCount: 8 },
        { status: "INACTIVE", employeeCount: 2 },
      ],
      currentSalaryByCurrency: [
        { currency: "INR", employeeCount: 3, averageAnnualSalary: "850000.00" },
        { currency: "USD", employeeCount: 1, averageAnnualSalary: "92000.00" },
      ],
    });

    expect(statusQuery.from).toHaveBeenCalledWith(employees);
    expect(salarySummaryQuery.innerJoinLateral).toHaveBeenCalledWith(
      currentSalaryAlias,
      expect.anything(),
    );
    expect(salarySummaryQuery.groupBy).toHaveBeenCalledWith(currentSalaryAlias.currency);
    expect(salarySummaryQuery.where).toHaveBeenCalledWith(expect.anything());
    expect(new PgDialect().sqlToQuery(salarySummaryQuery.where.mock.calls[0][0]).params)
      .toEqual(["ACTIVE"]);
    expect(currentSalaryQuery.limit).toHaveBeenCalledWith(1);
  });

  it("returns empty breakdowns when no employees or current salaries exist", async () => {
    const statusQuery = query([]);
    const currentSalaryQuery = query(undefined);
    currentSalaryQuery.as.mockReturnValue({
      amount: salaryRecords.amount,
      currency: salaryRecords.currency,
    });
    const salarySummaryQuery = query([]);
    selectMock
      .mockReturnValueOnce(statusQuery)
      .mockReturnValueOnce(currentSalaryQuery)
      .mockReturnValueOnce(salarySummaryQuery);

    await expect(getAnalyticsSummary()).resolves.toEqual({
      employeeCountsByStatus: [],
      currentSalaryByCurrency: [],
    });
  });
});

describe("getAnalyticsByCountry service", () => {
  beforeEach(() => {
    selectMock.mockReset();
  });

  it("returns active headcount and salary averages separately by country and currency", async () => {
    const currentSalaryQuery = query(undefined);
    const currentSalaryAlias = {
      amount: salaryRecords.amount,
      currency: salaryRecords.currency,
    };
    currentSalaryQuery.as.mockReturnValue(currentSalaryAlias);
    const headcountQuery = query([
      { countryCode: "IN", activeEmployeeCount: 3 },
      { countryCode: "US", activeEmployeeCount: 2 },
    ]);
    const salaryQuery = query([
      { countryCode: "IN", currency: "INR", employeeCount: 2, averageAnnualSalary: "850000.00" },
    ]);
    selectMock
      .mockReturnValueOnce(currentSalaryQuery)
      .mockReturnValueOnce(headcountQuery)
      .mockReturnValueOnce(salaryQuery);

    await expect(getAnalyticsByCountry()).resolves.toEqual([
      {
        countryCode: "IN",
        activeEmployeeCount: 3,
        currentSalaryByCurrency: [
          { currency: "INR", employeeCount: 2, averageAnnualSalary: "850000.00" },
        ],
      },
      { countryCode: "US", activeEmployeeCount: 2, currentSalaryByCurrency: [] },
    ]);

    expect(headcountQuery.groupBy).toHaveBeenCalledWith(employees.countryCode);
    expect(salaryQuery.innerJoinLateral).toHaveBeenCalledWith(currentSalaryAlias, expect.anything());
    expect(salaryQuery.groupBy).toHaveBeenCalledWith(employees.countryCode, currentSalaryAlias.currency);
    expect(currentSalaryQuery.limit).toHaveBeenCalledWith(1);
  });
});

describe("getAnalyticsByDepartment service", () => {
  beforeEach(() => {
    selectMock.mockReset();
  });

  it("returns active headcount and currency-specific salary averages by department", async () => {
    const currentSalaryQuery = query(undefined);
    const currentSalaryAlias = {
      amount: salaryRecords.amount,
      currency: salaryRecords.currency,
    };
    currentSalaryQuery.as.mockReturnValue(currentSalaryAlias);
    const headcountQuery = query([
      { department: "Engineering", activeEmployeeCount: 3 },
      { department: "Finance", activeEmployeeCount: 2 },
    ]);
    const salaryQuery = query([
      { department: "Engineering", currency: "INR", employeeCount: 2, averageAnnualSalary: "850000.00" },
    ]);
    selectMock
      .mockReturnValueOnce(currentSalaryQuery)
      .mockReturnValueOnce(headcountQuery)
      .mockReturnValueOnce(salaryQuery);

    await expect(getAnalyticsByDepartment()).resolves.toEqual([
      {
        department: "Engineering",
        activeEmployeeCount: 3,
        currentSalaryByCurrency: [
          { currency: "INR", employeeCount: 2, averageAnnualSalary: "850000.00" },
        ],
      },
      { department: "Finance", activeEmployeeCount: 2, currentSalaryByCurrency: [] },
    ]);

    expect(headcountQuery.groupBy).toHaveBeenCalledWith(employees.department);
    expect(salaryQuery.innerJoinLateral).toHaveBeenCalledWith(currentSalaryAlias, expect.anything());
    expect(salaryQuery.groupBy).toHaveBeenCalledWith(employees.department, currentSalaryAlias.currency);
    expect(currentSalaryQuery.limit).toHaveBeenCalledWith(1);
  });
});
