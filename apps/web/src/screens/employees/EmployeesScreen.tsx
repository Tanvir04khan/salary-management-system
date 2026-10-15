import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { DataTable } from "../../components/data-table/data-table";
import { buttonVariants } from "../../components/ui/button";
import { DataTablePagination } from "../../components/data-table/data-table-pagination";
import { EmptyState } from "../../components/common/empty-state";
import { ErrorState } from "../../components/common/error-state";
import { LoadingSkeleton } from "../../components/common/loading-skeleton";
import { PageContainer } from "../../components/common/page-container";
import { PageHeader } from "../../components/common/page-header";
import { useDebouncedValue } from "../../hooks/custom/use-debounced-value";
import {
  useEmployees,
  type EmployeeListParams,
  type EmployeeSortField,
  type EmploymentStatus,
} from "../../hooks/use-employees";
import { ApiError } from "../../utils/api-client";
import { createEmployeeColumns } from "./components/employee-columns";
import { EmployeeFilters, type EmployeeFiltersValue } from "./components/employee-filters";

const PAGE_SIZES = [25, 50, 100] as const;
const EMPLOYEE_SORT_FIELDS: readonly string[] = [
  "employeeCode",
  "firstName",
  "lastName",
  "department",
  "countryCode",
  "createdAt",
];

function positiveInteger(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function isEmployeeSortField(value: string | null): value is EmployeeSortField {
  return value !== null && EMPLOYEE_SORT_FIELDS.some((field) => field === value);
}

function getStatus(value: string | null): EmploymentStatus | undefined {
  return value === "ACTIVE" || value === "INACTIVE" ? value : undefined;
}

function getRequestErrorMessage(error: Error): string {
  return error instanceof ApiError
    ? error.message
    : "We couldn’t load the employee directory. Check your connection and try again.";
}

export default function EmployeesScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const searchFromUrl = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const page = positiveInteger(searchParams.get("page"), 1);
  const pageSizeCandidate = positiveInteger(searchParams.get("pageSize"), 25);
  const pageSize = PAGE_SIZES.find((size) => size === pageSizeCandidate) ?? 25;
  const sortByParam = searchParams.get("sortBy");
  const sortBy = isEmployeeSortField(sortByParam)
    ? sortByParam
    : "employeeCode";
  const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";
  const appliedFilters = useMemo<EmployeeFiltersValue>(() => ({
    country: searchParams.get("country") ?? "",
    department: searchParams.get("department") ?? "",
    status: getStatus(searchParams.get("status")) ?? "",
  }), [
    searchParams.get("country"),
    searchParams.get("department"),
    searchParams.get("status"),
  ]);

  useEffect(() => setSearchInput(searchFromUrl), [searchFromUrl]);

  useEffect(() => {
    if (searchInput.trim() !== debouncedSearch.trim()) return;
    const nextSearch = debouncedSearch.trim();
    if (nextSearch === searchFromUrl.trim()) return;

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextSearch) next.set("search", nextSearch);
      else next.delete("search");
      next.delete("page");
      return next;
    }, { replace: true });
  }, [debouncedSearch, searchFromUrl, searchInput, setSearchParams]);

  function updateParams(updates: Record<string, string | null>, resetPage = true) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      if (resetPage) next.delete("page");
      return next;
    }, { replace: true });
  }

  const requestParams: EmployeeListParams = {
    page,
    pageSize,
    search: searchFromUrl.trim() || undefined,
    country: appliedFilters.country || undefined,
    department: appliedFilters.department || undefined,
    status: appliedFilters.status || undefined,
    sortBy,
    sortOrder,
  };
  const employeesQuery = useEmployees(requestParams);
  const employees = employeesQuery.data?.employees ?? [];
  const pagination = employeesQuery.data?.pagination;
  const hasActiveSearchOrFilter = Boolean(
    searchFromUrl.trim() || appliedFilters.country || appliedFilters.department || appliedFilters.status,
  );

  const columns = createEmployeeColumns({
    search: location.search,
    sortBy,
    sortOrder,
    onSort: (field) => updateParams({
      sortBy: field,
      sortOrder: sortBy === field && sortOrder === "asc" ? "desc" : "asc",
    }, false),
  });

  function applyFilters(filters: EmployeeFiltersValue) {
    updateParams({
      country: filters.country || null,
      department: filters.department || null,
      status: filters.status || null,
    });
  }

  function clearDirectoryFilters() {
    setSearchInput("");
    updateParams({
      search: null,
      country: null,
      department: null,
      status: null,
    });
  }

  return (
    <PageContainer>
      <PageHeader
        title="Employees"
        description="Search and manage employee profiles, employment status, and annual base salary."
        actions={(
          <Link
            className={buttonVariants({ size: "lg" })}
            to={{ pathname: "/employees/new", search: location.search }}
          >
            Add employee
          </Link>
        )}
      />

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5" aria-label="Employee directory controls">
        <label className="block max-w-md text-xs font-medium text-slate-600" htmlFor="employee-search">
          Search employees
          <input
            autoComplete="off"
            className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/20"
            id="employee-search"
            maxLength={100}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name, email, or employee code"
            type="search"
            value={searchInput}
          />
        </label>
        <EmployeeFilters
          value={appliedFilters}
          onApply={applyFilters}
          onClear={clearDirectoryFilters}
        />
      </section>

      {employeesQuery.isPending ? (
        <div aria-label="Loading employees" className="space-y-3" role="status">
          <LoadingSkeleton className="h-12" />
          <LoadingSkeleton className="h-20" />
          <LoadingSkeleton className="h-20" />
          <LoadingSkeleton className="h-20" />
        </div>
      ) : employeesQuery.isError ? (
        <ErrorState message={getRequestErrorMessage(employeesQuery.error)} onRetry={() => void employeesQuery.refetch()} />
      ) : employees.length === 0 && pagination?.totalItems === 0 ? (
        <EmptyState
          title={hasActiveSearchOrFilter ? "No matching employees" : "No employees yet"}
          description={hasActiveSearchOrFilter
            ? "Try a different search or clear the current filters."
            : "Add an employee to start building the directory."}
          action={!hasActiveSearchOrFilter ? (
            <Link
              className={buttonVariants({ size: "lg" })}
              to={{ pathname: "/employees/new", search: location.search }}
            >
              Add employee
            </Link>
          ) : undefined}
        />
      ) : employees.length === 0 ? (
        <EmptyState
          title="No employees on this page"
          description="Move to a previous page or reset the current page number."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              {pagination?.totalItems ?? 0} employee{pagination?.totalItems === 1 ? "" : "s"}
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Rows per page
              <select
                className="min-h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-600"
                onChange={(event) => updateParams({ pageSize: event.target.value })}
                value={pageSize}
              >
                {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
          </div>
          <DataTable
            caption="Employees"
            columns={columns}
            getRowId={(employee) => employee.employeeId}
            rows={employees}
          />
          {pagination && (
            <DataTablePagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              totalPages={pagination.totalPages}
              onPageChange={(nextPage) => updateParams({ page: String(nextPage) }, false)}
            />
          )}
        </>
      )}
    </PageContainer>
  );
}
