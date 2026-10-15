import type { NextFunction, Request, Response } from "express";
import { employeeIdParamSchema, salaryUpdateSchema } from "../schema/employee";
import {
  FutureSalaryEffectiveDateError,
  getEmployeeCurrentSalary,
  getEmployeeSalaryHistory,
  OverlappingSalaryPeriodsError,
  updateEmployeeSalary,
} from "../services/salary-record";
import { failureResponse, successResponse } from "../types/api-response";

export async function getSalaryHistory(
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
    const history = await getEmployeeSalaryHistory(parsedParams.data.id);

    if (!history) {
      const response = failureResponse("Employee not found", 404);
      res.status(response.statusCode).json(response);
      return;
    }

    const response = successResponse(
      history,
      "Salary history retrieved successfully",
    );
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
}

export async function getCurrentSalary(
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
    const result = await getEmployeeCurrentSalary(parsedParams.data.id);

    if (!result) {
      const response = failureResponse("Employee not found", 404);
      res.status(response.statusCode).json(response);
      return;
    }

    const response = successResponse(
      result,
      "Current salary retrieved successfully",
    );
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
}

export async function patchEmployeeSalary(
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

  const parsedBody = salaryUpdateSchema.safeParse(req.body);

  if (!parsedBody.success) {
    const response = failureResponse("Invalid salary data", 400);
    res.status(response.statusCode).json(response);
    return;
  }

  try {
    const salaryRecord = await updateEmployeeSalary(
      parsedParams.data.id,
      parsedBody.data,
    );

    if (!salaryRecord) {
      const response = failureResponse("Employee not found", 404);
      res.status(response.statusCode).json(response);
      return;
    }

    const response = successResponse(
      salaryRecord,
      "Salary updated successfully",
    );
    res.status(response.statusCode).json(response);
  } catch (error) {
    if (error instanceof FutureSalaryEffectiveDateError) {
      const response = failureResponse(error.message, 400);
      res.status(response.statusCode).json(response);
      return;
    }

    if (error instanceof OverlappingSalaryPeriodsError || isUniqueViolation(error)) {
      const response = failureResponse(
        "Salary history conflicts with an existing effective period",
        409,
      );
      res.status(response.statusCode).json(response);
      return;
    }

    next(error);
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && error.code === "23505";
}
