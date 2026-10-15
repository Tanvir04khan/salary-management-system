import { asc, desc } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { employees, salaryRecords } from "../db/schema";
import {
    employeeCreateSchema,
    employeeListQuerySchema,
    employeeUpdateSchema,
} from "../schema/employee";
import type { EmployeeDetails, EmployeeList } from "../types/employee";
import {
    createEmployee,
    getEmployeeById,
    listEmployees,
    updateEmployee,
} from "./employee";

const { insertMock, selectMock, updateMock } = vi.hoisted(() => ({
    insertMock: vi.fn(),
    selectMock: vi.fn(),
    updateMock: vi.fn(),
}));

vi.mock("../db/client", () => ({
    db: { insert: insertMock, select: selectMock, update: updateMock },
}));

function makeQueryBuilder(result: unknown) {
    const builder = {
        from: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
        offset: vi.fn(),
        leftJoinLateral: vi.fn(),
        as: vi.fn(),
        then: (
            onFulfilled: (value: unknown) => unknown,
            onRejected?: (reason: unknown) => unknown,
        ) => Promise.resolve(result).then(onFulfilled, onRejected),
    };

    builder.from.mockReturnValue(builder);
    builder.where.mockReturnValue(builder);
    builder.orderBy.mockReturnValue(builder);
    builder.limit.mockReturnValue(builder);
    builder.offset.mockReturnValue(builder);
    builder.leftJoinLateral.mockReturnValue(builder);
    return builder;
}

function arrangeQueries(dataRows: EmployeeList["data"], total: number | undefined) {
    const salaryQuery = makeQueryBuilder(undefined);
    const salaryAlias = {
        amount: salaryRecords.amount,
        currency: salaryRecords.currency,
    };
    salaryQuery.as.mockReturnValue(salaryAlias);

    const dataQuery = makeQueryBuilder(dataRows);
    const countQuery = makeQueryBuilder(
        total === undefined ? [] : [{ total }],
    );
    selectMock
        .mockReturnValueOnce(salaryQuery)
        .mockReturnValueOnce(dataQuery)
        .mockReturnValueOnce(countQuery);

    return { salaryQuery, salaryAlias, dataQuery, countQuery };
}

function arrangeDetailQuery(rows: EmployeeDetails[]) {
    const salaryQuery = makeQueryBuilder(undefined);
    const salaryAlias = {
        amount: salaryRecords.amount,
        currency: salaryRecords.currency,
    };
    salaryQuery.as.mockReturnValue(salaryAlias);

    const employeeQuery = makeQueryBuilder(rows);
    selectMock
        .mockReturnValueOnce(salaryQuery)
        .mockReturnValueOnce(employeeQuery);

    return { salaryQuery, salaryAlias, employeeQuery };
}

const employeeDetail: EmployeeDetails = {
    employeeId: "00000000-0000-4000-8000-000000000001",
    employeeCode: "ACME-00001",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    countryCode: "IN",
    department: "Engineering",
    jobTitle: "Engineer",
    employmentStatus: "ACTIVE",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    currentAnnualSalary: "600000.00",
    salaryCurrency: "INR",
};

const employeeRows: EmployeeList["data"] = [];
const dialect = new PgDialect();

