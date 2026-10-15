import { ArrowDown, ArrowDownUp, ArrowUp } from "lucide-react";

type SortDirection = "asc" | "desc" | undefined;

type DataTableColumnHeaderProps = {
  label: string;
  direction?: SortDirection;
  onSort?: () => void;
};

export function DataTableColumnHeader({ label, direction, onSort }: DataTableColumnHeaderProps) {
  if (!onSort) return <span>{label}</span>;

  const Icon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowDownUp;
  const sortLabel = direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "not sorted";

  return (
    <button
      aria-label={`${label}, ${sortLabel}. Change sort order`}
      className="inline-flex min-h-8 items-center gap-2 rounded-sm text-left hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      onClick={onSort}
      type="button"
    >
      {label}
      <Icon aria-hidden="true" className="size-3.5" />
    </button>
  );
}
