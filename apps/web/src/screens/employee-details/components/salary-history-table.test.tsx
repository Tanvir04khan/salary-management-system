// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SalaryHistoryTable } from "./salary-history-table";

afterEach(cleanup);

describe("salary history table", () => {
  it("renders salary periods, exclusive end dates, and open ended records", () => {
    render(<SalaryHistoryTable rows={[
      { salaryRecordId: "s1", amount: "80000.00", currency: "USD", effectiveFrom: "2025-01-01", effectiveTo: "2026-01-01", changeReason: "Promotion", createdAt: "2025-01-01T00:00:00Z" },
      { salaryRecordId: "s2", amount: "90000.00", currency: "USD", effectiveFrom: "2026-01-01", effectiveTo: null, changeReason: null, createdAt: "2026-01-01T00:00:00Z" },
    ]} />);
    const table = screen.getByRole("table", { name: "Salary history" });
    expect(table.textContent).toContain("Promotion");
    expect(table.textContent).toContain("No end date");
    expect(table.textContent).toContain("Effective to (exclusive)");
  });

  it("shows an empty history table when no records exist", () => {
    render(<SalaryHistoryTable rows={[]} />);
    expect(screen.getByText("No salary history has been recorded for this employee.")).toBeTruthy();
  });
});
