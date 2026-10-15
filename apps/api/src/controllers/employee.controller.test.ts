import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    createEmployee,
    getEmployee,
    getEmployees,
    updateEmployee,
} from "./employee.controller";
import {
    createEmployee as createEmployeeRecord,
    getEmployeeById,
    listEmployees,
    updateEmployee as updateEmployeeRecord,
} from "../services/employee";
import type { EmployeeDetails, EmployeeList } from "../types/employee";

vi.mock("../services/employee", () => ({
    createEmployee: vi.fn(),
    getEmployeeById: vi.fn(),
    listEmployees: vi.fn(),
    updateEmployee: vi.fn(),
}));

const listEmployeesMock = vi.mocked(listEmployees);
const getEmployeeByIdMock = vi.mocked(getEmployeeById);
const createEmployeeMock = vi.mocked(createEmployeeRecord);
const updateEmployeeMock = vi.mocked(updateEmployeeRecord);

const employee: EmployeeDetails = {
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

const employeeList: EmployeeList = {
    data: [employee],
    pagination: { page: 1, pageSize: 25, totalItems: 1, totalPages: 1 },
};

function makeResponse() {
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    return res as unknown as Response & typeof res;
}

describe("getEmployees controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns a consistent 400 response for invalid query parameters", async () => {
        const req = { query: { pageSize: "500" } } as unknown as Request;
        const res = makeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await getEmployees(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            statusCode: 400,
            data: null,
            message: "Invalid employee list query parameters",
        });
        expect(listEmployeesMock).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it("validates and normalizes query parameters before returning employees", async () => {
        listEmployeesMock.mockResolvedValue(employeeList);
        const req = {
            query: { country: "in", page: "2", pageSize: "10" },
        } as unknown as Request;
        const res = makeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await getEmployees(req, res, next);

        expect(listEmployeesMock).toHaveBeenCalledWith({
            country: "IN",
            page: 2,
            pageSize: 10,
            sortBy: "employeeCode",
            sortOrder: "asc",
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            statusCode: 200,
            data: {
                employees: employeeList.data,
                pagination: employeeList.pagination,
            },
            message: "Employees retrieved successfully",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("forwards service errors to Express error middleware", async () => {
        const error = new Error("database unavailable");
        listEmployeesMock.mockRejectedValue(error);
        const req = { query: {} } as Request;
        const res = makeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await getEmployees(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it("returns a consistent 400 response for an invalid employee ID", async () => {
        const req = { params: { id: "not-a-uuid" } } as unknown as Request;
        const res = makeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await getEmployee(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            statusCode: 400,
            data: null,
            message: "Invalid employee ID",
        });
        expect(getEmployeeByIdMock).not.toHaveBeenCalled();
    });

    it("returns 404 when the employee ID is valid but absent", async () => {
        getEmployeeByIdMock.mockResolvedValue(null);
        const req = { params: { id: employee.employeeId } } as unknown as Request;
        const res = makeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await getEmployee(req, res, next);

        expect(getEmployeeByIdMock).toHaveBeenCalledWith(employee.employeeId);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            statusCode: 404,
            data: null,
            message: "Employee not found",
        });
    });

    it("returns employee details and salary using the shared response envelope", async () => {
        getEmployeeByIdMock.mockResolvedValue(employee);
        const req = { params: { id: employee.employeeId } } as unknown as Request;
        const res = makeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await getEmployee(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            statusCode: 200,
            data: employee,
            message: "Employee retrieved successfully",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("forwards employee detail service errors to Express", async () => {
        const error = new Error("database unavailable");
        getEmployeeByIdMock.mockRejectedValue(error);
        const req = { params: { id: employee.employeeId } } as unknown as Request;
        const res = makeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await getEmployee(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });

    it("returns a consistent 400 response for invalid employee data", async () => {
        const req = { body: { employeeCode: "" } } as Request;
        const res = makeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await createEmployee(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            statusCode: 400,
            data: null,
            message: "Invalid employee data",
        });
        expect(createEmployeeMock).not.toHaveBeenCalled();
    });

    it("creates an employee with normalized data and returns HTTP 201", async () => {
        createEmployeeMock.mockResolvedValue({
            ...employee,
            currentAnnualSalary: null,
            salaryCurrency: null,
        });
        const req = {
            body: {
                employeeCode: " ACME-00001 ",
                firstName: " Ada ",
                lastName: " Lovelace ",
                email: " ADA@EXAMPLE.COM ",
                countryCode: " in ",
                department: " Engineering ",
                jobTitle: " Engineer ",
            },
        } as Request;
        const res = makeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await createEmployee(req, res, next);

        expect(createEmployeeMock).toHaveBeenCalledWith({
            employeeCode: "ACME-00001",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@example.com",
            countryCode: "IN",
            department: "Engineering",
            jobTitle: "Engineer",
            employmentStatus: "ACTIVE",
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            statusCode: 201,
            data: {
                ...employee,
                currentAnnualSalary: null,
                salaryCurrency: null,
            },
            message: "Employee created successfully",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("returns 409 when employee code or email is already used", async () => {
        createEmployeeMock.mockRejectedValue(
            Object.assign(new Error("duplicate employee"), { code: "23505" }),
        );
        const req = {
            body: {
                employeeCode: "ACME-00001",
                firstName: "Ada",
                lastName: "Lovelace",
                email: "ada@example.com",
                countryCode: "IN",
                department: "Engineering",
                jobTitle: "Engineer",
            },
        } as Request;
        const res = makeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await createEmployee(req, res, next);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            statusCode: 409,
            data: null,
            message: "An employee with this employee code or email already exists",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects invalid IDs and empty update bodies", async () => {
        const res = makeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await updateEmployee(
            { params: { id: "bad-id" }, body: { department: "Finance" } } as unknown as Request,
            res,
            next,
        );
        expect(res.status).toHaveBeenNthCalledWith(1, 400);
        expect(updateEmployeeMock).not.toHaveBeenCalled();

        await updateEmployee(
            { params: { id: employee.employeeId }, body: {} } as unknown as Request,
            res,
            next,
        );
        expect(res.status).toHaveBeenNthCalledWith(2, 400);
        expect(res.json).toHaveBeenLastCalledWith({
            success: false,
            statusCode: 400,
            data: null,
            message: "Invalid employee update data",
        });
        expect(updateEmployeeMock).not.toHaveBeenCalled();
    });

    it("updates employee data and returns refreshed details", async () => {
        updateEmployeeMock.mockResolvedValue(employee);
        const req = {
            params: { id: employee.employeeId },
            body: { department: " Finance ", employmentStatus: "INACTIVE" },
        } as unknown as Request;
        const res = makeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await updateEmployee(req, res, next);

        expect(updateEmployeeMock).toHaveBeenCalledWith(employee.employeeId, {
            department: "Finance",
            employmentStatus: "INACTIVE",
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            statusCode: 200,
            data: employee,
            message: "Employee updated successfully",
        });
    });

    it("returns 404 when updating an unknown employee", async () => {
        updateEmployeeMock.mockResolvedValue(null);
        const req = {
            params: { id: employee.employeeId },
            body: { department: "Finance" },
        } as unknown as Request;
        const res = makeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await updateEmployee(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            statusCode: 404,
            data: null,
            message: "Employee not found",
        });
    });

    it("returns 409 for an email uniqueness conflict", async () => {
        updateEmployeeMock.mockRejectedValue(
            Object.assign(new Error("duplicate email"), { code: "23505" }),
        );
        const req = {
            params: { id: employee.employeeId },
            body: { email: "ada@example.com" },
        } as unknown as Request;
        const res = makeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await updateEmployee(req, res, next);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            statusCode: 409,
            data: null,
            message: "An employee with this email already exists",
        });
        expect(next).not.toHaveBeenCalled();
    });
});
