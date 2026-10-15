import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentSalary, getSalaryHistory, patchEmployeeSalary } from "./salary-record.controller";
import {
  FutureSalaryEffectiveDateError,
  getEmployeeCurrentSalary,
  getEmployeeSalaryHistory,
  OverlappingSalaryPeriodsError,
  updateEmployeeSalary,
} from "../services/salary-record";
import type { EmployeeSalaryHistory, SalaryHistoryItem } from "../types/employee";

vi.mock("../services/salary-record", () => ({
  FutureSalaryEffectiveDateError: class FutureSalaryEffectiveDateError extends Error {
    constructor() {
      super("Salary effective date cannot be in the future");
    }
  },
  getEmployeeSalaryHistory: vi.fn(),
  getEmployeeCurrentSalary: vi.fn(),
  OverlappingSalaryPeriodsError: class OverlappingSalaryPeriodsError extends Error {
    constructor() {
      super("Salary history contains overlapping effective periods");
    }
  },
  updateEmployeeSalary: vi.fn(),
}));

const getHistoryMock = vi.mocked(getEmployeeSalaryHistory);
const getCurrentSalaryMock = vi.mocked(getEmployeeCurrentSalary);
const updateSalaryMock = vi.mocked(updateEmployeeSalary);
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
const updatedSalary: SalaryHistoryItem = {
  salaryRecordId: "00000000-0001-4000-8000-000000000002",
  amount: "750000.00",
  currency: "INR",
  effectiveFrom: "2026-05-15",
  effectiveTo: null,
  changeReason: "Annual review",
  createdAt: new Date("2026-05-15T00:00:00.000Z"),
};
const currentSalary = {
  employeeId,
  currentSalary: updatedSalary,
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

  it("rejects invalid salary data before calling the service", async () => {
    const res = makeResponse();

    await patchEmployeeSalary(
      {
        params: { id: employeeId },
        body: { amount: 100, currency: "INR" },
      } as unknown as Request,
      res,
      vi.fn() as unknown as NextFunction,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      data: null,
      message: "Invalid salary data",
    });
    expect(updateSalaryMock).not.toHaveBeenCalled();
  });

  it("normalizes salary input and returns the created or updated salary record", async () => {
    updateSalaryMock.mockResolvedValue(updatedSalary);
    const res = makeResponse();

    await patchEmployeeSalary(
      {
        params: { id: employeeId },
        body: {
          amount: "750000",
          currency: "inr",
          changeReason: " Annual review ",
        },
      } as unknown as Request,
      res,
      vi.fn() as unknown as NextFunction,
    );

    expect(updateSalaryMock).toHaveBeenCalledWith(employeeId, {
      amount: "750000.00",
      currency: "INR",
      changeReason: "Annual review",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      statusCode: 200,
      data: updatedSalary,
      message: "Salary updated successfully",
    });
  });

  it("returns 400 for a future effective date", async () => {
    updateSalaryMock.mockRejectedValue(new FutureSalaryEffectiveDateError());
    const res = makeResponse();

    await patchEmployeeSalary(
      {
        params: { id: employeeId },
        body: {
          amount: "750000.00",
          currency: "INR",
          effectiveFrom: "2026-12-01",
        },
      } as unknown as Request,
      res,
      vi.fn() as unknown as NextFunction,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      data: null,
      message: "Salary effective date cannot be in the future",
    });
  });

  it("returns 409 when existing salary periods overlap", async () => {
    updateSalaryMock.mockRejectedValue(new OverlappingSalaryPeriodsError());
    const res = makeResponse();

    await patchEmployeeSalary(
      {
        params: { id: employeeId },
        body: { amount: "750000.00", currency: "INR" },
      } as unknown as Request,
      res,
      vi.fn() as unknown as NextFunction,
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 409,
      data: null,
      message: "Salary history conflicts with an existing effective period",
    });
  });
});

describe("getCurrentSalary controller", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects invalid employee IDs", async () => {
    const res = makeResponse();
    await getCurrentSalary(
      { params: { id: "invalid" } } as unknown as Request,
      res,
      vi.fn() as unknown as NextFunction,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(getCurrentSalaryMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the employee does not exist", async () => {
    getCurrentSalaryMock.mockResolvedValue(null);
    const res = makeResponse();
    await getCurrentSalary(
      { params: { id: employeeId } } as unknown as Request,
      res,
      vi.fn() as unknown as NextFunction,
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns the current salary in the shared response envelope", async () => {
    getCurrentSalaryMock.mockResolvedValue(currentSalary);
    const res = makeResponse();
    await getCurrentSalary(
      { params: { id: employeeId } } as unknown as Request,
      res,
      vi.fn() as unknown as NextFunction,
    );
    expect(getCurrentSalaryMock).toHaveBeenCalledWith(employeeId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      statusCode: 200,
      data: currentSalary,
      message: "Current salary retrieved successfully",
    });
  });

  it("forwards service errors to Express error middleware", async () => {
    const error = new Error("database unavailable");
    getCurrentSalaryMock.mockRejectedValue(error);
    const next = vi.fn();
    await getCurrentSalary(
      { params: { id: employeeId } } as unknown as Request,
      makeResponse(),
      next as unknown as NextFunction,
    );
    expect(next).toHaveBeenCalledWith(error);
  });
});
