import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EmployeeDetails, EmployeeList, SalaryHistoryItem } from "../types/employee";
import {
    createEmployee as createEmployeeRecord,
    getEmployeeById,
    listEmployees,
    updateEmployee as updateEmployeeRecord,
} from "../services/employee";
import {
    getEmployeeCurrentSalary,
    getEmployeeSalaryHistory,
    updateEmployeeSalary,
} from "../services/salary-record";
import employeeRoutes from "./employee.routes";

vi.mock("../services/employee", () => ({
    createEmployee: vi.fn(),
    getEmployeeById: vi.fn(),
    listEmployees: vi.fn(),
    updateEmployee: vi.fn(),
}));

vi.mock("../services/salary-record", () => ({
    getEmployeeCurrentSalary: vi.fn(),
    getEmployeeSalaryHistory: vi.fn(),
    updateEmployeeSalary: vi.fn(),
}));

const listEmployeesMock = vi.mocked(listEmployees);
const getEmployeeByIdMock = vi.mocked(getEmployeeById);
const createEmployeeMock = vi.mocked(createEmployeeRecord);
const updateEmployeeMock = vi.mocked(updateEmployeeRecord);
const getSalaryHistoryMock = vi.mocked(getEmployeeSalaryHistory);
const getCurrentSalaryMock = vi.mocked(getEmployeeCurrentSalary);
const updateSalaryMock = vi.mocked(updateEmployeeSalary);
const servers: ReturnType<express.Express["listen"]>[] = [];
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

async function startTestServer() {
    const app = express();
    app.use(express.json());
    app.use("/employees", employeeRoutes);
    const server = app.listen(0);
    servers.push(server);

    await new Promise<void>((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });

    const address = server.address() as AddressInfo;
    return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    })));
    vi.clearAllMocks();
});

