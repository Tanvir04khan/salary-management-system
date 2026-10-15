import { UserCheck, UsersRound, UserX } from "lucide-react";
import { EmptyState } from "../../components/common/empty-state";
import { ErrorState } from "../../components/common/error-state";
import { LoadingSkeleton } from "../../components/common/loading-skeleton";
import { PageContainer } from "../../components/common/page-container";
import { PageHeader } from "../../components/common/page-header";
import { StatCard } from "../../components/common/stat-card";
import { useAnalyticsByCountry, useAnalyticsByDepartment, useAnalyticsSummary } from "../../hooks/use-analytics";
import { ApiError } from "../../utils/api-client";
import { EmployeeCountChart, SalaryByCurrencyChart } from "../analytics/components/analytics-charts";

function safeMessage(error: Error): string {
  return error instanceof ApiError
    ? error.message
    : "Check your connection and try again.";
}

export default function DashboardScreen() {
  const summaryQuery = useAnalyticsSummary();
  const countryQuery = useAnalyticsByCountry();
  const departmentQuery = useAnalyticsByDepartment();
  const summary = summaryQuery.data;
  const activeEmployees = summary?.employeeCountsByStatus.find((item) => item.status === "ACTIVE")?.employeeCount ?? 0;
  const inactiveEmployees = summary?.employeeCountsByStatus.find((item) => item.status === "INACTIVE")?.employeeCount ?? 0;
  const totalEmployees = activeEmployees + inactiveEmployees;

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="An overview of employee headcount and current annual base compensation."
      />

      {summaryQuery.isPending ? (
        <div aria-label="Loading workforce summaries" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status">
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-32" />
        </div>
      ) : summaryQuery.isError ? (
        <ErrorState
          title="Workforce summary could not be loaded"
          message={safeMessage(summaryQuery.error)}
          onRetry={() => void summaryQuery.refetch()}
        />
      ) : (
        <section aria-label="Employee summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Total employees" value={totalEmployees} icon={<UsersRound className="size-5" />} />
          <StatCard label="Active employees" value={activeEmployees} icon={<UserCheck className="size-5" />} />
          <StatCard label="Inactive employees" value={inactiveEmployees} icon={<UserX className="size-5" />} />
        </section>
      )}

      <section className="space-y-4" aria-labelledby="dashboard-country-heading">
        <div>
          <h2 id="dashboard-country-heading" className="text-lg font-semibold tracking-tight text-slate-950">Active employees by country</h2>
          <p className="mt-1 text-sm text-slate-600">Compare workforce size across country codes.</p>
        </div>
        {countryQuery.isPending ? <LoadingSkeleton className="h-80" label="Loading country distribution" /> : countryQuery.isError ? (
          <ErrorState
            title="Country distribution could not be loaded"
            message={safeMessage(countryQuery.error)}
            onRetry={() => void countryQuery.refetch()}
          />
        ) : countryQuery.data.length ? (
          <EmployeeCountChart title="Active employees by country" data={countryQuery.data.map((row) => ({ label: row.countryCode, count: row.activeEmployeeCount }))} />
        ) : (
          <EmptyState title="No country distribution" description="Country headcount will appear when active employees are recorded." />
        )}
      </section>

      <section className="space-y-4" aria-labelledby="dashboard-department-heading">
        <div>
          <h2 id="dashboard-department-heading" className="text-lg font-semibold tracking-tight text-slate-950">Active employees by department</h2>
          <p className="mt-1 text-sm text-slate-600">Compare team sizes across departments.</p>
        </div>
        {departmentQuery.isPending ? <LoadingSkeleton className="h-80" label="Loading department distribution" /> : departmentQuery.isError ? (
          <ErrorState
            title="Department distribution could not be loaded"
            message={safeMessage(departmentQuery.error)}
            onRetry={() => void departmentQuery.refetch()}
          />
        ) : departmentQuery.data.length ? (
          <EmployeeCountChart title="Active employees by department" data={departmentQuery.data.map((row) => ({ label: row.department, count: row.activeEmployeeCount }))} />
        ) : (
          <EmptyState title="No department distribution" description="Department headcount will appear when active employees are recorded." />
        )}
      </section>

      <section className="space-y-4" aria-labelledby="dashboard-compensation-heading">
        <div>
          <h2 id="dashboard-compensation-heading" className="text-lg font-semibold tracking-tight text-slate-950">Compensation by currency</h2>
          <p className="mt-1 text-sm text-slate-600">Average annual base salary for active employees. Each currency uses its own scale.</p>
        </div>
        {summaryQuery.isPending ? <LoadingSkeleton className="h-80" label="Loading compensation analytics" /> : summaryQuery.isError ? (
          <ErrorState title="Compensation analytics could not be loaded" message={safeMessage(summaryQuery.error)} onRetry={() => void summaryQuery.refetch()} />
        ) : summary?.currentSalaryByCurrency.length ? (
          <SalaryByCurrencyChart title="Average annual salary" rows={summary.currentSalaryByCurrency.map((row) => ({ ...row, label: row.currency }))} />
        ) : (
          <EmptyState title="No current salary data" description="Compensation charts will appear when active employees have current salary records." />
        )}
      </section>
    </PageContainer>
  );
}
