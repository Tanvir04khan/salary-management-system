// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmployeeFilters } from "./employee-filters";

afterEach(cleanup);

describe("employee filters", () => {
  it("normalizes valid filters and submits them", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<EmployeeFilters value={{ country: "", department: "", status: "" }} onApply={onApply} onClear={vi.fn()} />);
    await user.type(screen.getByLabelText("Country code"), "us");
    await user.type(screen.getByLabelText("Department"), " Engineering ");
    await user.selectOptions(screen.getByLabelText("Status"), "ACTIVE");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(onApply).toHaveBeenCalledWith({ country: "US", department: "Engineering", status: "ACTIVE" });
  });

  it("rejects an invalid country code and clears filters", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onClear = vi.fn();
    render(<EmployeeFilters value={{ country: "", department: "", status: "" }} onApply={onApply} onClear={onClear} />);
    fireEvent.change(screen.getByLabelText("Country code"), { target: { value: "USA" } });
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.getByText("Enter a two-letter country code.")).toBeTruthy();
    expect(onApply).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
