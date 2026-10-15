// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { EmployeeCreateForm } from "./employee-create-form";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("employee creation form", () => {
  it("shows field-level validation errors and does not submit invalid data", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const queryClient = new QueryClient();
    const onCreated = vi.fn();
    const onCancel = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeeCreateForm onCreated={onCreated} onCancel={onCancel} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Create employee" }));

    expect(await screen.findByText("Employee code is required")).toBeTruthy();
    expect(screen.getByText("First name is required")).toBeTruthy();
    expect(screen.getByText("Enter a two-letter country code")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });
});
