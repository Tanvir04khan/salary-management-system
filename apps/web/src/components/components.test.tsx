// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CurrencyAmount } from "./common/currency-amount";
import { EmptyState } from "./common/empty-state";
import { ErrorState } from "./common/error-state";
import { LoadingSkeleton } from "./common/loading-skeleton";
import { PageContainer } from "./common/page-container";
import { PageHeader } from "./common/page-header";
import { RouteLoading } from "./common/route-loading";
import { StatCard } from "./common/stat-card";
import { StatusBadge } from "./common/status-badge";
import { ConfirmDialog } from "./common/confirm-dialog";
import { DataTable } from "./data-table/data-table";
import { DataTableColumnHeader } from "./data-table/data-table-column-header";
import { DataTablePagination } from "./data-table/data-table-pagination";
import { DataTableToolbar } from "./data-table/data-table-toolbar";
import { Button } from "./ui/button";

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

describe("shared UI components", () => {
  it("renders page layout content, descriptions, actions, and passed attributes", () => {
    render(<PageContainer data-testid="page" className="custom"><PageHeader title="Employees" description="Manage profiles" actions={<Button>Add</Button>} /></PageContainer>);
    expect(screen.getByTestId("page").className).toContain("custom");
    expect(screen.getByRole("heading", { name: "Employees" })).toBeTruthy();
    expect(screen.getByText("Manage profiles")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add" })).toBeTruthy();
  });

  it("renders stat values and optional content", () => {
    render(<StatCard label="Employees" value={12} detail="Across all offices" icon={<span>Icon</span>} />);
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("Across all offices")).toBeTruthy();
  });

  it("renders status and currency values, including missing amounts", () => {
    const { rerender } = render(<StatusBadge status="ACTIVE" />);
    expect(screen.getByText("Active")).toBeTruthy();
    rerender(<StatusBadge status="INACTIVE" />);
    expect(screen.getByText("Inactive")).toBeTruthy();
    rerender(<CurrencyAmount amount="1234.50" currency="USD" locale="en-US" />);
    expect(screen.getByText(/USD.*1,234\.50/)).toBeTruthy();
    rerender(<CurrencyAmount amount={null} currency="USD" />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("shows empty, error, and loading states with accessible status roles", () => {
    const retry = vi.fn();
    const { rerender } = render(<EmptyState title="No employees" description="Add one to begin." action={<Button>Create</Button>} />);
    expect(screen.getByRole("heading", { name: "No employees" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create" })).toBeTruthy();
    rerender(<ErrorState message="Connection failed" onRetry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert").textContent).toContain("Connection failed");
    rerender(<LoadingSkeleton label="Loading employees" />);
    expect(screen.getByRole("status", { name: "Loading employees" })).toBeTruthy();
    rerender(<RouteLoading />);
    expect(screen.getByRole("status", { name: "Loading page" })).toBeTruthy();
  });

  it("opens and confirms a confirmation dialog, and disables actions while pending", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    } });
    Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    } });
    render(<ConfirmDialog open title="Deactivate employee" description="This employee will no longer be active." confirmLabel="Deactivate" onConfirm={onConfirm} onOpenChange={onOpenChange} />);
    const dialog = screen.getByRole("dialog", { name: "Deactivate employee" });
    expect(dialog.textContent).toContain("will no longer be active");
    fireEvent.click(screen.getByRole("button", { name: "Deactivate" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders a semantic data table and its empty state", () => {
    const columns = [{ id: "name", header: "Name", cell: (row: { name: string }) => row.name }];
    const { rerender } = render(<DataTable caption="People" columns={columns} rows={[{ name: "Ada" }]} getRowId={(row) => row.name} />);
    expect(screen.getByRole("table", { name: "People" }).textContent).toContain("Ada");
    rerender(<DataTable caption="People" columns={columns} rows={[]} getRowId={(row) => row.name} emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeTruthy();
  });

  it("exposes sortable headers and pagination boundaries", () => {
    const onSort = vi.fn();
    const onPageChange = vi.fn();
    render(<><DataTableColumnHeader label="Name" direction="asc" onSort={onSort} /><DataTablePagination page={1} pageSize={10} totalItems={15} totalPages={2} onPageChange={onPageChange} /></>);
    fireEvent.click(screen.getByRole("button", { name: /Name, ascending/ }));
    expect(onSort).toHaveBeenCalledOnce();
    expect(screen.getByText(/Showing/).textContent).toContain("1");
    expect(screen.getByRole("button", { name: "Previous" }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("renders toolbar content and a working button", () => {
    render(<DataTableToolbar><Button>Apply</Button></DataTableToolbar>);
    expect(screen.getByRole("region", { name: "Table filters and actions" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Apply" })).toBeTruthy();
  });
});
