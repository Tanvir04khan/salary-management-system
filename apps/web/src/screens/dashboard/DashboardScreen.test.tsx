// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardScreen from "./DashboardScreen";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("dashboard summaries", () => {
  it("uses backend counts and keeps average salaries separated by currency", async () => {
    const summary = {
      employeeCountsByStatus: [
        { status: "ACTIVE", employeeCount: 8 },
        { status: "INACTIVE", employeeCount: 2 },
      ],
      currentSalaryByCurrency: [
        { currency: "USD", employeeCount: 3, averageAnnualSalary: "120000.00" },
        { currency: "INR", employeeCount: 5, averageAnnualSalary: "1800000.00" },
      ],
    };
    const countryData = [
      { countryCode: "US", activeEmployeeCount: 3, currentSalaryByCurrency: [summary.currentSalaryByCurrency[0]] },
      { countryCode: "IN", activeEmployeeCount: 5, currentSalaryByCurrency: [summary.currentSalaryByCurrency[1]] },
    ];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), "http://localhost");
      const data = url.pathname.endsWith("/by-country") ? countryData : summary;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, statusCode: 200, data, message: "ok" }),
      };
    }));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardScreen />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Total employees")).toBeTruthy();
    expect(screen.getAllByText("Active employees")[0].closest("article")?.textContent).toContain("8");
    expect(screen.getByText("Inactive employees").closest("article")?.textContent).toContain("2");
    const salaryTable = screen.getByRole("table", { name: "Average annual base salary by currency" });
    expect(salaryTable.textContent).toContain("USD 120,000.00");
    expect(salaryTable.textContent).toContain("INR 1,800,000.00");
    expect(screen.getByRole("table", { name: "Active employees by country" })).toBeTruthy();
  });
});
