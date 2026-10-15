import type { ReactNode } from "react";

export type DataTableColumn<TData> = {
  id: string;
  header: ReactNode;
  cell: (row: TData) => ReactNode;
  className?: string;
  sortDirection?: "ascending" | "descending" | "none";
};

type DataTableProps<TData> = {
  columns: readonly DataTableColumn<TData>[];
  rows: readonly TData[];
  getRowId: (row: TData) => string;
  caption: string;
  emptyMessage?: string;
};

export function DataTable<TData>({
  columns,
  rows,
  getRowId,
  caption,
  emptyMessage = "No records to display.",
}: DataTableProps<TData>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                aria-sort={column.sortDirection}
                className={`px-4 py-3.5 ${column.className ?? ""}`}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length > 0 ? rows.map((row) => (
            <tr key={getRowId(row)} className="hover:bg-slate-50/80">
              {columns.map((column) => (
                <td key={column.id} className={`px-4 py-3.5 text-slate-700 ${column.className ?? ""}`}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
