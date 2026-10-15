import type { NextFunction, Request, Response } from "express";
import { employeeIdParamSchema } from "../schema/employee";
import { getEmployeeSalaryHistory } from "../services/salary-record";
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
