// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { EmployeeSalaryForm } from "./employee-salary-form";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("employee salary form", () => {
  it("rejects zero salary and future effective dates before sending a request", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeeSalaryForm
            employee={{
              employeeId: "employee-1",
              employeeCode: "EMP-1",
              firstName: "Ada",
              lastName: "Lovelace",
              email: "ada@example.test",
              countryCode: "GB",
              department: "Engineering",
              jobTitle: "Engineer",
              employmentStatus: "ACTIVE",
              createdAt: "2025-01-01T00:00:00.000Z",
              updatedAt: "2025-01-01T00:00:00.000Z",
              currentAnnualSalary: "65000.00",
              salaryCurrency: "GBP",
            }}
            onCancel={vi.fn()}
            onSaved={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.clear(screen.getByLabelText("Annual base salary"));
    await user.type(screen.getByLabelText("Annual base salary"), "0");
    fireEvent.change(screen.getByLabelText("Effective from"), {
      target: { value: "9999-12-31" },
    });
    await user.click(screen.getByRole("button", { name: "Update salary" }));

    expect(await screen.findByText("Enter a positive amount with up to 13 digits and 2 decimal places")).toBeTruthy();
    expect(screen.getByText("Future salary dates are not supported")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