describe("listEmployees service", () => {
    beforeEach(() => {
        selectMock.mockReset();
    });

    it("returns rows and pagination using default sorting and first-page offset", async () => {
        const { dataQuery, countQuery } = arrangeQueries(employeeRows, 26);

        const result = await listEmployees(employeeListQuerySchema.parse({}));

        expect(result).toEqual({
            data: employeeRows,
            pagination: { page: 1, pageSize: 25, totalItems: 26, totalPages: 2 },
        });
        expect(dataQuery.where).toHaveBeenCalledWith(undefined);
        expect(dataQuery.leftJoinLateral).toHaveBeenCalled();
        expect(dataQuery.orderBy).toHaveBeenCalledWith(
            asc(employees.employeeCode),
            asc(employees.employeeId),
        );
        expect(dataQuery.limit).toHaveBeenCalledWith(25);
        expect(dataQuery.offset).toHaveBeenCalledWith(0);
        expect(countQuery.where).toHaveBeenCalledWith(undefined);
    });

    it("projects the latest salary effective today without duplicating employees", async () => {
        const { salaryQuery, salaryAlias, dataQuery } = arrangeQueries(employeeRows, 0);

        await listEmployees(employeeListQuerySchema.parse({}));

        const salaryPeriod = dialect.sqlToQuery(salaryQuery.where.mock.calls[0][0]);
        expect(salaryPeriod.sql).toContain('"salary_records"."employee_id" = "employees"."employee_id"');
        expect(salaryPeriod.sql).toContain('"salary_records"."effective_from" <= CURRENT_DATE');
        expect(salaryPeriod.sql).toContain('"salary_records"."effective_to" > CURRENT_DATE');
        expect(salaryQuery.orderBy).toHaveBeenCalledWith(
            desc(salaryRecords.effectiveFrom),
        );
        expect(salaryQuery.limit).toHaveBeenCalledWith(1);
        expect(dataQuery.leftJoinLateral).toHaveBeenCalledWith(
            salaryAlias,
            expect.anything(),
        );

        const selection = selectMock.mock.calls[1][0];
        expect(selection.currentAnnualSalary).toBe(salaryAlias.amount);
        expect(selection.salaryCurrency).toBe(salaryAlias.currency);
    });

    it("combines country, department, status, and case-insensitive search filters", async () => {
        const { dataQuery, countQuery } = arrangeQueries(employeeRows, 0);
        const query = employeeListQuerySchema.parse({
            country: "in",
            department: "Engineering",
            status: "ACTIVE",
            search: "ACME-00001",
        });

        await listEmployees(query);

        const whereClause = dataQuery.where.mock.calls[0][0];
        const renderedWhere = dialect.sqlToQuery(whereClause);
        expect(renderedWhere.sql).toContain('"employees"."country_code" =');
        expect(renderedWhere.sql).toContain('"employees"."department" =');
        expect(renderedWhere.sql).toContain('"employees"."employment_status" =');
        expect(renderedWhere.sql.match(/ ilike /gi)).toHaveLength(4);
        expect(renderedWhere.params).toEqual([
            "IN",
            "Engineering",
            "ACTIVE",
            "%ACME-00001%",
            "%ACME-00001%",
            "%ACME-00001%",
            "%ACME-00001%",
        ]);
        expect(countQuery.where).toHaveBeenCalledWith(whereClause);
    });

    it("uses descending requested sort, a stable employee tie-breaker, and the requested offset", async () => {
        const { dataQuery } = arrangeQueries(employeeRows, 45);

        const result = await listEmployees(employeeListQuerySchema.parse({
            page: "3",
            pageSize: "10",
            sortBy: "lastName",
            sortOrder: "desc",
        }));

        expect(dataQuery.orderBy).toHaveBeenCalledWith(
            desc(employees.lastName),
            asc(employees.employeeId),
        );
        expect(dataQuery.limit).toHaveBeenCalledWith(10);
        expect(dataQuery.offset).toHaveBeenCalledWith(20);
        expect(result.pagination).toEqual({
            page: 3,
            pageSize: 10,
            totalItems: 45,
            totalPages: 5,
        });
    });

    it("returns zero total pages when the count query has no row", async () => {
        const { dataQuery } = arrangeQueries(employeeRows, undefined);

        const result = await listEmployees(employeeListQuerySchema.parse({}));

        expect(result.pagination.totalItems).toBe(0);
        expect(result.pagination.totalPages).toBe(0);
    });
});

