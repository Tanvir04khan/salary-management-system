// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EmployeeCountChart, EmploymentStatusPieChart, SalaryByCurrencyChart } from "./analytics-charts";
import { GroupHeadcountTable, GroupSalaryTable } from "./analytics-group-tables";

afterEach(cleanup);

const groups = [{ label: "Engineering", activeEmployeeCount: 4, currentSalaryByCurrency: [
  { currency: "USD", employeeCount: 3, averageAnnualSalary: "90000.00" },
  { currency: "INR", employeeCount: 1, averageAnnualSalary: "1200000.00" },
] }];

describe("analytics visual components", () => {
  it("renders headcount and currency specific salary summaries", () => {
    const { rerender } = render(<GroupHeadcountTable dimension="Department" groups={groups} />);
    expect(screen.getByRole("table", { name: "Active employees by department" }).textContent).toContain("Engineering");
    expect(screen.getByRole("table").textContent).toContain("4");
    rerender(<GroupSalaryTable dimension="Department" groups={groups} />);
    const table = screen.getByRole("table", { name: "Average annual base salary by department and currency" });
    expect(table.textContent).toContain("USD");
    expect(table.textContent).toContain("INR");
    expect(table.textContent).toContain("90,000.00");
    rerender(<GroupSalaryTable dimension="Country" groups={[]} />);
    expect(screen.getByRole("heading", { name: "No salary summaries by country" })).toBeTruthy();
  });

  it("renders chart summaries accessibly and omits an empty salary chart", () => {
    const { rerender } = render(<EmploymentStatusPieChart title="Status" data={[{ label: "Active", count: 4 }, { label: "Inactive", count: 1 }]} />);
    expect(screen.getByRole("img", { name: "Status: Active: 4; Inactive: 1" })).toBeTruthy();
    rerender(<EmployeeCountChart title="By country" data={[{ label: "US", count: 3 }]} />);
    expect(screen.getByRole("img", { name: "By country: US: 3" })).toBeTruthy();
    rerender(<SalaryByCurrencyChart title="Salary" rows={[]} />);
    expect(screen.queryByRole("img")).toBeNull();
  });
});
