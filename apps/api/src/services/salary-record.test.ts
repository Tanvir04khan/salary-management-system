import { desc } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { employees, salaryRecords } from "../db/schema";
import { getEmployeeSalaryHistory } from "./salary-record";

const { selectMock } = vi.hoisted(() => ({ selectMock: vi.fn() }));

vi.mock("../db/client", () => ({ db: { select: selectMock } }));

function makeQuery(result: unknown) {
  const query = {
    from: vi.fn(),
    leftJoin: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    then: (
      onFulfilled: (value: unknown) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  };

  query.from.mockReturnValue(query);
  query.leftJoin.mockReturnValue(query);
  query.where.mockReturnValue(query);
  query.orderBy.mockReturnValue(query);
  return query;
}

const employeeId = "00000000-0000-4000-8000-000000000001";
const dialect = new PgDialect();

describe("getEmployeeSalaryHistory service", () => {
  beforeEach(() => {
    selectMock.mockReset();
  });

  it("returns salary records ordered newest effective date first", async () => {
    const rows = [
      {
        employeeId,
        salaryRecordId: "salary-new",
        amount: "750000.00",
        currency: "INR",
        effectiveFrom: "2026-04-01",
        effectiveTo: null,
        changeReason: "Promotion",
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
      },
      {
        employeeId,
        salaryRecordId: "salary-old",
        amount: "600000.00",
        currency: "INR",
        effectiveFrom: "2025-04-01",
        effectiveTo: "2026-04-01",
        changeReason: "Initial salary",
        createdAt: new Date("2025-04-01T00:00:00.000Z"),
      },
    ];
    const query = makeQuery(rows);
    selectMock.mockReturnValue(query);

    const result = await getEmployeeSalaryHistory(employeeId);

    expect(result).toEqual({ employeeId, salaryHistory: rows.map((row) => ({
      salaryRecordId: row.salaryRecordId,
      amount: row.amount,
      currency: row.currency,
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
      changeReason: row.changeReason,
      createdAt: row.createdAt,
    })) });
    expect(query.from).toHaveBeenCalledWith(employees);
    expect(query.leftJoin).toHaveBeenCalledWith(
      salaryRecords,
      expect.anything(),
    );
    expect(query.where).toHaveBeenCalledWith(expect.anything());
    expect(dialect.sqlToQuery(query.where.mock.calls[0][0]).params)
      .toEqual([employeeId]);
    expect(query.orderBy).toHaveBeenCalledWith(desc(salaryRecords.effectiveFrom));
  });

  it("returns an empty history when an employee has no salary records", async () => {
    const query = makeQuery([{
      employeeId,
      salaryRecordId: null,
      amount: null,
      currency: null,
      effectiveFrom: null,
      effectiveTo: null,
      changeReason: null,
      createdAt: null,
    }]);
    selectMock.mockReturnValue(query);

    await expect(getEmployeeSalaryHistory(employeeId)).resolves.toEqual({
      employeeId,
      salaryHistory: [],
    });
  });

  it("returns null when the employee does not exist", async () => {
    selectMock.mockReturnValue(makeQuery([]));

    await expect(getEmployeeSalaryHistory(employeeId)).resolves.toBeNull();
  });
});
