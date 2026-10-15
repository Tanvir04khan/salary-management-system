// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EmployeesScreen from "./EmployeesScreen";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function employeeRecord(id: string) {
  return {
    employeeId: id,
    employeeCode: `EMP-${id}`,
    firstName: `Employee ${id}`,
    lastName: "Example",
    email: `employee${id}@example.test`,
    countryCode: "US",
    department: "Engineering",
    jobTitle: "Software Engineer",
    employmentStatus: "ACTIVE",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    currentAnnualSalary: "90000.00",
    salaryCurrency: "USD",
  };
}

function renderEmployees(initialEntry = "/employees") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/employees" element={<EmployeesScreen />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function stubEmployeeApi() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://localhost");
    const page = Number(url.searchParams.get("page") ?? "1");
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        success: true,
        statusCode: 200,
        data: {
          employees: [employeeRecord(String(page))],
          pagination: { page, pageSize: 25, totalItems: 26, totalPages: 2 },
        },
        message: "Employees retrieved successfully",
      }),
    } as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("employee directory", () => {
  it("applies country, department, and status filters to the API request", async () => {
    const user = userEvent.setup();
    const fetchMock = stubEmployeeApi();
    renderEmployees();

    expect(await screen.findByRole("link", { name: "Employee 1 Example" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Country code"), { target: { value: "us" } });
    fireEvent.change(screen.getByLabelText("Department"), { target: { value: "Engineering" } });
    await user.selectOptions(screen.getByLabelText("Status"), "ACTIVE");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map(([input]) => new URL(String(input), "http://localhost"));
      expect(urls.some((url) =>
        url.searchParams.get("country") === "US" &&
        url.searchParams.get("department") === "Engineering" &&
        url.searchParams.get("status") === "ACTIVE",
      )).toBe(true);
    });
  });

  it("requests the next server page when pagination advances", async () => {
    const user = userEvent.setup();
    const fetchMock = stubEmployeeApi();
    renderEmployees("/employees?page=1&pageSize=25");

    expect(await screen.findByRole("link", { name: "Employee 1 Example" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("link", { name: "Employee 2 Example" })).toBeTruthy();

    await waitFor(() => {
      const requestedPages = fetchMock.mock.calls.map(([input]) =>
        new URL(String(input), "http://localhost").searchParams.get("page"),
      );
      expect(requestedPages).toContain("2");
    });
  });
});
