import type { NextFunction, Request, Response } from "express";
import {
  getAnalyticsByCountry,
  getAnalyticsByDepartment,
  getAnalyticsSummary,
} from "../services/analytics";
import { successResponse } from "../types/api-response";

export async function getSummary(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const summary = await getAnalyticsSummary();
    const response = successResponse(summary, "Analytics summary retrieved successfully");
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
}

export async function getByCountry(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await getAnalyticsByCountry();
    const response = successResponse(result, "Country analytics retrieved successfully");
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
}

export async function getByDepartment(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await getAnalyticsByDepartment();
    const response = successResponse(result, "Department analytics retrieved successfully");
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
}
