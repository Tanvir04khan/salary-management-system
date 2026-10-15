import { Link } from "react-router-dom";
import { CurrencyAmount } from "../../../components/common/currency-amount";
import { StatusBadge } from "../../../components/common/status-badge";
import { DataTableColumnHeader } from "../../../components/data-table/data-table-column-header";
import type { DataTableColumn } from "../../../components/data-table/data-table";
import type { EmployeeRecord, EmployeeSortField } from "../../../hooks/use-employees";

type EmployeeColumnsOptions = {
  search: string;
  sortBy: EmployeeSortField;
  sortOrder: "asc" | "desc";
  onSort: (field: EmployeeSortField) => void;
};

function sortDirection(
  column: EmployeeSortField,
  options: EmployeeColumnsOptions,
): "asc" | "desc" | undefined {
  return options.sortBy === column ? options.sortOrder : undefined;
}

export function createEmployeeColumns(
  options: EmployeeColumnsOptions,
): DataTableColumn<EmployeeRecord>[] {
  return [
    {
      id: "employeeCode",
      header: <DataTableColumnHeader
        label="Employee code"
        direction={sortDirection("employeeCode", options)}
        onSort={() => options.onSort("employeeCode")}
      />,
      cell: (employee) => employee.employeeCode,
      sortDirection: options.sortBy === "employeeCode"
        ? options.sortOrder === "asc" ? "ascending" : "descending"
        : "none",
    },
    {
      id: "name",
      header: <DataTableColumnHeader
        label="Employee"
        direction={sortDirection("firstName", options)}
        onSort={() => options.onSort("firstName")}
      />,
      cell: (employee) => (
        <Link
          className="font-medium text-slate-900 underline-offset-4 hover:text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-600"
          to={{ pathname: `/employees/${employee.employeeId}`, search: options.search }}
        >
          {employee.firstName} {employee.lastName}
        </Link>
      ),
      sortDirection: options.sortBy === "firstName"
        ? options.sortOrder === "asc" ? "ascending" : "descending"
        : "none",
    },
    { id: "email", header: "Email", cell: (employee) => employee.email },
    {
      id: "department",
      header: <DataTableColumnHeader
        label="Department"
        direction={sortDirection("department", options)}
        onSort={() => options.onSort("department")}
      />,
      cell: (employee) => employee.department,
      sortDirection: options.sortBy === "department"
        ? options.sortOrder === "asc" ? "ascending" : "descending"
        : "none",
    },
    { id: "jobTitle", header: "Job title", cell: (employee) => employee.jobTitle },
    {
      id: "country",
      header: <DataTableColumnHeader
        label="Country"
        direction={sortDirection("countryCode", options)}
        onSort={() => options.onSort("countryCode")}
      />,
      cell: (employee) => employee.countryCode,
      sortDirection: options.sortBy === "countryCode"
        ? options.sortOrder === "asc" ? "ascending" : "descending"
        : "none",
    },
    {
      id: "status",
      header: "Status",
      cell: (employee) => <StatusBadge status={employee.employmentStatus} />,
    },
    {
      id: "salary",
      header: "Annual base salary",
      cell: (employee) => (
        <CurrencyAmount amount={employee.currentAnnualSalary} currency={employee.salaryCurrency} />
      ),
    },
  ];
}
