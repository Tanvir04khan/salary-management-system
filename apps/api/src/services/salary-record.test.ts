import { desc } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { employees, salaryRecords } from "../db/schema";
import { salaryUpdateSchema } from "../schema/employee";
import {
  FutureSalaryEffectiveDateError,
  getEmployeeSalaryHistory,
  getEmployeeCurrentSalary,
  OverlappingSalaryPeriodsError,
  planSalaryChange,
  updateEmployeeSalary,
} from "./salary-record";

const { selectMock, transactionMock } = vi.hoisted(() => ({
  selectMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("../db/client", () => ({
  db: {
    select: selectMock,
    transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

function makeQuery(result: unknown) {
  const query = {
    from: vi.fn(),
    leftJoin: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    for: vi.fn(),
    then: (
      onFulfilled: (value: unknown) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  };

  query.from.mockReturnValue(query);
  query.leftJoin.mockReturnValue(query);
  query.where.mockReturnValue(query);
  query.orderBy.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.for.mockReturnValue(query);
  return query;
}

const employeeId = "00000000-0000-4000-8000-000000000001";
const dialect = new PgDialect();

function salaryRecord(
  effectiveFrom: string,
  effectiveTo: string | null,
  salaryRecordsId = "00000000-0001-4000-8000-000000000001",
) {
  return {
    salaryRecordsId,
    employeeId,
    amount: "600000.00",
    currency: "INR",
    effectiveFrom,
    effectiveTo,
    changeReason: "Existing record",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
  };
}

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

describe("getEmployeeCurrentSalary service", () => {
  beforeEach(() => {
    selectMock.mockReset();
  });

  it("returns the salary effective today using the exclusive end date", async () => {
    const row = {
      employeeId,
      salaryRecordId: "salary-current",
      amount: "750000.00",
      currency: "INR",
      effectiveFrom: "2026-04-01",
      effectiveTo: null,
      changeReason: "Promotion",
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
    };
    const query = makeQuery([row]);
    selectMock.mockReturnValue(query);

    await expect(getEmployeeCurrentSalary(employeeId)).resolves.toEqual({
      employeeId,
      currentSalary: {
        salaryRecordId: row.salaryRecordId,
        amount: row.amount,
        currency: row.currency,
        effectiveFrom: row.effectiveFrom,
        effectiveTo: row.effectiveTo,
        changeReason: row.changeReason,
        createdAt: row.createdAt,
      },
    });

    expect(query.from).toHaveBeenCalledWith(employees);
    expect(query.orderBy).toHaveBeenCalledWith(desc(salaryRecords.effectiveFrom));
    expect(query.limit).toHaveBeenCalledWith(1);
    const join = dialect.sqlToQuery(query.leftJoin.mock.calls[0][1]);
    expect(join.sql).toContain('"effective_from" <= CURRENT_DATE');
    expect(join.sql).toContain('"effective_to" > CURRENT_DATE');
    expect(dialect.sqlToQuery(query.where.mock.calls[0][0]).params)
      .toEqual([employeeId]);
  });

  it("returns currentSalary null when the employee has no current salary", async () => {
    selectMock.mockReturnValue(makeQuery([{
      employeeId,
      salaryRecordId: null,
      amount: null,
      currency: null,
      effectiveFrom: null,
      effectiveTo: null,
      changeReason: null,
      createdAt: null,
    }]));

    await expect(getEmployeeCurrentSalary(employeeId)).resolves.toEqual({
      employeeId,
      currentSalary: null,
    });
  });

  it("returns null when the employee does not exist", async () => {
    selectMock.mockReturnValue(makeQuery([]));

    await expect(getEmployeeCurrentSalary(employeeId)).resolves.toBeNull();
  });
});

describe("planSalaryChange", () => {
  it("replaces a record that already starts on the effective date", () => {
    const record = salaryRecord("2025-01-01", null);

    expect(planSalaryChange([record], "2025-01-01")).toEqual({
      type: "replace",
      record,
    });
  });

  it("splits the record that covers a historical effective date", () => {
    const record = salaryRecord("2024-01-01", null);

    expect(planSalaryChange([record], "2025-01-01")).toEqual({
      type: "split",
      record,
      effectiveTo: null,
    });
  });

  it("ends a new record at the next salary start when the date falls in a gap", () => {
    const priorRecord = salaryRecord("2023-01-01", "2024-01-01");
    const nextRecord = salaryRecord(
      "2026-01-01",
      null,
      "00000000-0001-4000-8000-000000000002",
    );

    expect(planSalaryChange([priorRecord, nextRecord], "2025-01-01")).toEqual({
      type: "insert",
      effectiveTo: "2026-01-01",
    });
  });

  it("rejects a date covered by overlapping salary periods", () => {
    const first = salaryRecord("2024-01-01", null);
    const second = salaryRecord(
      "2024-06-01",
      null,
      "00000000-0001-4000-8000-000000000002",
    );

    expect(() => planSalaryChange([first, second], "2025-01-01"))
      .toThrow(OverlappingSalaryPeriodsError);
  });
});

describe("updateEmployeeSalary service", () => {
  beforeEach(() => {
    transactionMock.mockReset();
  });

  it("locks the employee and creates a salary effective today transactionally", async () => {
    const employeeLock = makeQuery([{ employeeId, today: "2026-05-15" }]);
    const salaryRows = makeQuery([]);
    const created = {
      ...salaryRecord("2026-05-15", null),
      amount: "1000.00",
      currency: "USD",
      changeReason: "Initial salary",
    };
    const returningMock = vi.fn().mockResolvedValue([created]);
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    const tx = {
      select: vi.fn().mockReturnValueOnce(employeeLock).mockReturnValueOnce(salaryRows),
      insert: vi.fn().mockReturnValue({ values: valuesMock }),
    };
    transactionMock.mockImplementation((...args) => {
      const callback = args.find((argument) => typeof argument === "function");
      if (typeof callback !== "function") {
        throw new Error("Transaction callback was not provided");
      }
      return callback(tx);
    });

    const result = await updateEmployeeSalary(employeeId, salaryUpdateSchema.parse({
      amount: "1000",
      currency: "usd",
      changeReason: "Initial salary",
    }));

    expect(employeeLock.for).toHaveBeenCalledWith("update");
    expect(salaryRows.for).toHaveBeenCalledWith("update");
    expect(salaryRows.orderBy).toHaveBeenCalled();
    expect(valuesMock).toHaveBeenCalledWith({
      employeeId,
      amount: "1000.00",
      currency: "USD",
      effectiveFrom: "2026-05-15",
      effectiveTo: null,
      changeReason: "Initial salary",
    });
    expect(result).toEqual({
      salaryRecordId: created.salaryRecordsId,
      amount: "1000.00",
      currency: "USD",
      effectiveFrom: "2026-05-15",
      effectiveTo: null,
      changeReason: "Initial salary",
      createdAt: created.createdAt,
    });
  });

  it("splits the covering period for a historical salary change in one transaction", async () => {
    const employeeLock = makeQuery([{ employeeId, today: "2026-05-15" }]);
    const existingRecord = salaryRecord("2024-01-01", "2027-01-01");
    const salaryRows = makeQuery([existingRecord]);
    const created = {
      ...salaryRecord("2025-01-01", "2027-01-01", "00000000-0001-4000-8000-000000000003"),
      amount: "700000.00",
      currency: "INR",
      changeReason: "Historical correction",
    };
    const closePeriod = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      then: (
        onFulfilled: (value: undefined) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve(undefined).then(onFulfilled, onRejected),
    };
    const returningMock = vi.fn().mockResolvedValue([created]);
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    const tx = {
      select: vi.fn().mockReturnValueOnce(employeeLock).mockReturnValueOnce(salaryRows),
      update: vi.fn().mockReturnValue(closePeriod),
      insert: vi.fn().mockReturnValue({ values: valuesMock }),
    };
    transactionMock.mockImplementation((...args) => {
      const callback = args.find((argument) => typeof argument === "function");
      if (typeof callback !== "function") {
        throw new Error("Transaction callback was not provided");
      }
      return callback(tx);
    });

    const result = await updateEmployeeSalary(employeeId, salaryUpdateSchema.parse({
      amount: "700000.00",
      currency: "INR",
      effectiveFrom: "2025-01-01",
      changeReason: "Historical correction",
    }));

    expect(closePeriod.set).toHaveBeenCalledWith({ effectiveTo: "2025-01-01" });
    expect(valuesMock).toHaveBeenCalledWith({
      employeeId,
      amount: "700000.00",
      currency: "INR",
      effectiveFrom: "2025-01-01",
      effectiveTo: "2027-01-01",
      changeReason: "Historical correction",
    });
    expect(result?.effectiveTo).toBe("2027-01-01");
  });

  it("rejects future effective dates before reading salary history", async () => {
    const employeeLock = makeQuery([{ employeeId, today: "2026-05-15" }]);
    const tx = { select: vi.fn().mockReturnValue(employeeLock) };
    transactionMock.mockImplementation((...args) => {
      const callback = args.find((argument) => typeof argument === "function");
      if (typeof callback !== "function") {
        throw new Error("Transaction callback was not provided");
      }
      return callback(tx);
    });

    await expect(updateEmployeeSalary(employeeId, salaryUpdateSchema.parse({
      amount: "1000.00",
      currency: "USD",
      effectiveFrom: "2026-05-16",
    }))).rejects.toThrow(FutureSalaryEffectiveDateError);

    expect(tx.select).toHaveBeenCalledOnce();
  });
});
