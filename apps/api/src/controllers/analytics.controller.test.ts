import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getByCountry, getByDepartment, getSummary } from "./analytics.controller";
import {
  getAnalyticsByCountry,
  getAnalyticsByDepartment,
  getAnalyticsSummary,
} from "../services/analytics";

vi.mock("../services/analytics", () => ({
  getAnalyticsByCountry: vi.fn(),
  getAnalyticsByDepartment: vi.fn(),
  getAnalyticsSummary: vi.fn(),
}));
const getSummaryMock = vi.mocked(getAnalyticsSummary);
const getByCountryMock = vi.mocked(getAnalyticsByCountry);
const getByDepartmentMock = vi.mocked(getAnalyticsByDepartment);

function response() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
}

describe("getSummary controller", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the summary using the shared response envelope", async () => {
    const summary = {
      employeeCountsByStatus: [{ status: "ACTIVE" as const, employeeCount: 4 }],
      currentSalaryByCurrency: [{ currency: "INR", employeeCount: 3, averageAnnualSalary: "850000.00" }],
    };
    getSummaryMock.mockResolvedValue(summary);
    const res = response();

    await getSummary({} as Request, res, vi.fn() as unknown as NextFunction);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      statusCode: 200,
      data: summary,
      message: "Analytics summary retrieved successfully",
    });
  });

  it("forwards service failures to Express error middleware", async () => {
    const error = new Error("database unavailable");
    getSummaryMock.mockRejectedValue(error);
    const next = vi.fn();

    await getSummary({} as Request, response(), next as unknown as NextFunction);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("getByCountry controller", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns country analytics in the shared response envelope", async () => {
    const result = [{
      countryCode: "IN",
      activeEmployeeCount: 3,
      currentSalaryByCurrency: [{ currency: "INR", employeeCount: 2, averageAnnualSalary: "850000.00" }],
    }];
    getByCountryMock.mockResolvedValue(result);
    const res = response();

    await getByCountry({} as Request, res, vi.fn() as unknown as NextFunction);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      statusCode: 200,
      data: result,
      message: "Country analytics retrieved successfully",
    });
  });

  it("forwards service failures to Express error middleware", async () => {
    const error = new Error("database unavailable");
    getByCountryMock.mockRejectedValue(error);
    const next = vi.fn();

    await getByCountry({} as Request, response(), next as unknown as NextFunction);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("getByDepartment controller", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns department analytics using the shared response envelope", async () => {
    const result = [{
      department: "Engineering",
      activeEmployeeCount: 3,
      currentSalaryByCurrency: [{ currency: "INR", employeeCount: 2, averageAnnualSalary: "850000.00" }],
    }];
    getByDepartmentMock.mockResolvedValue(result);
    const res = response();

    await getByDepartment({} as Request, res, vi.fn() as unknown as NextFunction);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      statusCode: 200,
      data: result,
      message: "Department analytics retrieved successfully",
    });
  });

  it("forwards service failures to Express error middleware", async () => {
    const error = new Error("database unavailable");
    getByDepartmentMock.mockRejectedValue(error);
    const next = vi.fn();

    await getByDepartment({} as Request, response(), next as unknown as NextFunction);

    expect(next).toHaveBeenCalledWith(error);
  });
});
