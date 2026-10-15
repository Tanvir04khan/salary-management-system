import { EmptyState } from "../../components/common/empty-state";
import { ErrorState } from "../../components/common/error-state";
import { LoadingSkeleton } from "../../components/common/loading-skeleton";
import { PageContainer } from "../../components/common/page-container";
import { PageHeader } from "../../components/common/page-header";
import {
  useAnalyticsByCountry,
  useAnalyticsByDepartment,
  useAnalyticsSummary,
} from "../../hooks/use-analytics";
import { ApiError } from "../../utils/api-client";
import { GroupHeadcountTable, GroupSalaryTable, type AnalyticsGroup } from "./components/analytics-group-tables";
import { EmployeeCountChart, SalaryByCurrencyChart } from "./components/analytics-charts";

function safeMessage(error: Error): string {
  return error instanceof ApiError ? error.message : "Check your connection and try again.";
}

export default function AnalyticsScreen() {
  const summaryQuery = useAnalyticsSummary();
  const countryQuery = useAnalyticsByCountry();
  const departmentQuery = useAnalyticsByDepartment();

  const countryGroups: AnalyticsGroup[] = countryQuery.data?.map((country) => ({
    label: country.countryCode,
    activeEmployeeCount: country.activeEmployeeCount,
    currentSalaryByCurrency: country.currentSalaryByCurrency,
  })) ?? [];
  const departmentGroups: AnalyticsGroup[] = departmentQuery.data?.map((department) => ({
    label: department.department,
    activeEmployeeCount: department.activeEmployeeCount,
    currentSalaryByCurrency: department.currentSalaryByCurrency,
  })) ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        description="Explore active employee counts and annual base compensation. Currency values are always reported separately."
      />

      <section className="space-y-4" aria-labelledby="analytics-summary-heading">
        <div>
          <h2 id="analytics-summary-heading" className="text-lg font-semibold tracking-tight text-slate-950">Workforce summary</h2>
          <p className="mt-1 text-sm text-slate-600">Employee counts by employment status.</p>
        </div>
        {summaryQuery.isPending ? (
          <LoadingSkeleton className="h-44" label="Loading workforce analytics" />
        ) : summaryQuery.isError ? (
          <ErrorState
            title="Workforce summary could not be loaded"
            message={safeMessage(summaryQuery.error)}
            onRetry={() => void summaryQuery.refetch()}
          />
        ) : summaryQuery.data.employeeCountsByStatus.length ? (
          <EmployeeCountChart title="Employees by employment status" data={summaryQuery.data.employeeCountsByStatus.map((row) => ({ label: row.status === "ACTIVE" ? "Active" : "Inactive", count: row.employeeCount }))} />
        ) : (
          <EmptyState title="No workforce data" description="Status totals will appear when employee records are available." />
        )}
      </section>

      <section className="space-y-4" aria-labelledby="analytics-currency-heading">
        <div>
          <h2 id="analytics-currency-heading" className="text-lg font-semibold tracking-tight text-slate-950">Average salary by currency</h2>
          <p className="mt-1 text-sm text-slate-600">Current salaries for active employees, grouped without currency conversion.</p>
        </div>
        {summaryQuery.isPending ? (
          <LoadingSkeleton className="h-36" label="Loading currency analytics" />
        ) : summaryQuery.isError ? (
          <ErrorState
            title="Currency summary could not be loaded"
            message={safeMessage(summaryQuery.error)}
            onRetry={() => void summaryQuery.refetch()}
          />
        ) : summaryQuery.data.currentSalaryByCurrency.length ? (
          <SalaryByCurrencyChart title="Average annual salary" rows={summaryQuery.data.currentSalaryByCurrency.map((row) => ({ ...row, label: row.currency }))} />
        ) : (
          <EmptyState
            title="No current salary data"
            description="Average salary by currency will appear when active employees have current salary records."
          />
        )}
      </section>

      <AnalyticsDimensionSection
        title="Country analytics"
        description="Active headcount and current salary summaries by country and currency."
        dimension="Country"
        groups={countryGroups}
        isPending={countryQuery.isPending}
        error={countryQuery.error}
        hasError={countryQuery.isError}
        onRetry={() => void countryQuery.refetch()}
      />

      <AnalyticsDimensionSection
        title="Department analytics"
        description="Active headcount and current salary summaries by department and currency."
        dimension="Department"
        groups={departmentGroups}
        isPending={departmentQuery.isPending}
        error={departmentQuery.error}
        hasError={departmentQuery.isError}
        onRetry={() => void departmentQuery.refetch()}
      />
    </PageContainer>
  );
}

type AnalyticsDimensionSectionProps = {
  title: string;
  description: string;
  dimension: string;
  groups: AnalyticsGroup[];
  isPending: boolean;
  hasError: boolean;
  error: Error | null;
  onRetry: () => void;
};

function AnalyticsDimensionSection({
  title,
  description,
  dimension,
  groups,
  isPending,
  hasError,
  error,
  onRetry,
}: AnalyticsDimensionSectionProps) {
  return (
    <section className="space-y-5" aria-labelledby={`${dimension.toLowerCase()}-analytics-heading`}>
      <div>
        <h2 id={`${dimension.toLowerCase()}-analytics-heading`} className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      {isPending ? (
        <LoadingSkeleton className="h-40" label={`Loading ${dimension.toLowerCase()} analytics`} />
      ) : hasError ? (
        <ErrorState
          title={`${dimension} analytics could not be loaded`}
          message={error ? safeMessage(error) : "Check your connection and try again."}
          onRetry={onRetry}
        />
      ) : groups.length === 0 ? (
        <EmptyState title={`No ${dimension.toLowerCase()} data`} description={`${dimension} analytics will appear when active employees are available.`} />
      ) : (
        <div className="space-y-6">
          <EmployeeCountChart title={`Active employees by ${dimension.toLowerCase()}`} data={groups.map((group) => ({ label: group.label, count: group.activeEmployeeCount }))} />
          <SalaryByCurrencyChart
            title={`Average annual salary by ${dimension.toLowerCase()}`}
            rows={groups.flatMap((group) => group.currentSalaryByCurrency.map((salary) => ({ ...salary, label: group.label })))}
          />
          <GroupHeadcountTable dimension={dimension} groups={groups} />
          <GroupSalaryTable dimension={dimension} groups={groups} />
        </div>
      )}
    </section>
  );
}
