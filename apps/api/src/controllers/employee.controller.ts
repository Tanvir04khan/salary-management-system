import type { Request, Response, NextFunction } from "express";
import {
    employeeCreateSchema,
    employeeIdParamSchema,
    employeeListQuerySchema,
    employeeUpdateSchema,
} from "../schema/employee";
import {
    createEmployee as createEmployeeRecord,
    getEmployeeById,
    listEmployees,
    updateEmployee as updateEmployeeRecord,
} from "../services/employee";
import { failureResponse, successResponse } from "../types/api-response";

export async function getEmployees(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const parsedQuery = employeeListQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
        const response = failureResponse(
            "Invalid employee list query parameters",
            400,
        );
        res.status(response.statusCode).json(response);
        return;
    }

    try {
        const result = await listEmployees(parsedQuery.data);
        const response = successResponse(
            { employees: result.data, pagination: result.pagination },
            "Employees retrieved successfully",
        );
        res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
}

export async function createEmployee(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const parsedBody = employeeCreateSchema.safeParse(req.body);

    if (!parsedBody.success) {
        const response = failureResponse("Invalid employee data", 400);
        res.status(response.statusCode).json(response);
        return;
    }

    try {
        const employee = await createEmployeeRecord(parsedBody.data);
        const response = successResponse(
            employee,
            "Employee created successfully",
            201,
        );
        res.status(response.statusCode).json(response);
    } catch (error) {
        if (isUniqueConstraintViolation(error)) {
            const response = failureResponse(
                "An employee with this employee code or email already exists",
                409,
            );
            res.status(response.statusCode).json(response);
            return;
        }

        next(error);
    }
}

function isUniqueConstraintViolation(error: unknown): boolean {
    return typeof error === "object"
        && error !== null
        && "code" in error
        && error.code === "23505";
}

export async function getEmployee(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const parsedParams = employeeIdParamSchema.safeParse(req.params);

    if (!parsedParams.success) {
        const response = failureResponse("Invalid employee ID", 400);
        res.status(response.statusCode).json(response);
        return;
    }

    try {
        const employee = await getEmployeeById(parsedParams.data.id);

        if (!employee) {
            const response = failureResponse("Employee not found", 404);
            res.status(response.statusCode).json(response);
            return;
        }

        const response = successResponse(employee, "Employee retrieved successfully");
        res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
}

export async function updateEmployee(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const parsedParams = employeeIdParamSchema.safeParse(req.params);

    if (!parsedParams.success) {
        const response = failureResponse("Invalid employee ID", 400);
        res.status(response.statusCode).json(response);
        return;
    }

    const parsedBody = employeeUpdateSchema.safeParse(req.body);

    if (!parsedBody.success) {
        const response = failureResponse("Invalid employee update data", 400);
        res.status(response.statusCode).json(response);
        return;
    }

    try {
        const employee = await updateEmployeeRecord(
            parsedParams.data.id,
            parsedBody.data,
        );

        if (!employee) {
            const response = failureResponse("Employee not found", 404);
            res.status(response.statusCode).json(response);
            return;
        }

        const response = successResponse(employee, "Employee updated successfully");
        res.status(response.statusCode).json(response);
    } catch (error) {
        if (isUniqueConstraintViolation(error)) {
            const response = failureResponse(
                "An employee with this email already exists",
                409,
            );
            res.status(response.statusCode).json(response);
            return;
        }

        next(error);
    }
}
