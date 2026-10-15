import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ErrorState } from "../../components/common/error-state";
import { LoadingSkeleton } from "../../components/common/loading-skeleton";
import { PageContainer } from "../../components/common/page-container";
import { PageHeader } from "../../components/common/page-header";
import { useEmployee } from "../../hooks/use-employees";
import { ApiError } from "../../utils/api-client";
import { EmployeeEditForm } from "./components/employee-edit-form";

export default function EditEmployeeScreen() {
  const { employeeId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const employeeQuery = useEmployee(employeeId);

  if (employeeQuery.isPending) {
    return (
      <PageContainer>
        <PageHeader title="Edit employee" />
        <LoadingSkeleton className="h-72" label="Loading employee profile" />
      </PageContainer>
    );
  }

  if (employeeQuery.isError || !employeeQuery.data) {
    return (
      <PageContainer>
        <PageHeader title="Edit employee" />
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
        <Link className="text-sm font-medium text-indigo-700 underline-offset-4 hover:underline" to={{ pathname: `/employees/${employeeId}`, search: location.search }}>
          Back to employee
        </Link>
      </PageContainer>
    );
  }

  const employee = employeeQuery.data;
  const detailsPath = `/employees/${employeeId}${location.search}`;

  return (
    <PageContainer>
      <PageHeader
        title="Edit employee"
        description={`Update profile details for ${employee.firstName} ${employee.lastName}.`}
      />
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
        <EmployeeEditForm
          employee={employee}
          onCancel={() => navigate(detailsPath)}
          onSaved={() => navigate(detailsPath)}
        />
      </section>
    </PageContainer>
  );
}
