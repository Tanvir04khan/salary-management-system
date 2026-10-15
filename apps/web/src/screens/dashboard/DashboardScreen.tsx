import { UserCheck, UsersRound, UserX } from "lucide-react";
import { DataTable } from "../../components/data-table/data-table";
import { CurrencyAmount } from "../../components/common/currency-amount";
import { EmptyState } from "../../components/common/empty-state";
import { ErrorState } from "../../components/common/error-state";
import { LoadingSkeleton } from "../../components/common/loading-skeleton";
import { PageContainer } from "../../components/common/page-container";
import { PageHeader } from "../../components/common/page-header";
import { StatCard } from "../../components/common/stat-card";
import { useAnalyticsByCountry, useAnalyticsSummary } from "../../hooks/use-analytics";
import { ApiError } from "../../utils/api-client";

function safeMessage(error: Error): string {
  return error instanceof ApiError
    ? error.message
    : "Check your connection and try again.";
}

export default function DashboardScreen() {
  const summaryQuery = useAnalyticsSummary();
  const countryQuery = useAnalyticsByCountry();
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

      <section className="space-y-4" aria-labelledby="dashboard-salary-heading">
        <div>
          <h2 id="dashboard-salary-heading" className="text-lg font-semibold tracking-tight text-slate-950">
            Average annual base salary by currency
          </h2>
          <p className="mt-1 text-sm text-slate-600">Current salaries for active employees, kept separate by currency.</p>
        </div>
        {summaryQuery.isPending ? (
          <LoadingSkeleton className="h-40" label="Loading salary summaries" />
        ) : summaryQuery.isError ? (
          <ErrorState
            title="Salary summary could not be loaded"
            message={safeMessage(summaryQuery.error)}
            onRetry={() => void summaryQuery.refetch()}
          />
        ) : summary?.currentSalaryByCurrency.length ? (
          <DataTable
            caption="Average annual base salary by currency"
            columns={[
              { id: "currency", header: "Currency", cell: (item) => item.currency },
              {
                id: "average",
                header: "Average annual base salary",
                cell: (item) => <CurrencyAmount amount={item.averageAnnualSalary} currency={item.currency} />,
              },
              { id: "employees", header: "Employees included", cell: (item) => item.employeeCount },
            ]}
            getRowId={(item) => item.currency}
            rows={summary.currentSalaryByCurrency}
          />
        ) : (
          <EmptyState
            title="No current salary data"
            description="Average salary summaries will appear when active employees have current salary records."
          />
        )}
      </section>

      <section className="space-y-4" aria-labelledby="dashboard-country-heading">
        <div>
          <h2 id="dashboard-country-heading" className="text-lg font-semibold tracking-tight text-slate-950">Active employees by country</h2>
          <p className="mt-1 text-sm text-slate-600">Country headcount from the compensation analytics API.</p>
        </div>
        {countryQuery.isPending ? (
          <LoadingSkeleton className="h-44" label="Loading country distribution" />
        ) : countryQuery.isError ? (
          <ErrorState
            title="Country distribution could not be loaded"
            message={safeMessage(countryQuery.error)}
            onRetry={() => void countryQuery.refetch()}
          />
        ) : countryQuery.data.length ? (
          <DataTable
            caption="Active employees by country"
            columns={[
              { id: "country", header: "Country code", cell: (item) => item.countryCode },
              { id: "count", header: "Active employees", cell: (item) => item.activeEmployeeCount },
            ]}
            getRowId={(item) => item.countryCode}
            rows={countryQuery.data}
          />
        ) : (
          <EmptyState title="No country distribution" description="Country headcount will appear when active employees are recorded." />
        )}
      </section>
    </PageContainer>
  );
}