describe("getEmployeeById service", () => {
    beforeEach(() => {
        selectMock.mockReset();
    });

    it("returns one employee with current salary details for the UUID", async () => {
        const { employeeQuery, salaryAlias } = arrangeDetailQuery([employeeDetail]);

        const result = await getEmployeeById(employeeDetail.employeeId);

        expect(result).toEqual(employeeDetail);
        expect(employeeQuery.where).toHaveBeenCalledTimes(1);
        expect(dialect.sqlToQuery(employeeQuery.where.mock.calls[0][0]).params)
            .toEqual([employeeDetail.employeeId]);
        expect(employeeQuery.leftJoinLateral).toHaveBeenCalledWith(
            salaryAlias,
            expect.anything(),
        );
        expect(employeeQuery.limit).toHaveBeenCalledWith(1);
    });

    it("returns null when the UUID does not match an employee", async () => {
        arrangeDetailQuery([]);

        const result = await getEmployeeById("00000000-0000-4000-8000-000000000099");

        expect(result).toBeNull();
    });
});

describe("createEmployee service", () => {
    beforeEach(() => {
        insertMock.mockReset();
    });

    it("inserts validated employee data and returns null current salary fields", async () => {
        const input = employeeCreateSchema.parse({
            employeeCode: " ACME-00002 ",
            firstName: " Grace ",
            lastName: " Hopper ",
            email: " GRACE@EXAMPLE.COM ",
            countryCode: " us ",
            department: " Engineering ",
            jobTitle: " Compiler Engineer ",
        });
        const returningMock = vi.fn().mockResolvedValue([employeeDetail]);
        const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
        insertMock.mockReturnValue({ values: valuesMock });

        const result = await createEmployee(input);

        expect(insertMock).toHaveBeenCalledWith(employees);
        expect(valuesMock).toHaveBeenCalledWith(input);
        expect(returningMock).toHaveBeenCalledOnce();
        expect(result).toEqual({
            ...employeeDetail,
            currentAnnualSalary: null,
            salaryCurrency: null,
        });
    });

    it("throws if the insert does not return the created row", async () => {
        const input = employeeCreateSchema.parse({
            employeeCode: "ACME-00002",
            firstName: "Grace",
            lastName: "Hopper",
            email: "grace@example.com",
            countryCode: "US",
            department: "Engineering",
            jobTitle: "Compiler Engineer",
        });
        const returningMock = vi.fn().mockResolvedValue([]);
        insertMock.mockReturnValue({
            values: vi.fn().mockReturnValue({ returning: returningMock }),
        });

        await expect(createEmployee(input)).rejects.toThrow(
            "Employee insert did not return a record",
        );
    });
});

describe("updateEmployee service", () => {
    beforeEach(() => {
        updateMock.mockReset();
        selectMock.mockReset();
    });

    it("updates supplied fields and returns the refreshed employee details", async () => {
        const input = employeeUpdateSchema.parse({
            department: " Finance ",
            employmentStatus: "INACTIVE",
        });
        const returningMock = vi.fn().mockResolvedValue([
            { employeeId: employeeDetail.employeeId },
        ]);
        const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
        const setMock = vi.fn().mockReturnValue({ where: whereMock });
        updateMock.mockReturnValue({ set: setMock });
        const { employeeQuery, salaryAlias } = arrangeDetailQuery([employeeDetail]);

        const result = await updateEmployee(employeeDetail.employeeId, input);

        expect(updateMock).toHaveBeenCalledWith(employees);
        expect(setMock).toHaveBeenCalledWith(expect.objectContaining({
            department: "Finance",
            employmentStatus: "INACTIVE",
            updatedAt: expect.any(Date),
        }));
        expect(dialect.sqlToQuery(whereMock.mock.calls[0][0]).params)
            .toEqual([employeeDetail.employeeId]);
        expect(returningMock).toHaveBeenCalledOnce();
        expect(result).toEqual(employeeDetail);
        expect(employeeQuery.leftJoinLateral).toHaveBeenCalledWith(
            salaryAlias,
            expect.anything(),
        );
    });

    it("returns null and skips the detail query when the employee is absent", async () => {
        const input = employeeUpdateSchema.parse({ employmentStatus: "INACTIVE" });
        const returningMock = vi.fn().mockResolvedValue([]);
        const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
        updateMock.mockReturnValue({
            set: vi.fn().mockReturnValue({ where: whereMock }),
        });

        const result = await updateEmployee(employeeDetail.employeeId, input);

        expect(result).toBeNull();
        expect(selectMock).not.toHaveBeenCalled();
    });
});
