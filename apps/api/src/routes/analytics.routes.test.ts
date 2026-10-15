import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAnalyticsByCountry,
  getAnalyticsByDepartment,
  getAnalyticsSummary,
} from "../services/analytics";
import analyticsRoutes from "./analytics.routes";

vi.mock("../services/analytics", () => ({
  getAnalyticsByCountry: vi.fn(),
  getAnalyticsByDepartment: vi.fn(),
  getAnalyticsSummary: vi.fn(),
}));
const getSummaryMock = vi.mocked(getAnalyticsSummary);
const getByCountryMock = vi.mocked(getAnalyticsByCountry);
const getByDepartmentMock = vi.mocked(getAnalyticsByDepartment);
const servers: ReturnType<express.Express["listen"]>[] = [];

async function startServer() {
  const app = express();
  app.use("/api/analytics", analyticsRoutes);
  const server = app.listen(0);
  servers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  })));
  vi.clearAllMocks();
});

describe("analytics routes", () => {
  it("registers GET /summary and returns the controller response", async () => {
    const summary = {
      employeeCountsByStatus: [],
      currentSalaryByCurrency: [{ currency: "USD", employeeCount: 1, averageAnnualSalary: "92000.00" }],
    };
    getSummaryMock.mockResolvedValue(summary);
    const baseUrl = await startServer();

    const response = await fetch(`${baseUrl}/api/analytics/summary`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getSummaryMock).toHaveBeenCalledOnce();
    expect(body).toEqual({
      success: true,
      statusCode: 200,
      data: summary,
      message: "Analytics summary retrieved successfully",
    });
  });

  it("registers GET /by-country and returns the country breakdown", async () => {
    const result = [{
      countryCode: "IN",
      activeEmployeeCount: 3,
      currentSalaryByCurrency: [{ currency: "INR", employeeCount: 2, averageAnnualSalary: "850000.00" }],
    }];
    getByCountryMock.mockResolvedValue(result);
    const baseUrl = await startServer();

    const response = await fetch(`${baseUrl}/api/analytics/by-country`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getByCountryMock).toHaveBeenCalledOnce();
    expect(body).toEqual({
      success: true,
      statusCode: 200,
      data: result,
      message: "Country analytics retrieved successfully",
    });
  });

  it("registers GET /by-department and returns the department breakdown", async () => {
    const result = [{
      department: "Engineering",
      activeEmployeeCount: 3,
      currentSalaryByCurrency: [{ currency: "INR", employeeCount: 2, averageAnnualSalary: "850000.00" }],
    }];
    getByDepartmentMock.mockResolvedValue(result);
    const baseUrl = await startServer();

    const response = await fetch(`${baseUrl}/api/analytics/by-department`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getByDepartmentMock).toHaveBeenCalledOnce();
    expect(body).toEqual({
      success: true,
      statusCode: 200,
      data: result,
      message: "Department analytics retrieved successfully",
    });
  });
});
