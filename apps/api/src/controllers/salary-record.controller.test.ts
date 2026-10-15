import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSalaryHistory } from "./salary-record.controller";
import { getEmployeeSalaryHistory } from "../services/salary-record";
import type { EmployeeSalaryHistory } from "../types/employee";

vi.mock("../services/salary-record", () => ({
  getEmployeeSalaryHistory: vi.fn(),
}));

const getHistoryMock = vi.mocked(getEmployeeSalaryHistory);
const employeeId = "00000000-0000-4000-8000-000000000001";
const history: EmployeeSalaryHistory = {
  employeeId,
  salaryHistory: [{
    salaryRecordId: "00000000-0001-4000-8000-000000000001",
    amount: "600000.00",
    currency: "INR",
    effectiveFrom: "2025-04-01",
    effectiveTo: null,
    changeReason: "Initial salary",
    createdAt: new Date("2025-04-01T00:00:00.000Z"),
  }],
};

function makeResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & typeof res;
}

describe("getSalaryHistory controller", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects invalid employee IDs", async () => {
    const res = makeResponse();
    await getSalaryHistory(
      { params: { id: "invalid" } } as unknown as Request,
      res,
      vi.fn() as unknown as NextFunction,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      data: null,
      message: "Invalid employee ID",
    });
    expect(getHistoryMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the employee is missing", async () => {
    getHistoryMock.mockResolvedValue(null);
    const res = makeResponse();

    await getSalaryHistory(
      { params: { id: employeeId } } as unknown as Request,
      res,
      vi.fn() as unknown as NextFunction,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 404,
      data: null,
      message: "Employee not found",
    });
  });

  it("returns salary history in the shared response envelope", async () => {
    getHistoryMock.mockResolvedValue(history);
    const res = makeResponse();

    await getSalaryHistory(
      { params: { id: employeeId } } as unknown as Request,
      res,
      vi.fn() as unknown as NextFunction,
    );

    expect(getHistoryMock).toHaveBeenCalledWith(employeeId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      statusCode: 200,
      data: history,
      message: "Salary history retrieved successfully",
    });
  });

  it("forwards service failures to Express error middleware", async () => {
    const error = new Error("database unavailable");
    getHistoryMock.mockRejectedValue(error);
    const next = vi.fn();

    await getSalaryHistory(
      { params: { id: employeeId } } as unknown as Request,
      makeResponse(),
      next as unknown as NextFunction,
    );

    expect(next).toHaveBeenCalledWith(error);
  });
});
