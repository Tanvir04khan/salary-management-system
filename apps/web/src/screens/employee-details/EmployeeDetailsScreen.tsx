import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ConfirmDialog } from "../../components/common/confirm-dialog";
import { CurrencyAmount } from "../../components/common/currency-amount";
import { EmptyState } from "../../components/common/empty-state";
import { ErrorState } from "../../components/common/error-state";
import { LoadingSkeleton } from "../../components/common/loading-skeleton";
import { PageContainer } from "../../components/common/page-container";
import { PageHeader } from "../../components/common/page-header";
import { StatusBadge } from "../../components/common/status-badge";
import { buttonVariants } from "../../components/ui/button";
import { useEmployee, useUpdateEmployee } from "../../hooks/use-employees";
import { useSalaryHistory } from "../../hooks/use-salaries";
import { ApiError } from "../../utils/api-client";
import { formatDateTime } from "../../utils/date";
import { SalaryHistoryTable } from "./components/salary-history-table";

export default function EmployeeDetailsScreen() {
  const { employeeId = "" } = useParams();
  const location = useLocation();
  const [deactivationConfirmationOpen, setDeactivationConfirmationOpen] = useState(false);
  const employeeQuery = useEmployee(employeeId);
  const salaryHistoryQuery = useSalaryHistory(employeeId, employeeQuery.isSuccess);
  const updateEmployee = useUpdateEmployee(employeeId);
  const employee = employeeQuery.data;

  if (employeeQuery.isPending) {
    return (
      <PageContainer>
        <LoadingSkeleton className="h-8 w-64" label="Loading employee profile" />
        <LoadingSkeleton className="h-48" />
      </PageContainer>
    );
  }

  if (employeeQuery.isError || !employee) {
    const notFound = employeeQuery.error instanceof ApiError && employeeQuery.error.statusCode === 404;
    return (
      <PageContainer>
        <PageHeader title={notFound ? "Employee not found" : "Employee details"} />
        <ErrorState
          title={notFound ? "This employee does not exist" : "Employee details could not be loaded"}
          message={employeeQuery.error instanceof ApiError
            ? employeeQuery.error.message
            : "Check your connection and try again."}
          onRetry={notFound ? undefined : () => void employeeQuery.refetch()}
        />
        <Link className="text-sm font-medium text-indigo-700 underline-offset-4 hover:underline" to={{ pathname: "/employees", search: location.search }}>
          Back to employees
        </Link>
      </PageContainer>
    );
  }

  function changeStatus(status: "ACTIVE" | "INACTIVE") {
    updateEmployee.mutate({ employmentStatus: status }, {
      onSuccess: () => setDeactivationConfirmationOpen(false),
    });
  }

  const updateErrorMessage = updateEmployee.error instanceof ApiError
    ? updateEmployee.error.message
    : "The employee status could not be updated. Try again.";

  return (
    <PageContainer>
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={`${employee.employeeCode} · ${employee.email}`}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className={buttonVariants({ variant: "outline", size: "lg" })}
              to={{ pathname: `/employees/${employeeId}/edit`, search: location.search }}
            >
              Edit profile
            </Link>
            <Link
              className={buttonVariants({ size: "lg" })}
              to={{ pathname: `/employees/${employeeId}/salary`, search: location.search }}
            >
              Update salary
            </Link>
          </div>
        )}
      />

      {updateEmployee.isError && <ErrorState title="Status was not updated" message={updateErrorMessage} />}

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7" aria-labelledby="employee-profile-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="employee-profile-heading" className="text-base font-semibold text-slate-950">Employee profile</h2>
            <p className="mt-1 text-sm text-slate-500">Created {formatDateTime(employee.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={employee.employmentStatus} />
            {employee.employmentStatus === "ACTIVE" ? (
              <button
                className="min-h-9 rounded-lg px-3 text-sm font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-700 disabled:opacity-50"
                disabled={updateEmployee.isPending}
                onClick={() => setDeactivationConfirmationOpen(true)}
                type="button"
              >
                Deactivate
              </button>
            ) : (
              <button
                className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50"
                disabled={updateEmployee.isPending}
                onClick={() => changeStatus("ACTIVE")}
                type="button"
              >
                Activate
              </button>
            )}
          </div>
        </div>

        <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileValue label="Employee code" value={employee.employeeCode} />
          <ProfileValue label="Email" value={employee.email} />
          <ProfileValue label="Country" value={employee.countryCode} />
          <ProfileValue label="Department" value={employee.department} />
          <ProfileValue label="Job title" value={employee.jobTitle} />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Current annual base salary</dt>
            <dd className="mt-1.5 text-sm font-semibold text-slate-900">
              <CurrencyAmount amount={employee.currentAnnualSalary} currency={employee.salaryCurrency} />
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4" aria-labelledby="salary-history-heading">
        <div>
          <h2 id="salary-history-heading" className="text-lg font-semibold tracking-tight text-slate-950">Salary history</h2>
          <p className="mt-1 text-sm text-slate-600">Annual base salary records and their exclusive end dates.</p>
        </div>
        {salaryHistoryQuery.isPending ? (
          <LoadingSkeleton className="h-36" label="Loading salary history" />
        ) : salaryHistoryQuery.isError ? (
          <ErrorState
            title="Salary history could not be loaded"
            message={salaryHistoryQuery.error instanceof ApiError
              ? salaryHistoryQuery.error.message
              : "Check your connection and try again."}
            onRetry={() => void salaryHistoryQuery.refetch()}
          />
        ) : salaryHistoryQuery.data.salaryHistory.length === 0 ? (
          <EmptyState
            title="No salary history"
            description="No annual base salary has been recorded for this employee yet."
          />
        ) : (
          <SalaryHistoryTable rows={salaryHistoryQuery.data.salaryHistory} />
        )}
      </section>

      <ConfirmDialog
        open={deactivationConfirmationOpen}
        title="Deactivate this employee?"
        description="The employee will remain in the directory and salary history, but their employment status will become inactive."
        confirmLabel="Deactivate employee"
        pending={updateEmployee.isPending}
        onConfirm={() => changeStatus("INACTIVE")}
        onOpenChange={setDeactivationConfirmationOpen}
      />
    </PageContainer>
  );
}

function ProfileValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1.5 break-words text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