describe("employee routes", () => {
    it("registers GET / and returns the controller response", async () => {
        const result: EmployeeList = {
            data: [],
            pagination: { page: 1, pageSize: 25, totalItems: 0, totalPages: 0 },
        };
        listEmployeesMock.mockResolvedValue(result);
        const baseUrl = await startTestServer();

        const response = await fetch(`${baseUrl}/employees?country=in`);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            success: true,
            statusCode: 200,
            data: { employees: [], pagination: result.pagination },
            message: "Employees retrieved successfully",
        });
        expect(listEmployeesMock).toHaveBeenCalledWith({
            country: "IN",
            page: 1,
            pageSize: 25,
            sortBy: "employeeCode",
            sortOrder: "asc",
        });
    });

    it("returns 404 for a multi-segment path the employee router does not register", async () => {
        const baseUrl = await startTestServer();

        const response = await fetch(`${baseUrl}/employees/not-a-route/child`);

        expect(response.status).toBe(404);
        expect(listEmployeesMock).not.toHaveBeenCalled();
    });

    it("routes GET /:id to the employee detail controller", async () => {
        getEmployeeByIdMock.mockResolvedValue(employee);
        const baseUrl = await startTestServer();

        const response = await fetch(`${baseUrl}/employees/${employee.employeeId}`);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(getEmployeeByIdMock).toHaveBeenCalledWith(employee.employeeId);
        expect(body).toEqual({
            success: true,
            statusCode: 200,
            data: {
                ...employee,
                createdAt: employee.createdAt.toISOString(),
                updatedAt: employee.updatedAt.toISOString(),
            },
            message: "Employee retrieved successfully",
        });
    });

    it("routes POST / to employee creation and returns 201", async () => {
        const createdEmployee = {
            ...employee,
            currentAnnualSalary: null,
            salaryCurrency: null,
        };
        createEmployeeMock.mockResolvedValue(createdEmployee);
        const baseUrl = await startTestServer();

        const response = await fetch(`${baseUrl}/employees`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                employeeCode: "ACME-00001",
                firstName: "Ada",
                lastName: "Lovelace",
                email: "ada@example.com",
                countryCode: "IN",
                department: "Engineering",
                jobTitle: "Engineer",
            }),
        });
        const body = await response.json();

        expect(response.status).toBe(201);
        expect(body).toEqual({
            success: true,
            statusCode: 201,
            data: {
                ...createdEmployee,
                createdAt: employee.createdAt.toISOString(),
                updatedAt: employee.updatedAt.toISOString(),
            },
            message: "Employee created successfully",
        });
    });

    it("routes PATCH /:id to employee updates", async () => {
        const updatedEmployee = { ...employee, department: "Finance" };
        updateEmployeeMock.mockResolvedValue(updatedEmployee);
        const baseUrl = await startTestServer();

        const response = await fetch(`${baseUrl}/employees/${employee.employeeId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ department: "Finance" }),
        });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(updateEmployeeMock).toHaveBeenCalledWith(employee.employeeId, {
            department: "Finance",
        });
        expect(body).toEqual({
            success: true,
            statusCode: 200,
            data: {
                ...updatedEmployee,
                createdAt: employee.createdAt.toISOString(),
                updatedAt: employee.updatedAt.toISOString(),
            },
            message: "Employee updated successfully",
        });
    });

    it("routes GET /:id/salary-history and returns the salary history", async () => {
        const salaryHistory = {
            employeeId: employee.employeeId,
            salaryHistory: [],
        };
        getSalaryHistoryMock.mockResolvedValue(salaryHistory);
        const baseUrl = await startTestServer();

        const response = await fetch(
            `${baseUrl}/employees/${employee.employeeId}/salary-history`,
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(getSalaryHistoryMock).toHaveBeenCalledWith(employee.employeeId);
        expect(body).toEqual({
            success: true,
            statusCode: 200,
            data: salaryHistory,
            message: "Salary history retrieved successfully",
        });
    });

    it("routes PATCH /:id/salary to salary updates", async () => {
        const salaryRecord: SalaryHistoryItem = {
            salaryRecordId: "00000000-0001-4000-8000-000000000001",
            amount: "800000.00",
            currency: "INR",
            effectiveFrom: "2026-05-15",
            effectiveTo: null,
            changeReason: null,
            createdAt: new Date("2026-05-15T00:00:00.000Z"),
        };
        updateSalaryMock.mockResolvedValue(salaryRecord);
        const baseUrl = await startTestServer();

        const response = await fetch(
            `${baseUrl}/employees/${employee.employeeId}/salary`,
            {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ amount: "800000.00", currency: "INR" }),
            },
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(updateSalaryMock).toHaveBeenCalledWith(employee.employeeId, {
            amount: "800000.00",
            currency: "INR",
        });
        expect(body).toEqual({
            success: true,
            statusCode: 200,
            data: {
                ...salaryRecord,
                createdAt: salaryRecord.createdAt.toISOString(),
            },
            message: "Salary updated successfully",
        });
    });

    it("routes GET /:id/salary to the current salary controller", async () => {
        const salary = {
            employeeId: employee.employeeId,
            currentSalary: {
                salaryRecordId: "00000000-0001-4000-8000-000000000001",
                amount: "800000.00",
                currency: "INR",
                effectiveFrom: "2026-05-15",
                effectiveTo: null,
                changeReason: null,
                createdAt: new Date("2026-05-15T00:00:00.000Z"),
            },
        };
        getCurrentSalaryMock.mockResolvedValue(salary);
        const baseUrl = await startTestServer();

        const response = await fetch(`${baseUrl}/employees/${employee.employeeId}/salary`);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(getCurrentSalaryMock).toHaveBeenCalledWith(employee.employeeId);
        expect(body).toEqual({
            success: true,
            statusCode: 200,
            data: {
                ...salary,
                currentSalary: {
                    ...salary.currentSalary,
                    createdAt: salary.currentSalary.createdAt.toISOString(),
                },
            },
            message: "Current salary retrieved successfully",
        });
    });
});
