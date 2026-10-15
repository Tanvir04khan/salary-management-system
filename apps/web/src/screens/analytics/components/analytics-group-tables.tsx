import { CurrencyAmount } from "../../../components/common/currency-amount";
import { EmptyState } from "../../../components/common/empty-state";
import { DataTable } from "../../../components/data-table/data-table";
import type { CurrencySalarySummary } from "../../../hooks/use-analytics";

export type AnalyticsGroup = {
  label: string;
  activeEmployeeCount: number;
  currentSalaryByCurrency: CurrencySalarySummary[];
};

type GroupTableProps = {
  dimension: string;
  groups: AnalyticsGroup[];
};

export function GroupHeadcountTable({ dimension, groups }: GroupTableProps) {
  return (
    <DataTable
      caption={`Active employees by ${dimension.toLowerCase()}`}
      columns={[
        { id: "group", header: dimension, cell: (row) => row.label },
        { id: "count", header: "Active employees", cell: (row) => row.activeEmployeeCount },
      ]}
      getRowId={(row) => row.label}
      rows={groups}
    />
  );
}

export function GroupSalaryTable({ dimension, groups }: GroupTableProps) {
  const rows = groups.flatMap((group) => group.currentSalaryByCurrency.map((salary) => ({
    group: group.label,
    currency: salary.currency,
    employeeCount: salary.employeeCount,
    averageAnnualSalary: salary.averageAnnualSalary,
  })));

  if (rows.length === 0) {
    return (
      <EmptyState
        title={`No salary summaries by ${dimension.toLowerCase()}`}
        description="Current salary data will appear for active employees who have a current salary record."
      />
    );
  }

  return (
    <DataTable
      caption={`Average annual base salary by ${dimension.toLowerCase()} and currency`}
      columns={[
        { id: "group", header: dimension, cell: (row) => row.group },
        { id: "currency", header: "Currency", cell: (row) => row.currency },
        { id: "count", header: "Employees included", cell: (row) => row.employeeCount },
        {
          id: "average",
          header: "Average annual base salary",
          cell: (row) => <CurrencyAmount amount={row.averageAnnualSalary} currency={row.currency} />,
        },
      ]}
      getRowId={(row) => `${row.group}-${row.currency}`}
      rows={rows}
    />
  );
}
