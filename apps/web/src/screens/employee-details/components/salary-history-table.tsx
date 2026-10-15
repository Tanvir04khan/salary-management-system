import { CurrencyAmount } from "../../../components/common/currency-amount";
import { DataTable } from "../../../components/data-table/data-table";
import type { SalaryHistoryItem } from "../../../hooks/use-salaries";
import { formatDateOnly } from "../../../utils/date";

type SalaryHistoryTableProps = {
  rows: SalaryHistoryItem[];
};

export function SalaryHistoryTable({ rows }: SalaryHistoryTableProps) {
  return (
    <DataTable
      caption="Salary history"
      columns={[
        {
          id: "amount",
          header: "Annual base salary",
          cell: (record) => <CurrencyAmount amount={record.amount} currency={record.currency} />,
        },
        { id: "effectiveFrom", header: "Effective from", cell: (record) => formatDateOnly(record.effectiveFrom) },
        {
          id: "effectiveTo",
          header: "Effective to (exclusive)",
          cell: (record) => record.effectiveTo ? formatDateOnly(record.effectiveTo) : "No end date",
        },
        { id: "changeReason", header: "Reason", cell: (record) => record.changeReason || "—" },
      ]}
      emptyMessage="No salary history has been recorded for this employee."
      getRowId={(record) => record.salaryRecordId}
      rows={rows}
    />
  );
}
