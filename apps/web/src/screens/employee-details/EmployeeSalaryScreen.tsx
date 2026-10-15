import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ErrorState } from "../../components/common/error-state";
import { LoadingSkeleton } from "../../components/common/loading-skeleton";
import { PageContainer } from "../../components/common/page-container";
import { PageHeader } from "../../components/common/page-header";
import { useEmployee } from "../../hooks/use-employees";
import { ApiError } from "../../utils/api-client";
import { EmployeeSalaryForm } from "./components/employee-salary-form";

export default function EmployeeSalaryScreen() {
  const { employeeId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const employeeQuery = useEmployee(employeeId);

  if (employeeQuery.isPending) {
    return (
      <PageContainer>
        <PageHeader title="Update salary" />
        <LoadingSkeleton className="h-72" label="Loading employee profile" />
      </PageContainer>
    );
  }

  if (employeeQuery.isError || !employeeQuery.data) {
    return (
      <PageContainer>
        <PageHeader title="Update salary" />
        <ErrorState
          title={employeeQuery.error instanceof ApiError && employeeQuery.error.statusCode === 404
            ? "Employee not found"
            : "Employee profile could not be loaded"}
          message={employeeQuery.error instanceof ApiError
            ? employeeQuery.error.message
            : "Check your connection and try again."}
          onRetry={employeeQuery.error instanceof ApiError && employeeQuery.error.statusCode === 404
            ? undefined
            : () => void employeeQuery.refetch()}
        />
      </PageContainer>
    );
  }

  const employee = employeeQuery.data;
  const detailsPath = `/employees/${employeeId}${location.search}`;

  return (
    <PageContainer>
      <PageHeader
        title="Update annual base salary"
        description={`For ${employee.firstName} ${employee.lastName} · ${employee.employeeCode}`}
      />
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
        <EmployeeSalaryForm
          employee={employee}
          onCancel={() => navigate(detailsPath)}
          onSaved={() => navigate(detailsPath)}
        />
      </section>
      <Link className="text-sm font-medium text-indigo-700 underline-offset-4 hover:underline" to={detailsPath}>
        Back to employee details
      </Link>
    </PageContainer>
  );
}
